# Miguel’s Tractor Adventure — browser prototype

A browser-based 3D programming puzzle game prototype built with **Three.js + Vite**. The project is data-driven so worlds, missions, grid layouts, and character assets can be expanded without rewriting the game engine.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). To create a production build:

```bash
npm run build
npm run preview
```

## Current prototype features

- Isometric 3D farm scene with a visible grid, barn, silo, hay-bale obstacles, goal marker, tractor and seated farmer placeholder.
- Split-screen layout: 3D world on the left, visual programming interface on the right.
- 20 data-driven starter missions across five worlds (four per world).
- Mission board with world progression and completed-level states.
- Forward, left, right, pick up, F1 and F2 blocks (the repeat and conditional blocks are hidden from the library; the interpreter still supports them).
- Main program and two editable reusable function slots.
- Fixed instruction capacity, click-to-add, drag-and-drop, remove blocks, undo, redo, clear and run.
- Animated execution; an unsuccessful run simply ends without a failure screen or hint.
- Objective-based completion and automatic browser localStorage saving.
- PICK UP block and cargo system: collectible items (hay, toolbox, crates, vegetables) sit in the world; picking one up moves it onto the tractor's trailer, where cargo visibly accumulates.
- World 2 adds PLANT, a seed inventory (counter on the scene), planting tiles that show prepared soil, and low-poly crops (carrot, tomato, pumpkin, lettuce) that grow when planted. Functions F1/F2 have per-level limits (`functionLimits`) and the tractor pauses briefly each time a function returns.
- Two replayable practice missions (functions, planting) on the World 2 mission board; "Show me how" fills in their example program.
- Combinable objectives (`reach` a tile, `collect` items, `plant` tiles) declared per level in `src/data/worlds.js` along with `items`, `cargo`, `blocks`, `obstacles` and `instructionLimit`.
- A separate, testable instruction interpreter for grid movement, turns, repeats, functions and obstacle conditionals.
- The in-world farmer is a replaceable primitive placeholder styled after Miguel's approved character concept.

Run the interpreter and authored-mission checks with:

```bash
npm test
```

## Important next development steps

1. Replace the primitive tractor and seated farmer with proper low-poly 3D models. Miguel's visual references are in `public/assets/reference/`.
2. Add the optional, replayable guided concept mini-levels with locked example programs and tutorial markers on the mission board.
3. Refine the twenty authored puzzles. The current route data is starter content; loops, functions and conditionals are available as blocks, but the intended learning sequence and puzzle solutions still need playtesting.
4. Add world-specific scenery, character dialogue/portraits, tractor unlock models, audio, success animations and post-mission free driving.
5. Add tests for interpreter edge cases and responsive/mobile usability.

## Character asset workflow

- `public/assets/reference/miguel-photo-reference.jpg` — uploaded photo reference.
- `public/assets/reference/miguel-character-concept.png` — approved generated cartoon concept.
- Family members appear as cartoon portraits in public/assets/characters.
- Suggested final asset formats: GLB/GLTF for rigged 3D characters and tractors; PNG/WebP for portraits and UI art.

## Project structure

```text
public/assets/reference/   # Miguel reference images
src/data/worlds.js         # World and level definitions
src/game/scene.js          # Three.js scene, camera, tractor placement/animation
src/game/environment/      # Per-world scenery (kit, props, farm/fields/workshop/countryside/space themes)
src/main.js                # UI, editor, interpreter, progression and saving
src/style.css              # Responsive interface styling
```

## Notes

This is an initial playable foundation, not the finished production game. It uses placeholder 3D geometry and starter level routes. The generated Miguel concept is a visual reference and portrait, not a rigged 3D character model.
