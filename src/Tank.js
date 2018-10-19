import * as Vec2 from './Vector2';

function Tank(initialPos, turretColor, treadColor, worldWidth, worldHeight) {
  this.position = initialPos;
  this.turnSpeed = 0.0025;
  this.forward = [0, 1];
  this.targetForward = [0, 1];
  this.turretFwd = [0, 1];
  this.turretColor = turretColor;
  this.treadColor = treadColor;
  this.yMax = worldHeight;
  this.xMax = worldWidth;
  this.speed = 0.2;
  this.size = 0.03;
  this.hitRadius = 0.025;
}

function getWorldHitRadius() {
  return (this.hitRadius * this.xMax);
}

function setTurretFwd(fwd) {
  this.turretFwd = fwd;
}

function setForward(fwd) {
  this.targetForward = fwd;
}

function rotateTread(theta) {
  const [x1, y1] = this.forward;

  const x2 = x1 * Math.cos(theta) - y1 * Math.sin(theta);
  const y2 = y1 * Math.cos(theta) + x1 * Math.sin(theta);

  this.forward = [x2, y2];
}

function update(dt, gasLevel) {
  const [cx, cy] = this.targetForward;
  const [tx, ty] = this.forward;
  const theta = Math.atan2(tx * cy - ty * cx, tx * cx + ty * cy);
  this.forward = Vec2.rotate(theta * this.turnSpeed * dt, this.forward);

  // Move tank
  this.position = Vec2.add(
    this.position,
    Vec2.scale(gasLevel * dt * this.speed, this.forward)
  );

  // wrap around screen
  if (this.position[0] > this.xMax + this.size) {
    this.position[0] = 0 - this.size;
  } else if (this.position[0] < 0 - this.size) {
    this.position[0] = this.xMax + this.size;
  } else if (this.position[1] > this.yMax + this.size) {
    this.position[1] = 0 - this.size;
  } else if (this.position[1] < 0 - this.size) {
    this.position[1] = this.yMax + this.size;
  }
}

function cannonPath(ctx, scale) {
  ctx.moveTo(0, scale / 6);
  ctx.lineTo(scale * 5 / 6, scale / 6);
  ctx.lineTo(scale * 5 / 6, scale / -6);
  ctx.lineTo(0, scale / -6);
  ctx.lineTo(0, scale / 6);
}

function hubPath(ctx, scale) {
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, scale / 3, 0, 2 * Math.PI);
}

function bodyPath(ctx, scale) {
  ctx.moveTo(-scale / 2, scale / 2);
  ctx.lineTo(scale / 2, scale / 2);
  ctx.lineTo(scale / 2, -scale / 2);
  ctx.lineTo(-scale / 6, -scale / 2);
  ctx.lineTo(-scale / 2, -scale / 6);
  ctx.lineTo(-scale / 2, scale / 2);
}

function draw(ctx) {
  const size = this.size * this.xMax;
  ctx.save();
  ctx.strokeStyle = 'white';
  ctx.fillStyle = 'black';

  ctx.translate(this.position[0], this.position[1]);

  // do outline
  ctx.beginPath();
  ctx.save();
  // rotate cannon properly
  ctx.rotate(Math.atan2(this.turretFwd[1], this.turretFwd[0]));
  cannonPath(ctx, size);
  // I guess this doesn't need to be rotated
  hubPath(ctx, size);
  ctx.restore();

  ctx.save();
  ctx.rotate(Math.atan2(this.forward[1], this.forward[0]) + Math.PI * 3 / 4);
  bodyPath(ctx, size);
  ctx.closePath();
  ctx.restore();

  ctx.stroke();

  ctx.save();
  ctx.rotate(Math.atan2(this.forward[1], this.forward[0]) + Math.PI * 3 / 4);
  bodyPath(ctx, size);
  ctx.restore();
  ctx.fill();

  ctx.save();
  ctx.lineWidth = 2;
  ctx.rotate(Math.atan2(this.turretFwd[1], this.turretFwd[0]));
  ctx.beginPath();
  cannonPath(ctx, size);
  hubPath(ctx, size);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.fillStyle = 'black';
  hubPath(ctx, size);
  ctx.fill();
  ctx.closePath();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = 'white';
  // Show move vector
  ctx.beginPath();
  ctx.arc(this.forward[0] * size * 1.4, this.forward[1] * size * 1.4, size / 14, 0, 2 * Math.PI);
  ctx.fill();
  ctx.closePath();

  ctx.beginPath();
  ctx.lineWidth = 1;
  ctx.arc(this.targetForward[0] * size * 1.4, this.targetForward[1] * size * 1.4, size / 9, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.closePath();

  ctx.restore();

  ctx.restore();
}

Tank.prototype.getWorldHitRadius = getWorldHitRadius;
Tank.prototype.setTurretFwd = setTurretFwd;
Tank.prototype.setForward = setForward;
Tank.prototype.rotateTread = rotateTread;
Tank.prototype.update = update;
Tank.prototype.draw = draw;

export default Tank;
