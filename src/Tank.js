function Tank(initialPos, turretColor, treadColor) {
  this.position = initialPos;
  this.forward = [0, 1];
  this.turretAngle = 0; // radians
  this.turretColor = turretColor;
  this.treadColor = treadColor;
  this.speed = 0.3;
}

function rotateTurret(theta) {
  this.turretAngle += theta;
}

function rotateTread(theta) {
  const [x1, y1] = this.forward;

  const x2 = x1 * Math.cos(theta) - y1 * Math.sin(theta);
  const y2 = y1 * Math.cos(theta) + x1 * Math.sin(theta);

  this.forward = [x2, y2];
}

function move(dt) {
  this.position[0] += this.forward[0] * dt * this.speed;
  this.position[1] += this.forward[1] * dt * this.speed;
}

function draw(ctx) {
  ctx.save();
  ctx.translate(this.position[0], this.position[1]);

  ctx.save();
  ctx.rotate(Math.atan(this.forward[1] / this.forward[0]));
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
