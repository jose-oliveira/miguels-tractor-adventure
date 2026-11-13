import * as THREE from 'three';
import { createTractor } from './game/tractorModel.js';
import { playEffect, playFinale, stopWin } from './audio.js';
// Success dialog: celebration picture on the left, congratulations on the right,
// an automatic countdown to the next mission and a button to skip the wait.
const CONFETTI = ['#ef9b4a', '#e2372c', '#4aa3d8', '#f3d54b', '#5aa04c', '#b46bd6'];

// The real 3D tractors, one per farm in each farm's colour, parade across a transparent canvas.
const PARADE_COLORS = ['#c94e3d', '#4e9a57', '#4285b8', '#e2b43c', '#7b5cd6'];

function startParade(host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = false;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#ffffff', '#8a7fb0', 1.6));
  const sun = new THREE.DirectionalLight('#ffffff', 2.2);
  sun.position.set(-4, 8, 6);
  scene.add(sun);
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 100);
  camera.position.set(0, 3.2, 17);
  camera.lookAt(0, 1.3, 0);

  const SPACING = 6.8, LANE = SPACING * PARADE_COLORS.length;
  const tractors = PARADE_COLORS.map((color, i) => {
    const tractor = createTractor();
    tractor.traverse((o) => { if (o.userData.tractorPaint) o.material.color.set(color); });
    const space = i === PARADE_COLORS.length - 1;
    tractor.userData.classic.forEach((part) => { part.visible = !space; });
    tractor.userData.spaceship.visible = space;
    tractor.rotation.y = -Math.PI / 2 + .35;
    tractor.scale.setScalar(1.8);
    scene.add(tractor);
    return { tractor, offset: i * SPACING, wheels: [] };
  });
  tractors.forEach((t) => t.tractor.traverse((o) => { if (o.userData.isWheel) t.wheels.push(o); }));

  const resize = () => {
    const w = host.clientWidth || innerWidth, h = host.clientHeight || innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  addEventListener('resize', resize);
  const clock = new THREE.Clock();
  let frame = 0;
  const loop = () => {
    frame = requestAnimationFrame(loop);
    const t = clock.getElapsedTime();
    const halfWidth = Math.tan(THREE.MathUtils.degToRad(15)) * camera.aspect * camera.position.z;
    tractors.forEach(({ tractor, offset, wheels }) => {
      const x = ((t * 2.4 + offset) % LANE) - LANE / 2;
      tractor.position.set(x * (halfWidth * 2.4 / LANE), .12 + Math.abs(Math.sin(t * 7 + offset)) * .04, 0);
      wheels.forEach((w) => { w.rotation.x -= .08; });
    });
    renderer.render(scene, camera);
  };
  loop();
  return () => { cancelAnimationFrame(frame); removeEventListener('resize', resize); renderer.dispose(); };
}

function showFinale({ message, nextLabel, onNext, seconds }) {
  const layer = document.createElement('div');
  layer.className = 'finale-layer';
  layer.innerHTML = `<div class="finale-bg"></div>
    <div class="finale-top"><span class="eyebrow">YOU DID IT!</span><h2>Congratulations!</h2><p class="finale-text"></p></div>
    <div class="parade-road"></div>
    <div class="finale-footer"><span class="success-timer"><i></i></span><button class="run-btn success-next" type="button"></button></div>`;
  layer.querySelector('.finale-text').textContent = message;
  const button = layer.querySelector('.success-next');
  const bar = layer.querySelector('.success-timer i');
  document.body.appendChild(layer);
  playFinale();
  const stopParade = startParade(layer.querySelector('.parade-road'));
  button.focus();
  let finished = false, remaining = seconds;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearInterval(timer);
    stopParade();
    layer.remove();
    stopWin();
    onNext();
  };
  const paint = () => { button.textContent = `${nextLabel} (${remaining}s) →`; bar.style.width = `${(remaining / seconds) * 100}%`; };
  paint();
  const timer = setInterval(() => { remaining -= 1; if (remaining <= 0) finish(); else paint(); }, 1000);
  button.onclick = finish;
}

export function showSuccess({ level, message, nextLabel, onNext, seconds = 10, finale = false }) {
  if (finale) return showFinale({ message, nextLabel, onNext, seconds: 30 });
  const layer = document.createElement('div');
  layer.className = 'modal-layer success-layer';
  layer.innerHTML = `<section class="success-modal" role="dialog" aria-modal="true" aria-labelledby="successTitle">
    <div class="success-art"><img src="${level.character.successImage}" alt="${level.character.name} celebrating"></div>
    <div class="success-body">
      <span class="eyebrow">MISSION COMPLETE</span>
      <h2 id="successTitle">Congratulations!</h2>
      <p class="success-mission">${level.title}</p>
      <p class="success-text"></p>
      <div class="success-footer"><span class="success-timer"><i></i></span><button class="run-btn success-next" type="button"></button></div>
    </div></section>`;
  layer.querySelector('.success-text').textContent = message;
  const button = layer.querySelector('.success-next');
  const bar = layer.querySelector('.success-timer i');
  document.body.appendChild(layer);
  playEffect('plant');
  button.focus();
  let finished = false, remaining = seconds;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearInterval(timer);
    layer.remove();
    stopWin();
    onNext();
  };
  const paint = () => { button.textContent = `${nextLabel} (${remaining}s) →`; bar.style.width = `${(remaining / seconds) * 100}%`; };
  paint();
  const timer = setInterval(() => { remaining -= 1; if (remaining <= 0) finish(); else paint(); }, 1000);
  button.onclick = finish;
}
