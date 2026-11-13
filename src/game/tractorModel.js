import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// The tractor faces -Z in local space. Parts flagged with userData.tractorPaint take the world's tractor color.
const material = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness: .6, ...options });

function addMesh(parent, geometry, mat, position, { rotation, paint = false } = {}) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.tractorPaint = paint;
  parent.add(mesh);
  return mesh;
}

const roundedBox = (parent, size, color, position, options = {}) =>
  addMesh(parent, new RoundedBoxGeometry(...size, 3, Math.min(...size) * .22), material(color, options.material), position, options);

function addWheel(parent, x, z, radius, width, lugs) {
  const wheel = new THREE.Group();
  wheel.userData.isWheel = true;
  wheel.position.set(x, radius, z);
  const side = Math.sign(x);
  const axis = [0, 0, Math.PI / 2];
  addMesh(wheel, new THREE.CylinderGeometry(radius, radius, width, 24), material('#232a2d', { roughness: .95 }), [0, 0, 0], { rotation: axis });
  for (let i = 0; i < lugs; i += 1) {
    const angle = (i / lugs) * Math.PI * 2;
    const lug = addMesh(wheel, new THREE.BoxGeometry(width * .92, radius * .16, radius * .2), material('#171c1e', { roughness: 1 }),
      [0, Math.sin(angle) * radius, Math.cos(angle) * radius]);
    lug.rotation.x = -angle;
  }
  addMesh(wheel, new THREE.CylinderGeometry(radius * .58, radius * .58, width * 1.04, 20), material('#e5b93f', { roughness: .45 }), [0, 0, 0], { rotation: axis });
  addMesh(wheel, new THREE.CylinderGeometry(radius * .2, radius * .2, width * 1.12, 12), material('#8d9494', { metalness: .5, roughness: .35 }), [side * .01, 0, 0], { rotation: axis });
  parent.add(wheel);
}

function addLimb(parent, from, to, radius, color) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const length = start.distanceTo(end);
  const limb = addMesh(parent, new THREE.CylinderGeometry(radius, radius, length, 10), material(color), [0, 0, 0]);
  limb.position.copy(start).add(end).multiplyScalar(.5);
  limb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
  return limb;
}

function addMiguel(parent) {
  const miguel = new THREE.Group();
  miguel.name = 'miguel-placeholder';
  const skin = '#c68863', denim = '#3f6f9f', plaid = '#b3382e';
  roundedBox(miguel, [.46, .5, .3], plaid, [0, 1.02, .34]);
  for (const y of [.92, 1.1]) roundedBox(miguel, [.47, .035, .31], '#26201f', [0, y, .34]);
  roundedBox(miguel, [.34, .34, .06], denim, [0, .98, .19]);
  for (const x of [-.12, .12]) roundedBox(miguel, [.06, .44, .05], denim, [x, 1.1, .19]);
  roundedBox(miguel, [.46, .18, .3], denim, [0, .78, .34]);
  for (const x of [-.11, .11]) {
    addLimb(miguel, [x, .8, .3], [x, .8, -.04], .085, denim);
    roundedBox(miguel, [.14, .1, .2], '#5b3b27', [x, .74, -.12]);
    addLimb(miguel, [x * 2, 1.18, .34], [x * 1.15, 1.08, .0], .055, plaid);
    addMesh(miguel, new THREE.SphereGeometry(.058, 10, 8), material(skin), [x * 1.15, 1.08, -.02]);
  }
  addMesh(miguel, new THREE.SphereGeometry(.26, 24, 18), material(skin), [0, 1.55, .34]);
  for (const x of [-.26, .26]) addMesh(miguel, new THREE.SphereGeometry(.055, 10, 8), material(skin), [x, 1.54, .34]);
  addMesh(miguel, new THREE.SphereGeometry(.275, 24, 12, 0, Math.PI * 2, 0, Math.PI * .52), material('#3b2619', { roughness: .85 }), [0, 1.58, .36]);
  addMesh(miguel, new THREE.SphereGeometry(.11, 12, 8), material('#3b2619', { roughness: .85 }), [0, 1.82, .22]);
  for (const x of [-.09, .09]) {
    addMesh(miguel, new THREE.SphereGeometry(.05, 12, 8), material('#fffaf0'), [x, 1.58, .1]);
    addMesh(miguel, new THREE.SphereGeometry(.028, 10, 8), material('#2b211b'), [x, 1.58, .06]);
  }
  addMesh(miguel, new THREE.TorusGeometry(.07, .014, 6, 14, Math.PI), material('#7b3d2c'), [0, 1.5, .09], { rotation: [0, 0, Math.PI] });
  parent.add(miguel);
  return miguel;
}

// Cargo trailer behind the tractor. Items collected by the program are parented to `cargo`.
const CARGO_SLOTS = [[0, 1.74], [0, 2.3]];

function addTrailer(parent) {
  roundedBox(parent, [.08, .06, .4], '#555d60', [0, .42, 1.14], { material: { roughness: .4, metalness: .35 } });
  roundedBox(parent, [1.1, .07, 1.3], '#a8744a', [0, .34, 1.95]);
  roundedBox(parent, [.06, .2, 1.3], '#ffffff', [-.55, .47, 1.95], { paint: true });
  roundedBox(parent, [.06, .2, 1.3], '#ffffff', [.55, .47, 1.95], { paint: true });
  roundedBox(parent, [1.1, .2, .06], '#ffffff', [0, .47, 2.6], { paint: true });
  roundedBox(parent, [1.1, .14, .06], '#ffffff', [0, .44, 1.32], { paint: true });
  addWheel(parent, -.62, 2.1, .2, .12, 8);
  addWheel(parent, .62, 2.1, .2, .12, 8);
  const cargo = new THREE.Group();
  parent.add(cargo);
  return { cargo, cargoSlots: CARGO_SLOTS.map(([x, z]) => new THREE.Vector3(x, .38, z)) };
}

// Extras that turn the tractor into a little spaceship. The scene toggles them per world.
function glow(color, intensity = 1.2, options = {}) {
  return material(color, { emissive: color, emissiveIntensity: intensity, roughness: .3, ...options });
}

function addSpaceship(tractor) {
  const ship = new THREE.Group();
  ship.visible = false;
  const hull = '#e9edf5';
  // glass bubble over the driver's seat
  addMesh(ship, new THREE.SphereGeometry(.66, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), material('#9fe3ff', { transparent: true, opacity: .34, roughness: .05, metalness: .2 }), [0, 1.0, .32]).castShadow = false;
  addMesh(ship, new THREE.TorusGeometry(.66, .035, 8, 28), material('#c9d2e4', { metalness: .6, roughness: .3 }), [0, 1.0, .32], { rotation: [Math.PI / 2, 0, 0] });
  // pointed nose and glowing eye
  addMesh(ship, new THREE.ConeGeometry(.25, .6, 16), material(hull, { metalness: .4, roughness: .3 }), [0, .72, -1.15], { rotation: [-Math.PI / 2, 0, 0] });
  addMesh(ship, new THREE.SphereGeometry(.08, 12, 8), glow('#7be7ff', 1.6), [0, .76, -1.48]);
  // swept fins
  for (const x of [-1, 1]) {
    const fin = roundedBox(ship, [.08, .5, .8], '#ffffff', [x * .52, 1.02, .85], { paint: true });
    fin.rotation.z = x * -.25;
    fin.rotation.x = -.35;
    const tip = addMesh(ship, new THREE.SphereGeometry(.05, 8, 6), glow(x < 0 ? '#ff5a6e' : '#4dff9a', 1.8), [x * .62, 1.3, .98]);
    tip.castShadow = false;
  }
  // rocket engine
  addMesh(ship, new THREE.CylinderGeometry(.18, .24, .3, 14), material('#555d70', { metalness: .6, roughness: .35 }), [0, .72, .85], { rotation: [Math.PI / 2, 0, 0] });
  const flame = addMesh(ship, new THREE.ConeGeometry(.15, .6, 12), glow('#ff9a3d', 1.8, { transparent: true, opacity: .85 }), [0, .72, 1.25], { rotation: [Math.PI / 2, 0, 0] });
  flame.castShadow = false;
  ship.userData.flame = flame;
  // glowing hover pods in place of wheels
  for (const [x, z, r] of [[-.66, .34, .34], [.66, .34, .34], [-.5, -.52, .24], [.5, -.52, .24], [-.62, 2.1, .2], [.62, 2.1, .2]]) {
    addMesh(ship, new THREE.CylinderGeometry(r, r * .8, .1, 20), material('#39425a', { metalness: .6, roughness: .35 }), [x, .22, z]);
    addMesh(ship, new THREE.TorusGeometry(r * .82, .03, 6, 22), glow('#4dd9ff', 1.7), [x, .15, z], { rotation: [Math.PI / 2, 0, 0] }).castShadow = false;
  }
  tractor.add(ship);
  return ship;
}

export function createTractor() {
  const tractor = new THREE.Group();
  const metal = { metalness: .35, roughness: .4 };
  const dark = '#2d363a';
  const classic = [];

  roundedBox(tractor, [.5, .26, 1.56], dark, [0, .58, 0]);
  roundedBox(tractor, [.64, .5, .84], '#ffffff', [0, .95, -.4], { paint: true, material: { roughness: .35 } });
  roundedBox(tractor, [.5, .06, .7], '#ffffff', [0, 1.22, -.4], { paint: true });
  roundedBox(tractor, [.5, .42, .06], dark, [0, .95, -.84]);
  for (const y of [.82, .92, 1.02]) roundedBox(tractor, [.4, .035, .04], '#a9b0ad', [0, y, -.875], { material: metal });
  for (const x of [-.23, .23]) {
    addMesh(tractor, new THREE.SphereGeometry(.075, 14, 10), material('#fff1a8', { emissive: '#ffd45c', emissiveIntensity: .45 }), [x, 1.08, -.86]);
  }

  classic.push(addMesh(tractor, new THREE.CylinderGeometry(.045, .05, .55, 12), material('#4b5154', metal), [.2, 1.5, -.5]));
  classic.push(addMesh(tractor, new THREE.CylinderGeometry(.065, .045, .06, 12), material('#252a2c'), [.2, 1.8, -.5]));

  const cabFloor = roundedBox(tractor, [.88, .12, .9], dark, [0, .66, .32]);
  cabFloor.castShadow = true;
  roundedBox(tractor, [.5, .1, .38], '#3a3430', [0, .74, .5]);
  roundedBox(tractor, [.5, .42, .08], '#3a3430', [0, 1.0, .68]);

  for (const x of [-.4, .4]) {
    for (const z of [-.06, .7]) classic.push(roundedBox(tractor, [.07, 1.3, .07], dark, [x, 1.3, z]));
  }
  classic.push(roundedBox(tractor, [1.0, .1, 1.02], '#f2efe6', [0, 1.97, .32], { material: { roughness: .5 } }));
  addMesh(tractor, new THREE.BoxGeometry(.8, .62, .03), material('#9fd3df', { transparent: true, opacity: .32, roughness: .1 }), [0, 1.35, .72]);
  for (const x of [-.4, .4]) {
    addMesh(tractor, new THREE.BoxGeometry(.03, .5, .72), material('#9fd3df', { transparent: true, opacity: .22, roughness: .1 }), [x, 1.62, .32]).castShadow = false;
  }

  addMesh(tractor, new THREE.TorusGeometry(.14, .026, 8, 20), material('#1f2527'), [0, 1.22, .05], { rotation: [Math.PI * .38, 0, 0] });
  addMesh(tractor, new THREE.CylinderGeometry(.018, .018, .24, 8), material('#1f2527'), [0, 1.13, .1], { rotation: [Math.PI * .38, 0, 0] });

  for (const x of [-.64, .64]) {
    roundedBox(tractor, [.4, .08, .82], '#ffffff', [x, 1.17, .34], { paint: true });
    roundedBox(tractor, [.4, .24, .06], '#ffffff', [x, 1.06, .72], { paint: true });
    roundedBox(tractor, [.4, .24, .06], '#ffffff', [x, 1.06, -.04], { paint: true });
  }

  addWheel(tractor, -.66, .34, .56, .36, 14);
  addWheel(tractor, .66, .34, .56, .36, 14);
  addWheel(tractor, -.5, -.52, .32, .22, 10);
  addWheel(tractor, .5, -.52, .32, .22, 10);
  addMesh(tractor, new THREE.CylinderGeometry(.03, .03, 1.0, 10), material('#3f474a', metal), [0, .5, -.52], { rotation: [0, 0, Math.PI / 2] });
  roundedBox(tractor, [.18, .08, .26], '#555d60', [0, .5, .9], { material: metal });
  addMesh(tractor, new THREE.CylinderGeometry(.04, .04, .22, 10), material('#555d60', metal), [0, .55, 1.04], { rotation: [Math.PI / 2, 0, 0] });

  tractor.userData.miguel = addMiguel(tractor);
  Object.assign(tractor.userData, addTrailer(tractor));
  tractor.children.filter((child) => child.userData.isWheel).forEach((wheel) => classic.push(wheel));
  tractor.userData.classic = classic;
  tractor.userData.spaceship = addSpaceship(tractor);
  return tractor;
}
