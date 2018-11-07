import * as THREE from 'three';
import { GAME_TYPES } from '../Constants';
// maybe use this only in one spot so I
// can do the loading screen thing
import { getModel } from '../AssetManager';
import { isInRange } from '../utils';

class Player {
  constructor(scene, camera, worldSize) {
    this.type = GAME_TYPES.PLAYER;
    // move camera to a class that looks at the player
    this.camera = camera;
    this.turnRate = 0;
    this.speed = 0.01 / worldSize; // scaled to world size bc rotation
    this.forwardAxis = new THREE.Vector3(0, 0, 1);
    this.yawAxis = new THREE.Vector3(1, 0, 0);
    this.totalRotation = 0;

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
    const bodyMat = new THREE.MeshPhongMaterial({ flatShading: true, color: 0xaa0000 });
    const sailMat = new THREE.MeshPhongMaterial({ flatShading: true, color: 0xaaaaaa });
    getModel('./Assets/pirate_body.stl')
      .then((geo) => {
        this.body = new THREE.Mesh(geo, bodyMat);
        this.ship.add(this.body);
      });

    getModel('./Assets/pirate_frontsail.stl')
      .then((geo) => {
        this.frontSail = new THREE.Mesh(geo, sailMat);
        this.frontSail.position.x = 2.07;
        this.frontSail.position.y = 18.80;
        this.frontSail.rotateY(0.3);
        this.ship.add(this.frontSail);
      });

    getModel('./Assets/pirate_backsail.stl')
      .then((geo) => {
        this.backSail = new THREE.Mesh(geo, sailMat);
        this.backSail.position.x = 2.16;
        this.backSail.position.y = 7.29;
        this.backSail.rotateY(0.25);
        this.ship.add(this.backSail);
      });

    getModel('./Assets/pirate_rudder.stl')
      .then((geo) => {
        this.rudder = new THREE.Mesh(geo, sailMat);
        // this.rudder.position.x = 2.16;
        this.rudder.position.y = -8.18;
        this.ship.add(this.rudder);
      });

    // Set camera to follow player nice, values set manually
    this.camera = camera;
    this.gameObject.add(this.camera);
    this.camera.position.z = 10;
    this.camera.position.y = 22;
    this.camera.rotateX(0.9);

    // Avoid gimble lock with two rotation spheres
    this.moveSphere = new THREE.Object3D();
    this.moveSphere.add(this.gameObject);

    // Add top level obj to scene
    scene.add(this.moveSphere);
  }

  setTurnAngle(angle) {
    this.turnRate = angle;
    this.rudder.rotation.z = angle * 1000;
  }

  addRoll(impulse) {
    // this.ship.rotateY(angle);
    this.rollSpeed += impulse;
  }

  update(dt) {
    // always moving forward
    // switch to acceleration and velocity with a max speed
    if (this.speed > 0 && this.turnRate !== 0) {
      // if turning apply yaw to forward
      this.moveSphere.rotateOnAxis(this.yawAxis, this.turnRate * dt);
    }
    // apply rotspeed to move sphere based on forward
    // used for cannonballs
    this.totalRotation += dt * this.speed;
    this.moveSphere.rotateOnAxis(this.forwardAxis, dt * this.speed);

    if (this.ship.rotation.y > 0) {
      this.rollAcc = -0.0003;
    } else if (this.ship.rotation.y < 0) {
      // Set boat rotation to nothin
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
}

export default Player;
