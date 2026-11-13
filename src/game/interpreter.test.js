import test from 'node:test';
import assert from 'node:assert/strict';
import { executeProgram, reachedGoal, validateProgram } from './interpreter.js';
import { objectivesComplete } from './objectives.js';
import { levels } from '../data/worlds.js';

const run = (program, options = {}) =>
  executeProgram({ program, start: [1, 1], ...options });

test('moves forward in the current direction and turns without moving', async () => {
  const result = await run(['forward', 'right', 'forward']);
  assert.deepEqual(result.position, [2, 0]);
  assert.equal(result.facing, 1);
  assert.equal(result.haltReason, null);
});

test('stops cleanly when the next tile is outside the grid or blocked', async () => {
  const edge = await run(['left', 'forward'], { start: [0, 1] });
  const obstacle = await run(['forward'], { obstacles: [[1, 0]] });
  assert.equal(edge.haltReason, 'blocked');
  assert.deepEqual(edge.position, [0, 1]);
  assert.equal(obstacle.haltReason, 'blocked');
  assert.deepEqual(obstacle.position, [1, 1]);
});

test('repeats the next instruction the selected number of times', async () => {
  const result = await run(['repeat3', 'forward'], { start: [1, 4] });
  assert.deepEqual(result.position, [1, 1]);
  assert.equal(result.haltReason, null);
});

test('executes reusable functions and conditionals', async () => {
  const result = await run(['callF1'], {
    start: [1, 0],
    functions: { F1: ['ifBlockedRight', 'forward'] }
  });
  assert.deepEqual(result.position, [2, 0]);
  assert.equal(result.facing, 1);
});

test('can repeat a multi-step function', async () => {
  const result = await run(['repeat2', 'callF1'], {
    start: [1, 4],
    functions: { F1: ['forward', 'right'] }
  });
  assert.deepEqual(result.position, [2, 3]);
  assert.equal(result.facing, 2);
});

test('halts recursive calls and execution that exceeds its instruction budget', async () => {
  const recursive = await run(['callF1'], { functions: { F1: ['callF1'] }, maxCallDepth: 2 });
  const tooMany = await run(['repeat3', 'forward'], {
    start: [1, 4],
    maxInstructions: 2
  });
  assert.equal(recursive.haltReason, 'call-depth');
  assert.equal(tooMany.haltReason, 'instruction-limit');
});

test('validates repeat structure and level capacities', () => {
  assert.equal(validateProgram(['repeat2'], {}), 'Main needs a repeatable instruction after each repeat block.');
  assert.equal(validateProgram(['forward', 'left'], {}, { program: 1 }), 'The main program has too many instructions.');
  assert.equal(validateProgram(['forward'], { F1: ['left'] }, { function: 0 }), 'F1 has too many instructions.');
  assert.equal(validateProgram(['forward', 'right'], {}), null);
});

test('checks whether the tractor reached the objective tile', () => {
  assert.equal(reachedGoal([3, 4], [3, 4]), true);
  assert.equal(reachedGoal([3, 3], [3, 4]), false);
});

const F = 'forward', L = 'left', R = 'right', P = 'pickup';
// Design solutions for World 1; they live only in tests and are never shipped with the game data.
const world1Solutions = {
  1: [F, F, F],
  2: [F, F, L, F, F],
  3: [F, F, P, L, L, F, F, F, F],
  4: [F, F, P, R, F, F, P, R, F, F]
};

const C1 = 'callF1', C2 = 'callF2', PL = 'plant';
// Design solutions for World 2 (main program plus functions); tests only.
const world2Solutions = {
  5: { main: [C1, C1], F1: [F, F] },
  6: { main: [F, P, C1, C1, L, F, F, F], F1: [F, PL] },
  7: { main: [R, C2, P, L, F, L, C1, R, C1, L, C1, L, C2], F1: [F, F, PL], F2: [F, F] },
  9: { main: [F, P, C1, C1, F], F1: [F, F, 'fix'] },
  10: { main: [L, F, F, P, R, C1, C1, F, F], F1: [F, F, 'fix'] },
  11: { main: [R, F, F, P, L, C1, C1, L, C1, R, F, F], F1: [F, F, 'fix'] },
  12: { main: [R, F, P, L, C1, C1, C2, C1, F, F], F1: [F, F, 'fix'], F2: [L, F, F, 'fix', L] },
  13: { main: [F, P, C1, C1, L, C2, PL, L, C2], F1: [F, F, PL], F2: [F, F] },
  14: { main: [L, F, F, P, R, C1, C1, C1, R, F, F], F1: [F, F, PL] },
  15: { main: [R, C2, P, L, C1, C1, C1, L, C1, L, C2], F1: [F, F, PL], F2: [F, F] },
  17: { main: [F, P, C1, C1, L, C1, F, F], F1: [F, F, PL] },
  18: { main: [R, F, F, P, L, C1, C1, C1, L, C1, L, F, F], F1: [F, F, PL] },
  19: { main: [L, C2, P, R, C1, C1, C1, R, C1, R, C1, C2], F1: [F, F, PL], F2: [F, F] },
  20: { main: [L, C2, P, R, C1, C1, C1, R, C1, R, C1, C1, C2], F1: [F, F, PL], F2: [F, F] },
  16: { main: [R, F, P, L, C2, C1, L, C1, L, C2, F, F], F1: [F, F, PL], F2: [F, F, PL, F, F, PL] },
  8: { main: [R, F, P, L, L, F, R, C1, C1, C2, C1, C1], F1: [F, PL], F2: [L, F, R] }
};

const play = (level, program, functions = {}) => executeProgram({
  program,
  functions,
  plantTiles: level.plantTiles,
  fixTiles: level.fixTiles,
  start: level.start,
  facing: level.facing,
  width: level.grid.width,
  height: level.grid.height,
  obstacles: level.obstacles,
  items: level.items
});
const solved = (level, result) => objectivesComplete(level.objectives, result);

test('every authored mission solution completes its objectives within the instruction limit', async () => {
  for (const level of levels.filter((entry) => !world2Solutions[entry.id] && !entry.practice)) {
    const solution = world1Solutions[level.id] ?? level.solution;
    const error = validateProgram(solution, {}, { program: level.instructionLimit });
    assert.equal(error, null, `${level.title} should have a valid solution`);
    const result = await play(level, solution);
    assert.equal(result.haltReason, null, `${level.title} should not stop early`);
    assert.equal(solved(level, result), true, `${level.title} should complete its objectives`);
  }
});

test('World 1 offers pickup and functions but no repeat or conditional blocks', () => {
  for (const level of levels.slice(0, 4)) {
    assert.ok(level.blocks.includes('pickup') && level.blocks.includes('callF1'));
    assert.ok(!level.blocks.includes('ifBlockedRight') && !level.blocks.includes('repeat2'));
  }
});

test('pickup collects only the item on the current tile and does nothing elsewhere', async () => {
  const level = levels[2];
  const empty = await play(level, [P, F, F, F, P]);
  assert.deepEqual(empty.collected, []);
  assert.equal(empty.haltReason, null);
  const driven = await play(level, [F, F, L, L, F, F, F, F]);
  assert.deepEqual(driven.collected, [], 'driving over an item must not collect it');
  const picked = await play(level, [F, F, P, P]);
  assert.deepEqual(picked.collected, ['toolbox']);
});

test('reaching the destination without the required items does not complete the mission', async () => {
  const toolbox = levels[2];
  assert.equal(solved(toolbox, await play(toolbox, [F, F, L, L, F, F, F, F])), false);
  const crates = levels[3];
  const oneCrate = await play(crates, [F, F, P, L, L, F, F, R, R, F, F]);
  assert.deepEqual(oneCrate.collected, ['crate1']);
  assert.equal(solved(crates, oneCrate), false);
  const both = await play(crates, world1Solutions[4]);
  assert.deepEqual(both.collected, ['crate1', 'crate2']);
});

test('the garden blocks the direct routes in level 2', async () => {
  const level = levels[1];
  for (const program of [[L, F, F, R, F, F], [F, L, F, R, F, L, F]]) {
    const result = await play(level, program);
    assert.equal(solved(level, result), false);
  }
});

test('every World 2 and practice solution completes within the main and function limits', async () => {
  for (const level of levels.filter((entry) => world2Solutions[entry.id] || entry.practice)) {
    const { main, F1 = [], F2 = [] } = world2Solutions[level.id] ?? level.solution;
    const limits = { program: level.instructionLimit, functions: level.functionLimits };
    assert.equal(validateProgram(main, { F1, F2 }, limits), null, `${level.title} fits its limits`);
    const result = await play(level, main, { F1, F2 });
    assert.equal(result.haltReason, null, `${level.title} should not stop early`);
    assert.equal(solved(level, result), true, `${level.title} should complete its objectives`);
  }
});

test('functions return to the main program and keep position and facing between calls', async () => {
  const steps = [];
  const result = await executeProgram({
    program: ['callF1', 'callF1'], functions: { F1: ['forward', 'forward'] },
    start: [0, 4], facing: 1, onStep: (step) => steps.push(step.type)
  });
  assert.deepEqual(result.position, [4, 4]);
  assert.deepEqual(steps, ['move', 'move', 'return', 'move', 'move', 'return']);
});

test('planting needs seeds, a designated unplanted tile, and consumes one seed each time', async () => {
  const level = levels[5];
  const [first] = level.plantTiles.map((tile) => tile.pos);
  const noSeeds = await executeProgram({ program: [F, F, PL], start: level.start, facing: 1, plantTiles: level.plantTiles, items: level.items });
  assert.deepEqual(noSeeds.planted, []);
  const wrongTile = await play(level, [F, P, PL]);
  assert.deepEqual(wrongTile.planted, [], 'tile next to the seed bag is not a planting tile');
  assert.equal(wrongTile.seeds, 2);
  const twice = await play(level, [F, P, F, PL, PL]);
  assert.deepEqual(twice.planted, [`${first[0]},${first[1]}`], 'a tile can only be planted once');
  assert.equal(twice.seeds, 1);
  const out = await play(level, [F, P, F, PL, F, PL, F, PL]);
  assert.equal(out.planted.length, 2);
  assert.equal(out.seeds, 0);
});

test('reaching a World 2 destination without planting does not complete the mission', async () => {
  const level = levels[5];
  assert.equal(solved(level, await play(level, [F, P, F, F, F, F])), false);
  const row = levels[6];
  assert.equal(solved(row, await play(row, [P, L, L])), false);
});
