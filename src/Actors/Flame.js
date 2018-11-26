import * as THREE from 'three';

class Flame {
  constructor(parent, position, maxSize) {
    this.gameObject = new THREE.Object3D();
    this.gameObject.position.copy(position);
    parent.add(this.gameObject);

    this.size = 0;
    this.maxSize = maxSize;

    // Create particles here
    this.particles = [];
    this.particleGeo = new THREE.SphereGeometry(10, 4, 2);
    this.tempParticle = new THREE.Mesh(this.particleGeo);
    this.gameObject.add(this.tempParticle);

    this.gameObject.visible = false;
    this.growthRate = 0.0001;
  }

  hide() {
    this.gameObject.visible = false;
  }

  addFlame(amount) {
    this.size -= amount * this.growthRate;
    this.gameObject.scale.set(this.size, this.size, this.size);
  }

  calm(amount) {
    this.size -= amount * this.growthRate;
    this.gameObject.scale.set(this.size, this.size, this.size);
  }

  burn(startSize) {
    this.size = startSize;
    this.gameObject.visible = true;
    console.log('burn');
  }

  updateParticles(dt) {
    // console.log(this.particles);
  }

  update(dt) {
    this.updateParticles(dt);

    if (this.size <= this.maxSize) this.size += dt * this.growthRate;
    this.gameObject.scale.set(this.size, this.size, this.size);
  }
}

export default Flame;
