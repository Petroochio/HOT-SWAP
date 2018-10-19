import {
  __, add, append, clamp, divide, map,
  reduce, takeLast, zipWith
} from 'ramda';

import * as Vec2 from './Vector2';
import Tank from './Tank';
import Enemy from './Enemy';
import Bullet from './Bullet';
import {
  getAnalogButton, getDigitalButton, getThumbstick, getKnob
} from './InputParser';

let prevTime = 0;
let totalTime = 0;
let canvas;
let ctx;

let gasLevel = 0;
let startSpawning = false;
let turretFwd = [0, 1];
let score = 0;
let isGameOver = true;

let isShaking = false;
let shakeTimer = 0;
let shakeIntensity = 4;
let shakeXScale = 0;
let shakeYScale = 0;

let hitPauseTime = 0;

// maybe I should set world size defaults 0.o
const p1 = new Tank([window.innerWidth / 2, window.innerHeight / 2], '#77f', '#44f', 100, 100);

let enemySpawnTimer = 0; // start negative to give more time to adapt
const enemySpawnThreshold = 10200;
// dont create a new array every frame
let enemies = [];

const bulletPool = Array.from({ length: 100 }, () => new Bullet());

function fireBullet(position, forward, type) {
  // find a bullet
  const bullet = bulletPool.find(b => !b.isActive);
  if (bullet) {
    bullet.activate(position, forward, type);
  }
}

function startShake(time, intensity) {
  isShaking = true;
  shakeTimer = time;
  shakeIntensity = intensity;
  shakeXScale = Math.random() > 0.5 ? 1 : -1;
  shakeYScale = Math.random() > 0.5 ? 1 : -1;
}

function firePlayerBullet() {
  fireBullet(
    Vec2.add(p1.position, Vec2.scale(30, p1.turretFwd)),
    Vec2.copy(p1.turretFwd),
    'player'
  );

  startShake(35, 3);
}

function spawnEnemy() {
  enemySpawnTimer = 0;
  const position = [
    Math.random() * (canvas.width - 80) + 35,
    Math.random() * (canvas.height - 80) + 35,
  ];

  // IDK this code is supposed to make it not spawn near the tank
  const spawnDiff = Vec2.sub(p1.position, position);
  const distance = (spawnDiff[0] * spawnDiff[0] + spawnDiff[1] * spawnDiff[1]);

  if (distance >= canvas.width * canvas.width / 20) {
    enemies.push(new Enemy(position, [0, 1], fireBullet, canvas.width));
  } else {
    enemySpawnTimer = enemySpawnThreshold;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  if (isShaking) {
    ctx.translate(
      Math.cos(shakeTimer) * shakeIntensity * shakeXScale,
      Math.sin(shakeTimer) * shakeIntensity * shakeYScale,
    );
  }
  ctx.lineWidth = 5;

  // Draw all of the bullets
  bulletPool.forEach((b) => {
    if (b.isActive) {
      b.draw(ctx);
    }
  });

  p1.draw(ctx);
  // Draw all of the enemies
  enemies.forEach((e) => { e.draw(ctx); });
  ctx.restore();
}

function update(currentTime) {
  // bail
  if (isGameOver) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.querySelector('#ui').className = '';
    document.querySelector('#game-over').className = '';
    document.querySelector('#score').innerHTML = score;
    return;
  }

  const dt = currentTime - prevTime;
  prevTime = currentTime;
  totalTime += dt;
  // Screen shake stuff
  if (isShaking) shakeTimer -= dt;
  if (isShaking && shakeTimer <= 0) isShaking = false;
  // Why am I setting this in the update?
  p1.setTurretFwd(turretFwd);
  p1.update(dt, gasLevel);

  // Update all the bullets
  bulletPool.forEach((b) => {
    if (b.isActive) {
      b.update(dt);

      // collision stuff
      if (b.checkCollision(p1)) {
        b.isActive = false;
        isGameOver = true;
      }

      // map over enemies
      enemies.forEach((e) => {
        if (b.checkCollision(e)) {
          b.isActive = false;
          e.isActive = false;
          score += 1;
          // idk this seems like a good amount
          startShake(80, 8);
          hitPauseTime = 10; // unused
        }
      });
    }
  });

  // Update all the enemies
  enemies.forEach((e) => {
    e.setTarget(p1.position);
    e.update(dt);
  });

  // this is maybe ok performance wise
  if (enemies.find(e => !e.isActive)) {
    console.log('clearing dead guys');
    enemies = enemies.filter(e => e.isActive);
  }

  // Spawn new enemies
  if (gasLevel > 0) startSpawning = true;
  if (startSpawning) enemySpawnTimer += dt;
  // console.log((enemySpawnThreshold - totalTime / 28));
  if (enemySpawnTimer >= (enemySpawnThreshold - totalTime / 28)) {
    spawnEnemy();
  }

  draw();
  requestAnimationFrame(update.bind(this));
}

function reset() {
  prevTime = 0;
  totalTime = 0;

  gasLevel = 0;
  turretFwd = [0, 1];
  score = 0;
  isGameOver = false;

  p1.position = [window.innerWidth / 2, window.innerHeight / 2];

  enemySpawnTimer = 0;
  startSpawning = false;
  enemies = [];
  bulletPool.forEach((b) => { b.isActive = false; });

  document.querySelector('#ui').className = 'hidden';
  document.querySelector('#title').className = 'hidden';

  requestAnimationFrame(update.bind(this));
}

export function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  p1.xMax = window.innerWidth;
  p1.yMax = window.innerHeight;

  // update all the enemies
  enemies.forEach((e) => { e.xMax = canvas.width; });

  bulletPool.forEach((b) => { b.worldSize = window.innerWidth; });
}

function playListener() {
  // hide ui
  reset();
}

export function init(input$) {
  canvas = document.querySelector('canvas');
  ctx = canvas.getContext('2d');
  resize();

  window.onkeypress = (e) => {
    // I made constants for this specific reason :(
    if (e.keyCode === 32 && isGameOver) {
      playListener();
    }
  };

  // just like all the input stuff here
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

  const digitalButton$ = getDigitalButton(input$)
    .fold((acc, curr) => ({
      prev: curr,
      output: (!acc.prev && curr),
    }), { prev: false })
    .filter(data => data.output)
    .subscribe({
      next: firePlayerBullet, // filthy side effect
      error: val => console.log(val),
      complete: val => console.log(val),
    });

  // calibration values, this might want to move
  // Hard coded and lame
  const knobCal = [
    (538 + 529 + 520 + 510 + 503 + 500 + 502 + 510 + 519 + 529 + 540 + 543) / 12,
    (523 + 533 + 534 + 530 + 522 + 514 + 506 + 498 + 497 + 499 + 506 + 514) / 12,
  ];
  const knob$ = getKnob(input$)
    .map(([x, y]) => ([x - knobCal[0], y - knobCal[1]]))
    // gather the most recent 10 datapoints
    .fold(
      (prev, curr) => append(curr, takeLast(10, prev)),
      [[0, 0]]
    )
    // add all of the prev values together
    .map(reduce((acc, curr) => zipWith(add, acc, curr), [0, 1]))
    .map(map(divide(__, 10)))
    .subscribe({
      next: (fwd) => { turretFwd = Vec2.normalize(fwd); }, // filthy side effect
      error: val => console.log(val),
      complete: val => console.log(val),
    });

  const thumbStick$ = getThumbstick(input$)
    // calibration
    .map(([x, y]) => ([x - 455, y - 450]))
    // deadzone
    .filter(([x, y]) => ((x > 20 || x < -20) && (y > 20 || y < -20)))
    // Smoothing
    // merge the last 10 values
    .fold(
      (prev, curr) => append(curr, takeLast(10, prev)),
      [[0, 0]]
    )
    // add them together
    .map(reduce((acc, curr) => zipWith(add, acc, curr), [0, 1]))
    // average them
    .map(map(divide(__, 10)))
    // invert the y for some reason?
    .map(vec => ([vec[0], -vec[1]]))
    .subscribe({
      next: (val) => { p1.setForward(Vec2.normalize(val)); }, // filthy side effect
      error: val => console.log(val),
      complete: val => console.log(val),
    });
}
