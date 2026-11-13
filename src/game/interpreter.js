const DIRECTIONS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0]
];

const COMMANDS = new Set([
  'forward',
  'left',
  'right',
  'pickup',
  'plant',
  'fix',
  'repeat2',
  'repeat3',
  'ifBlockedRight',
  'callF1',
  'callF2'
]);

export function validateProgram(program, functions, limits = {}) {
  if (!Array.isArray(program)) return 'The main program is not a list of instructions.';
  if (program.length > (limits.program ?? Infinity)) return 'The main program has too many instructions.';

  for (const [name, instructions] of Object.entries(functions)) {
    if (!Array.isArray(instructions)) return `${name} is not a list of instructions.`;
    if (instructions.length > (limits.functions?.[name] ?? limits.function ?? Infinity)) return `${name} has too many instructions.`;
  }

  for (const [name, instructions] of [['Main', program], ...Object.entries(functions)]) {
    for (let index = 0; index < instructions.length; index += 1) {
      const command = instructions[index];
      if (!COMMANDS.has(command)) return `${name} contains an unknown instruction.`;
      if ((command === 'repeat2' || command === 'repeat3') &&
          (typeof instructions[index + 1] !== 'string' || instructions[index + 1].startsWith('repeat'))) {
        return `${name} needs a repeatable instruction after each repeat block.`;
      }
    }
  }

  return null;
}

export async function executeProgram({
  program,
  functions = {},
  start,
  facing = 0,
  width = 8,
  height = 8,
  obstacles = [],
  items = [],
  plantTiles = [],
  fixTiles = [],
  onStep = async () => {},
  maxInstructions = 150,
  maxCallDepth = 8
}) {
  let position = [...start];
  let direction = ((facing % 4) + 4) % 4;
  let instructionCount = 0;
  let haltReason = null;
  const collected = [];
  const planted = [];
  const fixed = [];
  let seeds = 0;
  let tools = 0;
  const obstacleSet = new Set(obstacles.map(([x, y]) => `${x},${y}`));

  const isBlocked = ([x, y]) =>
    x < 0 || x >= width || y < 0 || y >= height || obstacleSet.has(`${x},${y}`);

  const perform = async (command, depth) => {
    instructionCount += 1;
    if (instructionCount > maxInstructions) {
      haltReason = 'instruction-limit';
      return;
    }
    if (depth > maxCallDepth) {
      haltReason = 'call-depth';
      return;
    }

    if (command === 'forward') {
      const [dx, dy] = DIRECTIONS[direction];
      const next = [position[0] + dx, position[1] + dy];
      if (isBlocked(next)) {
        haltReason = 'blocked';
        return;
      }
      const from = position;
      position = next;
      await onStep({ type: 'move', from, position: [...position], facing: direction });
      return;
    }

    if (command === 'left' || command === 'right') {
      direction = (direction + (command === 'right' ? 1 : 3)) % 4;
      await onStep({ type: 'turn', position: [...position], facing: direction });
      return;
    }

    if (command === 'pickup') {
      const item = items.find(({ id, pos }) =>
        pos[0] === position[0] && pos[1] === position[1] && !collected.includes(id));
      if (!item) return;
      collected.push(item.id);
      seeds += item.seeds ?? 0;
      tools += item.tools ?? 0;
      await onStep({ type: 'pickup', item, seeds, tools, position: [...position], facing: direction });
      return;
    }

    if (command === 'plant') {
      const tile = plantTiles.find(({ pos }) => pos[0] === position[0] && pos[1] === position[1]);
      const key = `${position[0]},${position[1]}`;
      if (!tile || seeds < 1 || planted.includes(key)) return;
      seeds -= 1;
      planted.push(key);
      await onStep({ type: 'plant', tile, seeds, position: [...position], facing: direction });
      return;
    }

    if (command === 'fix') {
      const tile = fixTiles.find(({ pos }) => pos[0] === position[0] && pos[1] === position[1]);
      const key = `${position[0]},${position[1]}`;
      if (!tile || tools < 1 || fixed.includes(key)) return;
      tools -= 1;
      fixed.push(key);
      await onStep({ type: 'fix', tile, tools, position: [...position], facing: direction });
      return;
    }

    if (command === 'ifBlockedRight') {
      const [dx, dy] = DIRECTIONS[direction];
      if (isBlocked([position[0] + dx, position[1] + dy])) {
        direction = (direction + 1) % 4;
        await onStep({ type: 'turn', position: [...position], facing: direction });
      }
      return;
    }

    if (command === 'callF1' || command === 'callF2') {
      const name = command.slice(4);
      await executeList(functions[name] || [], depth + 1);
      if (!haltReason) await onStep({ type: 'return', name, position: [...position], facing: direction });
      return;
    }

    throw new Error(`Unsupported instruction: ${command}`);
  };

  const executeList = async (instructions, depth = 0) => {
    for (let index = 0; index < instructions.length && !haltReason; index += 1) {
      const command = instructions[index];
      if (command === 'repeat2' || command === 'repeat3') {
        instructionCount += 1;
        if (instructionCount > maxInstructions) {
          haltReason = 'instruction-limit';
          break;
        }
        const repeatedCommand = instructions[index + 1];
        const repeats = command === 'repeat2' ? 2 : 3;
        for (let repetition = 0; repetition < repeats && !haltReason; repetition += 1) {
          await perform(repeatedCommand, depth);
        }
        index += 1;
      } else {
        await perform(command, depth);
      }
    }
  };

  await executeList(program);
  return {
    position,
    facing: direction,
    haltReason,
    instructionCount,
    collected,
    planted,
    fixed,
    seeds,
    tools
  };
}

export function reachedGoal(position, goal) {
  return position[0] === goal[0] && position[1] === goal[1];
}
