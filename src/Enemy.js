import * as Vec2 from './Vector2';

function Enemy(position, forward, shootBullet, worldWidth) {
  this.position = position;
  this.forward = forward;
  this.rotationSpeed = 0.01;
  this.shootTimer = 7000;
  this.shootTimerMax = 8000;
  this.shootBullet = shootBullet;
  this.xMax = worldWidth;
  this.size = 0.03; // hard coded same as tank size
  this.hitRadius = 0.022;
  this.type = 'enemy';
  this.isActive = true;
}

function setTarget(targetVec) {
  this.forward = Vec2.normalize(Vec2.sub(targetVec, this.position));
}

function getWorldHitRadius() {
  return (this.hitRadius * this.xMax);
}

function update(dt) {
  this.shootTimer += dt;
  if (this.shootTimer >= this.shootTimerMax) {
    this.shootTimer = 0;
    this.shootBullet(this.position, this.forward, 'enemy');
  }
}

function draw(ctx) {
  const size = this.xMax * this.size;
  ctx.save();
  ctx.fillStyle = 'rgb(50, 0, 0)';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.translate(...this.position);
  ctx.rotate(Math.atan2(this.forward[1], this.forward[0]) - Math.PI / 2);

  ctx.beginPath();
  ctx.moveTo(-size / 2, size / 2);
  ctx.lineTo(-size / 2, -size / 6);
  ctx.lineTo(-size / 6, -size / 2);
  ctx.lineTo(size / 6, -size / 2);
  ctx.lineTo(size / 2, -size / 6);
  ctx.lineTo(size / 2, -size / 6);
  ctx.lineTo(size / 2, size / 2);
  ctx.lineTo(size / 6, size / 6);
  ctx.lineTo(-size / 6, size / 6);
  ctx.closePath();

  ctx.stroke();
  ctx.fill();

  ctx.restore();
}

Enemy.prototype.getWorldHitRadius = getWorldHitRadius;
Enemy.prototype.setTarget = setTarget;
Enemy.prototype.update = update;
Enemy.prototype.draw = draw;
export default Enemy;
