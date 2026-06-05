const MUSIC_VOLUME = 0.2;
const FADE_STEP_MS = 50;

// Tracks use HTML5 streaming audio (new Audio) — never decoded into memory.
// Setting preload='none' prevents eager buffering before play() is called.
// Clearing src on stop releases any buffered data back to the browser.
// Voiceovers should use the same pattern (not Phaser's load.audio).
const TRACKS = {
  intro:     'assets/music/Intro theme.mp3',
  offseason: 'assets/music/Offseason theme.mp3',
  battle:    'assets/music/Hot7Y battle theme.mp3',
  victory:   'assets/music/victory.mp3',
  gameover:  'assets/music/game over.mp3',
};

let _current = null;
let _currentKey = null;
let _enabled = true;
let _fadeTimer = null;
let _vo = null;

export function playMusic(key, { loop = true } = {}) {
  if (_currentKey === key) return;
  _stopImmediate();
  const audio = new Audio();
  audio.preload = 'none';
  audio.loop = loop;
  audio.volume = _enabled ? MUSIC_VOLUME : 0;
  audio.src = TRACKS[key];
  audio.play().catch(() => {});
  _current = audio;
  _currentKey = key;
}

export function stopMusic() {
  _stopImmediate();
}

// Fades out current track over durationMs, then optionally plays nextKey.
export function fadeOutMusic(durationMs = 1500, nextKey = null) {
  if (!_current) {
    if (nextKey) playMusic(nextKey);
    return;
  }
  const audio = _current;
  const startVol = audio.volume;
  const steps = durationMs / FADE_STEP_MS;
  const decrement = startVol / steps;
  _current = null;
  _currentKey = null;
  clearInterval(_fadeTimer);
  _fadeTimer = setInterval(() => {
    if (audio.volume > decrement) {
      audio.volume = Math.max(0, audio.volume - decrement);
    } else {
      audio.pause();
      audio.src = '';
      clearInterval(_fadeTimer);
      if (nextKey) playMusic(nextKey);
    }
  }, FADE_STEP_MS);
}

// Plays a voiceover clip independently of the music track.
// Stops any currently playing VO first.
export function playVO(src) {
  stopVO();
  const audio = new Audio();
  audio.preload = 'none';
  audio.volume = _enabled ? 1.0 : 0;
  audio.src = src;
  audio.play().catch(() => {});
  _vo = audio;
}

export function stopVO() {
  if (_vo) {
    _vo.pause();
    _vo.src = '';
    _vo = null;
  }
}

export function setMusicEnabled(enabled) {
  _enabled = enabled;
  if (_current) _current.volume = enabled ? MUSIC_VOLUME : 0;
  if (_vo) _vo.volume = enabled ? 1.0 : 0;
}

function _stopImmediate() {
  clearInterval(_fadeTimer);
  if (_current) {
    _current.pause();
    _current.src = '';
    _current = null;
    _currentKey = null;
  }
}
