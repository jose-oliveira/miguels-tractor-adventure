// Xbox / standard-mapping controller support: D-pad or left stick moves focus between buttons,
// A presses the focused button, B goes back, X undoes, Y opens the mission board,
// Menu runs the program and LB / RB switch between MAIN, F1 and F2.
import { unlockAudio } from './audio.js';

const BTN = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, MENU: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };
const DEADZONE = .55;
const FIRST_REPEAT = 380;
const REPEAT = 130;

const held = {};
let lastRect = null;

const isVisible = (el) => {
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return false;
  const cx = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2));
  const cy = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
  const top = document.elementFromPoint(cx, cy);
  return !!top && (el === top || el.contains(top) || top.contains(el));
};

// A success popup, finale or the mission board takes over navigation while open.
const scope = () => {
  const modal = document.querySelector('.finale-layer, .success-layer, .modal-layer:not(.hidden)');
  return modal || document;
};

const candidates = () => [...scope().querySelectorAll('button:not(:disabled), [tabindex="0"]')].filter(isVisible);
const center = (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

const focusEl = (el) => {
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  lastRect = el.getBoundingClientRect();
};

const focusNearestToLast = () => {
  const list = candidates();
  if (!list.length) return;
  if (!lastRect) { focusEl(document.querySelector('.success-next') || document.querySelector('#runBtn:not(:disabled)') || list[0]); return; }
  const from = center(lastRect);
  const best = list.map((el) => { const c = center(el.getBoundingClientRect()); return [el, Math.hypot(c.x - from.x, c.y - from.y)]; }).sort((a, b) => a[1] - b[1])[0];
  focusEl(best[0]);
};

const move = (dir) => {
  const active = document.activeElement;
  if (!active || active === document.body || !scope().contains?.(active) && scope() !== document) { focusNearestToLast(); return; }
  const from = center(active.getBoundingClientRect());
  let best = null;
  for (const el of candidates()) {
    if (el === active) continue;
    const c = center(el.getBoundingClientRect());
    const dx = c.x - from.x, dy = c.y - from.y;
    const along = dir === 'left' ? -dx : dir === 'right' ? dx : dir === 'up' ? -dy : dy;
    const across = dir === 'left' || dir === 'right' ? Math.abs(dy) : Math.abs(dx);
    if (along <= 4 || across > along * 2.5 + 40) continue;
    const score = along + across * 2.2;
    if (!best || score < best.score) best = { el, score };
  }
  if (best) focusEl(best.el);
};

const click = (selector) => { const el = document.querySelector(selector); if (el && !el.disabled && isVisible(el)) el.click(); };

export const controllerGuide = () => `<div class="pad-guide" aria-hidden="true">
<ul class="pad-keys"><li data-pad="DPAD"><b>D-pad</b> Move</li><li data-pad="A"><b class="a">A</b> Select</li><li data-pad="B"><b class="b">B</b> Forward</li><li data-pad="X"><b class="x">X</b> Pick up</li><li data-pad="Y"><b class="y">Y</b> Plant</li><li data-pad="RT"><b>RT</b> Turn right</li><li data-pad="LT"><b>LT</b> Turn left</li><li data-pad="MENU"><b>☰</b> Run</li><li data-pad="LBRB"><b>LB RB</b> Tabs</li></ul></div>`;

const lightPad = (state) => {
  document.querySelectorAll('[data-pad]').forEach((el) => el.classList.toggle('on', el.dataset.pad === 'DPAD' ? !!(state.UP || state.DOWN || state.LEFT || state.RIGHT) : el.dataset.pad === 'LBRB' ? !!(state.LB || state.RB) : !!state[el.dataset.pad]));
};

const addBlock = (cmd) => {
  if (document.querySelector('.finale-layer, .success-layer, .modal-layer:not(.hidden)')) return false;
  const el = document.querySelector(`[data-add="${cmd}"]`);
  if (!el || el.disabled || !isVisible(el)) return false;
  el.click();
  return true;
};

const pressed = (name) => {
  const active = document.activeElement;
  const hasFocus = active && active !== document.body;
  switch (name) {
    case 'A':
      if (!hasFocus) focusNearestToLast(); else if (active.click) { lastRect = active.getBoundingClientRect(); active.click(); }
      break;
    case 'B':
      if (document.querySelector('.finale-layer, .success-layer')) click('.success-next');
      else if (document.querySelector('.modal-layer:not(.hidden) #closeBoard')) click('#closeBoard');
      else addBlock('forward');
      break;
    case 'X': addBlock('pickup'); break;
    case 'Y': addBlock('plant') || addBlock('fix'); break;
    case 'RT': addBlock('right'); break;
    case 'LT': addBlock('left'); break;
    case 'MENU': click('#runBtn'); break;
    case 'LB': case 'RB': {
      const tabs = [...document.querySelectorAll('[data-tab]')];
      const i = tabs.findIndex((t) => t.classList.contains('active'));
      if (tabs.length && i >= 0) { const next = tabs[(i + (name === 'RB' ? 1 : tabs.length - 1)) % tabs.length]; if (!next.disabled) next.click(); }
      break;
    }
    default: move(name.toLowerCase());
  }
};

const poll = () => {
  const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  const now = performance.now();
  for (const pad of pads) {
    const down = (i) => !!pad.buttons[i]?.pressed;
    const [lx = 0, ly = 0] = pad.axes;
    const state = {
      A: down(BTN.A), B: down(BTN.B), X: down(BTN.X), Y: down(BTN.Y), LB: down(BTN.LB), RB: down(BTN.RB), LT: down(BTN.LT), RT: down(BTN.RT), MENU: down(BTN.MENU),
      UP: down(BTN.UP) || ly < -DEADZONE, DOWN: down(BTN.DOWN) || ly > DEADZONE,
      LEFT: down(BTN.LEFT) || lx < -DEADZONE, RIGHT: down(BTN.RIGHT) || lx > DEADZONE
    };
    lightPad(state);
    for (const [name, on] of Object.entries(state)) {
      const key = `${pad.index}:${name}`;
      if (!on) { delete held[key]; continue; }
      const direction = ['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(name);
      if (!held[key]) {
        held[key] = { next: now + FIRST_REPEAT };
        document.body.classList.add('using-pad');
        unlockAudio();
        pressed(name);
      } else if (direction && now >= held[key].next) {
        held[key].next = now + REPEAT;
        pressed(name);
      }
    }
  }
  requestAnimationFrame(poll);
};

export function initGamepad() {
  addEventListener('pointerdown', () => document.body.classList.remove('using-pad'));
  addEventListener('keydown', () => document.body.classList.remove('using-pad'));
  requestAnimationFrame(poll);
}
