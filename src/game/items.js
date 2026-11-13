import * as THREE from 'three';

// Collectible objects. Each factory returns a group whose origin is the bottom centre, roughly 0.4 units wide.
// Add a new entry to ITEM_FACTORIES to support more collectibles in later worlds.
const mat = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness: .75, flatShading: true, ...options });

function part(group, geometry, material, position, rotation) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

const ITEM_FACTORIES = {
  hay(g) {
    part(g, new THREE.CylinderGeometry(.2, .2, .34, 14), mat('#e2bb52'), [0, .2, 0], [0, 0, Math.PI / 2]);
    [-.1, .1].forEach((x) => part(g, new THREE.TorusGeometry(.2, .014, 5, 16), mat('#c79a38'), [x, .2, 0], [0, Math.PI / 2, 0]));
  },
  toolbox(g) {
    part(g, new THREE.BoxGeometry(.44, .17, .22), mat('#3b78b5'), [0, .085, 0]);
    part(g, new THREE.BoxGeometry(.46, .05, .24), mat('#2c5d8f'), [0, .19, 0]);
    part(g, new THREE.TorusGeometry(.08, .014, 5, 12, Math.PI), mat('#33393c'), [0, .21, 0]);
    part(g, new THREE.BoxGeometry(.06, .05, .02), mat('#e8c25a'), [0, .15, .12]);
  },
  crate(g) {
    part(g, new THREE.BoxGeometry(.38, .34, .38), mat('#bf9154'), [0, .17, 0]);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => part(g, new THREE.BoxGeometry(.05, .36, .05), mat('#8a6038'), [a * .19, .18, b * .19]));
    [.06, .28].forEach((y) => part(g, new THREE.BoxGeometry(.4, .045, .4), mat('#8a6038'), [0, y, 0]));
    part(g, new THREE.BoxGeometry(.12, .12, .01), mat('#f3ece0'), [0, .17, .2]);
  },
  seeds(g) {
    part(g, new THREE.BoxGeometry(.3, .34, .16), mat('#d9b98a'), [0, .17, 0]);
    part(g, new THREE.BoxGeometry(.32, .06, .18), mat('#b98f55'), [0, .35, 0]);
    part(g, new THREE.BoxGeometry(.18, .14, .01), mat('#f3ece0'), [0, .18, .085]);
    part(g, new THREE.SphereGeometry(.045, 8, 6), mat('#5aa04c'), [0, .19, .095]);
  },
  mysterybox(g) {
    part(g, new THREE.BoxGeometry(.34, .3, .34), mat('#0c0d14', { roughness: .35, metalness: .5 }), [0, .17, 0]);
    const light = mat('#b58cff', { emissive: '#8a5cff', emissiveIntensity: 1.8 });
    [-1, 1].forEach((a) => [-1, 1].forEach((b) => part(g, new THREE.BoxGeometry(.04, .32, .04), light, [a * .17, .17, b * .17])));
    [.02, .32].forEach((y) => part(g, new THREE.BoxGeometry(.36, .02, .36), light, [0, y, 0]));
    part(g, new THREE.SphereGeometry(.05, 8, 6), mat('#e9d9ff', { emissive: '#c9a6ff', emissiveIntensity: 2 }), [0, .17, .18]);
    const halo = part(g, new THREE.SphereGeometry(.3, 14, 10), mat('#a77bff', { emissive: '#8a5cff', emissiveIntensity: 1, transparent: true, opacity: .16, depthWrite: false }), [0, .2, 0]);
    halo.castShadow = false;
    halo.receiveShadow = false;
  },
  vegetables(g) {
    part(g, new THREE.CylinderGeometry(.2, .16, .2, 10), mat('#a8744a'), [0, .1, 0]);
    [['#e8953a', -.08, -.04], ['#d6352f', .09, .02], ['#5aa04c', 0, .08], ['#7bc05a', -.06, .1], ['#e8953a', .08, -.08]].forEach(([c, x, z]) =>
      part(g, new THREE.SphereGeometry(.09, 8, 6), mat(c), [x, .24, z]));
  }
};

export function createItem(type) {
  const group = new THREE.Group();
  (ITEM_FACTORIES[type] || ITEM_FACTORIES.crate)(group);
  return group;
}
