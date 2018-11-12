import * as THREE from 'three';

import Player from './Actors/Player';
import Cannonball from './Actors/Cannonball';
import { getModel } from './AssetManager';
import EnemyShip from './Actors/EnemyShip';
import { GAME_TYPES, SHIP_DIRECTIONS } from './Constants';

let prevTime = 0;
let totalTime = 0;
let score = 0;
let isGameOver = true;
// Use this to give players grace period at start
let canSpawn = true;

// Screen shake for juice
let isShaking = false;
let shakeTimer = 0;

const WORLD_SIZE = 300;

const scene = new THREE.Scene();
// Possibly make this a class so I can do that sweet tween
// find a good number for this
const cameraScale = 7;
const camera = new THREE.OrthographicCamera(
  window.innerWidth / (-cameraScale),
  window.innerWidth / cameraScale,
  window.innerHeight / cameraScale,
  window.innerHeight / (-cameraScale),
  -100,
  1000
);

const cannonballPool = Array.from(
  { length: 150 },
  () => new Cannonball(scene, WORLD_SIZE)
);

let enemySpawnTimer = 0; // start negative to give more time to adapt
const enemySpawnThreshold = 5200;

// Arrow to keep scope, pass to enemy so we can share one pool
// maybe create a separate pool for enemy and player :|
const fireEnemyCannon = (enemyRot) => {
  const cannonball = cannonballPool.find(b => !b.isActive);
  if (cannonball) {
    cannonball.enemyFire(enemyRot, 0.09);
  }
};

const enemyPool = Array.from(
  { length: 50 },
  () => new EnemyShip(scene, WORLD_SIZE, fireEnemyCannon)
);

const firePlayerCannon = (side, rotation, position) => {
  const cannonball = cannonballPool.find(b => !b.isActive);
  if (cannonball) cannonball.playerFire(side, rotation, position, 0.03);
};
const player = new Player(scene, camera, WORLD_SIZE, firePlayerCannon);

// init renderer
const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0x000033, 1);
renderer.setPixelRatio(window.devicePixelRatio);

// Make world a class that just holds the globe and maybe some clouds, land?
// should also include lights, except for player point light
const worldMat = new THREE.MeshPhongMaterial({ flatShading: true, color: 0x55ffcc });
let world;
getModel('./Assets/world.stl')
  .then((geo) => {
    world = new THREE.Mesh(geo, worldMat);
    world.scale.set(WORLD_SIZE, WORLD_SIZE, WORLD_SIZE);
    scene.add(world);
  });

function spawnEnemy() {
  if (canSpawn) {
    enemySpawnTimer = 0;
    const enemy = enemyPool.find(e => !e.isActive);
    // Hard cap is in the enemy pool rn ~50
    if (enemy) enemy.spawn(player.moveSphere.rotation);
  }
}

function checkCollisions() {
  cannonballPool.forEach((c) => {
    if (c.isActive) {
      // Check if enemy is hit
      if (c.ownerType === GAME_TYPES.PLAYER) {
        enemyPool.forEach((e) => {
          if (e.isActive && e.calcHit(c.getPosition(), c.hitRadius)) {
            e.die();
            c.explode();
          }
        });
      }
      // check player hit here
      // should also map over enemies to intersect player
    }
  });
}

function update(currentTime) {
  if (prevTime === 0) prevTime = currentTime;
  const dt = currentTime - prevTime;
  prevTime = currentTime;
  totalTime += dt;

  player.update(dt);
  cannonballPool.forEach(c => c.update(dt));
  enemyPool.forEach(e => e.update(dt, player.worldPos));

  checkCollisions();

  // Enemy spawn logic
  enemySpawnTimer += dt;
  if (enemySpawnTimer > enemySpawnThreshold) spawnEnemy();

  // Rendering is so much simpler with THREE than Canvas
  renderer.render(scene, camera);
  requestAnimationFrame(update.bind(this));
}

function reset() {
  // do game state reset stuff here
  prevTime = 0;
  totalTime = 0;

  requestAnimationFrame(update.bind(this));
}

export function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function playListener() {
  // hide ui
  reset();
}

export function init(input$) {
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  resize();

  window.onkeydown = (e) => {
    // I made constants for this specific reason :(
    if (e.keyCode === 37) {
      // should be adding to turn angle with actual controller
      // also need to add stuff for speed
      player.setTurnAngle(0.0004);
    } else if (e.keyCode === 39) {
      player.setTurnAngle(-0.0004);
    }
  };

  window.onkeyup = (e) => {
    // I made constants for this specific reason :(
    if (e.keyCode === 37 || e.keyCode === 39) {
      player.setTurnAngle(0);
    }

    // light port
    if (e.keyCode === 87) {
      player.lightFuse(SHIP_DIRECTIONS.PORT);
    }
    // light starboard
    if (e.keyCode === 83) {
      player.lightFuse(SHIP_DIRECTIONS.STARBOARD);
    }

    // Load port
    if (e.keyCode === 65) {
      player.loadCannon(SHIP_DIRECTIONS.PORT);
    }

    // Load starboard
    if (e.keyCode === 68) {
      player.loadCannon(SHIP_DIRECTIONS.STARBOARD);
    }
  };

  playListener();
}
