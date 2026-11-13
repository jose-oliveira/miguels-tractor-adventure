import { Kit, buildGround, cellToWorld, TILE_TOP } from './kit.js';
import farm from './farm.js';
import fields from './fields.js';
import workshop from './workshop.js';
import countryside from './countryside.js';
import space from './space.js';

const THEMES = { 1: farm, 2: fields, 3: workshop, 4: countryside, 5: space };

export function buildEnvironment(root, level, world) {
  const theme = THEMES[world.id] || farm;
  const kit = new Kit(root, world.id * 7919);
  const terrain = theme.terrain(kit);
  buildGround(kit, root, terrain);
  kit.baseY = terrain.groundTop ?? 0.04;
  theme.decorate(kit, root);
  kit.baseY = TILE_TOP;
  (level.obstacles || []).forEach(([cx, cy], i) => {
    const [x, z] = cellToWorld(cx, cy);
    theme.obstacle(kit, root, x, z, i, level);
  });
  return { sky: theme.sky, animators: kit.animators, kit };
}
