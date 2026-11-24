'use strict';
// Terrafrante - audio procedurale (opzionale: se non disponibile il gioco parte comunque)
(function (TF) {
  const SFX = {
    hit: { f: 220, f2: 90, d: 0.09, w: 'square', v: 0.12 }, hurt: { f: 300, f2: 110, d: 0.2, w: 'sawtooth', v: 0.15 },
    boom: { n: 1, f: 700, d: 0.4, v: 0.25 }, thunk: { f: 150, f2: 70, d: 0.08, w: 'triangle', v: 0.14 },
    pick: { f: 660, f2: 990, d: 0.08, w: 'sine', v: 0.1 }, jump: { f: 260, f2: 520, d: 0.1, w: 'square', v: 0.05 },
    land: { n: 1, f: 300, d: 0.06, v: 0.06 }, swing: { n: 1, f: 1800, d: 0.09, v: 0.06 }, bow: { f: 180, f2: 90, d: 0.12, w: 'triangle', v: 0.14 },
    magic: { f: 500, f2: 1100, d: 0.18, w: 'sine', v: 0.12 }, dig: { n: 1, f: 500, d: 0.05, v: 0.05 }, break: { n: 1, f: 380, d: 0.1, v: 0.1 },
    place: { f: 170, f2: 120, d: 0.07, w: 'triangle', v: 0.14 }, door: { f: 120, f2: 80, d: 0.14, w: 'triangle', v: 0.12 },
    chest: { f: 300, f2: 450, d: 0.14, w: 'triangle', v: 0.12 }, drink: { f: 300, f2: 700, d: 0.2, w: 'sine', v: 0.1 },
    powerup: { f: 400, f2: 1200, d: 0.5, w: 'triangle', v: 0.14 }, roar: { f: 110, f2: 40, d: 0.7, w: 'sawtooth', v: 0.2 },
    sonic: { f: 800, f2: 200, d: 0.4, w: 'sine', v: 0.16 }, die: { f: 260, f2: 60, d: 0.25, w: 'square', v: 0.1 },
    bossdie: { f: 160, f2: 30, d: 1.4, w: 'sawtooth', v: 0.22 }, death: { f: 200, f2: 40, d: 0.9, w: 'sawtooth', v: 0.2 },
    root: { n: 1, f: 200, d: 0.18, v: 0.12 }, ui: { f: 600, f2: 700, d: 0.05, w: 'square', v: 0.05 },
  };
  const SCALES = { day: [0, 2, 4, 7, 9], night: [0, 3, 5, 7, 10], deep: [0, 1, 5, 6, 10], boss: [0, 3, 5, 6, 7, 10] };
  class Audio {
    constructor() { this.ctx = null; this.last = {}; this.mood = 'day'; this.beat = 0; this.ok = true; this.timer = 0; }
    init() {
      if (this.ctx || !this.ok) return;
      try {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) { this.ok = false; return; }
        this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
        this.sfxG = this.ctx.createGain(); this.musG = this.ctx.createGain(); this.sfxG.connect(this.master); this.musG.connect(this.master);
        const len = this.ctx.sampleRate * 0.5, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; this.noise = buf; this.applyVol();
      } catch (e) { this.ok = false; this.ctx = null; }
    }
    applyVol() { if (!this.ctx) return; this.sfxG.gain.value = TF.settings.sfx; this.musG.gain.value = TF.settings.music * 0.5; }
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); }
    play(name, vol) {
      if (!this.ctx || TF.settings.sfx <= 0) return;
      const s = SFX[name]; if (!s) return; const now = this.ctx.currentTime;
      if (this.last[name] && now - this.last[name] < 0.04) return; this.last[name] = now;
      try {
        const g = this.ctx.createGain(), v = s.v * (vol || 1);
        g.gain.setValueAtTime(v, now); g.gain.exponentialRampToValueAtTime(0.0001, now + s.d); g.connect(this.sfxG);
        let src;
        if (s.n) { src = this.ctx.createBufferSource(); src.buffer = this.noise; const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = s.f; src.connect(f); f.connect(g); }
        else { src = this.ctx.createOscillator(); src.type = s.w; src.frequency.setValueAtTime(s.f, now); src.frequency.exponentialRampToValueAtTime(Math.max(20, s.f2), now + s.d); src.connect(g); }
        src.start(now); src.stop(now + s.d + 0.02);
      } catch (e) { /* ignora */ }
    }
    note(freq, dur, type, vol) {
      const now = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(0.0001, now); g.gain.linearRampToValueAtTime(vol, now + dur * 0.2); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.connect(g); g.connect(this.musG); o.start(now); o.stop(now + dur + 0.05);
    }
    // musica generativa leggera in base all'atmosfera
    update(G) {
      if (!this.ctx || TF.settings.music <= 0 || G.state !== 'play') return;
      if (++this.timer < (this.mood === 'boss' ? 14 : 30)) return; this.timer = 0;
      const boss = G.enemies.some((e) => e.boss && !e.dead), bz = G.world.biomeAt(G.player.cx / TF.TS | 0, G.player.cy / TF.TS | 0);
      this.mood = boss ? 'boss' : bz.id >= 8 || bz.key === 'dungeon' ? 'deep' : G.clock.night ? 'night' : 'day';
      const sc = SCALES[this.mood], root = this.mood === 'deep' ? 98 : this.mood === 'boss' ? 110 : 196;
      this.beat++;
      try {
        if (this.beat % 4 === 0 || this.mood === 'boss') { const n = sc[(Math.random() * sc.length) | 0], f = root * Math.pow(2, n / 12) * (Math.random() < 0.3 ? 2 : 1); this.note(f, this.mood === 'boss' ? 0.3 : 1.6, this.mood === 'day' ? 'triangle' : 'sine', this.mood === 'boss' ? 0.1 : 0.07); }
        if (this.beat % 16 === 0) this.note(root / 2, 4, 'sine', 0.08);
      } catch (e) { /* ignora */ }
    }
  }
  TF.Audio = Audio;
})(window.TF);
