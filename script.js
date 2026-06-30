(function() {
  'use strict';

  /* ─── NOTE DATA ──────────────────────────────────────────── */
  // 24 keys · chromatic C4 – B5
  const NOTES = [
    { id: '01', note: 'C4', freq: 261.63, type: 'white', label: 'C' },
    { id: '02', note: 'C#4', freq: 277.18, type: 'black', label: 'C#' },
    { id: '03', note: 'D4', freq: 293.66, type: 'white', label: 'D' },
    { id: '04', note: 'D#4', freq: 311.13, type: 'black', label: 'D#' },
    { id: '05', note: 'E4', freq: 329.63, type: 'white', label: 'E' },
    { id: '06', note: 'F4', freq: 349.23, type: 'white', label: 'F' },
    { id: '07', note: 'F#4', freq: 369.99, type: 'black', label: 'F#' },
    { id: '08', note: 'G4', freq: 392.00, type: 'white', label: 'G' },
    { id: '09', note: 'G#4', freq: 415.30, type: 'black', label: 'G#' },
    { id: '10', note: 'A4', freq: 440.00, type: 'white', label: 'A' },
    { id: '11', note: 'A#4', freq: 466.16, type: 'black', label: 'A#' },
    { id: '12', note: 'B4', freq: 493.88, type: 'white', label: 'B' },
    { id: '13', note: 'C5', freq: 523.25, type: 'white', label: 'C' },
    { id: '14', note: 'C#5', freq: 554.37, type: 'black', label: 'C#' },
    { id: '15', note: 'D5', freq: 587.33, type: 'white', label: 'D' },
    { id: '16', note: 'D#5', freq: 622.25, type: 'black', label: 'D#' },
    { id: '17', note: 'E5', freq: 659.25, type: 'white', label: 'E' },
    { id: '18', note: 'F5', freq: 698.46, type: 'white', label: 'F' },
    { id: '19', note: 'F#5', freq: 739.99, type: 'black', label: 'F#' },
    { id: '20', note: 'G5', freq: 783.99, type: 'white', label: 'G' },
    { id: '21', note: 'G#5', freq: 830.61, type: 'black', label: 'G#' },
    { id: '22', note: 'A5', freq: 880.00, type: 'white', label: 'A' },
    { id: '23', note: 'A#5', freq: 932.33, type: 'black', label: 'A#' },
    { id: '24', note: 'B5', freq: 987.77, type: 'white', label: 'B' }
  ];

  /* ─── KEYBOARD MAPPING ──────────────────────────────────── */
  const KEYMAP = {
    'a': 0, 'w': 1, 's': 2, 'e': 3,
    'd': 4, 'f': 5, 't': 6, 'g': 7,
    'y': 8, 'h': 9, 'u': 10, 'j': 11,
    'k': 12, 'o': 13, 'l': 14, 'p': 15,
    ';': 16, "'": 17, 'z': 18, 'x': 19,
    'c': 20, 'v': 21, 'b': 22, 'n': 23
  };

  /* ─── DOM REFS ──────────────────────────────────────────── */
  const pianoEl = document.getElementById('piano');
  const keyEls = {};

  /* ─── AUDIO ENGINE ──────────────────────────────────────── */
  let audioCtx = null;

  function getCtx() {
    if (!audioCtx) {
      audioCtx = new(window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  const activeNotes = {};

  function playNote(index) {
    const data = NOTES[index];
    if (!data) return;

    stopNote(index);

    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = data.freq;
      osc.detune.value = (Math.random() - 0.5) * 1.2;

      const now = ctx.currentTime;
      const attack = 0.012;
      const release = 0.75;

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.32, now + attack);
      gain.gain.setValueAtTime(0.32, now + attack + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + release);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + release + 0.06);

      const el = keyEls[data.id];
      if (el) {
        el.classList.add('active');
        setTimeout(() => el.classList.remove('active'), release * 1000 + 50);
      }

      activeNotes[index] = {
        osc,
        gain,
        timeout: setTimeout(() => { delete activeNotes[index]; }, (release + 0.06) * 1000 + 50)
      };

    } catch (err) {
      // silently fail – no audio context
    }
  }

  function stopNote(index) {
    const entry = activeNotes[index];
    if (!entry) return;
    const { osc, gain, timeout } = entry;
    try {
      const ctx = getCtx();
      gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      setTimeout(() => { try { osc.stop(); } catch (_) {} }, 50);
    } catch (_) {}
    clearTimeout(timeout);
    delete activeNotes[index];
    const data = NOTES[index];
    if (data) {
      const el = keyEls[data.id];
      if (el) el.classList.remove('active');
    }
  }

  function stopAll() {
    for (const idx in activeNotes) {
      stopNote(Number(idx));
    }
  }

  /* ─── BUILD PIANO ────────────────────────────────────────── */
  function buildPiano() {
    pianoEl.innerHTML = '';
    NOTES.forEach((data, index) => {
      const li = document.createElement('li');
      li.className = `key key-${data.type}`;
      li.dataset.id = data.id;
      li.dataset.index = index;

      // note label
      const lbl = document.createElement('span');
      lbl.className = 'label';
      lbl.textContent = data.label;
      li.appendChild(lbl);

      // keyboard shortcut badge
      const badge = document.createElement('span');
      badge.className = 'badge';
      const shortcut = Object.keys(KEYMAP).find(k => KEYMAP[k] === index);
      badge.textContent = shortcut || '';
      li.appendChild(badge);

      // events
      li.addEventListener('mousedown', (e) => {
        e.preventDefault();
        playNote(index);
      });

      li.addEventListener('touchstart', (e) => {
        e.preventDefault();
        playNote(index);
      }, { passive: false });

      pianoEl.appendChild(li);
      keyEls[data.id] = li;
    });
  }

  /* ─── KEYBOARD SUPPORT ──────────────────────────────────── */
  const pressed = new Set();

  function onKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const key = e.key.toLowerCase();
    if (['control', 'shift', 'alt', 'meta', 'tab', 'escape'].includes(key)) return;

    const idx = KEYMAP[key];
    if (idx !== undefined && !pressed.has(key)) {
      e.preventDefault();
      pressed.add(key);
      playNote(idx);
    }
  }

  function onKeyUp(e) {
    const key = e.key.toLowerCase();
    if (['control', 'shift', 'alt', 'meta', 'tab', 'escape'].includes(key)) return;
    const idx = KEYMAP[key];
    if (idx !== undefined) {
      e.preventDefault();
      pressed.delete(key);
      const data = NOTES[idx];
      if (data) {
        const el = keyEls[data.id];
        if (el) {
          setTimeout(() => {
            if (!pressed.has(key)) {
              el.classList.remove('active');
            }
          }, 80);
        }
      }
    }
  }

  /* ─── RESUME AUDIO CONTEXT ────────────────────────────── */
  function resumeAudio() {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  }
  document.addEventListener('click', resumeAudio);
  document.addEventListener('touchstart', resumeAudio);
  document.addEventListener('keydown', resumeAudio);

  /* ─── CLEANUP ───────────────────────────────────────────── */
  window.addEventListener('beforeunload', () => {
    stopAll();
    if (audioCtx) {
      audioCtx.close().catch(() => {});
    }
  });

  /* ─── INIT ──────────────────────────────────────────────── */
  buildPiano();

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  console.log('🎹 Piano ready – 24 keys');
})();