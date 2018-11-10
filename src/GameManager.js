import * as THREE from 'three';

import Player from './Actors/Player';
import Cannonball from './Actors/Cannonball';
import { getModel } from './AssetManager';
import EnemyShip from './Actors/EnemyShip';
import { GAME_TYPES } from './Constants';

let prevTime = 0;
let totalTime = 0;
let score = 0;
let isGameOver = true;
// Use this to give players grace period at start
let canSpawn = true;

// Screen shake for juice
let isShaking = false;
let shakeTimer = 0;
let shakeIntensity = 4;
let shakeXScale = 0;
let shakeYScale = 0;

const WORLD_SIZE = 300;

const scene = new THREE.Scene();
const cannonballPool = Array.from(
  { length: 150 },
  () => new Cannonball(scene, WORLD_SIZE)
);

let enemySpawnTimer = 0; // start negative to give more time to adapt
const enemySpawnThreshold = 5200;
// dont create a new array every frame
const enemyPool = Array.from(
  { length: 50 },
  () => new EnemyShip(scene, WORLD_SIZE)
);

const portCannonAmmo = 0;
const starboardCannonAmmo = 0;

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

const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0x000033, 1);
renderer.setPixelRatio(window.devicePixelRatio);
// Make world a class that just holds the globe and maybe some clouds, land?
// should also include lights

const worldMat = new THREE.MeshPhongMaterial({ flatShading: true, color: 0x55ffcc });
let world;
getModel('./Assets/world.stl')
  .then((geo) => {
    world = new THREE.Mesh(geo, worldMat);
    world.scale.set(WORLD_SIZE, WORLD_SIZE, WORLD_SIZE);
    scene.add(world);
  });

const player = new Player(scene, camera, WORLD_SIZE);

// rework this to move div, or at least the implementation
// possibly just shake the camera
function startShake(time, intensity) {
  isShaking = true;
  shakeTimer = time;
  shakeIntensity = intensity;
  shakeXScale = Math.random() > 0.5 ? 1 : -1;
  shakeYScale = Math.random() > 0.5 ? 1 : -1;
}

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
    }
  });
}

function update(currentTime) {
  // bail
  if (isGameOver) {
    document.querySelector('#ui').className = '';
    document.querySelector('#game-over').className = '';
    document.querySelector('#score').innerHTML = score;
    return;
  }

  if (prevTime === 0) prevTime = currentTime;
  const dt = currentTime - prevTime;
  prevTime = currentTime;
  totalTime += dt;

  player.update(dt);
  player.getWorldPosition(); // ewwww
  cannonballPool.forEach(c => c.update(dt));
  enemyPool.forEach(e => e.update(dt, player.worldPos));

  checkCollisions();

  // old stuff?
  // Screen shake stuff
  if (isShaking) shakeTimer -= dt;
  if (isShaking && shakeTimer <= 0) isShaking = false;

  // Enemy spawn logic
  enemySpawnTimer += dt;
  if (enemySpawnTimer > enemySpawnThreshold) spawnEnemy();

  // Rendering is so much simpler with THREE than Canvas
  renderer.render(scene, camera);
  requestAnimationFrame(update.bind(this));
}

function reset() {
  prevTime = 0;
  totalTime = 0;
  score = 0;
  isGameOver = false;

  document.querySelector('#ui').className = 'hidden';
  document.querySelector('#title').className = 'hidden';

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

    if (e.keyCode === 32) {
      const cannonball = cannonballPool.find(b => !b.isActive);
      if (cannonball) {
        cannonball.playerFire(
          'STARBOARD',
          player.moveSphere.rotation,
          0.025,
          0.03,
        );

        player.addRoll(-0.01);
        // Front cannon
        // 0.05
        // Mid Cannon
        // 0.025
        // Back cannon
        // 0
      }
    }
  };

  playListener();
}
