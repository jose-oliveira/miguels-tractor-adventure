import { STRIPS } from './kit.js';
import { barn, silo, farmhouse, tree, fence, hayRound, sheep, cow, flowers, tufts, bush, crate, wagon, rock } from './props.js';

// A vegetable bed filling one grid cell, used where the garden blocks the tractor's way.
function gardenBed(kit, root, x, z, i) {
  const g = kit.group(root, x, z);
  kit.box(g, [.9, .14, .9], '#6b4a30', [0, .07, 0]);
  const crops = [['#e8953a', 'carrot'], ['#5aa04c', 'lettuce'], ['#d6352f', 'tomato'], ['#7bc05a', 'lettuce']][i % 4];
  for (let row = -1; row <= 1; row += 1) {
    for (let col = -1; col <= 1; col += 1) {
      const px = col * .27;
      const pz = row * .27;
      if (crops[1] === 'tomato') {
        kit.cyl(g, .012, .012, .35, '#7b5535', [px, .3, pz], { seg: 4 });
        kit.sphere(g, .075, crops[0], [px, .32, pz], { seg: 6 });
      } else {
        kit.sphere(g, crops[1] === 'carrot' ? .07 : .1, crops[1] === 'carrot' ? '#5aa04c' : crops[0], [px, .2, pz], { seg: 6, scale: [1, .8, 1] });
        if (crops[1] === 'carrot') kit.cone(g, .035, .09, '#e8953a', [px, .17, pz + .04], { seg: 5, rot: [Math.PI, 0, 0] });
      }
    }
  }
  kit.box(g, [.94, .06, .04], '#b58b55', [0, .17, .46]);
  kit.box(g, [.94, .06, .04], '#b58b55', [0, .17, -.46]);
  return g;
}

export default {
  sky: '#bfe3f5',
  terrain: () => ({
    earth: '#7a5a3c',
    ground: '#7fb35c',
    gap: '#5d9448',
    tile: (cx, cy) => (cx === 7 || cy === 7 ? ((cx + cy) % 2 ? '#c9a574' : '#bf9a68') : (cx + cy) % 2 ? '#8dc566' : '#84bd5f')
  }),
  decorate(kit, root) {
    barn(kit, root, -6.1, -4.6, 0.25);
    silo(kit, root, -4.9, -5.6);
    farmhouse(kit, root, -6.4, 0.2, Math.PI / 2);
    // vegetable garden behind the grid
    for (let i = 0; i < 3; i += 1) {
      const g = kit.group(root, -1.5 + i * 1.5, -5.4);
      kit.box(g, [1.1, .14, .5], '#6b4a30', [0, .07, 0]);
      for (let k = 0; k < 5; k += 1) kit.sphere(g, .09, i === 1 ? '#e8953a' : '#4f9a47', [-.4 + k * .2, .2, 0], { seg: 6 });
    }
    kit.occupyRect(-2.3, 2.5, -5.8, -5.0);
    // animal pen on the right
    fence(kit, root, 5.2, -3.8, 7.4, -3.8);
    fence(kit, root, 7.4, -3.8, 7.4, -1.0);
    fence(kit, root, 7.4, -1.0, 5.2, -1.0);
    fence(kit, root, 5.2, -1.0, 5.2, -3.8);
    sheep(kit, root, 6.2, -3.0, 0.5);
    sheep(kit, root, 6.8, -2.2, 2);
    cow(kit, root, 6.0, -1.9, 1.2);
    kit.occupyRect(5.1, 7.5, -3.9, -.9);
    hayRound(kit, root, 7.0, 1.4, 1);
    hayRound(kit, root, 7.2, 2.4, .9);
    wagon(kit, root, 5.9, 4.8, .3, 'hay');
    crate(kit, root, -4.9, 4.9);
    tree(kit, root, -7.0, -2.6, 1.3);
    tree(kit, root, -7.2, 3.8, 1.2, 'apple');
    tree(kit, root, -5.4, 5.3, 1);
    tree(kit, root, 7.3, -5.6, 1.1);
    tree(kit, root, 2.5, -6.0, 1.0);
    tree(kit, root, 6.3, -5.8, 1.0);
    fence(kit, root, -7.5, 5.8, -5.2, 5.8);
    bush(kit, root, -4.7, 3.0, .28, '#5aa04c', '#d6352f');
    flowers(kit, root, 90, STRIPS.all);
    tufts(kit, root, 90, STRIPS.all);
  },
  obstacle(kit, root, x, z, i, level) {
    if (level?.obstacleStyle === 'garden') return gardenBed(kit, root, x, z, i);
    hayRound(kit, root, x, z, 1.05);
  }
};
