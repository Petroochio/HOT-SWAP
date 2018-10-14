import xs from 'xstream';
import { clamp } from 'ramda';

import { KEYS } from './Constants';
import Tank from './Tank';
import Bullet from './Bullet';
import { getAnalogButton, getKnob } from './InputParser';

let prevTime = 0;
let canvas;
let ctx;
const input$ = xs.create();

let gasLevel = 0;
let leftDown = false;
let rightDown = false;
const rotSpeed = 0.001;

let dDown = false;
let aDown = false;

const p1 = new Tank([30, 30], '#77f', '#44f');

const bulletPool = [];

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  p1.draw(ctx);

  bulletPool.forEach((b) => {
    if (b.isActive) {
      b.draw(ctx);
    }
  });
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

  p1.move(gasLevel * deltaTime);

  // should I check active here or in bullet
  bulletPool.forEach(b => b.update(deltaTime));

  draw();

  requestAnimationFrame(update.bind(this));
}

function keyDown(e) {
  if (e.keyCode === KEYS.LEFT) {
    leftDown = true;
  } else if (e.keyCode === KEYS.RIGHT) {
    rightDown = true;
  }

  if (e.keyCode === KEYS.D) {
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

  if (e.keyCode === KEYS.D) {
    dDown = false;
  } else if (e.keyCode === KEYS.A) {
    aDown = false;
  }
}

export function init(inputSource$) {
  canvas = document.querySelector('canvas');
  ctx = canvas.getContext('2d');

  // IDK why I thought I needed to do this proxy stuff
  input$.imitate(inputSource$);

  const analogButton$ = getAnalogButton(input$)
    // calibrate?
    .map(clamp(120, 480))
    // float btw 0 and 1, 1 is all the way pressed
    .map(x => (1 - (x - 120) / 360))
    .subscribe({
      next: (x) => { gasLevel = x; }, // filthy side effect
      error: x => console.log(x),
      complete: x => console.log(x),
    });

  const knob$ = getKnob(input$)
    .subscribe({
      next: (x) => console.log(x), // filthy side effect
      error: x => console.log(x),
      complete: x => console.log(x),
    });


  // generate bullet pool
  // for loops make me sick
  for (let i = 0; i < 100; i += 1) {
    bulletPool.push(new Bullet());
  }

  requestAnimationFrame(update.bind(this));
}

window.onkeydown = keyDown.bind(this);
window.onkeyup = keyUp.bind(this);

export default init;
