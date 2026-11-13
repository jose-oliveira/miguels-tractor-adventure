import * as THREE from 'three';

// Small low-poly crops. Each factory returns { group, fruit }: the leaves grow first and the
// fruit group is scaled in afterwards by the scene's planting animation.
const mat = (color) => new THREE.MeshStandardMaterial({ color, roughness: .7, flatShading: true });

function add(group, geometry, color, position, rotation) {
  const mesh = new THREE.Mesh(geometry, mat(color));
  mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  group.add(mesh);
  return mesh;
}

function leaves(group, count, color, length, tilt, y = .04) {
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const leaf = add(group, new THREE.ConeGeometry(.045, length, 5), color, [Math.cos(angle) * .05, y + length / 2.4, Math.sin(angle) * .05]);
    leaf.rotation.set(Math.sin(angle) * tilt, 0, -Math.cos(angle) * tilt);
  }
}

// Planets float above a glowing launch pad. The pad sprouts first, then the planet scales in.
// Planets are plain spheres floating above a glowing launch pad.
function planet(group, fruit, color, { ring = null, tilt = .4, size = 1 } = {}) {
  add(group, new THREE.CylinderGeometry(.14, .17, .03, 16), '#2a3050', [0, .03, 0]);
  const glow = add(group, new THREE.TorusGeometry(.15, .018, 6, 22), '#4dd9ff', [0, .05, 0], [Math.PI / 2, 0, 0]);
  glow.material = new THREE.MeshStandardMaterial({ color: '#4dd9ff', emissive: '#4dd9ff', emissiveIntensity: 1.6 });
  const r = .13 * size, y = .3;
  add(fruit, new THREE.SphereGeometry(r, 32, 24), color, [0, y, 0]);
  if (ring) add(fruit, new THREE.TorusGeometry(r * 1.7, r * .1, 8, 40), ring, [0, y, 0], [Math.PI / 2 - tilt, 0, 0]);
}

const CROP_FACTORIES = {
  carrot(group, fruit) {
    leaves(group, 6, '#4fa83d', .3, .55);
    add(fruit, new THREE.ConeGeometry(.065, .2, 6), '#f08a24', [0, .05, 0], [Math.PI, 0, 0]);
  },
  tomato(group, fruit) {
    add(group, new THREE.CylinderGeometry(.015, .02, .3, 5), '#5c9b3a', [0, .17, 0]);
    leaves(group, 5, '#3f9a45', .22, .9, .14);
    [[.09, .12, 0], [-.07, .1, .07], [.02, .08, -.09]].forEach(([x, y, z]) =>
      add(fruit, new THREE.SphereGeometry(.06, 8, 6), '#e2372c', [x, y, z]));
  },
  pumpkin(group, fruit) {
    leaves(group, 4, '#3f8f3d', .26, 1.1, .06);
    add(fruit, new THREE.SphereGeometry(.14, 10, 8), '#f0872a', [0, .13, 0]).scale.set(1.15, .8, 1.15);
    add(fruit, new THREE.CylinderGeometry(.02, .025, .06, 5), '#5c7a2d', [0, .25, 0]);
  },
  pine(group, fruit) {
    add(group, new THREE.CylinderGeometry(.03, .04, .12, 6), '#6b4528', [0, .06, 0]);
    [[.2, .12, .22], [.15, .12, .38], [.1, .1, .54]].forEach(([r, h, y], i) =>
      add(fruit, new THREE.ConeGeometry(r, .26, 7), i % 2 ? '#2f7d3f' : '#2a6e38', [0, y, 0]));
  },
  saturn(group, fruit) { planet(group, fruit, '#e8c981', { ring: '#c9a45e', tilt: .5 }); },
  jupiter(group, fruit) { planet(group, fruit, '#d9a679'); },
  mars(group, fruit) { planet(group, fruit, '#d2552f'); },
  neptune(group, fruit) { planet(group, fruit, '#3f7fe0'); },
  moon(group, fruit) { planet(group, fruit, '#c9ccd4'); },
  earth(group, fruit) { planet(group, fruit, '#3d86d6'); },
  lettuce(group, fruit) {
    [0, 1, 2].forEach((ring) => {
      const leafCount = 6 - ring;
      for (let i = 0; i < leafCount; i += 1) {
        const angle = (i / leafCount) * Math.PI * 2 + ring;
        const leaf = add(fruit, new THREE.SphereGeometry(.09, 7, 5), ring === 2 ? '#a5dc6b' : '#6fc352', [Math.cos(angle) * (.1 - ring * .03), .08 + ring * .05, Math.sin(angle) * (.1 - ring * .03)]);
        leaf.scale.set(1, .45, 1.2);
        leaf.rotation.y = -angle;
      }
    });
  }
};

export function createCrop(type) {
  const group = new THREE.Group(), fruit = new THREE.Group();
  (CROP_FACTORIES[type] || CROP_FACTORIES.carrot)(group, fruit);
  group.add(fruit);
  return { group, fruit };
}
