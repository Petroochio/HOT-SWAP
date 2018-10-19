import * as Vec2 from './Vector2';

function Bullet() {
  this.position = [100, 0];
  this.forward = [0, 1];
  this.isActive = false;
  this.lifeTimer = 0;
  this.lifeMax = 2000;
  this.worldSize = 100;
  this.speed = 0.3;
  this.size = 0.02; // hard coded same as tank size
  this.type = 'player'; // or 'enemy';
}

function activate(position, forward, type) {
  this.position = position;
  this.forward = forward;

  this.type = type;
  if (type === 'enemy') {
    this.speed = 0.03;
  } else {
    this.speed = 0.3;
  }
  this.lifeTimer = 0;
  this.isActive = true;
}

/**
 * 
 * @param {*} target : enemy or player object
 * @returns bool : did it hit the thing
 */
function checkCollision(target) {
  const diff = Vec2.sub(target.position, this.position);
  const distance = diff[0] * diff[0] + diff[1] * diff[1];
  const hitThreshold = target.getWorldHitRadius() * target.getWorldHitRadius()
                       + (this.size * this.worldSize / 3) * (this.size * this.worldSize / 3);

  return (distance < hitThreshold && target.type !== this.type);
}

function update(dt) {
  this.position = Vec2.add(
    this.position,
    Vec2.scale(this.speed * dt, this.forward)
  );

  const [x, y] = this.position;
  // make this a var nerd
  if (x < 0 || x > window.innerWidth || y < 0 || y > window.innerHeight) {
    this.isActive = false;
  }
}

function draw(ctx) {
  const size = this.size * this.worldSize;
  ctx.save();
  ctx.fillStyle = (this.type === 'player') ? 'white' : 'black';
  ctx.strokeStyle = 'white';
  ctx.translate(...this.position);
  ctx.rotate(Math.atan2(this.forward[1], this.forward[0]) + Math.PI / 4);

  ctx.beginPath();
  ctx.moveTo(size / 6, -size / 6);
  ctx.lineTo(size / 6, size / 6);
  ctx.lineTo(-size / 6, -size / 6);
  ctx.closePath();

  ctx.stroke();
  ctx.fill();

  ctx.restore();
}

Bullet.prototype.checkCollision = checkCollision;
Bullet.prototype.activate = activate;
Bullet.prototype.update = update;
Bullet.prototype.draw = draw;

export default Bullet;
