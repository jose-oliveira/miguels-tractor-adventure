import * as THREE from 'three';

// Broken things in the workshop yard. Each repair has a `broken` and a `fixed` look; the scene swaps them when FIX runs.
const mat = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness: .7, flatShading: true, ...options });

function part(group, geometry, material, position, rotation) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

const BUILDERS = {
  wheel: {
    broken(g) {
      const tilt = [0, -.45, 0];
      const tire = part(g, new THREE.TorusGeometry(.2, .09, 8, 16), mat('#2b2b2e'), [0, .2, 0], tilt);
      tire.scale.set(1.12, .68, 1.3);
      const rim = part(g, new THREE.CylinderGeometry(.11, .11, .1, 10), mat('#b8bcbe'), [0, .17, 0], [Math.PI / 2, 0, .6]);
      rim.rotation.set(Math.PI / 2, 0, 0);
      rim.rotation.order = 'YXZ';
      rim.rotation.y = -.45;
      rim.scale.set(1, 1, .6);
      part(g, new THREE.BoxGeometry(.05, .12, .02), mat('#d9d9d9'), [.3, .06, .1]);
    },
    fixed(g) {
      part(g, new THREE.TorusGeometry(.2, .09, 8, 16), mat('#2b2b2e'), [0, .3, 0], [0, 0, 0]);
      part(g, new THREE.CylinderGeometry(.11, .11, .1, 10), mat('#e9c33d'), [0, .3, 0], [Math.PI / 2, 0, 0]);
    }
  },
  gear: {
    broken(g) {
      const body = mat('#7a4a2a');
      part(g, new THREE.CylinderGeometry(.2, .2, .07, 10), body, [0, .1, 0], [.25, 0, .2]);
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 8) * Math.PI * 2;
        part(g, new THREE.BoxGeometry(.08, .08, .08), body, [Math.cos(a) * .24, .13, Math.sin(a) * .24], [.25, 0, .2]);
      }
      part(g, new THREE.BoxGeometry(.08, .04, .08), mat('#3a2a1e'), [.24, .02, .08]);
    },
    fixed(g) {
      const body = mat('#e8b93a', { metalness: .3 });
      part(g, new THREE.CylinderGeometry(.2, .2, .07, 12), body, [0, .12, 0]);
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * Math.PI * 2;
        part(g, new THREE.BoxGeometry(.08, .07, .08), body, [Math.cos(a) * .24, .12, Math.sin(a) * .24], [0, -a, 0]);
      }
      part(g, new THREE.CylinderGeometry(.06, .06, .09, 8), mat('#4c5a66'), [0, .13, 0]);
    }
  },
  plank: {
    broken(g) {
      const wood = mat('#a06a3a');
      part(g, new THREE.BoxGeometry(.4, .06, .14), wood, [-.12, .05, .08], [0, .3, .15]);
      part(g, new THREE.BoxGeometry(.3, .06, .14), wood, [.17, .05, -.1], [0, -.4, -.2]);
      part(g, new THREE.BoxGeometry(.04, .04, .04), mat('#9a9d9e'), [.05, .03, .0]);
    },
    fixed(g) {
      const wood = mat('#c8975e');
      part(g, new THREE.BoxGeometry(.7, .07, .16), wood, [0, .08, 0]);
      [-.28, .28].forEach((x) => part(g, new THREE.SphereGeometry(.03, 6, 5), mat('#c8ccce'), [x, .125, 0]));
    }
  },
  pipe: {
    broken(g) {
      const metal = mat('#5f6b73');
      part(g, new THREE.CylinderGeometry(.07, .07, .3, 8), metal, [-.22, .09, 0], [0, 0, Math.PI / 2 - .15]);
      part(g, new THREE.CylinderGeometry(.07, .07, .3, 8), metal, [.24, .09, 0], [0, 0, Math.PI / 2 + .2]);
      part(g, new THREE.CylinderGeometry(.2, .22, .02, 12), mat('#4a9de0', { transparent: true, opacity: .8 }), [0, .04, .1]);
    },
    fixed(g) {
      part(g, new THREE.CylinderGeometry(.07, .07, .7, 8), mat('#8d9aa3', { metalness: .3 }), [0, .1, 0], [0, 0, Math.PI / 2]);
      part(g, new THREE.CylinderGeometry(.085, .085, .08, 8), mat('#e0453a'), [0, .1, 0], [0, 0, Math.PI / 2]);
    }
  }
};

export const REPAIR_KINDS = Object.keys(BUILDERS);

export function createRepair(kind) {
  const builder = BUILDERS[kind] || BUILDERS.wheel;
  const group = new THREE.Group();
  const broken = new THREE.Group();
  const fixed = new THREE.Group();
  builder.broken(broken);
  builder.fixed(fixed);
  fixed.visible = false;
  group.add(broken, fixed);
  return { group, broken, fixed };
}

export function createWrench() {
  const g = new THREE.Group();
  const steel = mat('#d9dee2', { metalness: .4 });
  part(g, new THREE.BoxGeometry(.06, .34, .05), steel, [0, 0, 0]);
  part(g, new THREE.TorusGeometry(.07, .03, 5, 10, Math.PI * 1.5), steel, [0, .19, 0]);
  return g;
}
