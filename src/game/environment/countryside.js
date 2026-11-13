import * as THREE from 'three';
import { STRIPS } from './kit.js';
import { tree, gableHouse, rock, bush, flowers, tufts, fence, bear } from './props.js';

export default {
  sky: '#c6e4ef',
  terrain: () => ({
    earth: '#6b5a45',
    ground: '#78ad5a',
    gap: '#557f43',
    tile: (cx, cy, rand) => {
      const r = rand();
      if (r < .12) return '#b9a784';
      if (r < .3) return '#a3b85f';
      return (cx + cy) % 2 ? '#86bb62' : '#7cb258';
    }
  }),
  decorate(kit, root) {
    // river along the left edge
    kit.box(root, [1.5, .08, 12.4], '#4aa3d8', [-5.5, .03, 0], { cast: false, mat: { roughness: .2, emissive: '#1d5f86', emissiveIntensity: .25 } });
    [-6.35, -4.65].forEach((x) => kit.box(root, [.2, .1, 12.4], '#b9a784', [x, .03, 0], { cast: false }));
    kit.occupyRect(-6.3, -4.7, -6.2, 6.2);
    const bridge = kit.group(root, -5.5, 0.8);
    kit.box(bridge, [2.1, .08, .9], '#a8744a', [0, .22, 0]);
    [-.45, .45].forEach((dz) => { kit.box(bridge, [2.1, .08, .05], '#8a5f3a', [0, .55, dz]); [-1, 0, 1].forEach((dx) => kit.box(bridge, [.06, .34, .06], '#8a5f3a', [dx, .38, dz])); });
    // thatched cottage with smoke on the far bank
    const cottage = gableHouse(kit, root, { x: -7.1, z: -2.4, rotY: Math.PI / 2, w: 1.9, d: 1.3, h: .8, roofH: .65, wall: '#efe0bf', roof: '#c9a24f', overhang: .2 });
    kit.box(cottage, [.34, .55, .04], '#6b4a30', [-.3, .28, .67]);
    kit.box(cottage, [.28, .28, .04], '#8fcbe4', [.45, .5, .67]);
    kit.box(cottage, [.2, .6, .2], '#8d8a82', [.5, 1.4, -.2]);
    const smoke = [0, 1, 2].map((i) => kit.sphere(cottage, .12, '#f0f0f0', [.5, 1.9, -.2], { cast: false, mat: { transparent: true, opacity: .6, flatShading: false } }));
    kit.animate((t) => smoke.forEach((s, i) => {
      const k = (t * .25 + i / 3) % 1;
      s.position.y = 1.8 + k * 1.1;
      s.position.x = .5 + k * .3;
      s.scale.setScalar(.7 + k);
      s.material.opacity = .6 * (1 - k);
    }));
    // hills in the back
    [[-3.5, -7.0, 2.6], [1.5, -7.3, 3.0], [6.2, -7.0, 2.4]].forEach(([x, z, r]) => {
      kit.mesh(root, new THREE.SphereGeometry(r, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), '#6ea052', [x, kit.baseY - .05, z], { scale: [1.3, .55, 1] });
    });
    // pine forest back and right
    [[-4.2, -5.5], [-2.7, -5.8], [-1.0, -5.5], [.7, -5.9], [2.4, -5.5], [4.1, -5.8], [5.8, -5.4], [7.0, -4.4], [7.2, -2.8], [6.2, -3.4], [7.0, -1.2], [6.5, 0.2]]
      .forEach(([x, z], i) => tree(kit, root, x, z, .95 + (i % 3) * .15, 'pine'));
    tree(kit, root, 6.8, 3.6, .9);
    tree(kit, root, -3.0, 5.6, 1.0);
    tree(kit, root, 3.0, 5.7, .9);
    [[-2.0, 5.2, .35], [1.0, 5.6, .28], [6.1, 5.0, .4], [6.9, 1.8, .3], [-4.2, 4.8, .25]].forEach(([x, z, s]) => rock(kit, root, x, z, s, '#9ea09a'));
    bear(kit, root, -.2, 5.4, Math.atan2(10, 12));
    // fallen log
    const log = kit.group(root, 5.2, 5.3, .5);
    kit.cyl(log, .14, .14, 1.1, '#7a5238', [0, .14, 0], { rot: [0, 0, Math.PI / 2], seg: 8 });
    kit.occupy(5.2, 5.3, .6);
    // mushrooms
    [[-4.5, 3.6], [-4.3, 3.9], [5.4, 4.4]].forEach(([x, z]) => {
      const m = kit.group(root, x, z);
      kit.cyl(m, .025, .03, .1, '#f0e8d8', [0, .05, 0], { seg: 5 });
      kit.sphere(m, .07, '#d6352f', [0, .1, 0], { scale: [1, .6, 1], seg: 7 });
    });
    bush(kit, root, -4.7, -2.4, .3, '#4f9a4a');
    bush(kit, root, 7.0, 4.2, .3, '#4f9a4a', '#c43b66');
    fence(kit, root, -3.6, 5.9, 1.0, 5.9);
    flowers(kit, root, 70, STRIPS.all);
    tufts(kit, root, 80, STRIPS.all);
  },
  obstacle(kit, root, x, z) {
    const g = kit.group(root, x, z, kit.rand() * 6);
    kit.ico(g, .38, '#9a9d98', [0, .28, 0], { detail: 0, scale: [1, .8, .9] });
    kit.ico(g, .2, '#7f827d', [.22, .15, .1], { detail: 0 });
  }
};
