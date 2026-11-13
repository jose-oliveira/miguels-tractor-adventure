import * as THREE from 'three';

export const GROUND_TOP = 0.04;
export const TILE_TOP = 0.08;
export const GRID_HALF = 4;
export const cellToWorld = (cx, cy) => [cx - 3.5, cy - 3.5];

// Margin areas around the 8x8 grid. Camera looks from +x/+z, so tall scenery belongs in left/back.
export const STRIPS = {
  left: { x: [-7.7, -4.6], z: [-6.2, 6.2] },
  right: { x: [4.6, 7.7], z: [-6.2, 6.2] },
  back: { x: [-7.7, 7.7], z: [-6.2, -4.6] },
  front: { x: [-7.7, 7.7], z: [4.6, 6.2] },
  all: { x: [-7.7, 7.7], z: [-6.2, 6.2] }
};

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Kit {
  constructor(root, seed, size = { w: 16, d: 13 }) {
    this.root = root;
    this.size = size;
    this.rand = mulberry32(seed);
    this.mats = new Map();
    this.animators = [];
    this.keepOut = [];
    this.keepRects = [];
    this.baseY = GROUND_TOP;
    this.mood = { state: 'idle', since: 0 };
  }

  range(a, b) { return a + this.rand() * (b - a); }
  pick(list) { return list[Math.floor(this.rand() * list.length)]; }
  animate(fn) { this.animators.push(fn); }

  mat(color, options = {}) {
    const key = color + JSON.stringify(options);
    if (!this.mats.has(key)) {
      this.mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: .8, flatShading: true, ...options }));
    }
    return this.mats.get(key);
  }

  mesh(parent, geometry, color, pos = [0, 0, 0], o = {}) {
    const mesh = new THREE.Mesh(geometry, this.mat(color, o.mat));
    mesh.position.set(...pos);
    if (o.rot) mesh.rotation.set(...o.rot);
    if (o.scale !== undefined) {
      if (typeof o.scale === 'number') mesh.scale.setScalar(o.scale); else mesh.scale.set(...o.scale);
    }
    mesh.castShadow = o.cast ?? true;
    mesh.receiveShadow = o.receive ?? true;
    parent.add(mesh);
    return mesh;
  }

  box(parent, size, color, pos, o) { return this.mesh(parent, new THREE.BoxGeometry(...size), color, pos, o); }
  cyl(parent, rt, rb, h, color, pos, o = {}) { return this.mesh(parent, new THREE.CylinderGeometry(rt, rb, h, o.seg ?? 10), color, pos, o); }
  cone(parent, r, h, color, pos, o = {}) { return this.mesh(parent, new THREE.ConeGeometry(r, h, o.seg ?? 8), color, pos, o); }
  sphere(parent, r, color, pos, o = {}) { return this.mesh(parent, new THREE.SphereGeometry(r, o.seg ?? 10, Math.max(4, (o.seg ?? 10) - 3)), color, pos, o); }
  ico(parent, r, color, pos, o = {}) { return this.mesh(parent, new THREE.IcosahedronGeometry(r, o.detail ?? 1), color, pos, o); }
  torus(parent, r, tube, color, pos, o = {}) { return this.mesh(parent, new THREE.TorusGeometry(r, tube, o.rs ?? 6, o.ts ?? 14), color, pos, o); }

  group(parent, x, z, rotY = 0, y = this.baseY) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = rotY;
    parent.add(g);
    return g;
  }

  occupy(x, z, r) { this.keepOut.push([x, z, r]); }
  occupyRect(x0, x1, z0, z1) { this.keepRects.push([x0, x1, z0, z1]); }

  isFree(x, z, r = 0, avoidGrid = true) {
    if (Math.abs(x) > this.size.w / 2 - .3 || Math.abs(z) > this.size.d / 2 - .3) return false;
    if (avoidGrid && Math.abs(x) < GRID_HALF + .35 + r && Math.abs(z) < GRID_HALF + .35 + r) return false;
    if (this.keepRects.some(([x0, x1, z0, z1]) => x > x0 - r && x < x1 + r && z > z0 - r && z < z1 + r)) return false;
    return !this.keepOut.some(([ox, oz, or]) => Math.hypot(x - ox, z - oz) < or + r);
  }

  scatter(count, area, { r = .25, avoidGrid = true } = {}) {
    const spots = [];
    for (let tries = 0; spots.length < count && tries < count * 14; tries += 1) {
      const x = this.range(...area.x);
      const z = this.range(...area.z);
      if (this.isFree(x, z, r, avoidGrid)) spots.push([x, z]);
    }
    return spots;
  }

  instanced(parent, geometry, color, items, o = {}) {
    if (!items.length) return null;
    const mesh = new THREE.InstancedMesh(geometry, this.mat(color, o.mat), items.length);
    const dummy = new THREE.Object3D();
    items.forEach((item, i) => {
      dummy.position.set(...item.pos);
      dummy.rotation.set(...(item.rot || [0, 0, 0]));
      const s = item.scale ?? 1;
      if (typeof s === 'number') dummy.scale.setScalar(s); else dummy.scale.set(...s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.castShadow = o.cast ?? false;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
}

// Island base, a darker "gap" layer that forms the visible grid lines, and one themed tile per cell.
export function buildGround(kit, root, t) {
  const { w, d } = kit.size;
  kit.box(root, [w - .3, .7, d - .3], t.earth, [0, -.43, 0]);
  kit.box(root, [w, .14, d], t.ground, [0, -.03, 0]);
  t.underlay?.(kit, root);
  kit.box(root, [8.02, .03, 8.02], t.gap, [0, .05, 0], { cast: false });
  for (let cy = 0; cy < 8; cy += 1) {
    for (let cx = 0; cx < 8; cx += 1) {
      const [x, z] = cellToWorld(cx, cy);
      kit.box(root, [.93, .1, .93], t.tile(cx, cy, kit.rand), [x, .03, z], { cast: false });
    }
  }
}
