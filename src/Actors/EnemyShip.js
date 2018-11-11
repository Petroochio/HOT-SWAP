import * as THREE from 'three';
import { GAME_TYPES } from '../Constants';

import { getModel } from '../AssetManager';

class EnemyShip {
  constructor(scene, worldSize, shoot) {
    this.type = GAME_TYPES.ENEMY;
    this.isActive = false;
    this.scene = scene;
    this.speed = 0.005 / worldSize;
    this.accelCounter = 1000;
    this.forwardAxis = new THREE.Vector3(0, 0, 1);
    this.yawAxis = new THREE.Vector3(1, 0, 0);
    this.shoot = shoot;
    this.shootTimer = 0;
    this.shootMax = 5000;

    // Used to calc actual world position
    this.worldPos = new THREE.Vector3();
    this.hitPos = new THREE.Vector3();

    // maybe scale it up after it fires
    this.gameObject = new THREE.Object3D();
    this.gameObject.position.x = worldSize - 2;
    this.gameObject.rotateY(Math.PI / 2);

    this.forwardMarker = new THREE.Object3D();
    this.forwardMarker.position.y = worldSize - 2;

    const bodyMat = new THREE.MeshPhongMaterial({ flatShading: true, color: 0xaa0000 });
    getModel('./Assets/enemy/enemy_body.stl')
      .then((geo) => {
        this.body = new THREE.Mesh(geo, bodyMat);
        this.gameObject.add(this.body);
      });

    const sailMat = new THREE.MeshBasicMaterial({ color: 0xeeeeee, side: THREE.DoubleSide });
    getModel('./Assets/enemy/enemy_sail.stl')
      .then((geo) => {
        this.sail = new THREE.Mesh(geo, sailMat);
        this.sail.position.y = 9.79;
        this.gameObject.add(this.sail);
      });

    // Debug stuff for hitbox
    // const debugMat = new THREE.MeshBasicMaterial({ color: 0xeeeeee, wireframe: true });
    // this.hitSphere = new THREE.Mesh(new THREE.SphereGeometry(12, 10, 10), debugMat);
    this.hitRadius = 12;
    this.hitTarget = new THREE.Object3D();
    this.hitTarget.position.y = 13;
    this.gameObject.add(this.hitTarget);

    const cannonMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    getModel('./Assets/enemy/enemy_cannon.stl')
      .then((geo) => {
        this.cannon = new THREE.Mesh(geo, cannonMat);
        this.cannon.position.y = 23.99;
        this.gameObject.add(this.cannon);
      });

    // this is the same thing as in all other actors
    // Avoid gimble lock with two rotation spheres
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

  spawn(playerRot) {
    this.isActive = true;
    // Add top level obj to scene
    // I'll need to remove it when it dies
    // this.moveSphere.rotateOnAxis(playerRot, forwardAxis);
    this.moveSphere.rotation.set(playerRot.x, playerRot.y, playerRot.z);
    const yawOffset = (Math.random() * 1.31 * Math.PI) + (Math.PI / 3.5);
    const startOffset = -Math.PI / 4;

    this.moveSphere.rotateOnAxis(this.yawAxis, yawOffset);
    this.moveSphere.rotateOnAxis(this.forwardAxis, startOffset);

    // Add top level obj to scene
    this.gameObject.visible = true;
  }

  die() {
    this.isActive = false;
    this.gameObject.visible = false;
  }

  update(dt, playerPos) {
    if (this.isActive) {
      // Logic for seeking the player
      this.gameObject.getWorldPosition(this.worldPos);
      const forwardVec = new THREE.Vector3();
      this.forwardMarker.getWorldPosition(forwardVec);
      // B′=B−A, C′=C−A, X′=X−A.
      const cross = new THREE.Vector3().crossVectors(this.worldPos, forwardVec).normalize();
      const planeTest = cross.dot(playerPos.normalize());
      let turn = 0;
      if (planeTest > 0.001 || planeTest < -0.001) turn = planeTest > 0 ? 1 : -1;

      // hard coded turn rate at end
      this.moveSphere.rotateOnAxis(this.yawAxis, dt * turn * 0.00001);

      // maybe add another enemy that's got cannons at the side
      this.moveSphere.rotateOnAxis(this.forwardAxis, this.speed * dt);

      // Cannon stuff
      this.shootTimer += dt;
      if (this.shootTimer >= this.shootMax) {
        this.shootTimer = 0;
        this.shoot(this.moveSphere.rotation);
      }
    }
  }
}

export default EnemyShip;
