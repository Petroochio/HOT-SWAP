import { KEYS } from './Constants';
import Tank from './Tank';

let prevTime = 0;
let canvas;
let ctx;

let leftDown = false;
let rightDown = false;
const rotSpeed = 0.001;

let wDown = false;
let dDown = false;
let aDown = false;

const p1 = new Tank({ x: 30, y: 30 }, '#77f', '#44f');

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  p1.draw(ctx);
}

function update(currentTime) {
  const deltaTime = currentTime - prevTime;
  prevTime = currentTime;

  if (leftDown) {
    p1.rotateTurret(-rotSpeed * deltaTime);
  } else if (rightDown) {
    p1.rotateTurret(rotSpeed * deltaTime);
  }

  if (aDown) {
    p1.rotateTread(-rotSpeed * deltaTime);
  } else if (dDown) {
    p1.rotateTread(rotSpeed * deltaTime);
  }

  if (wDown) {
    p1.move(deltaTime);
  }

  draw();

  requestAnimationFrame(update.bind(this));
}

function keyDown(e) {
  if (e.keyCode === KEYS.LEFT) {
    leftDown = true;
  } else if (e.keyCode === KEYS.RIGHT) {
    rightDown = true;
  }

  if (e.keyCode === KEYS.W) {
    wDown = true;
  } else if (e.keyCode === KEYS.D) {
    dDown = true;
  } else if (e.keyCode === KEYS.A) {
    aDown = true;
  }
}

function keyUp(e) {
  if (e.keyCode === KEYS.LEFT) {
    leftDown = false;
  } else if (e.keyCode === KEYS.RIGHT) {
    rightDown = false;
  }

  if (e.keyCode === KEYS.W) {
    wDown = false;
  }

  if (e.keyCode === KEYS.D) {
    dDown = false;
  } else if (e.keyCode === KEYS.A) {
    aDown = false;
  }
}

export function init() {
  canvas = document.querySelector('canvas');
  ctx = canvas.getContext('2d');

  requestAnimationFrame(update.bind(this));
}

window.onkeydown = keyDown.bind(this);
window.onkeyup = keyUp.bind(this);

export default init;
