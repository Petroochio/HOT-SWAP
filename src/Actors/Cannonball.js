import * as THREE from 'three';
import { GAME_TYPES } from '../Constants';

class Cannonball {
  constructor(scene, worldSize) {
    // organize these somehow?
    this.type = GAME_TYPES.CANNONBALL;
    this.ownerType = '';
    this.worldSize = worldSize;
    this.isActive = false;
    this.scene = scene;
    this.speed = 0.07 / worldSize;
    this.playerSpeed = 0.04 / worldSize;
    this.accelCounter = 1000;
    this.forwardAxis = new THREE.Vector3(0, 0, 1);
    this.playerAxis = new THREE.Vector3(0, 0, 0);
    this.yawAxis = new THREE.Vector3(1, 0, 0);
    // Used to store world position
    this.worldPos = new THREE.Vector3();
    this.hitRadius = 3;
    this.flightTime = 0;
    this.maxFlight = 1500;

    // maybe scale it up after it fires
    const ballGeo = new THREE.SphereGeometry(3, 32, 32);
    const ballMat = new THREE.MeshPhongMaterial({ flatShading: false, color: 0x000000 });

    this.gameObject = new THREE.Mesh(ballGeo, ballMat);
    this.gameObject.position.x = worldSize + 4;
    this.gameObject.visible = false;
    // this is the same thing as in all other actors
    // Avoid gimble lock with two rotation spheres
    this.moveSphere = new THREE.Object3D();
    this.moveSphere.add(this.gameObject);
    this.scene.add(this.moveSphere);
  }

  getPosition() {
    this.gameObject.getWorldPosition(this.worldPos);
    return this.worldPos;
  }

  enemyFire(enemyRot, startOffset) {
    this.isActive = true;
    this.gameObject.visible = true;
    this.accelCounter = 300;
    this.ownerType = GAME_TYPES.ENEMY;

    this.gameObject.scale.set(0.001, 0.001, 0.001);
    this.moveSphere.rotation.set(enemyRot.x, enemyRot.y, enemyRot.z);
    this.moveSphere.rotateOnAxis(this.forwardAxis, startOffset);
  }

  playerFire(side, playerRot, startOffset, cannonOffset) {
    this.isActive = true;
    this.gameObject.visible = true;
    this.accelCounter = 300;
    this.ownerType = GAME_TYPES.PLAYER;

    // Add top level obj to scene
    // I'll need to remove it when it dies
    this.gameObject.scale.set(0.001, 0.001, 0.001);
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
  }

  reset() {
    this.isActive = false;
    this.gameObject.visible = false;
    this.flightTime = 0;
  }

  explode() {
    // trigger explosion animation instead
    this.reset();
  }

  splash() {
    // trigger splash animation instead
    this.reset();
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
        this.gameObject.position.x = this.worldSize + 4;
      } else {
        this.flightTime += dt;
        // calc distance from surface of water
        const dist = (4 * (this.maxFlight - this.flightTime) / this.maxFlight);
        this.gameObject.position.x = this.worldSize + dist;

        // I want it to go below the water so I added an extra buffer here, thats the 500
        if (this.flightTime > this.maxFlight + 500) {
          this.splash();
        }

        this.gameObject.scale.set(1, 1, 1);
      }

      this.moveSphere.rotateOnAxis(this.forwardAxis, move);

      // add player angular speed
      if (this.ownerType === GAME_TYPES.PLAYER) {
        this.moveSphere.rotateOnAxis(this.playerAxis, dt * this.playerSpeed);
      }
    }
  }
}

export default Cannonball;
