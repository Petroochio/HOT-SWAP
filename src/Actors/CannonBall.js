import * as THREE from 'three';
import { GAME_TYPES } from '../Constants';

class Cannonball {
  constructor(scene, worldSize) {
    this.type = GAME_TYPES.CANNONBALL;
    this.isActive = false;
    this.scene = scene;
    this.speed = 0.07 / worldSize;
    this.playerSpeed = 0.04 / worldSize;
    this.accelCounter = 1000;
    this.forwardAxis = new THREE.Vector3(0, 0, 1);
    this.playerAxis = new THREE.Vector3(0, 0, 0);
    this.yawAxis = new THREE.Vector3(1, 0, 0);

    // maybe scale it up after it fires
    const ballGeo = new THREE.SphereGeometry(3, 32, 32);
    const ballMat = new THREE.MeshPhongMaterial({ flatShading: false, color: 0x000000 });

    this.gameObject = new THREE.Mesh(ballGeo, ballMat);
    this.gameObject.position.x = worldSize + 5;

    // this is the same thing as in all other actors
    // Avoid gimble lock with two rotation spheres
    this.moveSphere = new THREE.Object3D();
    this.moveSphere.add(this.gameObject);
  }

  fire(side, playerRot, startOffset, cannonOffset) {
    this.isActive = true;
    this.accelCounter = 300;
    // Add top level obj to scene
    // I'll need to remove it when it dies
    // this.moveSphere.rotateOnAxis(playerRot, forwardAxis);
    this.moveSphere.rotation.set(playerRot.x, playerRot.y, playerRot.z);
    this.moveSphere.rotateOnAxis(this.forwardAxis, startOffset);
    if (side === 'PORT') {
      this.moveSphere.rotateOnAxis(this.yawAxis, Math.PI / 2);
      this.playerAxis = new THREE.Vector3(0, 1, 0);
    } else {
      this.moveSphere.rotateOnAxis(this.yawAxis, -Math.PI / 2);
      this.playerAxis = new THREE.Vector3(0, -1, 0);
    }

    this.moveSphere.rotateOnAxis(this.forwardAxis, cannonOffset);
    this.scene.add(this.moveSphere);
  }

  update(dt) {
    if (this.isActive) {
      let move = dt * this.speed;
      // hacky fire animation code
      if (this.accelCounter > 0) {
        this.accelCounter -= dt;
        move *= this.accelCounter / 150;
        move = move < dt * this.speed ? dt * this.speed : move;

        const s = (300 - this.accelCounter) / 270;
        this.gameObject.scale.set(s, s, s);
      } else {
        this.gameObject.scale.set(1, 1, 1);
      }
      this.moveSphere.rotateOnAxis(this.forwardAxis, move);
      this.moveSphere.rotateOnAxis(this.playerAxis, dt * this.playerSpeed);
    }
  }
}

export default Cannonball;
