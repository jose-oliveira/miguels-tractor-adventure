import * as THREE from 'three';
import { alien } from './props.js';

const PADS = ['#3b4260', '#434b6a', '#363d58'];

// Distant stars and planets sit on a plane facing the isometric camera so they show behind and around the island.
function backdrop(kit, root) {
  const toCamera = new THREE.Vector3(10, 13, 12).normalize();
  const right = new THREE.Vector3(0, 1, 0).cross(toCamera).normalize();
  const up = toCamera.clone().cross(right).normalize();
  const place = (a, b, depth) => toCamera.clone().multiplyScalar(-depth).addScaledVector(right, a).addScaledVector(up, b);

  const palette = [new THREE.Color('#ffffff'), new THREE.Color('#bcd7ff'), new THREE.Color('#ffe9b8'), new THREE.Color('#ffc4e1')];
  // Dense layers plus a Milky Way band: a night sky far from city lights.
  const gauss = () => (kit.rand() + kit.rand() + kit.rand() + kit.rand() - 2) / 2;
  const field = () => [kit.range(-16, 16), kit.range(-11, 11)];
  const band = () => { const u = kit.range(-18, 18); const v = gauss() * 3.2; return [u * .8 - v * .6, u * .6 + v * .8]; };
  const layers = [
    [4200, .3, 0, field, .35], [2200, .28, .8, band, .35],
    [260, .85, 2.4, field, 1], [120, .8, 3.7, band, 1],
  ];
  const starLayers = layers.map(([count, size, phase, spread, light]) => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const [a, b] = spread();
      place(a, b, kit.range(22, 34)).toArray(positions, i * 3);
      palette[Math.floor(kit.rand() * palette.length)].clone().multiplyScalar(light * (.7 + kit.rand() * .3)).toArray(colors, i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const points = new THREE.Points(geometry, new THREE.PointsMaterial({ size, vertexColors: true, fog: false, sizeAttenuation: true }));
    root.add(points);
    return { points, size, phase };
  });
  kit.animate((t) => starLayers.forEach(({ points, size, phase }) => { points.material.size = size * (1 + Math.sin(t * 1.6 + phase) * .15); }));

  const glowMat = (color, opacity) => ({ mat: { emissive: color, emissiveIntensity: .5, transparent: true, opacity, fog: false, roughness: 1 }, cast: false, receive: false });
  [['#5a2a8c', -12, 9, 9], ['#1f4f9c', 13, -8, 8], ['#8c2a6b', 4, 15, 6]].forEach(([c, a, b, r]) =>
    kit.sphere(root, r, c, place(a, b, 40).toArray(), { seg: 16, ...glowMat(c, .22) }));

  // big ringed planet and a small red one
  const ringed = new THREE.Group();
  ringed.position.copy(place(-9.5, 7.5, 30));
  root.add(ringed);
  kit.sphere(ringed, 2.2, '#e4b86c', [0, 0, 0], { seg: 20, mat: { fog: false } });
  kit.torus(ringed, 3.6, .22, '#cfa35d', [0, 0, 0], { rot: [Math.PI / 2 - .35, .2, 0], ts: 40, rs: 4, mat: { fog: false } }).scale.z = .35;
  kit.animate((t) => { ringed.rotation.y = t * .05; });
  kit.sphere(root, 1.1, '#d2552f', place(10.5, 7, 32).toArray(), { seg: 14, mat: { fog: false } });
  kit.sphere(root, .6, '#c9ccd4', place(12.5, -3.5, 30).toArray(), { seg: 12, mat: { fog: false } });
}

function crystal(kit, parent, x, z, s, color = '#7be7ff') {
  const g = kit.group(parent, x, z);
  [[0, 0, 1], [.16, .05, .65], [-.14, -.08, .5]].forEach(([dx, dz, h], i) =>
    kit.cone(g, .09 * s, h * s, color, [dx * s, h * s / 2, dz * s], { seg: 5, rot: [0, i, 0], mat: { emissive: color, emissiveIntensity: .8, transparent: true, opacity: .9 } }));
  kit.occupy(x, z, .3 * s);
}

function dome(kit, root, x, z) {
  const g = kit.group(root, x, z);
  kit.occupy(x, z, 1.1);
  kit.cyl(g, 1.0, 1.1, .22, '#8a93ad', [0, .11, 0], { seg: 20, mat: { metalness: .5, roughness: .4 } });
  kit.mesh(g, new THREE.SphereGeometry(.9, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), '#9fe3ff', [0, .22, 0], { mat: { transparent: true, opacity: .4, roughness: .1, metalness: .2 }, cast: false });
  kit.box(g, [.3, .45, .06], '#2a3050', [0, .45, .88]);
  kit.sphere(g, .22, '#6fd65a', [0, .5, 0], { seg: 8, mat: { emissive: '#2f8a2a', emissiveIntensity: .5 } });
  kit.cyl(g, .02, .02, .5, '#c9d3ea', [.5, .55, -.3], { seg: 5 });
  kit.sphere(g, .06, '#ff5a6e', [.5, .83, -.3], { seg: 6, mat: { emissive: '#ff2a44', emissiveIntensity: 1.5 } });
}

function dish(kit, root, x, z, rotY) {
  const g = kit.group(root, x, z, rotY);
  kit.occupy(x, z, .6);
  kit.cyl(g, .08, .14, .5, '#9aa3bd', [0, .25, 0], { seg: 8 });
  const bowl = kit.mesh(g, new THREE.SphereGeometry(.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.4), '#e9edf5', [0, .75, 0], { rot: [Math.PI * .72, 0, 0], mat: { metalness: .3, side: THREE.DoubleSide } });
  kit.cyl(g, .015, .015, .4, '#c9d3ea', [0, .95, .25], { rot: [Math.PI * .4, 0, 0], seg: 5 });
  kit.sphere(g, .05, '#ffe45c', [0, 1.1, .38], { seg: 6, mat: { emissive: '#ffd400', emissiveIntensity: 1.5 } });
  return bowl;
}

function solarPanels(kit, root, x, z, rotY) {
  const g = kit.group(root, x, z, rotY);
  kit.occupy(x, z, .9);
  kit.cyl(g, .05, .05, .5, '#9aa3bd', [0, .25, 0], { seg: 6 });
  [-.55, .55].forEach((dx) => {
    kit.box(g, [.9, .04, .6], '#1e3a7a', [dx, .55, 0], { rot: [.25, 0, 0], mat: { metalness: .5, roughness: .25 } });
    for (let i = 1; i < 3; i += 1) kit.box(g, [.015, .045, .6], '#7fb2ff', [dx - .45 + i * .3, .56, 0], { rot: [.25, 0, 0] });
  });
}

function floatingRock(kit, root, x, y, z, s, spin) {
  const rock = kit.ico(root, s, '#6c6a7c', [x, y, z], { detail: 0, scale: [1, .8, 1.1], cast: false });
  kit.animate((t) => { rock.position.y = y + Math.sin(t * .8 + x) * .15; rock.rotation.y = t * spin; });
}

export default {
  sky: '#070a1c',
  terrain: () => ({
    earth: '#2e2a45',
    ground: '#262b46',
    gap: '#12162a',
    tile: (cx, cy, rand) => (rand() < .08 ? '#4a4663' : PADS[(cx + cy) % 3])
  }),
  decorate(kit, root) {
    backdrop(kit, root);
    // glowing rim around the platform
    kit.box(root, [15.9, .04, .08], '#4dd9ff', [0, .05, 6.3], { cast: false, mat: { emissive: '#4dd9ff', emissiveIntensity: 1.2 } });
    kit.box(root, [15.9, .04, .08], '#4dd9ff', [0, .05, -6.3], { cast: false, mat: { emissive: '#4dd9ff', emissiveIntensity: 1.2 } });
    kit.box(root, [.08, .04, 12.6], '#4dd9ff', [7.9, .05, 0], { cast: false, mat: { emissive: '#4dd9ff', emissiveIntensity: 1.2 } });
    kit.box(root, [.08, .04, 12.6], '#4dd9ff', [-7.9, .05, 0], { cast: false, mat: { emissive: '#4dd9ff', emissiveIntensity: 1.2 } });
    dome(kit, root, -6.2, -4.6);
    dish(kit, root, 6.4, -5.0, -.5);
    solarPanels(kit, root, -2.4, -5.4, 0);
    solarPanels(kit, root, 2.6, -5.5, .2);
    crystal(kit, root, 6.8, 1.0, 1.2);
    crystal(kit, root, 6.2, 2.2, .8, '#c28bff');
    crystal(kit, root, -6.9, 1.6, 1.0, '#c28bff');
    crystal(kit, root, -5.8, 3.4, .7);
    crystal(kit, root, 5.5, 5.4, .9);
    [[-6.6, -.4, .35], [6.9, -2.0, .3], [-3.6, 5.5, .28], [4.2, 5.2, .3]].forEach(([x, z, s]) => {
      kit.ico(kit.group(root, x, z), s, '#6c6a7c', [0, s * .5, 0], { detail: 0, scale: [1, .7, 1.1] });
      kit.occupy(x, z, s);
    });
    floatingRock(kit, root, -8.8, 1.8, 4.5, .45, .3);
    floatingRock(kit, root, 8.9, 1.2, -1.5, .35, -.4);
    floatingRock(kit, root, 7.6, -.2, 7.0, .3, .5);
    floatingRock(kit, root, -8.2, .6, -3.2, .55, .2);
    alien(kit, root, 1.4, 5.3, Math.atan2(10, 12));
  },
  obstacle(kit, root, x, z, i) {
    const g = kit.group(root, x, z, i * 1.3);
    kit.occupy(x, z, .35);
    if (i % 2) {
      kit.box(g, [.5, .4, .5], '#4a5370', [0, .2, 0], { mat: { metalness: .4, roughness: .45 } });
      kit.box(g, [.52, .05, .52], '#4dd9ff', [0, .3, 0], { mat: { emissive: '#4dd9ff', emissiveIntensity: 1 } });
    } else {
      kit.ico(g, .3, '#6c6a7c', [0, .22, 0], { detail: 0, scale: [1, .75, 1.1] });
      kit.cone(g, .06, .25, '#7be7ff', [.12, .4, .05], { seg: 5, mat: { emissive: '#7be7ff', emissiveIntensity: .8 } });
    }
  }
};
