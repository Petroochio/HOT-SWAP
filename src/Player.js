import * as THREE from 'three';
import { GAME_TYPES } from './Constants';

class Player {
  constructor(scene, camera) {
    this.type = GAME_TYPES.PLAYER;
    // move camera to a class that looks at the player
    this.camera = camera;
    // theta, something
    this.position = [1.57, 0.1];
    this.forward = [0.1, 0.1];
    this.speed = 0.01;
    // temp geo
    const worldGeo = new THREE.SphereGeometry(1, 10, 10);
    const worldMat = new THREE.MeshPhongMaterial({ flatShading: true, color: 0xaa0000 });
    const world = new THREE.Mesh(worldGeo, worldMat);
    this.gameObject = world;
    scene.add(world);
  }

  update(dt) {
    // lat
    this.position[0] += this.forward[0] * dt * this.speed;
    // long
    this.position[1] += this.forward[1] * dt * this.speed;
    if (this.position[1] >= 3.14 && this.forward > 0) {
      this.position[1] = -(this.position[1] - 3.14) - 3.14;
    } else if (this.position[1] <= -3.14 && this.forward < 0) {
      this.position[1] = -(this.position[1] - 3.14) + 3.14;
    }
    // where s is lat
    // and t is lon
    // x = r * cos(s) * sin(t)
    // y = r * sin(s) * sin(t)
    // z = r * cos(t)

    // transform position to position
    // x = r sin(something) cos(theta)
    // y = r sin(something) sin(theta)
    // z = r cos(something)
    // this puts it on surface of sphere
    // swap y and z because of how the axis in three is
    this.gameObject.position.x = 5 * Math.cos(this.position[0]) * Math.sin(this.position[1]);
    this.gameObject.position.y = 5 * Math.cos(this.position[1]);
    this.gameObject.position.z = 5 * Math.sin(this.position[0]) * Math.sin(this.position[1]);
  }
}

export default Player;
