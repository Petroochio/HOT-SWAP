function Tank(initialPos, turretColor, treadColor) {
  this.position = initialPos;
  this.forward = { x: 0, y: 1 };
  this.turretAngle = 0; // radians
  this.turretColor = turretColor;
  this.treadColor = treadColor;
  this.speed = 0.06;
}

function rotateTurret(theta) {
  this.turretAngle += theta;
}

function rotateTread(theta) {
  const { x: x1, y: y1 } = this.forward;

  const x2 = x1 * Math.cos(theta) - y1 * Math.sin(theta);
  const y2 = y1 * Math.cos(theta) + x1 * Math.sin(theta);

  this.forward = { x: x2, y: y2 };
}

function move(dt) {
  this.position.x += this.forward.x * dt * this.speed;
  this.position.y += this.forward.y * dt * this.speed;
}

function draw(ctx) {
  ctx.save();
  ctx.translate(this.position.x, this.position.y);

  ctx.save();
  ctx.rotate(Math.atan(this.forward.y / this.forward.x));
  ctx.fillStyle = this.treadColor;
  ctx.fillRect(-15, -15, 30, 30);
  ctx.restore();

  ctx.rotate(this.turretAngle);
  ctx.fillStyle = this.turretColor;
  ctx.fillRect(-5, 0, 10, 20);
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, 2 * Math.PI);
  ctx.fill();
  ctx.closePath();
  ctx.restore();
}

Tank.prototype.rotateTurret = rotateTurret;
Tank.prototype.rotateTread = rotateTread;
Tank.prototype.move = move;
Tank.prototype.draw = draw;

export default Tank;
