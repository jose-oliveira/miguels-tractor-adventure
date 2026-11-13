export const worlds = [
  { id: 1, name: 'The Farm', subtitle: 'A helping hand around home', tractor: 'Classic Red', color: '#c94e3d', description: 'A peaceful family farm with a barn, vegetable garden, hay bales, fences and dirt paths.' },
  { id: 2, name: 'The Fields', subtitle: 'Time to get the fields ready', tractor: 'Green Field', color: '#4e9a57', description: 'Golden crops, irrigation channels, orchards and a little windmill.' },
  { id: 3, name: 'The Workshop', subtitle: 'Tools, repairs and deliveries', tractor: 'Blue Utility', color: '#4285b8', description: 'A busy machinery yard with sheds, tools, crates and equipment.' },
  { id: 4, name: 'The Countryside', subtitle: 'Beyond the farm gate', tractor: 'Yellow All-terrain', color: '#e2b43c', description: 'Forest paths, a river, bridges, rocky passages and cottages.' },
  { id: 5, name: 'The Space Farm', subtitle: 'Planets, moons and mystery boxes', tractor: 'Star Cruiser', color: '#7b5cd6', description: 'A floating farm among the stars, where you plant planets instead of seeds.' }
];

// Every level offers every block, and F1 and F2 always have plenty of room.
const FUNCTION_SLOTS = 8;
// Farm 3 swaps PLANT for FIX.
const blocksFor = (world) => (world === 3 ? ALL_BLOCKS.map((block) => (block === 'plant' ? 'fix' : block)) : ALL_BLOCKS);
const ALL_BLOCKS = ['forward', 'left', 'right', 'pickup', 'plant', 'callF1', 'callF2'];

// Each path is a sequence of grid coordinates. All twenty starter missions are playable.
const routes = [
  [[1,4],[1,3],[1,2]], [[1,4],[2,4],[3,4]], [[1,4],[1,3],[2,3],[3,3]], [[1,4],[2,4],[2,3],[2,2]],
  [[0,4],[1,4],[2,4],[3,4]], [[0,4],[0,3],[1,3],[2,3],[2,2]], [[1,5],[1,4],[2,4],[3,4],[3,3]], [[0,5],[1,5],[1,4],[2,4],[2,3],[3,3]],
  [[0,4],[1,4],[2,4],[2,3],[2,2]], [[0,5],[0,4],[1,4],[2,4],[3,4],[3,3]], [[1,5],[1,4],[1,3],[2,3],[3,3],[3,2]], [[0,5],[1,5],[2,5],[2,4],[2,3],[3,3],[4,3]],
  [[0,5],[0,4],[1,4],[2,4],[2,3],[3,3]], [[0,5],[1,5],[2,5],[2,4],[3,4],[4,4],[4,3]], [[1,5],[1,4],[2,4],[2,3],[2,2],[3,2],[4,2]], [[0,5],[1,5],[1,4],[1,3],[2,3],[3,3],[3,2],[4,2]],
  [[0,5],[1,5],[2,5],[3,5],[3,4],[3,3],[4,3]], [[0,5],[0,4],[1,4],[2,4],[3,4],[3,3],[4,3]], [[1,5],[1,4],[1,3],[2,3],[3,3],[4,3],[4,2]], [[0,5],[1,5],[2,5],[2,4],[3,4],[4,4],[4,3],[5,3]]
];
const titles = [
  ['A Trip to the Barn','Bring the farmer’s small toolbox to the barn.'],
  ['Garden Supplies','Take a watering can to the vegetable garden.'],
  ['The Missing Basket','Bring an empty basket to the garden gate.'],
  ['Hay for the Animals','Deliver a bale of hay to the animal pen.'],
  ['The Long Field','Drive along the field path to the marker.'],
  ['Watering the Rows','Follow the path beside the irrigation ditch.'],
  ['The Orchard Gate','Take a crate to the orchard entrance.'],
  ['Windmill Supplies','Deliver supplies to the windmill.'],
  ['A Wobbly Wheel','Bring a spare wheel to the workshop.'],
  ['The Tool Crate','Move a crate across the equipment yard.'],
  ['Parts for the Shed','Deliver parts to the far storage shed.'],
  ['Ready for Repairs','Bring the mechanic a toolbox.'],
  ['The Forest Path','Carry a parcel to the forest cottage.'],
  ['Across the Bridge','Take supplies across the country lane.'],
  ['The Rocky Turn','Navigate the winding path to the lookout.'],
  ['A Visit to the Cottage','Deliver a basket to the cottage.'],
  ['Festival Decorations','Bring decorations to the village square.'],
  ['The Market Stall','Deliver produce to the market.'],
  ['A Seat for Everyone','Bring benches to the festival grounds.'],
  ['The Big Celebration','Make one last delivery for the harvest festival.']
];
const BASE = import.meta.env?.BASE_URL ?? '/';
const portrait = (name) => `${BASE}assets/characters/${encodeURIComponent(name)}.png`;
const missionGivers = [
  { name: 'Mom', dialogue: 'Could you help me get these supplies where they need to go?' },
  { name: 'Dad', dialogue: 'The farm is counting on one careful delivery!' },
  { name: 'Gabe', dialogue: 'I spotted a useful path. Can you try it with the tractor?' },
  { name: 'Bruh', dialogue: 'This will be fun! Can you bring the things over?' },
  { name: 'Aunt Mandy', dialogue: 'A little planning will get these supplies there in no time.' },
  { name: 'Grandma', dialogue: 'Take your time, dear. A steady hand gets the harvest home.' },
  { name: 'Grandpa', dialogue: 'In my day we did it with one wheel. You have a whole tractor!' },
  { name: 'Baby Lilian', dialogue: 'Goo goo! Tractor, tractor!' }
].map((giver) => ({ ...giver, image: portrait(giver.name), successImage: `${BASE}assets/characters/success/${encodeURIComponent(giver.name)}.png` }));
const directionBetween = (a,b) => b[0] > a[0] ? 1 : b[0] < a[0] ? 3 : b[1] > a[1] ? 2 : 0;
const routeToCommands = (route) => {
  let facing = 0; const commands = [];
  for (let i=1;i<route.length;i++) {
    const target = directionBetween(route[i-1],route[i]);
    const diff = (target-facing+4)%4;
    if (diff===1) commands.push('right');
    else if (diff===3) commands.push('left');
    else if (diff===2) { commands.push('right','right'); }
    commands.push('forward'); facing=target;
  }
  return commands;
};
const generatedLevels = routes.map((route,index) => {
  const world = Math.floor(index/4)+1;
  const solution = routeToCommands(route);
  const obstacles = [];
  // Decorative blockers are kept off the authored solution path.
  const routeKeys = new Set(route.map(([x,y])=>`${x},${y}`));
  for (const [x,y] of [[4,1],[4,4],[0,1],[5,5],[5,1],[3,1]]) if (!routeKeys.has(`${x},${y}`)) obstacles.push([x,y]);
  return {
    id: index+1, world, title: titles[index][0], briefing: titles[index][1],
    character: missionGivers[index%missionGivers.length],
    grid: { width: 8, height: 8 },
    start: route[0], goal: route[route.length-1], facing: 0, route,
    objectives: [{ type: 'reach', pos: route[route.length-1] }], items: [], cargo: [], blocks: ALL_BLOCKS,
    obstacles: obstacles.slice(0,3), instructionLimit: Math.max(8, solution.length+2),
    functionLimit: 6, solution, concept: ['Sequencing','Sequencing','Turning','Navigation','Loops','Loops','Loops','Loops','Functions','Functions','Functions','Functions','Conditionals','Conditionals','Conditionals','Conditionals','Combining concepts','Combining concepts','Combining concepts','Final challenge'][index]
  };
});

const GIVER_ORDER = ['Dad', 'Mom', 'Gabe', 'Bruh', 'Aunt Mandy', 'Baby Lilian', 'Grandma', 'Grandpa'];
const missionGiver = (name) => missionGivers.find((giver) => giver.name === name);

// Grid coordinates: x grows East, y grows South. Facing 0 = North, 1 = East, 2 = South, 3 = West.
const world1Levels = [
  {
    title: 'Deliver the Hay', briefing: 'Drive the tractor to the flag.',
    character: { ...missionGiver('Dad'), dialogue: 'Miguel, can you take this hay to the storage area? I’ve already loaded it onto your tractor. Just follow the path to the flag!' },
    start: [3, 5], facing: 0, cargo: [{ id: 'hay', type: 'hay' }], items: [],
    objectives: [{ type: 'reach', pos: [3, 2] }], instructionLimit: 5, concept: 'Sequencing'
  },
  {
    title: 'Around the Vegetable Garden', briefing: 'Follow the path around the garden to the flag.',
    character: { ...missionGiver('Mom'), dialogue: 'Miguel, I need you to bring the vegetables to the farmhouse. The garden is in the way, so you’ll have to follow the path around it!' },
    start: [1, 5], facing: 1, cargo: [{ id: 'veg', type: 'vegetables' }], items: [],
    obstacles: [[1, 4], [2, 4], [1, 3], [2, 3]], obstacleStyle: 'garden',
    objectives: [{ type: 'reach', pos: [3, 3] }], instructionLimit: 7, concept: 'Turning'
  },
  {
    title: 'Fetch the Toolbox', briefing: 'Pick up the toolbox, then bring it back to the flag.',
    character: { ...missionGiver('Gabe'), dialogue: 'I left my toolbox near the barn! Could you grab it and bring it back? I need it to fix my bike.' },
    start: [2, 4], facing: 1, cargo: [], items: [{ id: 'toolbox', type: 'toolbox', pos: [4, 4] }],
    objectives: [{ type: 'collect', ids: ['toolbox'] }, { type: 'reach', pos: [0, 4] }], instructionLimit: 9, concept: 'Picking up'
  },
  {
    title: 'Supplies for the Barn', briefing: 'Collect both supply crates, then return to the flag.',
    character: { ...missionGiver('Aunt Mandy'), dialogue: 'Miguel, I need two supply crates for the barn. One is near the garden and the other is further down the field. Could you collect both and bring them back?' },
    start: [2, 5], facing: 0, cargo: [], items: [{ id: 'crate1', type: 'crate', pos: [2, 3] }, { id: 'crate2', type: 'crate', pos: [4, 3] }],
    objectives: [{ type: 'collect', ids: ['crate1', 'crate2'] }, { type: 'reach', pos: [4, 5] }], instructionLimit: 15, concept: 'Planning a route'
  }
];

// World 2 uses logical coordinates (x East, y North, origin = first tile) mapped onto the cultivated field.
const field = ([x, y]) => [x + 1, 4 - y];
const plots = (crop, ...tiles) => tiles.map((pos) => ({ pos: field(pos), crop }));
const plotKeys = (tiles) => tiles.map(({ pos }) => pos);
const seedBag = (id, pos, seeds, offset) => ({ id, type: 'seeds', pos: field(pos), seeds, offset });

const world2Levels = (() => {
  const l2 = plots('tomato', [2, 0], [3, 0]);
  const l3 = plots('carrot', [1, 0], [3, 0], [3, 2]);
  const l4 = [...plots('carrot', [1, 0], [2, 0]), ...plots('tomato', [3, 1], [4, 1])];
  return [
    {
      title: 'The Long Way Home', briefing: 'Make a routine with F1 and use it to reach the flag.',
      character: { ...missionGiver('Grandpa'), dialogue: 'Miguel, the storage area is at the other end of this field. Instead of writing the same instructions over and over, why don’t you make a little routine that does the work for you?' },
      start: field([0, 0]), facing: 1, items: [], plantTiles: [],
      objectives: [{ type: 'reach', pos: field([4, 0]) }],
      instructionLimit: 3, functionLimits: { F1: 2, F2: 0 }, concept: 'Functions'
    },
    {
      title: 'Plant the First Seeds', briefing: 'Pick up the seeds, plant both prepared patches, then reach the flag.',
      character: { ...missionGiver('Mom'), dialogue: 'Miguel, I’d like to start growing some vegetables in this field. There’s a bag of seeds near the entrance. Pick it up, then plant some seeds in these two prepared patches!' },
      start: field([0, 0]), facing: 1, items: [seedBag('seeds', [1, 0], 2)], plantTiles: l2,
      objectives: [{ type: 'collect', ids: ['seeds'] }, { type: 'plant', tiles: plotKeys(l2) }, { type: 'reach', pos: field([3, 3]) }],
      instructionLimit: 8, functionLimits: { F1: 2, F2: 0 }, concept: 'Planting'
    },
    {
      title: 'Plant the Whole Row', briefing: 'Plant all three patches, then drive to the flag.',
      character: { ...missionGiver('Gabe'), dialogue: 'Miguel, we need to plant an entire row of carrots. There are three empty patches. I bet you can make a function to plant them without adding the same instructions over and over!' },
      start: field([0, 0]), facing: 1, items: [seedBag('seeds', [0, -2], 3)], plantTiles: l3,
      objectives: [{ type: 'collect', ids: ['seeds'] }, { type: 'plant', tiles: plotKeys(l3) }, { type: 'reach', pos: field([1, 2]) }],
      instructionLimit: 13, functionLimits: { F1: 3, F2: 2 }, concept: 'Functions and planting'
    },
    {
      title: 'Two Rows of Vegetables', briefing: 'Plant both rows using F1 and F2, and finish at the flag.',
      character: { ...missionGiver('Aunt Mandy'), dialogue: 'Miguel, we have a bigger job today! We need to plant two rows of vegetables. Try to organize your instructions into two functions so you can get everything planted without writing the same steps again and again.' },
      start: field([0, 0]), facing: 1, items: [seedBag('seeds', [0, -1], 4)], plantTiles: l4,
      objectives: [{ type: 'collect', ids: ['seeds'] }, { type: 'plant', tiles: plotKeys(l4) }, { type: 'reach', pos: field([4, 1]) }],
      instructionLimit: 12, functionLimits: { F1: 2, F2: 3 }, concept: 'Combining functions'
    }
  ];
})();


// Farm 3 uses the same logical coordinates idea as Farm 2: x East, y North, mapped onto the workshop yard.
const shop = ([x, y]) => [x + 1, 6 - y];
const repairs = (...tiles) => tiles.map(([pos, kind]) => ({ pos: shop(pos), kind }));
const repairKeys = (tiles) => tiles.map(({ pos }) => pos);
const toolbox = (pos, tools) => ({ id: 'toolbox', type: 'toolbox', pos: shop(pos), tools });

const world3Levels = (() => {
  const l1 = repairs([[3, 0], 'wheel'], [[5, 0], 'pipe']);
  const l2 = repairs([[2, 2], 'plank'], [[4, 2], 'pipe']);
  const l3 = repairs([[2, 0], 'wheel'], [[4, 0], 'gear'], [[4, 2], 'pipe']);
  const l4 = repairs([[2, 0], 'plank'], [[4, 0], 'wheel'], [[4, 2], 'gear'], [[2, 2], 'pipe']);
  return [
    {
      title: 'Wheel and Pipe', briefing: 'Pick up the toolbox, fix both broken parts with an F1 routine, then reach the flag.',
      character: { ...missionGiver('Grandma'), dialogue: 'Miguel, two parts in the workshop yard are broken. Grab the toolbox, use FIX on each one, and put the repeated steps into a function!' },
      start: shop([0, 0]), facing: 1, items: [toolbox([1, 0], 2)], fixTiles: l1,
      objectives: [{ type: 'collect', ids: ['toolbox'] }, { type: 'fix', tiles: repairKeys(l1) }, { type: 'reach', pos: shop([6, 0]) }],
      instructionLimit: 5, functionLimits: { F1: 3, F2: 0 }, concept: 'Fixing with functions'
    },
    {
      title: 'Mend the Yard', briefing: 'Fetch the toolbox from the side, then fix the plank and the pipe on the way to the flag.',
      character: { ...missionGiver('Mom'), dialogue: 'Miguel, the toolbox is off to one side and two things need mending on the far row. Fetch it first, then fix them and bring the tractor to the flag.' },
      start: shop([0, 0]), facing: 1, items: [toolbox([0, 2], 2)], fixTiles: l2,
      objectives: [{ type: 'collect', ids: ['toolbox'] }, { type: 'fix', tiles: repairKeys(l2) }, { type: 'reach', pos: shop([6, 2]) }],
      instructionLimit: 10, functionLimits: { F1: 3, F2: 0 }, concept: 'Detours and functions'
    },
    {
      title: 'Three Repairs', briefing: 'Fix all three broken parts, then drive to the flag.',
      character: { ...missionGiver('Bruh'), dialogue: 'Miguel, there are three broken parts scattered around the yard, and the toolbox is two squares to your right. Make a function so you don’t repeat yourself!' },
      start: shop([0, 2]), facing: 1, items: [toolbox([0, 0], 3)], fixTiles: l3,
      objectives: [{ type: 'collect', ids: ['toolbox'] }, { type: 'fix', tiles: repairKeys(l3) }, { type: 'reach', pos: shop([6, 2]) }],
      instructionLimit: 12, functionLimits: { F1: 3, F2: 0 }, concept: 'Functions and turning'
    },
    {
      title: 'The Big Overhaul', briefing: 'Fix all four broken parts using F1 and F2, then reach the flag.',
      character: { ...missionGiver('Aunt Mandy'), dialogue: 'Miguel, today is the big workshop overhaul! Four parts need fixing across two rows. Split the job into two functions to keep your program short.' },
      start: shop([0, 1]), facing: 1, items: [toolbox([0, 0], 4)], fixTiles: l4,
      objectives: [{ type: 'collect', ids: ['toolbox'] }, { type: 'fix', tiles: repairKeys(l4) }, { type: 'reach', pos: shop([0, 2]) }],
      instructionLimit: 10, functionLimits: { F1: 3, F2: 5 }, concept: 'Combining functions'
    }
  ];
})();

// Farm 4 plants pine saplings on the same grid mapping as Farm 3.
const saplings = (...tiles) => tiles.map((pos) => ({ pos: shop(pos), crop: 'pine' }));
const saplingBag = (pos, seeds) => ({ id: 'seeds', type: 'seeds', pos: shop(pos), seeds });

const world4Levels = (() => {
  const l1 = saplings([3, 0], [5, 0], [5, 2]);
  const l2 = saplings([2, 2], [4, 2], [6, 2]);
  const l3 = saplings([2, 0], [4, 0], [6, 0], [6, 2]);
  const l4 = saplings([2, 0], [4, 0], [6, 0], [6, 2], [4, 2], [2, 2]);
  const level = (title, briefing, giver, dialogue, start, bag, tiles, goal, limit, concept) => ({
    title, briefing, character: { ...missionGiver(giver), dialogue },
    start: shop(start), facing: 1, items: [saplingBag(...bag)], plantTiles: tiles,
    objectives: [{ type: 'collect', ids: ['seeds'] }, { type: 'plant', tiles: plotKeys(tiles) }, { type: 'reach', pos: shop(goal) }],
    instructionLimit: limit, functionLimits: { F1: 3, F2: 3 }, concept
  });
  return [
    level('Pine Trail', 'Pick up the saplings, plant a pine on each marked patch, then reach the flag.', 'Dad',
      'Miguel, we are starting a little forest by the road. Grab the saplings, plant a pine on each dark patch, and use functions so you don’t repeat yourself!',
      [0, 0], [[1, 0], 3], l1, [3, 2], 9, 'Functions and planting'),
    level('The Far Row', 'Fetch the saplings from the side, plant the far row, then drive down to the flag.', 'Mom',
      'Miguel, the saplings are over to the side and the new row is at the far end. Fetch them first, then plant three pines and come back to the flag.',
      [0, 0], [[0, 2], 3], l2, [6, 0], 11, 'Detours and functions'),
    level('Forest Corner', 'Plant all four pines, turning the corner as you go, then reach the flag.', 'Gabe',
      'Miguel, the saplings are two squares to your right. Plant a row of pines, turn the corner for one more, and finish at the flag. Functions will save you lots of blocks!',
      [0, 2], [[0, 0], 4], l3, [4, 2], 11, 'Functions and turning'),
    level('The Pine Grove', 'Plant six pines in a loop using F1 and F2, then reach the flag.', 'Aunt Mandy',
      'Miguel, today we plant a whole grove! Six pines in a loop around the clearing. Split the job into two functions to keep your program short.',
      [0, 1], [[0, 0], 6], l4, [0, 2], 12, 'Combining functions')
  ];
})();

// Farm 5 floats in outer space and plants planets on the same grid mapping.
const planets = (...tiles) => tiles.map(([pos, crop]) => ({ pos: shop(pos), crop }));
const mysteryBox = (pos, seeds) => ({ id: 'seeds', type: 'mysterybox', pos: shop(pos), seeds });

const world5Levels = (() => {
  const l1 = planets([[3, 1], 'moon'], [[5, 1], 'mars'], [[5, 3], 'saturn']);
  const l2 = planets([[2, 1], 'mars'], [[4, 1], 'jupiter'], [[6, 1], 'moon'], [[6, 3], 'saturn']);
  const l3 = planets([[2, 3], 'earth'], [[4, 3], 'jupiter'], [[6, 3], 'moon'], [[6, 1], 'saturn'], [[4, 1], 'mars']);
  const l4 = planets([[2, 2], 'moon'], [[4, 2], 'earth'], [[6, 2], 'jupiter'], [[6, 0], 'saturn'], [[4, 0], 'neptune'], [[2, 0], 'mars']);
  const level = (title, briefing, giver, dialogue, start, bag, tiles, goal, limit, concept) => ({
    title, briefing, character: { ...missionGiver(giver), dialogue },
    start: shop(start), facing: 1, items: [mysteryBox(...bag)], plantTiles: tiles,
    objectives: [{ type: 'collect', ids: ['seeds'] }, { type: 'plant', tiles: plotKeys(tiles) }, { type: 'reach', pos: shop(goal) }],
    instructionLimit: limit, functionLimits: { F1: 3, F2: 3 }, concept
  });
  return [
    level('First Planets', 'Collect the glowing box, plant a planet on each launch pad, then reach the flag.', 'Baby Lilian',
      'Miguel, welcome to the space farm! That mysterious box holds baby planets. Plant one on each glowing pad and use a function to save blocks.',
      [0, 1], [[1, 1], 3], l1, [5, 5], 9, 'Functions and planting'),
    level('Planet Corner', 'Plant four planets, turning the corner as you go.', 'Mom',
      'Miguel, the box is down below the start. Fetch it, plant a row of planets, and turn the corner for the last one.',
      [0, 3], [[0, 1], 4], l2, [4, 3], 13, 'Detours and functions'),
    level('Orbit Loop', 'Plant five planets in a loop, using F1 and F2.', 'Gabe',
      'Miguel, this one is a long way round. Plant five planets in a loop. Two small functions will keep your program short!',
      [0, 1], [[0, 3], 5], l3, [2, 1], 12, 'Combining functions'),
    level('The Solar System', 'Plant six planets in a big loop, then reach the flag.', 'Aunt Mandy',
      'Miguel, today we build a whole solar system! Six planets in a big loop around the station. Use both functions wisely.',
      [0, 0], [[0, 2], 6], l4, [0, 0], 13, 'Mastering functions')
  ];
})();

// Replayable practice missions. They show their solution on request and never affect progression.
const practiceTiles = plots('carrot', [2, 0]);
const practiceLevels = [
  {
    id: 21, world: 2, practice: true, title: 'Practice: Make a Routine', briefing: 'Put the instructions you want to reuse inside F1, then call F1 from the main program.',
    character: { ...missionGiver('Dad'), dialogue: 'A function is a little routine you name once and use as often as you like. Put two Forwards in F1, then call it from the main program!' },
    start: [1, 5], facing: 1, items: [], cargo: [], plantTiles: [], obstacles: [],
    objectives: [{ type: 'reach', pos: [3, 3] }], goal: [3, 3],
    instructionLimit: 3, functionLimits: { F1: 2, F2: 0 }, concept: 'Functions',
    solution: { main: ['callF1', 'left', 'callF1'], F1: ['forward', 'forward'] }
  },
  {
    id: 22, world: 2, practice: true, title: 'Practice: Plant a Seed', briefing: 'Pick up the seeds, then plant them on the dark soil. Turn left afterwards so the new plant stays in view.',
    character: { ...missionGiver('Mom'), dialogue: 'Seeds have to be picked up before you can plant them. Then drive onto the dark soil and use Plant!' },
    start: field([0, 0]), facing: 1, cargo: [], obstacles: [],
    items: [seedBag('seeds', [1, 0], 1)], plantTiles: practiceTiles,
    objectives: [{ type: 'collect', ids: ['seeds'] }, { type: 'plant', tiles: plotKeys(practiceTiles) }, { type: 'reach', pos: field([2, 3]) }], goal: field([2, 3]),
    instructionLimit: 8, functionLimits: { F1: 0, F2: 0 }, concept: 'Planting',
    solution: { main: ['forward', 'pickup', 'forward', 'plant', 'left', 'forward', 'forward', 'forward'], F1: [] }
  }
];

// Scattered boxes and props for scenery. They sit outside the area the mission uses, so they never get in the way.
function withDecor(level) {
  const pts = [level.start, level.goal, ...level.items.map((item) => item.pos), ...(level.plantTiles || []).map((tile) => tile.pos), ...(level.fixTiles || []).map((tile) => tile.pos), ...(level.route || [])];
  const xs = pts.map((point) => point[0]), ys = pts.map((point) => point[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs) - 1, Math.max(...xs) + 1, Math.min(...ys) - 1, Math.max(...ys) + 1];
  const taken = new Set(level.obstacles.map(([x, y]) => `${x},${y}`));
  const spots = [];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    if ((x < x0 || x > x1 || y < y0 || y > y1) && !taken.has(`${x},${y}`)) spots.push([x, y]);
  }
  const picked = [];
  for (let i = 0; i < spots.length && picked.length < 3; i++) picked.push(spots[(level.id * 7 + i * 5) % spots.length]);
  return { ...level, obstacles: [...level.obstacles, ...new Map(picked.map((spot) => [spot.join(), spot])).values()] };
}

export const levels = generatedLevels.map((level, index) => {
  const custom = world1Levels[index] ?? world2Levels[index - 4] ?? world3Levels[index - 8] ?? world4Levels[index - 12] ?? world5Levels[index - 16];
  if (!custom) return level;
  const { route, solution, ...base } = level;
  const reach = custom.objectives.find((objective) => objective.type === 'reach');
  return { ...base, obstacles: [], ...custom, goal: reach.pos, blocks: blocksFor(level.world) };
}).map((level, index) => ({ ...level, character: { ...level.character, ...missionGiver(GIVER_ORDER[index % GIVER_ORDER.length]), dialogue: level.character.dialogue } })).concat(practiceLevels.map((level) => ({ ...level, grid: { width: 8, height: 8 } })))
  .map((level) => withDecor(level))
  .map((level) => ({ ...level, blocks: blocksFor(level.world), functionLimit: FUNCTION_SLOTS, functionLimits: { F1: FUNCTION_SLOTS, F2: FUNCTION_SLOTS } }));
