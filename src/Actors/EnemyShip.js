import * as THREE from 'three';
import { GAME_TYPES } from '../Constants';

class EnemyShip {
  constructor(scene, worldSize) {
    this.type = GAME_TYPES.ENEMY;
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

  update(dt) {
    
  }
}

export default EnemyShip;
