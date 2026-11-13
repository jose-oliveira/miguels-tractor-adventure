// Background music (one track per farm), pick/plant effects and random win jingles.
const BASE = `${import.meta.env.BASE_URL}assets/audio/`;
const MUSIC_VOLUME = .35;
const WIN_VOLUME = .8;

let music = null;
let musicWorld = null;
let unlocked = false;
let win = null;

const fade = (audio, to, ms, done) => {
  clearInterval(audio.fadeTimer);
  const from = audio.volume, steps = Math.max(1, Math.round(ms / 40));
  let i = 0;
  audio.fadeTimer = setInterval(() => {
    i += 1;
    audio.volume = Math.min(1, Math.max(0, from + (to - from) * (i / steps)));
    if (i >= steps) { clearInterval(audio.fadeTimer); done?.(); }
  }, 40);
};

const startMusic = () => {
  if (!music || win || !unlocked) return;
  music.volume = 0;
  music.play().then(() => fade(music, MUSIC_VOLUME, 1000)).catch(() => { unlocked = false; });
};

// Browsers only allow audio after the first interaction (a controller press counts too).
const unlock = () => {
  if (unlocked) return;
  unlocked = true;
  startMusic();
};
export { unlock as unlockAudio };
addEventListener('pointerdown', unlock);
addEventListener('keydown', unlock);

// Only switches tracks when the farm changes. The old track stops before the new one starts.
export function setMusicWorld(world) {
  if (world === musicWorld) return;
  musicWorld = world;
  if (music) { clearInterval(music.fadeTimer); music.pause(); }
  music = new Audio(`${BASE}farm${world}.mp3`);
  music.loop = true;
  startMusic();
}

export function playEffect(name) {
  const effect = new Audio(`${BASE}${name}.mp3`);
  effect.volume = .9;
  effect.play().catch(() => {});
}

// Finale song; the background music stays silent until it ends.
export function playFinale() {
  if (win) { win.onended = null; win.pause(); }
  if (music) { clearInterval(music.fadeTimer); music.pause(); }
  const track = new Audio(`${BASE}win3.mp3`);
  track.volume = WIN_VOLUME;
  track.onended = () => { if (win === track) { win = null; startMusic(); } };
  win = track;
  track.play().catch(() => { if (win === track) { win = null; startMusic(); } });
}

// Stops the win track and resumes the background music from where it was paused.
export function stopWin() {
  if (!win) return;
  win.onended = null;
  win.pause();
  win = null;
  startMusic();
}
