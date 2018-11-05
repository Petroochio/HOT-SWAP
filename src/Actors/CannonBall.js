import * as THREE from 'three';
import { GAME_TYPES } from '../Constants';

class Cannonball {
  constructor(scene, worldSize) {
    this.type = GAME_TYPES.CANNONBALL;
    this.isActive = false;
    this.scene = scene;
    this.speed = 0.1 / worldSize;
    this.accelCounter = 1000;

    // maybe scale it up after it fires
    const ballGeo = new THREE.SphereGeometry(3, 32, 32);
    const ballMat = new THREE.MeshPhongMaterial({ flatShading: false, color: 0x000000 });

    this.gameObject = new THREE.Mesh(ballGeo, ballMat);
    this.gameObject.position.x = worldSize + 5;

    // this is the same thing as in all other actors
    // Avoid gimble lock with two rotation spheres
    this.moveSphereX = new THREE.Object3D();
    this.moveSphereY = new THREE.Object3D();
    this.moveSphereX.add(this.moveSphereY);
    this.moveSphereY.add(this.gameObject);
  }

  fire(xrot, yrot) {
    this.isActive = true;
    this.accelCounter = 300;
    // Add top level obj to scene
    // I'll need to remove it when it dies
    this.moveSphereX.rotation.x = xrot;
    this.moveSphereY.rotation.y = yrot;
    this.scene.add(this.moveSphereX);
  }

  update(dt) {
    if (this.isActive) {
      let move = dt * this.speed;
      // hacky fire animation code
      if (this.accelCounter > 0) {
        this.accelCounter -= dt;
        move *= this.accelCounter / 100;
        move = move < dt * this.speed ? dt * this.speed : move;

        const s = (300 - this.accelCounter) / 270;
        this.gameObject.scale.set(s, s, s);
      } else {
        this.gameObject.scale.set(1, 1, 1);
      }
      this.moveSphereY.rotateY(move);
    }
  }
}

export default Cannonball;
