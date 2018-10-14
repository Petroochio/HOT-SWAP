import * as Vec2 from './Vector2';

function Bullet() {
  this.position = [0, 0];
  this.forward = [0, 1];
  this.isActive = false;
  this.speed = 0.5;
}

function activate(position, forward) {
  this.position = position;
  this.forward = forward;
}

function update(dt) {
  if (this.isActive) {
    this.position = Vec2.add(
      this.position,
      Vec2.scale(this.forward, this.speed * dt)
    );
  }
}

function draw(ctx) {
  ctx.save();
  ctx.fillStyle = 'white';
  ctx.translate(...this.position);
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.closePath();

  ctx.restore();
}

Bullet.prototype.activate = activate;
Bullet.prototype.update = update;
Bullet.prototype.draw = draw;

export default Bullet;
