import {
  __, add, append, clamp, divide, map,
  reduce, takeLast, zipWith
} from 'ramda';

import * as THREE from 'three';

import {
  getAnalogButton, getDigitalButton, getThumbstick, getKnob
} from './InputParser';

let prevTime = 0;
let totalTime = 0;
let score = 0;
let isGameOver = true;

let isShaking = false;
let shakeTimer = 0;
let shakeIntensity = 4;
let shakeXScale = 0;
let shakeYScale = 0;

let enemySpawnTimer = 0; // start negative to give more time to adapt
const enemySpawnThreshold = 10200;
// dont create a new array every frame
let enemies = [];

const scene = new THREE.Scene();
// Maybe attach this to player
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer();
var geometry = new THREE.BoxGeometry( 1, 1, 1 );
  var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
  var cube = new THREE.Mesh( geometry, material );
  scene.add( cube );

function startShake(time, intensity) {
  isShaking = true;
  shakeTimer = time;
  shakeIntensity = intensity;
  shakeXScale = Math.random() > 0.5 ? 1 : -1;
  shakeYScale = Math.random() > 0.5 ? 1 : -1;
}

function render() {
  renderer.render(scene, camera);
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
  // Screen shake stuff
  if (isShaking) shakeTimer -= dt;
  if (isShaking && shakeTimer <= 0) isShaking = false;

  cube.rotation.x += 0.01 * dt;
  cube.rotation.y += 0.01 * dt;
  render();
  requestAnimationFrame(update.bind(this));
}

function reset() {
  prevTime = 0;
  totalTime = 0;
  score = 0;
  isGameOver = false;
  enemies = [];

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

  camera.position.z = 5;

  window.onkeypress = (e) => {
    // I made constants for this specific reason :(
    if (e.keyCode === 32 && isGameOver) {
      playListener();
    }
  };
}
