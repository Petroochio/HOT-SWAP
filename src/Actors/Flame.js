import * as THREE from 'three';

class Flame {
  constructor(parent, position, maxTime) {
    this.gameObject = new THREE.Object3D();
    this.gameObject.position.copy(position);
    parent.add(this.gameObject);

    this.time = 0;
    // for when to stop growing
    this.maxTime = maxTime;

    // Create particles here
    this.particleGeo = new THREE.SphereGeometry(5, 4, 2);
    this.particles = Array.from(
      { length: 30 },
      () => ({
        mesh: new THREE.Mesh(
          this.particleGeo,
          new THREE.MeshBasicMaterial({ color: 0xF00000, transparent: true })
        ),
        forward: new THREE.Vector3(Math.random() * 6 - 3, Math.random() * 6 - 3, Math.random() * 5 + 4),
        initialPos: Math.random() * 900,
      })
    );
    this.particles.forEach((p) => {
      p.mesh.scale.x = 0.3;
      p.mesh.scale.y = 0.3;
      this.gameObject.add(p.mesh);
    });
    // this.tempParticle = new THREE.Mesh(this.particleGeo);
    // this.gameObject.add(this.tempParticle);

    this.gameObject.scale.set(0, 0, 0);
    this.gameObject.visible = false;
    this.growthRate = 0.0002;
  }

  hide() {
    this.gameObject.visible = false;
  }

  addFlame(amount) {
    this.time += amount;
  }

  calm(amount) {
    this.time -= amount;
  }

  burn(startTime) {
    this.time = startTime;
    this.gameObject.visible = true;
    console.log('burn');
  }

  updateParticles() {
    // console.log(this.particles);
    this.particles.forEach((p) => {
      // p.mesh.position.add(p.forward);
      const pos = p.forward.clone();
      const s = ((p.initialPos + this.time) % 1000) / 1000;

      pos.multiplyScalar(s);
      p.mesh.position.x = pos.x;
      p.mesh.position.y = pos.y;
      p.mesh.position.z = pos.z;

      p.mesh.scale.x = (1 - s) * 0.3;
      p.mesh.scale.y = (1 - s) * 0.3;
      p.mesh.scale.z = 1 - s;

      p.mesh.material.color.r = 1 - s + 0.3;
      p.mesh.material.color.g = (1 - s) * 0.5;
      p.mesh.material.opacity = (1 - s) * 0.4;
    });
  }

  update(dt) {
    this.updateParticles(dt);

    this.time += dt;
    const s = this.time > this.maxTime ? (this.maxTime + 600) * this.growthRate : (this.time + 600) * this.growthRate;
    this.gameObject.scale.set(s, s, s);
  }
}

export default Flame;
