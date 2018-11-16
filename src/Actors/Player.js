import * as THREE from 'three';
import { clamp } from 'ramda';

import { GAME_TYPES, SHIP_DIRECTIONS } from '../Constants';
// maybe use asset manager only in one spot so I
// can do the loading screen thing, then pass the models
// or since it's memoized just do a preload somewhere
import { getModel } from '../AssetManager';
import { isInRange } from '../utils';

class Player {
  constructor(scene, camera, worldSize, fireCannon) {
    this.type = GAME_TYPES.PLAYER;
    // move camera to a class that looks at the player maybe
    this.scene = scene;
    this.velocityMin = 0.000007;
    this.velocityMax = 0.00015; // scaled to world size bc rotation
    this.velocityTarget = this.velocityMin;
    this.velocity = this.velocityMin;
    this.acceleration = 0.0000001;
    this.forwardAxis = new THREE.Vector3(0, 0, 1);
    this.yawAxis = new THREE.Vector3(1, 0, 0);
    this.worldPos = new THREE.Vector3(); // stores world location

    this.rollOffset = 0;
    this.turnRollOffset = 0;

    this.turnRate = 0;
    this.rollSpeed = 0;
    this.rollAcc = 0;

    // Set it to be on the edge of the world
    this.gameObject = new THREE.Object3D();
    this.gameObject.position.x = worldSize - 4;
    this.gameObject.rotateY(Math.PI / 2);

    // ship body
    this.ship = new THREE.Object3D();
    this.gameObject.add(this.ship);

    // this mat might need to change
    const bodyMat = new THREE.MeshPhongMaterial({ flatShading: true, color: 0xD69136 });
    getModel('./Assets/pirate/pirate_body.stl')
      .then((geo) => {
        this.body = new THREE.Mesh(geo, bodyMat);
        this.ship.add(this.body);
      });
    const specular = new THREE.Color(0xffffff);
    // Sails
    const sailMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      // specular,
      shininess: 100,
      reflectivity: 0,
    });
    // sailMat.specular = ;
    getModel('./Assets/pirate/pirate_frontsail.stl')
      .then((geo) => {
        this.frontSail = new THREE.Mesh(geo, sailMat);
        this.frontSail.position.x = 2.07; // hard coded from model file
        this.frontSail.position.y = 18.80;
        this.ship.add(this.frontSail);
      });

    getModel('./Assets/pirate/pirate_backsail.stl')
      .then((geo) => {
        this.backSail = new THREE.Mesh(geo, sailMat);
        this.backSail.position.x = 2.16; // hard coded from model file
        this.backSail.position.y = 7.29;
        this.ship.add(this.backSail);
      });

    getModel('./Assets/pirate/pirate_rudder.stl')
      .then((geo) => {
        this.rudder = new THREE.Mesh(geo, sailMat);
        this.rudder.position.y = -8.18; // hard coded from model file
        this.ship.add(this.rudder);
      });

    // Map over these positions in loader to set cannon spot
    // values are hard coded from models
    this.portCannons = [[-2.49, 18.05, 0], [-3.49, 10.95, 0], [-2.49, 3.86, 0]];
    this.starboardCannons = [[2.49, 18.05, 0], [3.49, 10.95, 0], [2.49, 3.86, 0]];
    this.cannonLoadedMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.cannonMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    getModel('./Assets/pirate/pirate_cannon.stl')
      .then((geo) => {
        this.portCannons = this.portCannons.map((position) => {
          const cannon = new THREE.Mesh(geo, this.cannonMat);
          cannon.position.set(...position);
          this.ship.add(cannon);
          return cannon;
        });

        this.starboardCannons = this.starboardCannons.map((position) => {
          const cannon = new THREE.Mesh(geo, this.cannonMat);
          // Gotta flip the model
          cannon.rotateZ(Math.PI);
          cannon.position.set(...position);
          this.ship.add(cannon);
          return cannon;
        });
      });

    // Fire logic
    this.fireCannon = fireCannon; // passed in to use cannon pool
    // names for these need to match the constants
    this.ammo = { PORT: 0, STARBOARD: 0 };
    this.fuses = {
      PORT: { lit: false, time: 0 },
      STARBOARD: { lit: false, time: 0 },
    };
    this.FUSE_MAX = 200;
    // [back, mid, front]
    this.CANNON_POS = [0, 0.025, 0.05];
    this.FIRE_ROLL_AMOUNT = { PORT: 0.007, STARBOARD: -0.007 };

    // Set camera to follow player nice, values set manually
    // consider camera class if it needs any functionality
    this.camera = camera;
    this.gameObject.add(this.camera);
    this.camera.position.z = 10;
    this.camera.position.y = 22;
    this.camera.rotateX(0.9);

    // Why am I setting lights on the player? so what you look at is illuminated nice
    const light = new THREE.PointLight(0xffffff, 0.5, 200000);
    // const light2 = new THREE.PointLight(0xffffff, 0.5, 200);
    const ambient = new THREE.AmbientLight(0x505050);
    this.gameObject.add(light);
    // this.gameObject.add(light2);
    this.gameObject.add(ambient);
    light.position.set(0, -40, 100);
    // light2.position.set(0, 2, 30);

    // Avoid gimble lock with rotation spheres
    this.moveSphere = new THREE.Object3D();
    this.moveSphere.add(this.gameObject);

    // Add top level obj to scene
    scene.add(this.moveSphere);
  }

  // Used for collisions and player tracking on enemies
  getWorldPosition() {
    this.gameObject.getWorldPosition(this.worldPos);
    return this.worldPos;
  }

  setTurnAngle(angle) {
    this.turnRate = clamp(-0.0005, 0.0005, this.turnRate + angle);
    this.rudder.rotation.z = -this.turnRate * 1000;
    // tween this
    // and add a roll
    this.turnRollOffset = -this.turnRate * 150;
    // this.ship.rotation.z = this.turnRate * 200;
  }

  setSailSpeed(delta) {
    // scale sails here
    this.velocityTarget = clamp(this.velocityMin, this.velocityMax, this.velocityTarget + delta);
  }

  addRoll(impulse) {
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
          fuse.time = this.FUSE_MAX - 100;
          // Primitives are not passed by ref so i need to do this here
          this.ammo[side] -= 1;

          // maybe cancel the animation to add impact
          this.addRoll(this.FIRE_ROLL_AMOUNT[side]);
        } else {
          // out of ammo, stop firing
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

    this.ship.rotation.y = this.turnRollOffset;
    // Only roll when there is roll speed
    if (this.rollSpeed !== 0) {
      // Stop the roll if the speed is low and at center
      if (isInRange(0.0015, -0.0015, this.rollOffset) && isInRange(0.0015, -0.0015, this.rollSpeed)) {
        this.rollSpeed = 0;
      } else {
        this.rollSpeed += this.rollAcc;
        this.rollSpeed *= 0.98;
        this.rollOffset += this.rollSpeed;
        this.ship.rotation.y = this.rollOffset + this.turnRollOffset;
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
    if (this.velocity >= this.velocityMin && this.turnRate !== 0) {
      // if turning apply yaw to forward
      this.moveSphere.rotateOnAxis(this.yawAxis, this.turnRate * dt);
    }
    // just change velocity max
    if (this.velocity > this.velocityTarget) {
      this.velocity -= this.acceleration * dt;
    } else {
      this.velocity += this.acceleration * dt;
    }

    // apply rotspeed to move sphere based on forward
    this.moveSphere.rotateOnAxis(this.forwardAxis, dt * this.velocity);
  }
}

export default Player;
