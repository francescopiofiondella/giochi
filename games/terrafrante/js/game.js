'use strict';
// Terrafrante - orchestrazione: stato, input, ciclo giorno/notte, loop a passo fisso
(function (TF) {
  const TS = TF.TS, T = TF.T;
  // ---- impostazioni persistenti ----
  TF.settings = { sfx: 0.6, music: 0.4, zoom: 0, light: 1, particles: true, shake: true, fps: false };
  try { Object.assign(TF.settings, JSON.parse(localStorage.getItem('terrafrante.settings') || '{}')); } catch (e) { /* ignora */ }
  TF.saveSettings = () => { try { localStorage.setItem('terrafrante.settings', JSON.stringify(TF.settings)); } catch (e) { /* ignora */ } };
  const SIZES = { s: [1800, 640], m: [2400, 760], l: [3200, 900] };
  const DAY_SECONDS = 600; // durata di un giorno completo
  const smooth = TF.smooth;

  class Game {
    constructor() {
      this.state = 'menu'; this.world = null; this.name = ''; this.tick = 0; this.fps = 0; this.playtime = 0; this.autosave = 0;
      this.player = new TF.Player(); this.inv = new TF.Inventory(); this.enemies = []; this.enemyMgr = new TF.EnemyMgr();
      this.particles = new TF.Particles(); this.camera = new TF.Camera(); this.lighting = new TF.Lighting(); this.audio = new TF.Audio(); this.ui = new TF.UI(); this.Combat = TF.Combat;
      this.clock = { h: 8, day: 1, night: false, daylight: 1, daylightN: 1, tint: [4, 8, 28] }; this.progress = { bosses: {} };
      this.input = { keys: new Set(), mouse: { x: 0, y: 0, wx: 0, wy: 0, left: false, right: false } };
      this.acc = 0; this.last = 0; this.scale = 3; this.fcount = 0; this.ft = 0;
    }
    init() {
      TF.Sprites.init();
      this.canvas = document.getElementById('game'); this.renderer = new TF.Renderer(this.canvas);
      this.ui.init(this); this.bindInput(); this.resize(); window.addEventListener('resize', () => this.resize());
      this.updateClock(); this.ui.mainMenu();
      this.last = performance.now(); requestAnimationFrame((t) => this.frame(t));
    }
    resize() {
      const s = TF.settings.zoom || TF.clamp(Math.floor(innerHeight / 360), 2, 4); this.scale = s;
      const w = Math.ceil(innerWidth / s), h = Math.ceil(innerHeight / s);
      this.renderer.resize(w, h); this.camera.resize(w, h); this.canvas.style.width = w * s + 'px'; this.canvas.style.height = h * s + 'px'; this.lighting.dirty = true;
    }
    // ---------- input ----------
    bindInput() {
      const k = this.input.keys, m = this.input.mouse, G = this, cv = this.canvas;
      window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        const c = e.code;
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(c)) e.preventDefault();
        if (c === 'F5') { e.preventDefault(); if (G.state === 'play') G.save().then((ok) => G.ui.toast(ok ? 'Salvataggio rapido eseguito' : 'Salvataggio non riuscito: il browser blocca la memoria locale')); return; }
        G.audio.init(); G.audio.resume();
        if (e.repeat) { k.add(c); return; }
        k.add(c);
        if (c === 'Escape') {
          if (G.ui.invOpen) G.ui.closeInventory(); else if (G.state === 'play' && !G.ui.overlay) G.pauseGame(); else if (G.state === 'pause') G.resume();
        } else if (c === 'KeyE' && G.state === 'play' && !G.ui.overlay) { if (G.ui.invOpen) G.ui.closeInventory(); else G.ui.openInventory(); }
        else if (/^Digit[0-9]$/.test(c) && G.state === 'play') { const n = +c.slice(5); G.selectSlot(n === 0 ? 9 : n - 1); }
      });
      window.addEventListener('keyup', (e) => k.delete(e.code));
      window.addEventListener('blur', () => { k.clear(); m.left = m.right = false; });
      cv.addEventListener('mousemove', (e) => { m.x = e.clientX / G.scale; m.y = e.clientY / G.scale; });
      cv.addEventListener('mousedown', (e) => { G.audio.init(); G.audio.resume(); m.x = e.clientX / G.scale; m.y = e.clientY / G.scale; if (e.button === 0) { m.left = true; m.leftPulse = true; } else if (e.button === 2) { m.right = true; m.rightPulse = true; } });
      window.addEventListener('mouseup', (e) => { if (e.button === 0) { m.left = false; G.player.leftLock = false; } else if (e.button === 2) m.right = false; });
      cv.addEventListener('contextmenu', (e) => e.preventDefault());
      window.addEventListener('wheel', (e) => { if (G.state !== 'play' || G.ui.invOpen || G.ui.overlay) return; G.selectSlot((G.inv.sel + (e.deltaY > 0 ? 1 : 9)) % 10); }, { passive: true });
      document.addEventListener('visibilitychange', () => { if (document.hidden && G.state === 'play') { G.pauseGame(); G.save(); } });
    }
    selectSlot(i) { this.inv.sel = i; this.inv.touch(); this.ui.itemLabel(this.inv.selected()); this.player.mine = null; this.player.leftLock = true; }
    // ---------- stato di gioco ----------
    resetState() {
      this.player.reset(); this.inv = new TF.Inventory(); TF.resetStores(this); this.enemies.length = 0; TF.Combat.reset(); this.particles.clear(); this.renderer.reset(); this.lighting.dirty = true;
      this.clock.h = 8; this.clock.day = 1; this.progress = { bosses: {} }; this.playtime = 0; this.ui.G = this; this.ui.invOpen = false; this.ui.chest = null;
    }
    startKit() {
      const i = this.inv; for (const [id, n] of [['sword_copper', 1], ['pick_copper', 1], ['axe_copper', 1], ['hammer_copper', 1], ['torch', 12]]) i.add(id, n);
      i.sel = 1;
    }
    async newGame(o) {
      this.state = 'loading'; this.ui.loading(0, 'Preparazione…'); await TF.yieldUI();
      try {
        const [w, h] = SIZES[o.size] || SIZES.m, world = new TF.World(w, h, o.seed), t0 = performance.now();
        const ctx = await TF.Terrain.generate(world, (p, m) => this.ui.loading(p, m));
        await TF.Structures.build(ctx, (p, m) => this.ui.loading(p, m));
        this.resetState(); this.world = world; this.name = o.name; this.camera.world = world; this.startKit();
        const p = this.player; p.place(this, world.spawn.x, world.spawn.y); p.recalc(this); p.hp = p.maxhp; p.mana = p.maxmana; this.camera.snap(p);
        console.log('Mondo generato in ' + Math.round(performance.now() - t0) + ' ms (' + w + 'x' + h + ', seme ' + o.seed + ')');
        this.enterPlay(); await this.save();
        this.ui.toast('Benvenuto! Premi E per l\'inventario, ESC per la pausa');
      } catch (e) { console.error(e); this.state = 'menu'; this.ui.mainMenu(); this.ui.toast('Errore nella generazione: ' + e.message); }
    }
    async loadGame() {
      this.state = 'loading'; this.ui.loading(0.1, 'Carico la partita…'); await TF.yieldUI();
      const d = await TF.Save.read();
      if (!d) { this.state = 'menu'; this.ui.mainMenu(); this.ui.toast('Nessun salvataggio trovato'); return; }
      try {
        this.resetState(); TF.Save.unpack(this, d); this.camera.world = this.world; const p = this.player; p.recalc(this); this.camera.snap(p);
        if (p.hp <= 0) p.hp = p.maxhp; this.enterPlay(); this.ui.toast('Partita caricata');
      } catch (e) { console.error(e); this.state = 'menu'; this.ui.mainMenu(); this.ui.toast('Salvataggio non valido'); }
    }
    enterPlay() { this.state = 'play'; this.ui.hideOverlay(); this.ui.buildHotbar(); this.ui.hud.classList.remove('hidden'); this.updateClock(); this.lighting.dirty = true; this.autosave = 0; this.ui.itemLabel(this.inv.selected()); }
    async save() { if (!this.world) return false; return TF.Save.write(TF.Save.pack(this)); }
    pauseGame() { if (this.state !== 'play') return; this.state = 'pause'; this.input.keys.clear(); this.input.mouse.left = this.input.mouse.right = false; this.ui.pause(); }
    resume() { if (this.state !== 'pause') return; this.state = 'play'; this.ui.hideOverlay(); }
    async toMenu() { this.ui.toast('Salvataggio…'); await this.save(); this.state = 'menu'; this.world = null; this.enemies.length = 0; this.ui.hud.classList.add('hidden'); this.ui.mainMenu(); }

    // ---------- ciclo giorno/notte ----------
    updateClock() {
      const c = this.clock, h = c.h;
      let d;
      if (h < 5) d = 0; else if (h < 7) d = smooth((h - 5) / 2); else if (h < 17) d = 1; else if (h < 19.5) d = 1 - smooth((h - 17) / 2.5); else d = 0;
      c.daylightN = d; c.daylight = 0.3 + 0.7 * d; c.night = h >= 19.2 || h < 5.2;
      const sunset = Math.max(0, 1 - Math.abs(h - 18.3) / 1.6) + Math.max(0, 1 - Math.abs(h - 5.9) / 1.3);
      const t = Math.min(1, sunset), a = [4, 8, 28], b = [60, 22, 22]; c.tint = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t].map(Math.round);
    }
    // ---------- aggiornamento fisso a 60 Hz ----------
    update() {
      this.tick++;
      const w = this.world, p = this.player, m = this.input.mouse, cam = this.camera;
      m.wx = cam.x + m.x; m.wy = cam.y + m.y;
      this.playtime += 1 / 60;
      const c = this.clock; c.h += 24 / (DAY_SECONDS * 60); if (c.h >= 24) { c.h -= 24; c.day++; this.ui.toast('Giorno ' + c.day); } this.updateClock();
      p.update(this); cam.follow(p);
      this.enemyMgr.update(this); TF.Combat.updateProjectiles(this); TF.Combat.updateDrops(this); TF.Combat.updateTexts();
      if (this.tick % 3 === 0) { const tx = Math.floor(p.cx / TS), ty = Math.floor(p.cy / TS); w.stepLiquids(tx - 72, ty - 50, tx + 72, ty + 50); }
      this.particles.update(); if (this.tick % 3 === 0) this.particles.ambient(this);
      this.audio.update(this);
      if (this.tick % 5 === 0) this.lighting.dirty = true;
      if ((this.autosave += 1 / 60) > 150) { this.autosave = 0; this.save(); }
    }
    frame(now) {
      requestAnimationFrame((t) => this.frame(t));
      let dt = now - this.last; this.last = now; if (dt > 100) dt = 100;
      this.fcount++; this.ft += dt; if (this.ft >= 1000) { this.fps = this.fcount; this.fcount = 0; this.ft = 0; }
      try {
        if (this.state === 'play' || this.state === 'pause') {
          if (this.state === 'play') { this.acc += dt; let n = 0; while (this.acc >= 16.667 && n < 5) { this.update(); this.acc -= 16.667; n++; } if (n === 5) this.acc = 0; }
          this.renderer.draw(this);
        } else if (this.state === 'menu' || this.state === 'loading') { this.renderer.g.fillStyle = '#0a0d1c'; this.renderer.g.fillRect(0, 0, this.camera.viewW, this.camera.viewH); }
        this.ui.update();
      } catch (e) { console.error(e); (window.__errors = window.__errors || []).push(String(e && e.stack || e)); }
    }
  }
  TF.Game = Game;
  window.addEventListener('error', (e) => { (window.__errors = window.__errors || []).push(e.message + ' @' + e.filename + ':' + e.lineno); });
  window.addEventListener('DOMContentLoaded', () => { TF.game = new Game(); TF.game.init(); });
})(window.TF);
