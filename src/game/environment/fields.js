import * as THREE from 'three';
import { STRIPS, GROUND_TOP } from './kit.js';
import { tree, windmill, scarecrow, cropField, fence, crate, rock, flowers, tufts, gableHouse } from './props.js';

export default {
  sky: '#cfe8f2',
  terrain: () => ({
    earth: '#6b4a30',
    ground: '#c9ad62',
    gap: '#5f4128',
    tile: (cx, cy) => (cx >= 6 || cy === 0 || cy === 7 ? '#d8bb55' : cx % 2 ? '#8b6240' : '#7d5638')
  }),
  decorate(kit, root) {
    // irrigation channel on the left with animated water and a bridge
    kit.box(root, [.9, .1, 12.4], '#8c8a82', [-5.15, .02, 0], { cast: false });
    const water = kit.box(root, [.6, .06, 12.3], '#4aa3d8', [-5.15, .06, 0], { cast: false, mat: { roughness: .2, transparent: true, opacity: .9, emissive: '#1d5f86', emissiveIntensity: .25 } });
    kit.animate((t) => { water.material.emissiveIntensity = .25 + Math.sin(t * 2) * .08; });
    kit.occupyRect(-5.7, -4.6, -6.2, 6.2);
    kit.box(root, [1.0, .08, .9], '#a8744a', [-5.15, .2, 3.0]);
    [-.4, .4].forEach((dz) => kit.box(root, [1.0, .2, .05], '#8a5f3a', [-5.15, .3, 3.0 + dz]));
    // apple orchard
    [[-7.0, -3.5], [-7.0, -1.2], [-7.0, 1.1], [-7.0, 3.4], [-6.0, -5.2]].forEach(([x, z]) => tree(kit, root, x, z, 1.15, 'apple'));
    windmill(kit, root, 1.6, -6.2);
    // shed
    const shed = gableHouse(kit, root, { x: -2.3, z: -5.6, rotY: 0, w: 1.5, d: 1.0, h: .8, roofH: .5, wall: '#a8744a', roof: '#6e4b35' });
    kit.box(shed, [.4, .6, .04], '#5b3e29', [0, .3, .52]);
    scarecrow(kit, root, 2.6, 5.7, Math.atan2(10, 12));
    // wheat in the margins
    cropField(kit, root, { x0: 4.8, x1: 7.5, z0: -2.8, z1: 5.8, spacing: .26 });
    cropField(kit, root, { x0: 0.2, x1: 4.4, z0: 4.8, z1: 5.9, spacing: .26, color: '#d6b04c' });
    cropField(kit, root, { x0: -4.0, x1: 2.0, z0: -6.0, z1: -4.7, spacing: .26, color: '#d2ac45' });
    // wheat on the margin tiles
    const items = [];
    for (let cy = 0; cy < 8; cy += 1) for (let cx = 0; cx < 8; cx += 1) {
      if (!(cx >= 6 || cy === 0 || cy === 7)) continue;
      for (let k = 0; k < 7; k += 1) items.push({ pos: [cx - 3.5 + kit.range(-.38, .38), .08 + .12, cy - 3.5 + kit.range(-.38, .38)], scale: [1, .7 + kit.rand() * .4, 1] });
    }
    kit.instanced(root, new THREE.ConeGeometry(.035, .24, 4), '#e8c75a', items);
    fence(kit, root, 4.6, -3.2, 4.6, 6.0, { color: '#b58b55' });
    rock(kit, root, -3.5, 5.3, .22);
    crate(kit, root, 1.2, -5.5, { s: .45, goods: 'apples' });
    flowers(kit, root, 25, { x: [-7.5, -6.2], z: [-6, 6] });
    tufts(kit, root, 50, STRIPS.all, '#a8a24f');
  },
  obstacle(kit, root, x, z) {
    crate(kit, root, x, z, { s: .6, goods: 'apples' });
  }
};
