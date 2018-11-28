import * as THREE from 'three';
import { prop } from 'ramda';

import Player from './Actors/Player';
import Cannonball from './Actors/Cannonball';
import { getModel } from './AssetManager';
import EnemyShip from './Actors/EnemyShip';
import { GAME_TYPES, SHIP_DIRECTIONS } from './Constants';
import {
  getHatch, getWick, getRudderKnob, getSailKnob, getAllInputSwap, getFlame
} from './InputParser';

import { cycleInstructions, hideStartScreen, runGameOverSequence } from './UI';

let prevTime = 0;
let totalTime = 0;
let shipsSunk = 0;
let score = 0;
let isGameOver = false;
// Use this to give players grace period at start
let canSpawn = true;

// Start sequence stuff
let canRun = false;
let startSeqCount = 0;
const startSequence = ['SAIL', 'RUDDER', 'HATCH', 'WICK'];

let screen;

// Screen shake for juice
let isShaking = false;
let shakeTime = 0;
const shakeIntensity = 3;
let shakeXScale = 0;
let shakeYScale = 0;
const SHAKE_TIME_MAX = 100;

let hitPauseTime = 0;
const HIT_PAUSE_MAX = 30;

const WORLD_SIZE = 300;

const scene = new THREE.Scene();
// Possibly make this a class so I can do that sweet tween
// find a good number for this
const cameraScale = 8;
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
const fireEnemyCannon = (enemyRot, enemyHeading) => {
  const cannonball = cannonballPool.find(b => !b.isActive && !b.isExploding);
  if (cannonball) {
    cannonball.enemyFire(enemyRot, 0.09, enemyHeading);
  }
};

const enemyPool = Array.from(
  { length: 50 },
  () => new EnemyShip(scene, WORLD_SIZE, fireEnemyCannon)
);

const firePlayerCannon = (side, rotation, position) => {
  const cannonball = cannonballPool.find(b => !b.isActive && !b.isExploding);
  if (cannonball) cannonball.playerFire(side, rotation, position, 0.03);
};

function triggerGameOver(cannonsFired, fireTime) {
  isGameOver = true;
  canRun = false;
  runGameOverSequence(shipsSunk, cannonsFired, totalTime, fireTime);
}

const player = new Player(scene, camera, WORLD_SIZE, firePlayerCannon, triggerGameOver);

// init renderer
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setClearColor(0x666666, 0);
renderer.setPixelRatio(window.devicePixelRatio);

// do bloom effect here, they should make npm packages for this

// Make world a class that just holds the globe and maybe some clouds, land?
// should also include lights, except for player point light
// const worldTex = new THREE.TextureLoader().load('./Assets/world.png'); //0x5599AA
const worldMat = new THREE.MeshLambertMaterial({ color: 0x5599AA, flatShading: true });

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
    const enemy = enemyPool.find(e => !e.isActive && !e.isDying);
    // Hard cap is in the enemy pool rn ~50
    if (enemy) enemy.spawn(player.moveSphere.rotation);
  }
}

function startShake() {
  isShaking = true;
  shakeTime = 0;
  shakeXScale = Math.random() > 0.5 ? 1 : -1;
  shakeYScale = Math.random() > 0.5 ? 1 : -1;
}

function checkCollisions() {
  cannonballPool.forEach((c) => {
    if (c.isActive && !c.isExploding) {
      // Check if enemy is hit
      if (c.ownerType === GAME_TYPES.PLAYER) {
        enemyPool.forEach((e) => {
          if (e.isActive && e.calcHit(c.getPosition(), c.hitRadius)) {
            e.die();
            c.explode();
            shipsSunk += 1;
          }
        });
      } else if (c.ownerType === GAME_TYPES.ENEMY) {
        if (player.getHit(c.getPosition(), c.hitRadius)) {
          c.explode();
          player.addFlame(1000);
          startShake();
        }
      }
    }

    // should also map over enemies to intersect player and each other
    enemyPool.forEach((e1) => {
      if (e1.isActive) {
        enemyPool.forEach((e2) => {
          if (e2.isActive && e2.id !== e1.id && e1.calcHit(e2.getPosition(), e2.hitRadius)) {
            e1.die();
            e2.die();
          }
        });

        if (player.getHit(e1.getPosition(), e1.hitRadius)) {
          e1.die();
          player.addFlame(1000);
          startShake();
          shipsSunk += 1;
        }
      }
    });
  });
}

function update(currentTime) {
  if (prevTime === 0) prevTime = currentTime;
  const dt = currentTime - prevTime;
  prevTime = currentTime;

  // update all this on start screen
  if (!isGameOver) {
    player.update(dt);
    cannonballPool.forEach(c => c.update(dt));
  }

  if (canRun) {
    totalTime += dt;
    enemyPool.forEach(e => e.update(dt, player.getPosition()));

    checkCollisions();

    // Enemy spawn logic
    enemySpawnTimer += dt;
    if (enemySpawnTimer > enemySpawnThreshold) spawnEnemy();

    // screen shake
    if (isShaking) {
      shakeTime += dt;
      screen.style.left = (Math.cos(shakeTime) * shakeIntensity * shakeXScale) + 'px';
      screen.style.top = (Math.sin(shakeTime) * shakeIntensity * shakeYScale) + 'px';

      if (shakeTime > SHAKE_TIME_MAX) {
        isShaking = false;
        screen.style.left = '0px';
        screen.style.top = '0px';
      }
    }
  }

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
  screen = document.querySelector('#screen');
  screen.appendChild(renderer.domElement);
  resize();

  window.onkeyup = (e) => {
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

    // Load port
    if (e.keyCode === 38) {
      player.setSailSpeed(0.00001);
    }

    // Load starboard
    if (e.keyCode === 40) {
      player.setSailSpeed(-0.00001);
    }

    if (e.keyCode === 37) {
      player.setTurnAngle(0.00005);
    }

    // Load starboard
    if (e.keyCode === 39) {
      player.setTurnAngle(-0.00005);
    }

    if (e.keyCode === 70) {
      player.calmFire(1000);
    }
  };

  // Steering
  getRudderKnob(input$)
    .map(data => data.value + Math.PI)
    .fold(
      (prev, value) => {
        let delta = 0;
        const valChange = prev.value - value;
        if (valChange > 0.05) delta = -0.000005;
        if (valChange < -0.05) delta = 0.000005;
        return {
          delta,
          value,
        };
      },
      { delta: 0, value: 0 }
    )
    .filter(data => data.delta !== 0)
    .subscribe({
      next: data => player.setTurnAngle(data.delta),
      error: console.log,
      complete: console.log,
    });

  // Speed
  getSailKnob(input$)
    .map(data => data.value + Math.PI)
    .fold(
      (prev, value) => {
        let delta = 0;
        const valChange = prev.value - value;
        if (valChange > 0.05) delta = 0.000001;
        if (valChange < -0.05) delta = -0.000001;
        return {
          delta,
          value,
        };
      },
      { delta: 0, value: 0 }
    )
    .filter(data => data.delta !== 0)
    .subscribe({
      next: data => player.setSailSpeed(data.delta),
      error: console.log,
      complete: console.log,
    });

  // Ammo
  getHatch(input$)
    .fold(
      (acc, curr) => ({ id: curr.id, prev: curr.isOpen, shouldLoad: (curr.isOpen && !acc.prev) }),
      { id: 0, shouldLoad: false }
    )
    .filter(prop('shouldLoad'))
    .map(({ id }) => (id === 1 ? SHIP_DIRECTIONS.PORT : SHIP_DIRECTIONS.STARBOARD))
    .subscribe({
      next: direction => player.loadCannon(direction),
      error: console.log,
      complete: console.log,
    });

  // Fire
  getWick(input$)
    .fold(
      (acc, curr) => ({ id: curr.id, prev: curr.isLit, shouldLight: (curr.isLit && !acc.prev) }),
      { id: 0, shouldLight: false }
    )
    .filter(prop('shouldLight'))
    .map(({ id }) => (id === 1 ? SHIP_DIRECTIONS.PORT : SHIP_DIRECTIONS.STARBOARD))
    .subscribe({
      next: direction => player.lightFuse(direction),
      error: console.log,
      complete: console.log,
    });

  // Put fire out
  getFlame(input$)
    .fold((acc, curr) => ({
      prev: curr.isPressed,
      output: (!acc.prev && curr.isPressed),
    }), { prev: false })
    .filter(data => data.output)
    .subscribe({
      next: () => player.calmFire(1500),
      error: console.log,
      complete: console.log,
    });

  // Used to trigger speech bubbles
  getAllInputSwap(input$)
    .map(([sideId, type]) =>[
      sideId === 1 ? SHIP_DIRECTIONS.PORT : SHIP_DIRECTIONS.STARBOARD,
      type,
    ])
    .subscribe({
      next: ([side, type]) => {
        player.triggerBubble(side, type);
        if (!isGameOver && !canRun) {
          if (type === startSequence[startSeqCount]) {
            startSeqCount += 1;
            if (startSeqCount < startSequence.length) cycleInstructions(startSeqCount);
          }

          if (startSeqCount === startSequence.length) {
            hideStartScreen();
            canRun = true;
          }
        }
      },
      error: console.log,
      complete: console.log,
    });

  playListener();
}
