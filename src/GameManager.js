import * as THREE from 'three';
import Player from './Player';

let prevTime = 0;
let totalTime = 0;
let score = 0;
let isGameOver = true;

// Screen shake for juice
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
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10;
camera.lookAt(new THREE.Vector3(0,0,0));

const renderer = new THREE.WebGLRenderer();
// Make world a class that just holds the globe and maybe some clouds, land?
// should also include lights
const worldGeo = new THREE.SphereGeometry(5, 32, 32);
const worldMat = new THREE.MeshPhongMaterial({ flatShading: true, color: 0xa0a0a0 });
const world = new THREE.Mesh(worldGeo, worldMat);
scene.add(world);
// Maybe use some ambient light so I don't gotta do this shit
const light = new THREE.DirectionalLight(0xffffff, 1);
const light2 = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(light);
scene.add(light2);

const player = new Player(scene, camera);

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

  // Enemy spawn logic
  enemySpawnTimer += dt;
  player.update(dt);

  // Spin the earth
  // world.rotation.x += 0.0001 * dt;
  // world.rotation.y += 0.0001 * dt;

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

  playListener();
  // window.onkeypress = (e) => {
  //   // I made constants for this specific reason :(
  //   if (e.keyCode === 32 && isGameOver) {
  //     playListener();
  //   }
  // };
}
