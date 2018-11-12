import * as THREE from 'three';
import { GAME_TYPES, SHIP_DIRECTIONS } from '../Constants';
// maybe use this only in one spot so I
// can do the loading screen thing
import { getModel } from '../AssetManager';
import { isInRange } from '../utils';

class Player {
  constructor(scene, camera, worldSize, fireCannon) {
    this.type = GAME_TYPES.PLAYER;
    // move camera to a class that looks at the player
    this.camera = camera;
    this.turnRate = 0;
    this.speed = 0.01 / worldSize; // scaled to world size bc rotation
    this.forwardAxis = new THREE.Vector3(0, 0, 1);
    this.yawAxis = new THREE.Vector3(1, 0, 0);
    this.worldPos = new THREE.Vector3();

    this.rollSpeed = 0;
    this.rollAcc = 0;

    // Fire logic
    this.fireCannon = fireCannon;
    // names for these need to match the constants
    this.ammo = { PORT: 0, STARBOARD: 0 };
    this.fuses = {
      PORT: { lit: false, time: 0 },
      STARBOARD: { lit: false, time: 0 },
    };
    this.FUSE_MAX = 1500;
    // [back, mid, front]
    this.CANNON_POS = [0, 0.025, 0.05];
    this.FIRE_ROLL_AMOUNT = { PORT: 0.007, STARBOARD: -0.007 };

    // Set it to be on the edge of the world
    this.gameObject = new THREE.Object3D();
    this.gameObject.position.x = worldSize - 4;
    this.gameObject.rotateY(Math.PI / 2);

    // ship body
    this.ship = new THREE.Object3D();
    this.gameObject.add(this.ship);

    // this mat might need to change
    const bodyMat = new THREE.MeshPhongMaterial({ flatShading: true, color: 0xaa0000 });
    getModel('./Assets/pirate/pirate_body.stl')
      .then((geo) => {
        this.body = new THREE.Mesh(geo, bodyMat);
        this.ship.add(this.body);
      });

    // Sails
    const sailMat = new THREE.MeshPhongMaterial({ flatShading: true, color: 0xffffff, side: THREE.DoubleSide });
    getModel('./Assets/pirate/pirate_frontsail.stl')
      .then((geo) => {
        this.frontSail = new THREE.Mesh(geo, sailMat);
        this.frontSail.position.x = 2.07;
        this.frontSail.position.y = 18.80;
        this.ship.add(this.frontSail);
      });

    getModel('./Assets/pirate/pirate_backsail.stl')
      .then((geo) => {
        this.backSail = new THREE.Mesh(geo, sailMat);
        this.backSail.position.x = 2.16;
        this.backSail.position.y = 7.29;
        this.ship.add(this.backSail);
      });

    getModel('./Assets/pirate/pirate_rudder.stl')
      .then((geo) => {
        this.rudder = new THREE.Mesh(geo, sailMat);
        // this.rudder.position.x = 2.16;
        this.rudder.position.y = -8.18;
        this.ship.add(this.rudder);
      });

    // Cannons
    // Map over these positions in loader to set cannon spot
    this.portCannons = [[-2.49, 18.05, 0], [-3.49, 10.95, 0], [-2.49, 3.86, 0]];
    this.starboardCannons = [[2.49, 18.05, 0], [3.49, 10.95, 0], [2.49, 3.86, 0]];
    this.cannonLoadedMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.cannonUnloadedMat = new THREE.MeshBasicMaterial({ color: 0x777777 });
    getModel('./Assets/pirate/pirate_cannon.stl')
      .then((geo) => {
        this.portCannons = this.portCannons.map((position) => {
          const cannon = new THREE.Mesh(geo, this.cannonUnloadedMat);
          cannon.position.set(...position);
          this.ship.add(cannon);
          return cannon;
        });

        this.starboardCannons = this.starboardCannons.map((position) => {
          const cannon = new THREE.Mesh(geo, this.cannonUnloadedMat);
          // Gotta flip the model
          cannon.rotateZ(Math.PI);
          cannon.position.set(...position);
          this.ship.add(cannon);
          return cannon;
        });
      });

    // Set camera to follow player nice, values set manually
    this.camera = camera;
    this.gameObject.add(this.camera);
    this.camera.position.z = 10;
    this.camera.position.y = 22;
    this.camera.rotateX(0.9);

    const light = new THREE.PointLight(0xffffff, 0.5, 200000);
    const ambient = new THREE.AmbientLight(0x505050);
    this.gameObject.add(light);
    this.gameObject.add(ambient);
    light.position.set(0, -40, 100);

    // Avoid gimble lock with two rotation spheres
    this.moveSphere = new THREE.Object3D();
    this.moveSphere.add(this.gameObject);

    // Add top level obj to scene
    scene.add(this.moveSphere);
  }

  getWorldPosition() {
    this.gameObject.getWorldPosition(this.worldPos);
    return this.worldPos;
  }

  setTurnAngle(angle) {
    this.turnRate = angle;
    this.rudder.rotation.z = -angle * 1000;
    // tween this
    // and add a roll
    this.ship.rotation.z = angle * 100;
  }

  addRoll(impulse) {
    // this.ship.rotateY(angle);
    this.rollSpeed += impulse;
  }

  // Fire logic
  loadCannon(side) {
    // no more than 3, and don't load while fuses are lit
    if (this.ammo[side] < 3 && !this.fuses[side].lit) {
      this.ammo[side] += 1;
    }
  }

  lightFuse(side) {
    // don't light without ammo
    if (this.ammo[side] > 0 && !this.fuses[side].lit) {
      this.fuses[side].lit = true;
      this.fuses[side].time = 0;
    }
  }

  updateCannons(dt, side) {
    const fuse = this.fuses[side];
    const ammo = this.ammo[side];
    // Player fire logic
    if (fuse.lit) {
      fuse.time += dt;
      if (fuse.time > this.FUSE_MAX) {
        if (ammo !== 0) {
          this.fireCannon(
            side,
            this.moveSphere.rotation,
            this.CANNON_POS[ammo - 1]
          );
          // hard coded offest btw cannon fire
          fuse.time = this.FUSE_MAX - 130;
          // Primitives are not passed by ref
          this.ammo[side] -= 1;
          this.addRoll(this.FIRE_ROLL_AMOUNT[side]);
        } else {
          fuse.lit = false;
        }
      }
    }
  }

  updateRoll(dt) {
    // I should probs use dt in here somewhere
    // calc rotation direction
    if (this.ship.rotation.y > 0) {
      this.rollAcc = -0.0003;
    } else if (this.ship.rotation.y < 0) {
      this.rollAcc = 0.0003;
    }

    if (this.rollSpeed !== 0) {
      const shipRoll = this.ship.rotation.y;
      if (isInRange(0.0015, -0.0015, shipRoll) && isInRange(0.0015, -0.0015, this.rollSpeed)) {
        this.rollSpeed = 0;
        this.ship.rotation.y = 0;
      } else {
        this.rollSpeed += this.rollAcc;
        this.rollSpeed *= 0.98;
        this.ship.rotation.y += this.rollSpeed;
      }
    }
  }

  // Central update
  update(dt) {
    // Set this once a frame so that enemies can use it
    this.getWorldPosition();

    this.updateRoll(dt);
    // Update both sets of cannons
    this.updateCannons(dt, SHIP_DIRECTIONS.PORT);
    this.updateCannons(dt, SHIP_DIRECTIONS.STARBOARD);

    // always moving forward
    // switch to acceleration and velocity with a max speed
    if (this.speed > 0 && this.turnRate !== 0) {
      // if turning apply yaw to forward
      this.moveSphere.rotateOnAxis(this.yawAxis, this.turnRate * dt);
    }
    // apply rotspeed to move sphere based on forward
    this.moveSphere.rotateOnAxis(this.forwardAxis, dt * this.speed);
  }
}

export default Player;
