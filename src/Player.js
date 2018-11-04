import * as THREE from 'three';
import { GAME_TYPES } from './Constants';
// maybe use this only in one spot so I
// can do the loading screen thing
import { getModel } from './AssetManager';

class Player {
  constructor(scene, camera, worldSize) {
    this.type = GAME_TYPES.PLAYER;
    // move camera to a class that looks at the player
    this.camera = camera;
    this.turnRate = 0;
    this.speed = 0.005 / worldSize; // scaled to world size bc rotation

    // Set it to be on the edge of the world
    this.gameObject = new THREE.Object3D();
    this.gameObject.position.x = worldSize - 4;
    this.gameObject.rotateZ(-Math.PI / 2);
    this.gameObject.rotateX(-Math.PI / 2);

    // ship body
    // this mat might need to change
    const bodyMat = new THREE.MeshPhongMaterial({ flatShading: true, color: 0xaa0000 });
    const sailMat = new THREE.MeshPhongMaterial({ flatShading: true, color: 0xaaaaaa });
    getModel('./Assets/pirate_body.stl')
      .then((geo) => {
        this.body = new THREE.Mesh(geo, bodyMat);
        this.gameObject.add(this.body);
      });

    getModel('./Assets/pirate_frontsail.stl')
      .then((geo) => {
        this.frontSail = new THREE.Mesh(geo, sailMat);
        this.frontSail.position.x = 2.07;
        this.frontSail.position.y = 18.80;
        this.frontSail.rotateY(0.3);
        this.gameObject.add(this.frontSail);
      });

    getModel('./Assets/pirate_backsail.stl')
      .then((geo) => {
        this.backSail = new THREE.Mesh(geo, sailMat);
        this.backSail.position.x = 2.16;
        this.backSail.position.y = 7.29;
        this.backSail.rotateY(0.25);
        this.gameObject.add(this.backSail);
      });

    getModel('./Assets/pirate_rudder.stl')
      .then((geo) => {
        this.rudder = new THREE.Mesh(geo, sailMat);
        // this.rudder.position.x = 2.16;
        this.rudder.position.y = -8.18;
        this.gameObject.add(this.rudder);
      });
    // Set camera to follow player nice, values set manually
    this.camera = camera;
    this.gameObject.add(this.camera);
    this.camera.position.z = 10;
    this.camera.position.y = 22;
    this.camera.rotateX(0.9);

    // Avoid gimble lock with two rotation spheres
    this.moveSphereX = new THREE.Object3D();
    this.moveSphereY = new THREE.Object3D();
    this.moveSphereX.add(this.moveSphereY);
    this.moveSphereY.add(this.gameObject);

    // Add top level obj to scene
    scene.add(this.moveSphereX);
  }

  setTurnAngle(angle) {
    this.turnRate = angle / 6000;
    this.rudder.rotation.z = -angle;
  }

  update(dt) {
    // always moving forward
    console.log(this.turnRate * dt);
    // switch to acceleration and velocity with a max speed
    if (this.speed > 0) {
      this.moveSphereX.rotateX(this.turnRate * dt);
    }
    this.moveSphereY.rotateY(1 * dt * this.speed);
  }
}

export default Player;
