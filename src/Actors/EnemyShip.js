import * as THREE from 'three';
import { GAME_TYPES } from '../Constants';

import { getModel } from '../AssetManager';

class EnemyShip {
  constructor(scene, worldSize, fireCannon) {
    this.type = GAME_TYPES.ENEMY;
    this.scene = scene;
    this.worldSize = worldSize;
    this.fireCannon = fireCannon;
    this.speed = 0.005 / worldSize;
    this.forwardAxis = new THREE.Vector3(0, 0, 1);
    this.yawAxis = new THREE.Vector3(1, 0, 0);

    this.isActive = false;
    this.floatPos = 0;
    this.floatAcc = 0;
    this.floatVel = 0;
    this.restingPos = this.worldSize - 2;

    this.shootTimer = 0;
    this.shootMax = 5000;

    // Used to calc actual world position
    this.worldPos = new THREE.Vector3();
    this.hitPos = new THREE.Vector3();

    // used to create a plane to track player
    this.forwardMarker = new THREE.Object3D();
    this.forwardMarker.position.y = worldSize - 2;

    // container for body of the ship
    this.gameObject = new THREE.Object3D();
    this.gameObject.rotateY(Math.PI / 2);

    // Main body
    const bodyMat = new THREE.MeshPhongMaterial({ flatShading: true, color: 0xaa0000 });
    getModel('./Assets/enemy/enemy_body.stl')
      .then((geo) => {
        this.body = new THREE.Mesh(geo, bodyMat);
        this.gameObject.add(this.body);
      });

    // sail
    const sailMat = new THREE.MeshBasicMaterial({ color: 0xeeeeee, side: THREE.DoubleSide });
    getModel('./Assets/enemy/enemy_sail.stl')
      .then((geo) => {
        this.sail = new THREE.Mesh(geo, sailMat);
        this.sail.position.y = 9.79; // hardcoded from model
        this.gameObject.add(this.sail);
      });

    // cannon
    const cannonMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    getModel('./Assets/enemy/enemy_cannon.stl')
      .then((geo) => {
        this.cannon = new THREE.Mesh(geo, cannonMat);
        this.cannon.position.y = 23.99; // hardcoded from model
        this.gameObject.add(this.cannon);
      });

    // Used to calculate hitbox
    this.hitRadius = 12;
    this.hitTarget = new THREE.Object3D();
    // debug stuff so you can see hitbox
    // const debugMat = new THREE.MeshBasicMaterial({ color: 0xeeeeee, wireframe: true });
    // this.hitTarget = new THREE.Mesh(new THREE.SphereGeometry(12, 10, 10), debugMat);
    this.hitTarget.position.y = 13;
    this.gameObject.add(this.hitTarget);

    // this is the same thing as in all other actors
    this.moveSphere = new THREE.Object3D();
    this.moveSphere.add(this.gameObject);
    this.moveSphere.add(this.forwardMarker);
    this.scene.add(this.moveSphere);
    this.gameObject.visible = false;
  }

  calcHit(position, d) {
    this.hitTarget.getWorldPosition(this.hitPos);
    return this.hitPos.distanceTo(position) < d + this.hitRadius;
  }

  // Spawn within an arc of the player at a set distance
  spawn(playerRot) {
    this.isActive = true;
    this.floatPos = -20;

    // start with player position
    this.moveSphere.rotation.set(playerRot.x, playerRot.y, playerRot.z);
    const yawOffset = (Math.random() * 1.31 * Math.PI) + (Math.PI / 3.5);
    const startOffset = -Math.PI / 4;

    // move away from player based on randomly generated position
    this.moveSphere.rotateOnAxis(this.yawAxis, yawOffset);
    this.moveSphere.rotateOnAxis(this.forwardAxis, startOffset);

    // Add top level obj to scene
    this.gameObject.visible = true;
    // trigger spawning animation right here
  }

  die() {
    // trigger death animation
    this.isActive = false;
    this.floatPos = -20;
    this.gameObject.visible = false;
  }

  updateFloat(dt) {
    this.floatAcc = -1 * (this.floatPos) * 0.00001;
    this.floatVel += this.floatAcc * dt;
    this.floatVel *= 0.93;
    this.floatPos += this.floatVel * dt;
    this.gameObject.position.x = this.restingPos + this.floatPos;
  }

  // Logic for seeking the player
  updateHeading(dt, playerPos) {
    this.gameObject.getWorldPosition(this.worldPos);
    const forwardVec = new THREE.Vector3();
    this.forwardMarker.getWorldPosition(forwardVec);
    // B′=B−A, C′=C−A, X′=X−A.
    const cross = new THREE.Vector3().crossVectors(this.worldPos, forwardVec).normalize();
    const planeTest = cross.dot(playerPos.normalize());
    let turn = 0;
    if (planeTest > 0.001 || planeTest < -0.001) turn = planeTest > 0 ? 1 : -1;

    // hard coded turn rate at end, maybe make this a twean
    this.moveSphere.rotateOnAxis(this.yawAxis, dt * turn * 0.0001);
  }

  update(dt, playerPos) {
    if (this.isActive) {
      this.updateFloat(dt);
      this.updateHeading(dt, playerPos);

      // maybe add another enemy that's got cannons at the side
      // move
      this.moveSphere.rotateOnAxis(this.forwardAxis, this.speed * dt);

      // Fire cannon every time the timer is at the right value
      this.shootTimer += dt;
      if (this.shootTimer >= this.shootMax) {
        this.shootTimer = 0;
        this.fireCannon(this.moveSphere.rotation);
      }
    }
  }
}

export default EnemyShip;
