import * as THREE from 'three';
import { GAME_TYPES, SHIP_DIRECTIONS } from '../Constants';

class Cannonball {
  constructor(scene, worldSize) {
    // Constant properties
    this.type = GAME_TYPES.CANNONBALL;
    this.scene = scene;
    this.worldSize = worldSize;
    this.speed = 0.07 / worldSize;
    this.playerSpeed = 0.04 / worldSize; // Use only when player owner
    this.forwardAxis = new THREE.Vector3(0, 0, 1);
    this.yawAxis = new THREE.Vector3(1, 0, 0);
    this.hitRadius = 3; // Size for calculating collisions

    this.isActive = false;
    this.ownerType = ''; // set when fired
    this.accelCounter = 1000;
    this.playerAxis = new THREE.Vector3(0, 0, 0);
    // Used to store world position
    this.worldPos = new THREE.Vector3();

    this.flightTime = 0;
    this.maxFlight = 1500;

    // maybe scale it up after it fires
    const ballGeo = new THREE.SphereGeometry(3, 32, 32); // un hardcode these pls
    const ballMat = new THREE.MeshPhongMaterial({ flatShading: false, color: 0x000000 });

    // This game object is just one model, the ball itself
    this.gameObject = new THREE.Mesh(ballGeo, ballMat);
    this.gameObject.position.x = worldSize + 4;
    this.gameObject.visible = false;

    // this is the same thing as in all other actors
    this.moveSphere = new THREE.Object3D();
    this.moveSphere.add(this.gameObject);
    this.scene.add(this.moveSphere);
  }

  getPosition() {
    this.gameObject.getWorldPosition(this.worldPos);
    return this.worldPos;
  }

  reset(ownerType) {
    this.isActive = true;
    this.gameObject.visible = true;
    this.accelCounter = 300;
    this.ownerType = ownerType;
    // Initialize size for startup animation
    this.gameObject.scale.set(0.001, 0.001, 0.001);
  }

  enemyFire(enemyRot, startOffset) {
    this.reset(GAME_TYPES.ENEMY);
    // Set position, then rotate to front of cannon
    this.moveSphere.rotation.set(enemyRot.x, enemyRot.y, enemyRot.z);
    this.moveSphere.rotateOnAxis(this.forwardAxis, startOffset);
  }

  // Fires cannonball as if rom player
  playerFire(side, playerRot, startOffset, cannonOffset) {
    this.reset(GAME_TYPES.PLAYER);

    // Set position, then move to relative position of cannon
    this.moveSphere.rotation.set(playerRot.x, playerRot.y, playerRot.z);
    this.moveSphere.rotateOnAxis(this.forwardAxis, startOffset);

    // Based on the side it is fired from, rotate and set player forward axis
    // Might want to make this section generic
    if (side === SHIP_DIRECTIONS.PORT) {
      this.moveSphere.rotateOnAxis(this.yawAxis, Math.PI / 2);
      this.playerAxis = new THREE.Vector3(0, 1, 0);
    } else {
      this.moveSphere.rotateOnAxis(this.yawAxis, -Math.PI / 2);
      this.playerAxis = new THREE.Vector3(0, -1, 0);
    }

    // Move to front of cannon
    this.moveSphere.rotateOnAxis(this.forwardAxis, cannonOffset);
  }

  hide() {
    this.isActive = false;
    this.gameObject.visible = false;
    this.flightTime = 0;
  }

  // Triggers exploding animation
  explode() {
    // trigger explosion animation instead
    this.hide();
  }

  // Triggers splashing animation
  splash() {
    // trigger splash animation instead
    this.hide();
  }

  update(dt) {
    if (this.isActive) {
      let move = dt * this.speed;

      // Starting animation that speeds up cannonball when first fired
      if (this.accelCounter > 0) {
        this.accelCounter -= dt;
        move *= this.accelCounter / 150;
        move = move < dt * this.speed ? dt * this.speed : move;

        const s = (300 - this.accelCounter) / 270;
        this.gameObject.scale.set(s, s, s);
        this.gameObject.position.x = this.worldSize + 4;
      } else {
        // Adds to the flight time and moves the cannon closer to water
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

      // Movement
      this.moveSphere.rotateOnAxis(this.forwardAxis, move);
      // add player angular speed
      if (this.ownerType === GAME_TYPES.PLAYER) {
        this.moveSphere.rotateOnAxis(this.playerAxis, dt * this.playerSpeed);
      }
    }
  }
}

export default Cannonball;
