import * as THREE from 'three';
import { GROUND_TOP } from './kit.js';

export const facing = (x, z) => Math.atan2(-x, -z);
const GREENS = ['#5fa650', '#6bb35a', '#4f9a4a', '#78bd62'];

export function tree(kit, p, x, z, s = 1, kind = 'round') {
  const g = kit.group(p, x, z, kit.rand() * 6.28);
  kit.occupy(x, z, .45 * s);
  if (kind === 'pine') {
    kit.cyl(g, .07 * s, .1 * s, .5 * s, '#7a5238', [0, .25 * s, 0]);
    [[.55, .75, .6], [.43, .65, 1.0], [.3, .55, 1.4]].forEach(([r, h, y], i) =>
      kit.cone(g, r * s, h * s, i % 2 ? '#2f7d4f' : '#286b44', [0, y * s, 0], { seg: 7 }));
    return g;
  }
  kit.cyl(g, .08 * s, .13 * s, .75 * s, '#7a5238', [0, .37 * s, 0]);
  kit.ico(g, .55 * s, kit.pick(GREENS), [0, 1.05 * s, 0]);
  kit.ico(g, .36 * s, kit.pick(GREENS), [.3 * s, .8 * s, .12 * s]);
  kit.ico(g, .34 * s, kit.pick(GREENS), [-.28 * s, .82 * s, -.15 * s]);
  if (kind === 'apple') {
    for (let i = 0; i < 7; i += 1) {
      const a = kit.rand() * 6.28;
      kit.sphere(g, .055 * s, '#d83a34', [Math.cos(a) * .5 * s, (.85 + kit.rand() * .45) * s, Math.sin(a) * .5 * s], { seg: 6 });
    }
  }
  return g;
}

export function fence(kit, p, x1, z1, x2, z2, { color = '#caa26a', h = .5, gap = .55 } = {}) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.hypot(dx, dz);
  const g = kit.group(p, (x1 + x2) / 2, (z1 + z2) / 2, -Math.atan2(dz, dx));
  const posts = Math.max(1, Math.round(length / gap));
  for (let i = 0; i <= posts; i += 1) kit.box(g, [.06, h, .06], color, [-length / 2 + (length * i) / posts, h / 2, 0]);
  [.36, .72].forEach((k) => kit.box(g, [length, h * .1, .04], color, [0, h * k, 0]));
  return g;
}

function windowAt(kit, g, x, y, z, w = .28, h = .28) {
  kit.box(g, [w + .07, h + .07, .03], '#fff8ea', [x, y, z + .01]);
  kit.box(g, [w, h, .04], '#8fcbe4', [x, y, z + .015], { mat: { emissive: '#3b6e86', emissiveIntensity: .18 } });
  kit.box(g, [.025, h, .045], '#fff8ea', [x, y, z + .02]);
  kit.box(g, [w, .025, .045], '#fff8ea', [x, y, z + .02]);
}

function doorAt(kit, g, x, z, { w = .34, h = .6, color = '#7a4d2e', trim = '#fff8ea' } = {}) {
  kit.box(g, [w + .08, h + .05, .03], trim, [x, (h + .05) / 2, z + .01]);
  kit.box(g, [w, h, .04], color, [x, h / 2, z + .02]);
  kit.sphere(g, .025, '#e8c25a', [x + w * .3, h * .5, z + .05], { seg: 6 });
}

// Faces local +z. Windows and doors are added by the callers below.
export function gableHouse(kit, p, { x, z, rotY = 0, w = 2, d = 1.4, h = 1, roofH = .7, wall = '#f1e4c8', roof = '#a8473d', trim = '#fff8ea', overhang = .12 }) {
  const g = kit.group(p, x, z, rotY);
  kit.occupy(x, z, Math.max(w, d) * .62);
  kit.box(g, [w, h, d], wall, [0, h / 2, 0]);
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0);
  shape.lineTo(w / 2, 0);
  shape.lineTo(0, roofH);
  shape.closePath();
  const gable = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
  gable.translate(0, 0, -d / 2);
  kit.mesh(g, gable, wall, [0, h, 0]);

  const k = roofH / (w / 2);
  const a = Math.atan(k);
  const ex = w / 2 + overhang;
  const length = ex * Math.hypot(1, k);
  [-1, 1].forEach((side) => {
    kit.box(g, [length, .08, d + overhang * 2], roof,
      [side * (ex / 2 + Math.sin(a) * .04), h + roofH - (k * ex) / 2 + Math.cos(a) * .04, 0],
      { rot: [0, 0, -side * a] });
  });
  kit.box(g, [.12, .1, d + overhang * 2 + .02], roof, [0, h + roofH + .03, 0]);
  kit.box(g, [w + .04, .07, d + .04], trim, [0, .035, 0]);
  return g;
}

export function farmhouse(kit, p, x, z, rotY = 0, colors = {}) {
  const w = 2.1;
  const d = 1.4;
  const g = gableHouse(kit, p, { x, z, rotY, w, d, h: 1, roofH: .75, wall: colors.wall ?? '#f6e8c9', roof: colors.roof ?? '#5b80a6' });
  doorAt(kit, g, -.35, d / 2);
  windowAt(kit, g, .35, .55, d / 2);
  windowAt(kit, g, .75, .55, d / 2);
  windowAt(kit, g, -.78, .55, d / 2);
  windowAt(kit, g, 0, 1.3, d / 2 + .0, .24, .22);
  kit.box(g, [.22, .55, .22], '#a7a39b', [.55, 1.45, -.2]);
  kit.box(g, [.28, .06, .28], '#7c7871', [.55, 1.75, -.2]);
  kit.box(g, [.95, .07, .5], '#c49a62', [-.35, .05, d / 2 + .25]);
  [-.78, .08].forEach((px) => kit.box(g, [.05, .62, .05], '#fff8ea', [px, .36, d / 2 + .46]));
  kit.box(g, [1.05, .05, .58], '#8f4b3f', [-.35, .72, d / 2 + .25], { rot: [.12, 0, 0] });
  return g;
}

export function barn(kit, p, x, z, rotY = 0, { wall = '#b9453a', roof = '#6e3a35' } = {}) {
  const w = 2.2;
  const d = 2.0;
  const g = gableHouse(kit, p, { x, z, rotY, w, d, h: 1.2, roofH: .85, wall, roof, trim: '#f3ece0' });
  kit.box(g, [.9, .9, .04], '#8d3128', [0, .45, d / 2 + .02]);
  kit.box(g, [.05, .96, .05], '#f3ece0', [0, .48, d / 2 + .05]);
  kit.box(g, [.96, .05, .05], '#f3ece0', [0, .93, d / 2 + .05]);
  [-1, 1].forEach((s) => kit.box(g, [.05, 1.05, .05], '#f3ece0', [s * .22, .48, d / 2 + .05], { rot: [0, 0, s * .45] }));
  kit.box(g, [.34, .34, .04], '#3a2a26', [0, 1.5, d / 2 + .02]);
  kit.box(g, [.42, .05, .05], '#f3ece0', [0, 1.7, d / 2 + .05]);
  return g;
}

export function silo(kit, p, x, z, h = 2.1) {
  const g = kit.group(p, x, z);
  kit.occupy(x, z, .6);
  kit.cyl(g, .42, .44, h, '#dcd9cc', [0, h / 2, 0], { seg: 16 });
  [.4, .85, 1.3, 1.75].forEach((y) => kit.cyl(g, .45, .45, .04, '#9aa1a4', [0, y, 0], { seg: 16 }));
  kit.mesh(g, new THREE.SphereGeometry(.44, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), '#8f9ba1', [0, h, 0]);
  kit.box(g, [.04, h - .1, .04], '#8a8f92', [.44, h / 2, 0]);
  return g;
}

export function windmill(kit, p, x, z, rotY = facing(x, z)) {
  const g = kit.group(p, x, z, rotY);
  kit.occupy(x, z, .8);
  kit.cyl(g, .56, .62, .5, '#b36a4a', [0, .25, 0], { seg: 12 });
  kit.cyl(g, .3, .5, 2.1, '#f0e7d3', [0, 1.55, 0], { seg: 12 });
  kit.cone(g, .46, .62, '#7a4a35', [0, 2.9, 0], { seg: 12 });
  kit.box(g, [.22, .36, .04], '#6a4430', [0, .72, .6]);
  kit.box(g, [.2, .2, .04], '#8fcbe4', [0, 1.5, .4]);
  const blades = new THREE.Group();
  blades.position.set(0, 2.45, .5);
  g.add(blades);
  kit.cyl(blades, .07, .07, .16, '#4a3426', [0, 0, 0], { rot: [Math.PI / 2, 0, 0] });
  for (let i = 0; i < 4; i += 1) {
    const arm = new THREE.Group();
    arm.rotation.z = (i * Math.PI) / 2;
    blades.add(arm);
    kit.box(arm, [.06, 1.6, .04], '#7b5535', [0, .85, 0]);
    kit.box(arm, [.3, 1.15, .015], '#f4efe2', [.18, .95, .01]);
    [.45, .8, 1.15].forEach((y) => kit.box(arm, [.3, .025, .02], '#c9b995', [.18, y, .02]));
  }
  const speed = .55;
  kit.animate((t) => { blades.rotation.z = -t * speed; });
  return g;
}

export function hayRound(kit, p, x, z, s = 1, y) {
  const g = kit.group(p, x, z, kit.rand() * 3.14, y);
  kit.cyl(g, .3 * s, .3 * s, .5 * s, '#e2bb52', [0, .3 * s, 0], { seg: 14, rot: [0, 0, Math.PI / 2] });
  [-.2, 0, .2].forEach((off) => kit.torus(g, .3 * s, .018 * s, '#c79a38', [off * s, .3 * s, 0], { rot: [0, Math.PI / 2, 0], ts: 16 }));
  [-.26, .26].forEach((off) => kit.cyl(g, .22 * s, .22 * s, .02, '#f0d27a', [off * s, .3 * s, 0], { seg: 12, rot: [0, 0, Math.PI / 2] }));
  return g;
}

export function crate(kit, p, x, z, { s = .5, color = '#bf9154', rotY = kit.rand() * .4, y, goods } = {}) {
  const g = kit.group(p, x, z, rotY, y);
  kit.box(g, [s, s * .9, s], color, [0, s * .45, 0]);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => kit.box(g, [.05, s * .94, .05], '#8a6038', [a * s / 2, s * .45, b * s / 2]));
  [.14, .76].forEach((k) => {
    kit.box(g, [s + .03, .045, s + .03], '#8a6038', [0, s * k, 0]);
  });
  if (goods === 'apples') {
    for (let i = 0; i < 5; i += 1) kit.sphere(g, .075, '#d83a34', [(i % 3 - 1) * .13, s * .9 + .05, (Math.floor(i / 3) - .5) * .16], { seg: 7 });
  }
  if (goods === 'pumpkins') {
    pumpkin(kit, g, -.1, s * .9, -.07, .13);
    pumpkin(kit, g, .12, s * .9, .08, .12);
  }
  return g;
}

export function barrel(kit, p, x, z, { color = '#c0463b', y } = {}) {
  const g = kit.group(p, x, z, kit.rand() * 6, y);
  kit.cyl(g, .17, .17, .42, color, [0, .21, 0], { seg: 12 });
  [.08, .34].forEach((h) => kit.cyl(g, .18, .18, .035, '#3e454a', [0, h, 0], { seg: 12 }));
  kit.cyl(g, .15, .15, .02, '#d9d9d2', [0, .43, 0], { seg: 12 });
  return g;
}

export function rock(kit, p, x, z, s = .3, color = '#a5a79f', y) {
  const g = kit.group(p, x, z, 0, y);
  kit.ico(g, s, color, [0, s * .5, 0], { detail: 0, scale: [1, .72, .9], rot: [kit.rand(), kit.rand() * 6, kit.rand()] });
  return g;
}

export function bush(kit, p, x, z, s = .3, color = '#5aa04c', berries) {
  const g = kit.group(p, x, z);
  kit.ico(g, s, color, [0, s * .8, 0]);
  kit.ico(g, s * .75, color, [s * .8, s * .6, s * .2]);
  kit.ico(g, s * .7, color, [-s * .7, s * .55, -s * .2]);
  if (berries) for (let i = 0; i < 6; i += 1) kit.sphere(g, .035, berries, [kit.range(-s, s), s * (.6 + kit.rand() * .7), kit.range(-s, s)], { seg: 5 });
  return g;
}

export function pumpkin(kit, g, x, y, z, r = .13, color = '#f08a24') {
  kit.sphere(g, r, color, [x, y + r * .75, z], { scale: [1, .78, 1], seg: 9 });
  kit.box(g, [.03, .06, .03], '#4d7a2f', [x, y + r * 1.5, z]);
}

// Farm animals and the scarecrow react to how a run ended: `sad` shows a sweat drop or laughter, `happy` hops side to side.
function reactive(kit, g, { drop = null, laugh = false, arms = [] }) {
  const base = g.position.clone();
  const baseRot = g.rotation.clone();
  const side = new THREE.Vector3(Math.cos(g.rotation.y), 0, -Math.sin(g.rotation.y));
  let sweat = null;
  if (drop) {
    sweat = new THREE.Group();
    const bead = new THREE.MeshStandardMaterial({ color: '#59b7ff', emissive: '#1b6fb0', emissiveIntensity: .35 });
    const ball = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), bead);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(.08, .17, 10), bead);
    tip.position.y = .15;
    sweat.add(ball, tip);
    sweat.position.set(...drop);
    sweat.visible = false;
    g.add(sweat);
  }
  const poses = arms.map(({ pivot, rest, target }) => {
    const restQ = pivot.quaternion.clone();
    const laughQ = new THREE.Quaternion().setFromUnitVectors(rest.clone().normalize(), target.clone().normalize());
    return { pivot, restQ, laughQ };
  });
  const wobble = new THREE.Quaternion();
  const axis = new THREE.Vector3(0, 0, 1);
  kit.animate((t) => {
    const { state, since } = kit.mood;
    const e = t - since;
    g.position.copy(base); g.rotation.copy(baseRot);
    const raise = state === 'sad' && e < 6 ? Math.min(1, e * 4) : 0;
    poses.forEach(({ pivot, restQ, laughQ }, i) => {
      pivot.quaternion.copy(restQ).slerp(laughQ, raise);
      if (raise) pivot.quaternion.multiply(wobble.setFromAxisAngle(axis, Math.sin(e * 24 + i) * .09));
    });
    if (sweat) sweat.visible = false;
    if (state === 'sad' && e < 6) {
      if (sweat) {
        sweat.visible = true;
        const fall = (e * .8) % 1;
        sweat.position.y = drop[1] - fall * .12;
        sweat.scale.setScalar(1 - fall * .4);
      }
      if (laugh) {
        g.rotation.z = baseRot.z + Math.sin(e * 22) * .07;
        g.position.y = base.y + Math.abs(Math.sin(e * 11)) * .06;
        g.rotation.x = baseRot.x - .12 + Math.sin(e * 11) * .05;
      }
    } else if (state === 'happy' && e < 6) {
      const swing = Math.sin(e * 7);
      g.position.addScaledVector(side, swing * .28);
      g.position.y = base.y + Math.abs(Math.sin(e * 7)) * .22;
      g.rotation.z = baseRot.z + swing * .18;
    }
  });
}

export function sheep(kit, p, x, z, rotY = 0) {
  const g = kit.group(p, x, z, rotY);
  kit.ico(g, .21, '#f6f2ea', [0, .32, 0], { scale: [1, .9, 1.25] });
  kit.ico(g, .13, '#f6f2ea', [0, .48, .02]);
  kit.ico(g, .11, '#3b332e', [0, .5, .3], { scale: [1, 1, 1.15] });
  [-.1, .1].forEach((ex) => kit.sphere(g, .04, '#3b332e', [ex, .55, .27], { scale: [1.6, .7, 1], seg: 6 }));
  [-.05, .05].forEach((ex) => kit.sphere(g, .02, '#ffffff', [ex, .53, .39], { seg: 6 }));
  [-.14, -.08, .08, .14].forEach((lx) => [-.16, .16].forEach((lz) => kit.box(g, [.05, .2, .05], '#3b332e', [lx * 1.3, .1, lz])));
  reactive(kit, g, { drop: [.15, .98, .3] });
  return g;
}

export function cow(kit, p, x, z, rotY = 0) {
  const g = kit.group(p, x, z, rotY);
  kit.box(g, [.34, .3, .64], '#f7f3ea', [0, .42, 0]);
  kit.box(g, [.12, .32, .22], '#3b332e', [.06, .42, -.12]);
  kit.box(g, [.1, .32, .16], '#3b332e', [-.1, .42, .16]);
  const head = new THREE.Group();
  head.position.set(0, .5, .36);
  g.add(head);
  kit.box(head, [.2, .2, .22], '#f7f3ea', [0, 0, 0]);
  kit.box(head, [.16, .09, .08], '#e9a7a0', [0, -.05, .13]);
  [-.12, .12].forEach((ex) => kit.cone(head, .03, .09, '#e8dcc0', [ex, .12, 0], { seg: 5 }));
  [-.12, .12].forEach((ex) => kit.box(head, [.08, .03, .05], '#3b332e', [ex, .06, -.02]));
  [-.11, .11].forEach((lx) => [-.22, .22].forEach((lz) => kit.cyl(g, .03, .03, .27, '#3b332e', [lx, .135, lz], { seg: 5 })));
  kit.box(g, [.03, .24, .03], '#3b332e', [0, .35, -.34]);
  reactive(kit, g, { drop: [.15, 1.05, .3] });
  const phase = kit.rand() * 6;
  kit.animate((t) => { head.rotation.x = Math.max(0, Math.sin(t * .9 + phase)) * .45; });
  return g;
}

export function flowers(kit, p, count, area, palette = ['#f4d03f', '#f06292', '#ffffff', '#ba68c8', '#ff8a65']) {
  const spots = kit.scatter(count, area, { r: .12 });
  kit.instanced(p, new THREE.CylinderGeometry(.007, .007, .12, 4), '#4f9a47',
    spots.map(([x, z]) => ({ pos: [x, GROUND_TOP + .06, z] })));
  palette.forEach((color, i) => {
    const items = spots.filter((_, j) => j % palette.length === i)
      .map(([x, z]) => ({ pos: [x, GROUND_TOP + .13, z], scale: .8 + kit.rand() * .5 }));
    kit.instanced(p, new THREE.SphereGeometry(.04, 6, 5), color, items);
  });
}

export function tufts(kit, p, count, area, color = '#6aa84f') {
  const spots = kit.scatter(count, area, { r: .05 });
  kit.instanced(p, new THREE.ConeGeometry(.06, .15, 5), color, spots.map(([x, z]) => ({
    pos: [x, GROUND_TOP + .07, z], rot: [0, kit.rand() * 6, 0], scale: [1, .6 + kit.rand() * .9, 1]
  })));
}

export function cropField(kit, p, { x0, x1, z0, z1, spacing = .24, color = '#e5c25b', height = .45, y = GROUND_TOP }) {
  const items = [];
  for (let x = x0; x <= x1; x += spacing) {
    for (let z = z0; z <= z1; z += spacing) {
      items.push({
        pos: [x + kit.range(-.05, .05), y + height / 2, z + kit.range(-.05, .05)],
        rot: [kit.range(-.1, .1), kit.rand() * 6, kit.range(-.1, .1)],
        scale: [1, .8 + kit.rand() * .4, 1]
      });
    }
  }
  kit.instanced(p, new THREE.ConeGeometry(.04, height, 4), color, items);
}

// Faces local +z. Pass a rotY that points it at the camera.
export function scarecrow(kit, p, x, z, rotY = 0) {
  const g = kit.group(p, x, z, rotY);
  g.scale.setScalar(1.8);
  kit.cyl(g, .035, .035, 1.2, '#7b5535', [0, .6, 0], { seg: 6 });
  kit.box(g, [.32, .38, .18], '#c0453a', [0, .78, 0]);
  [-.1, .1].forEach((px) => kit.box(g, [.05, .4, .02], '#3f6f9f', [px, .76, .1]));
  kit.box(g, [.34, .08, .2], '#7a5a3a', [0, .6, 0]);
  const crow = [-1, 1].map((sx) => {
    const pivot = new THREE.Group();
    pivot.position.set(sx * .16, .86, .02);
    g.add(pivot);
    kit.box(pivot, [.4, .06, .06], '#7b5535', [sx * .2, 0, 0]);
    kit.box(pivot, [.1, .05, .06], '#e2bb52', [sx * .43, 0, 0]);
    [-.05, 0, .05].forEach((dz) => kit.box(pivot, [.1, .015, .015], '#e8c95a', [sx * .5, 0, dz], { rot: [0, 0, sx * .2] }));
    return { pivot, rest: new THREE.Vector3(sx, 0, 0), target: new THREE.Vector3(-sx * .1, .2, .24) };
  });
  const head = new THREE.Group();
  head.position.set(0, 1.14, 0);
  head.rotation.x = -.75;
  head.scale.setScalar(1.55);
  g.add(head);
  kit.sphere(head, .17, '#efc99a', [0, 0, 0]);
  [-.16, .16].forEach((ex) => kit.sphere(head, .035, '#efc99a', [ex, 0, 0], { seg: 6 }));
  kit.sphere(head, .05, '#ffffff', [-.07, .05, .14], { seg: 8 });
  kit.sphere(head, .068, '#ffffff', [.08, .06, .135], { seg: 8 });
  kit.sphere(head, .022, '#2a1f1a', [-.06, .05, .185], { seg: 6 });
  kit.sphere(head, .03, '#2a1f1a', [.09, .06, .19], { seg: 6 });
  kit.box(head, [.1, .018, .02], '#5a3a22', [-.07, .12, .15], { rot: [0, 0, .35] });
  kit.box(head, [.1, .018, .02], '#5a3a22', [.08, .14, .145], { rot: [0, 0, -.1] });
  kit.sphere(head, .055, '#e0453a', [0, -.02, .17], { seg: 8 });
  const smile = new THREE.Mesh(new THREE.TorusGeometry(.07, .016, 5, 12, Math.PI), new THREE.MeshStandardMaterial({ color: '#7a2a2a' }));
  smile.position.set(0, -.07, .155); smile.rotation.z = Math.PI; head.add(smile);
  kit.cone(head, .15, .3, '#8a5a32', [0, -.21, .05], { rot: [Math.PI, 0, 0], seg: 7 });
  kit.sphere(head, .09, '#8a5a32', [-.1, -.1, .1], { seg: 7 });
  kit.sphere(head, .09, '#8a5a32', [.1, -.1, .1], { seg: 7 });
  kit.box(head, [.15, .035, .03], '#8a5a32', [0, -.045, .17]);
  kit.cyl(head, .21, .21, .03, '#6b4a2b', [0, .17, -.07]);
  kit.cone(head, .125, .22, '#6b4a2b', [0, .29, -.07]);
  kit.cyl(head, .128, .128, .04, '#d9a52b', [0, .2, -.07]);
  kit.sphere(head, .045, '#ef6fa0', [.1, .24, .0], { seg: 7 });
  reactive(kit, g, { laugh: true, arms: crow });
  g.traverse((o) => { o.castShadow = false; });
  return g;
}

// Faces local +z. Pass a rotY that points it at the camera.
export function robot(kit, p, x, z, rotY = 0) {
  const g = kit.group(p, x, z, rotY);
  g.scale.setScalar(1.8);
  kit.occupy(x, z, .5);
  const steel = '#b9c3cb', dark = '#3a4650', accent = '#e9a53d';
  [-.1, .1].forEach((lx) => {
    kit.box(g, [.12, .3, .14], dark, [lx, .15, 0]);
    kit.box(g, [.16, .06, .22], '#2b2b2e', [lx, .03, .03]);
  });
  kit.box(g, [.46, .4, .3], steel, [0, .5, 0]);
  kit.box(g, [.3, .2, .02], dark, [0, .52, .16]);
  [-.08, 0, .08].forEach((bx, i) => kit.sphere(g, .022, ['#e0453a', accent, '#4fd18b'][i], [bx, .54, .175], { seg: 6, mat: { emissive: ['#7a1b14', '#7a5410', '#1b6a44'][i] } }));
  kit.box(g, [.22, .02, .02], '#e0453a', [0, .46, .175]);
  kit.cyl(g, .05, .05, .08, dark, [0, .74, 0], { seg: 8 });
  const head = new THREE.Group();
  head.position.set(0, .98, 0);
  head.rotation.x = -.2;
  g.add(head);
  kit.box(head, [.42, .34, .34], steel, [0, 0, 0]);
  kit.box(head, [.36, .26, .03], '#1f2a33', [0, .01, .175]);
  [-.08, .08].forEach((ex) => {
    kit.sphere(head, .07, '#ffffff', [ex, .05, .19], { seg: 10 });
    kit.sphere(head, .035, '#1b8fd1', [ex * 1.05, .045, .245], { seg: 8, mat: { emissive: '#0b5f94' } });
  });
  kit.box(head, [.12, .02, .02], '#4fd1ff', [-.08, .13, .195], { rot: [0, 0, .25], mat: { emissive: '#1b8fb0' } });
  kit.box(head, [.12, .02, .02], '#4fd1ff', [.08, .13, .195], { rot: [0, 0, -.25], mat: { emissive: '#1b8fb0' } });
  kit.box(head, [.2, .05, .02], '#e0453a', [0, -.07, .195], { mat: { emissive: '#7a1b14' } });
  kit.box(head, [.2, .018, .022], '#ffffff', [0, -.07, .2]);
  [-.24, .24].forEach((ex) => kit.cyl(head, .05, .05, .06, accent, [ex, 0, 0], { rot: [0, 0, Math.PI / 2], seg: 8 }));
  kit.cyl(head, .015, .015, .2, dark, [0, .27, 0], { seg: 5 });
  kit.sphere(head, .045, '#e0453a', [0, .39, 0], { seg: 8, mat: { emissive: '#a02018' } });
  const arms = [-1, 1].map((sx) => {
    const pivot = new THREE.Group();
    pivot.position.set(sx * .28, .62, .02);
    g.add(pivot);
    kit.sphere(pivot, .06, dark, [0, 0, 0], { seg: 8 });
    kit.box(pivot, [.3, .08, .08], steel, [sx * .17, 0, 0]);
    kit.sphere(pivot, .065, accent, [sx * .35, 0, 0], { seg: 8 });
    kit.box(pivot, [.05, .09, .03], dark, [sx * .4, 0, 0]);
    return { pivot, rest: new THREE.Vector3(sx, 0, 0), target: new THREE.Vector3(-sx * .24, .28, .2) };
  });
  reactive(kit, g, { laugh: true, arms });
  g.traverse((o) => { o.castShadow = false; });
  return g;
}

export function bear(kit, p, x, z, rotY = 0) {
  const g = kit.group(p, x, z, rotY);
  g.scale.setScalar(1.8);
  kit.occupy(x, z, .5);
  const fur = '#8a5a35', light = '#d9b48a', dark = '#2b1d14';
  [-.09, .09].forEach((lx) => {
    kit.sphere(g, .08, fur, [lx, .08, .02], { scale: [1, 1, 1.3], seg: 8 });
    kit.sphere(g, .045, light, [lx, .06, .1], { seg: 6 });
  });
  kit.sphere(g, .2, fur, [0, .32, 0], { scale: [1, 1.1, .9], seg: 12 });
  kit.sphere(g, .13, light, [0, .3, .12], { scale: [1, 1.1, .5], seg: 10 });
  const head = new THREE.Group();
  head.position.set(0, .66, .02);
  head.rotation.x = -.15;
  g.add(head);
  kit.sphere(head, .17, fur, [0, 0, 0], { seg: 12 });
  [-1, 1].forEach((sx) => {
    kit.sphere(head, .06, fur, [sx * .13, .14, -.01], { seg: 8 });
    kit.sphere(head, .035, light, [sx * .13, .14, .03], { seg: 6 });
    kit.sphere(head, .04, '#ffffff', [sx * .065, .04, .145], { seg: 8 });
    kit.sphere(head, .022, dark, [sx * .065, .04, .18], { seg: 6 });
  });
  kit.sphere(head, .085, light, [0, -.04, .14], { scale: [1.15, .9, 1], seg: 10 });
  kit.sphere(head, .03, dark, [0, -.01, .22], { scale: [1.3, .9, 1], seg: 6 });
  kit.box(head, [.08, .02, .02], '#b3352c', [0, -.09, .215]);
  const arms = [-1, 1].map((sx) => {
    const pivot = new THREE.Group();
    pivot.position.set(sx * .2, .44, .03);
    g.add(pivot);
    kit.sphere(pivot, .07, fur, [sx * .02, -.08, 0], { scale: [1, 1.7, 1], seg: 8 });
    kit.sphere(pivot, .06, light, [sx * .02, -.2, 0], { seg: 8 });
    return { pivot, rest: new THREE.Vector3(0, -1, 0), target: new THREE.Vector3(-sx * .2, .1, .18) };
  });
  reactive(kit, g, { laugh: true, arms });
  g.traverse((o) => { o.castShadow = false; });
  return g;
}

export function alien(kit, p, x, z, rotY = 0) {
  const g = kit.group(p, x, z, rotY);
  g.scale.setScalar(1.8);
  kit.occupy(x, z, .5);
  const skin = '#6fd65a', skinDark = '#4fb843', suit = '#c9d3ea', accent = '#7b5cd6';
  [-.08, .08].forEach((lx) => kit.sphere(g, .07, skinDark, [lx, .06, .03], { scale: [1, .7, 1.4], seg: 8 }));
  kit.cyl(g, .1, .15, .3, suit, [0, .26, 0], { seg: 10 });
  kit.box(g, [.12, .08, .02], accent, [0, .28, .135], { mat: { emissive: accent, emissiveIntensity: .8 } });
  kit.sphere(g, .035, '#4dd9ff', [0, .28, .15], { seg: 6, mat: { emissive: '#4dd9ff', emissiveIntensity: 1.8 } });
  kit.cyl(g, .035, .04, .08, skin, [0, .46, 0], { seg: 8 });
  const head = new THREE.Group();
  head.position.set(0, .64, .01);
  head.rotation.x = -.12;
  g.add(head);
  kit.sphere(head, .2, skin, [0, .02, 0], { scale: [1.1, 1, 1], seg: 14 });
  [-1, 1].forEach((sx) => {
    const eye = kit.sphere(head, .075, '#10121a', [sx * .09, .03, .15], { scale: [.9, 1.35, .6], seg: 10 });
    eye.rotation.z = sx * -.35;
    kit.sphere(head, .022, '#ffffff', [sx * .075, .08, .19], { seg: 6 });
    kit.cyl(head, .008, .008, .16, skinDark, [sx * .09, .24, 0], { rot: [0, 0, sx * -.4], seg: 5 });
    kit.sphere(head, .04, '#ffe45c', [sx * .13, .33, 0], { seg: 8, mat: { emissive: '#ffd400', emissiveIntensity: 1.2 } });
  });
  kit.torus(head, .05, .008, '#1d5a1a', [0, -.08, .175], { rot: [0, 0, Math.PI], ts: 12 }).scale.set(1.2, .8, 1);
  kit.box(head, [.02, .02, .02], skinDark, [-.02, -.01, .19]);
  kit.box(head, [.02, .02, .02], skinDark, [.02, -.01, .19]);
  const arms = [-1, 1].map((sx) => {
    const pivot = new THREE.Group();
    pivot.position.set(sx * .15, .38, .03);
    g.add(pivot);
    kit.sphere(pivot, .05, suit, [0, 0, 0], { seg: 8 });
    kit.sphere(pivot, .045, skin, [sx * .02, -.17, 0], { scale: [1, 1.4, 1], seg: 8 });
    kit.cyl(pivot, .03, .03, .16, suit, [sx * .01, -.09, 0], { seg: 6 });
    return { pivot, rest: new THREE.Vector3(0, -1, 0), target: new THREE.Vector3(-sx * .12, .22, .22) };
  });
  reactive(kit, g, { laugh: true, arms });
  g.traverse((o) => { o.castShadow = false; });
  return g;
}

export function stall(kit, p, { x, z, rotY = 0, colors = ['#d94f45', '#fff6e8'], goods = 'apples' }) {
  const g = kit.group(p, x, z, rotY);
  kit.occupy(x, z, .9);
  kit.box(g, [1.4, .45, .6], '#a9784a', [0, .225, 0]);
  kit.box(g, [1.5, .05, .7], '#c8975e', [0, .47, 0]);
  [[-.72, -.4], [.72, -.4], [-.72, .4], [.72, .4]].forEach(([px, pz]) =>
    kit.cyl(g, .03, .03, 1.3, '#8a5f3a', [px, .65, pz], { seg: 6 }));
  const stripes = 8;
  for (let i = 0; i < stripes; i += 1) {
    kit.box(g, [1.6 / stripes + .01, .04, 1.05], colors[i % 2], [-.8 + (i + .5) * (1.6 / stripes), 1.25, 0], { rot: [.17, 0, 0] });
    kit.box(g, [1.6 / stripes + .01, .13, .03], colors[i % 2], [-.8 + (i + .5) * (1.6 / stripes), 1.14, .52]);
  }
  for (let i = 0; i < 10; i += 1) {
    const gx = -.55 + (i % 5) * .275;
    const gz = i < 5 ? -.12 : .13;
    if (goods === 'apples') kit.sphere(g, .075, '#d6352f', [gx, .55, gz], { seg: 7 });
    else if (goods === 'pumpkins') pumpkin(kit, g, gx, .5, gz, .09);
    else if (goods === 'bread') kit.sphere(g, .09, '#c9893f', [gx, .55, gz], { scale: [1.4, .75, 1], seg: 7 });
    else kit.sphere(g, .06, ['#f4d03f', '#f06292', '#ba68c8'][i % 3], [gx, .54, gz], { seg: 6 });
  }
  return g;
}

export function pole(kit, p, x, z, h = 2.3, color = '#8a5f3a') {
  const g = kit.group(p, x, z);
  kit.cyl(g, .04, .05, h, color, [0, h / 2, 0], { seg: 6 });
  kit.sphere(g, .06, '#e8c25a', [0, h + .03, 0], { seg: 6 });
  return g;
}

export function bunting(kit, p, from, to, { n = 10, colors = ['#e8553f', '#f4c542', '#4aa3d8', '#6bbf59', '#f08fb6'], sag = .28 } = {}) {
  const points = [];
  for (let i = 0; i <= 8; i += 1) {
    const t = i / 8;
    points.push(new THREE.Vector3(
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t - Math.sin(Math.PI * t) * sag,
      from[2] + (to[2] - from[2]) * t
    ));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  kit.mesh(p, new THREE.TubeGeometry(curve, 24, .01, 4), '#4a3b32', [0, 0, 0], { cast: false });
  const angle = -Math.atan2(to[2] - from[2], to[0] - from[0]);
  const shape = new THREE.Shape();
  shape.moveTo(-.1, 0);
  shape.lineTo(.1, 0);
  shape.lineTo(0, -.2);
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape);
  for (let i = 0; i < n; i += 1) {
    const pos = curve.getPoint((i + .5) / n);
    kit.mesh(p, geometry, colors[i % colors.length], [pos.x, pos.y, pos.z], {
      rot: [0, angle, 0], cast: false, mat: { side: THREE.DoubleSide, flatShading: false }
    });
  }
}

export function balloon(kit, p, x, y, z, color) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  p.add(g);
  kit.sphere(g, .17, color, [0, .9, 0], { scale: [1, 1.2, 1], seg: 12, mat: { roughness: .3, flatShading: false } });
  kit.cone(g, .03, .05, color, [0, .66, 0], { seg: 5, rot: [Math.PI, 0, 0] });
  kit.cyl(g, .004, .004, .65, '#f4efe2', [0, .33, 0], { seg: 3, cast: false });
  const phase = kit.rand() * 6;
  kit.animate((t) => { g.position.y = y + Math.sin(t * 1.3 + phase) * .06; g.rotation.z = Math.sin(t * .9 + phase) * .06; });
  return g;
}

export function wagon(kit, p, x, z, rotY = 0, load = 'hay') {
  const g = kit.group(p, x, z, rotY);
  kit.occupy(x, z, .9);
  kit.box(g, [1.2, .08, .7], '#a8744a', [0, .38, 0]);
  [[0, .35], [0, -.35]].forEach(([, side]) => kit.box(g, [1.2, .22, .05], '#b98457', [0, .5, side]));
  [-.6, .6].forEach((ex) => kit.box(g, [.05, .22, .7], '#b98457', [ex, .5, 0]));
  [-.4, .4].forEach((wx) => [-.4, .4].forEach((wz) => {
    kit.cyl(g, .22, .22, .06, '#5b3e29', [wx, .22, wz], { seg: 12, rot: [Math.PI / 2, 0, 0] });
    kit.cyl(g, .08, .08, .08, '#e5b93f', [wx, .22, wz], { seg: 8, rot: [Math.PI / 2, 0, 0] });
  }));
  kit.box(g, [.7, .04, .05], '#7b5535', [-.95, .3, 0]);
  if (load === 'hay') kit.box(g, [1.05, .3, .6], '#e2bb52', [0, .6, 0]);
  if (load === 'pumpkins') {
    [[-.35, -.15], [0, .12], [.35, -.1], [-.15, .18], [.2, .2], [-.3, .15]].forEach(([px, pz]) => pumpkin(kit, g, px, .42, pz, .15));
  }
  return g;
}

export function picnicTable(kit, p, x, z, rotY = 0) {
  const g = kit.group(p, x, z, rotY);
  kit.occupy(x, z, .9);
  kit.box(g, [1.5, .06, .5], '#b98457', [0, .5, 0]);
  [-.5, .5].forEach((bz) => kit.box(g, [1.5, .05, .2], '#a8744a', [0, .3, bz * .8]));
  [-.55, .55].forEach((lx) => kit.box(g, [.06, .5, .9], '#8a5f3a', [lx, .25, 0]));
  kit.box(g, [.5, .01, .5], '#d94f45', [0, .54, 0]);
  [[-.4, 0], [0, .08], [.4, -.05]].forEach(([fx, fz], i) => kit.sphere(g, .07, ['#f4c542', '#d6352f', '#6bbf59'][i], [fx, .6, fz], { seg: 6 }));
  return g;
}
