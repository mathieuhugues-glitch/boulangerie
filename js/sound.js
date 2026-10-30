/* La boulangerie - tiny WebAudio sound effects (no audio files, works offline) */
(function () {
  'use strict';
  let ctx = null, muted = localStorage.getItem('boul.muted') === '1';
  function ac() { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } } if (ctx.state === 'suspended') ctx.resume(); return ctx; }
  function tone(freq, dur, type, vol, delay, slide) {
    if (muted) return; const c = ac(); if (!c) return;
    const t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.02); g.gain.setValueAtTime(vol || 0.2, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, delay) {
    if (muted) return; const c = ac(); if (!c) return;
    const t = c.currentTime + (delay || 0), n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; f.type = 'bandpass'; f.frequency.value = 1800; g.gain.value = vol || 0.15;
    s.connect(f); f.connect(g); g.connect(c.destination); s.start(t);
  }
  window.BSound = {
    unlock() { ac(); },
    get muted() { return muted; },
    setMuted(m) { muted = m; localStorage.setItem('boul.muted', m ? '1' : '0'); },
    pick() { tone(600, 0.06, 'sine', 0.15, 0, 800); },
    clack() { noise(0.06, 0.25); tone(880, 0.07, 'triangle', 0.2, 0.02); tone(1320, 0.12, 'triangle', 0.18, 0.08); },
    boing() { tone(260, 0.3, 'sine', 0.18, 0, 140); },
    toot() { [0, 0.45].forEach(d => { tone(392, 0.38, 'sawtooth', 0.07, d); tone(494, 0.38, 'sawtooth', 0.06, d); tone(587, 0.38, 'triangle', 0.08, d); }); },
    chug() { for (let i = 0; i < 6; i++) noise(0.08, 0.12 - i * 0.015, 0.9 + i * 0.2); },
    star() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.15, 'sine', 0.16, i * 0.07)); },
    fanfare() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, 'triangle', 0.22, i * 0.14)); tone(1047, 0.8, 'triangle', 0.2, 0.6); tone(784, 0.8, 'triangle', 0.15, 0.6); }
  };
})();
(function () { // extra: coin jingle
  const S = window.BSound; let ctx = null;
  S.coin = function () { if (S.muted) return; try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); } catch (e) { return; }
    [1568, 2093].forEach((f, i) => { const t = ctx.currentTime + i * 0.06, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'square'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.2); }); };
  S.bell = function () { if (S.muted) return; try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    [1318, 1046].forEach((f, i) => { const t = ctx.currentTime + i * 0.18, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.65); }); };
})();
