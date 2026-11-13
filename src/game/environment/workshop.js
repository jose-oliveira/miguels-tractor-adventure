import { STRIPS } from './kit.js';
import { gableHouse, barrel, crate, rock, tree, fence, pole, robot } from './props.js';

function tire(kit, p, x, z, y) {
  const g = kit.group(p, x, z, 0, y);
  kit.torus(g, .17, .07, '#2b2b2e', [0, .24, 0], { rot: [Math.PI / 2, 0, 0], rs: 8, ts: 14 });
  return g;
}

export default {
  sky: '#c3d3dc',
  terrain: () => ({
    earth: '#4d5257',
    ground: '#9a9d9e',
    gap: '#6c7073',
    tile: (cx, cy) => (cx === 0 || cy === 7 ? ((cx + cy) % 2 ? '#e9c33d' : '#2d2f33') : (cx + cy) % 2 ? '#b6b8b9' : '#acaeb0')
  }),
  decorate(kit, root) {
    const shop = gableHouse(kit, root, { x: -6.2, z: -3.0, rotY: Math.PI / 4 * .3, w: 2.6, d: 2.2, h: 1.3, roofH: .5, wall: '#8e9aa3', roof: '#4c5a66', trim: '#dfe5e8' });
    kit.box(shop, [1.2, 1.0, .05], '#d5d9db', [0, .5, 1.12]);
    for (let i = 0; i < 6; i += 1) kit.box(shop, [1.2, .015, .06], '#a2a8ab', [0, .1 + i * .17, 1.14]);
    kit.box(shop, [.6, .2, .04], '#e9c33d', [-.6, 1.5, 1.12]);
    kit.box(shop, [.6, .2, .04], '#e9c33d', [.6, 1.5, 1.12]);
    // gantry crane at the back with a swinging load
    const crane = kit.group(root, 0, -5.4);
    [-2.5, 2.5].forEach((x) => kit.box(crane, [.15, 2.0, .15], '#e9a53d', [x, 1.0, 0]));
    kit.box(crane, [5.3, .16, .2], '#e9a53d', [0, 2.0, 0]);
    const hook = kit.group(crane, 0, 0, 0, 2.0);
    kit.cyl(hook, .015, .015, 1.0, '#2d2f33', [0, -.5, 0], { seg: 4 });
    kit.box(hook, [.4, .3, .4], '#bf7a3b', [0, -1.15, 0]);
    kit.animate((t) => { hook.position.x = Math.sin(t * .6) * 1.4; });
    kit.occupyRect(-2.8, 2.8, -5.8, -5.0);
    // tool shed and fuel pump
    const shed = gableHouse(kit, root, { x: 4.0, z: -5.5, w: 1.4, d: 1.0, h: .8, roofH: .35, wall: '#c9663a', roof: '#4c5a66' });
    kit.box(shed, [.4, .55, .04], '#3d3f43', [0, .28, .52]);
    const pump = kit.group(root, 6.6, 3.0);
    kit.occupy(6.6, 3.0, .4);
    kit.box(pump, [.35, .9, .3], '#d6352f', [0, .45, 0]);
    kit.box(pump, [.25, .2, .02], '#cfe8f2', [0, .7, .16]);
    // plow implement
    const plow = kit.group(root, 6.4, -1.0, .6);
    kit.occupy(6.4, -1.0, .9);
    kit.box(plow, [1.4, .1, .12], '#4c5a66', [0, .5, 0]);
    for (let i = 0; i < 4; i += 1) kit.cone(plow, .12, .4, '#c8ccce', [-.5 + i * .33, .25, 0], { rot: [Math.PI, 0, 0], seg: 4 });
    // trailer
    const trailer = kit.group(root, -3.0, 5.4, 0);
    kit.occupy(-3, 5.4, 1);
    kit.box(trailer, [1.6, .08, .8], '#4c5a66', [0, .3, 0]);
    kit.box(trailer, [1.6, .3, .06], '#d6352f', [0, .48, .4]);
    kit.box(trailer, [1.6, .3, .06], '#d6352f', [0, .48, -.4]);
    [-.5, .5].forEach((x) => [-.43, .43].forEach((z) => kit.cyl(trailer, .17, .17, .08, '#2b2b2e', [x, .17, z], { rot: [Math.PI / 2, 0, 0], seg: 12 })));
    barrel(kit, root, -5.0, 3.2, { color: '#3d6fa8' });
    barrel(kit, root, -5.3, 3.8, { color: '#c0463b' });
    barrel(kit, root, 5.4, 5.2, { color: '#e9a53d' });
    tire(kit, root, 5.2, 4.2);
    tire(kit, root, 5.2, 4.2, .2);
    crate(kit, root, -6.4, 2.3, { s: .5 });
    crate(kit, root, -6.2, 2.9, { s: .45 });
    for (let i = 0; i < 4; i += 1) kit.box(root, [1.0, .08, .8], '#b58b55', [4.2 + (i % 2) * .05, .06 + i * .09, 5.6]);
    pole(kit, root, 7.2, -5.6, 2.0, '#6c7073');
    fence(kit, root, -7.5, 5.8, 7.5, 5.8, { color: '#8a9094', h: .35, gap: .8 });
    robot(kit, root, 1.6, 5.3, Math.atan2(10, 12));
    rock(kit, root, 7.0, 5.1, .2);
    tree(kit, root, 7.2, -3.2, .9, 'pine');
  },
  obstacle(kit, root, x, z) {
    barrel(kit, root, x, z, { color: '#2d6e9a' });
    barrel(kit, root, x + .12, z + .1, { color: '#2d6e9a' });
  }
};
