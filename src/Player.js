import * as THREE from 'three';
import { GAME_TYPES } from './Constants';

class Player {
  constructor(scene, camera, worldSize) {
    this.type = GAME_TYPES.PLAYER;
    // move camera to a class that looks at the player
    this.camera = camera;
    // theta, something
    this.position = [1.57, 0.1];
    this.forward = [0, 1];
    this.speed = 0.0005;
    // temp geo
    const worldGeo = new THREE.SphereGeometry(1, 10, 10);
    const worldMat = new THREE.MeshPhongMaterial({ flatShading: true, color: 0xaa0000 });
    const world = new THREE.Mesh(worldGeo, worldMat);
    this.gameObject = world;

    const nubGeo = new THREE.SphereGeometry(0.5, 10, 10);
    const nubMat = new THREE.MeshPhongMaterial({ flatShading: true, color: 0xaa0000 });
    const nub = new THREE.Mesh(nubGeo, nubMat);
    // this.position.z = 0.01;
    this.gameObject = world;
    this.gameObject.add(nub);
    this.gameObject.position.x = worldSize;
    this.gameObject.rotateZ(-Math.PI / 2);
    // Set camera to follow player nice
    this.camera = camera;
    this.gameObject.add(this.camera);
    this.camera.position.z = 20;
    this.camera.position.y = 20;
    this.camera.rotateX(-0.5);
    // this.camera.lookAt(new THREE.Vector3(0, world, 0));

    this.moveSphereX = new THREE.Object3D();
    this.moveSphereY = new THREE.Object3D();
    this.moveSphereX.add(this.moveSphereY);
    this.moveSphereY.add(this.gameObject);
    scene.add(this.moveSphereX);
  }

  // find a better name bc these are angles
  addForward(x, y) {
    const newX = x + this.forward[0];
    const newY = y + this.forward[1];
    const mag = Math.sqrt((newX * newX) + (newY * newY));

    this.forward = [
      newX / mag,
      newY / mag,
    ];
    this.moveSphereX.rotateX(x);
  }

  update(dt) {
    // this.moveSphereX.rotateX(this.forward[0] * dt * this.speed);
    // always moving forward
    this.moveSphereY.rotateY(1 * dt * this.speed);
  }
}

export default Player;
