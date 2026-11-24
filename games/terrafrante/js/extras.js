'use strict';
// Terrafrante - estensioni del giocatore: armi (mischia, archi, magia, lancio), rampini, strumenti, aure degli arredi
(function (TF) {
  const TS = TF.TS, TILES = TF.TILES, ITEMS = TF.ITEMS, P = TF.Physics, C = TF.Combat, Pl = TF.Player.prototype;
  const S = () => TF.Sprites;

  TF.resetStores = (G) => { G.stores = { piggy: { x: -1, y: -1, slots: new Array(20).fill(null) }, safe: { x: -1, y: -1, slots: new Array(20).fill(null) } }; };

  // ---------------- attacco con l'oggetto in mano ----------------
  Pl.attack = function (G, it, aimDir, toolOnly) {
    if (this.useT > 0 || (this.swing && !this.swing.mineOnly)) return;
    const m = G.input.mouse, inv = G.inv, F = (n) => this.fx[n] || 0;
    this.facing = aimDir;
    const sx = this.cx, sy = this.y + 10, ang = Math.atan2(m.wy - sy, m.wx - sx);
    const spd = Math.max(6, Math.round(it.spd * (1 - Math.min(0.5, F('atkspd')))));
    const crit = 0.06 + F('crit') + (it.crit || 0);
    const status = { slow: !!it.slow || F('frostHit') > 0, poison: !!it.poison || F('poisonHit') > 0, burn: !!it.burn || F('burnHit') > 0, lifesteal: (it.lifesteal || 0) + F('vamp'), pen: it.pen || 0 };
    const aim = Math.atan2(m.wy - sy, (m.wx - sx) * aimDir);

    if (it.type === 'sword' || toolOnly) {
      this.useT = spd;
      this.swing = { t: spd, dur: spd, angle: -1.5, hit: new Set(), item: it, icon: S().icon(it.id), rot: Math.PI / 4, melee: true, len: it.len || 22, scale: it.scale || 1, crit, stab: it.style === 'stab', aimRel: TF.clamp(Math.atan2(m.wy - sy, Math.abs(m.wx - sx)), -1.2, 1.2), status, kb: (it.kb || 0) * (1 + F('knock')) };
      G.audio.play('swing');
      if (it.wave) { const sp = 7; C.proj({ kind: 'wave', x: sx + Math.cos(ang) * 12, y: sy + Math.sin(ang) * 12, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, dmg: it.dmg * it.wave * (1 + F('melee')), kb: 3, life: 40, pierce: 4, w: 10, h: 14, col: it.col[0], trail: it.col[0], crit, slow: status.slow, burn: status.burn, poison: status.poison }); }
      if (it.sproj) C.proj({ kind: it.sproj, col: it.col[0], x: sx + Math.cos(ang) * 12, y: sy + Math.sin(ang) * 12, vx: Math.cos(ang) * 8, vy: Math.sin(ang) * 8, dmg: it.dmg * (it.sdmg || 0.6) * (1 + F('melee')), kb: 2, life: 60, pierce: it.spierce || 1, w: 8, h: 8, trail: it.col[0], crit, slow: status.slow, burn: status.burn, poison: status.poison });
    } else if (it.type === 'bow') {
      const af = it.af || 'arrow';
      const ammo = inv.slots.find((s) => s && ITEMS[s.id].type === 'ammo' && (ITEMS[s.id].af || 'arrow') === af);
      if (!ammo) { this.say(G, 'Servono ' + TF.AMMO_NAME[af]); return; }
      const ai = ITEMS[ammo.id];
      if (Math.random() >= F('ammoSave')) inv.remove(ammo.id, 1);
      this.useT = spd; this.swing = { t: Math.min(spd, 14), dur: 14, angle: aim, icon: S().icon(it.id), rot: Math.PI / 4 + 0.5, aim: true };
      const n = it.multi || 1, dmg = (it.dmg + ai.dmg) * (1 + F('ranged')), kind = ai.pk || (af === 'bolt' ? 'bolt' : af === 'dart' ? 'dart' : 'arrow');
      for (let i = 0; i < n; i++) {
        const a = ang + (n > 1 ? (i - (n - 1) / 2) * (it.spread || 0.14) : 0) + (it.inacc ? (Math.random() - 0.5) * it.inacc : 0);
        C.proj({ kind, col: ai.tip, x: sx, y: sy, vx: Math.cos(a) * it.vel, vy: Math.sin(a) * it.vel, dmg, kb: it.kb, life: it.life || 100, grav: it.grav === undefined ? 0.07 : it.grav, pierce: (it.pierce || 1) + (ai.pierce || 0), w: 6, h: 6, crit,
          slow: ai.slow || it.slow || status.slow, poison: ai.poison || it.poison || status.poison, burn: ai.burn || it.burn || status.burn, explode: ai.explode, homing: ai.homing || it.homing, trail: ai.trail || it.trail, lifesteal: status.lifesteal });
      }
      G.audio.play('bow');
    } else if (it.type === 'staff') {
      const cost = Math.max(1, Math.round(it.mana * (1 - Math.min(0.6, F('manaCost')))));
      if (this.mana < cost) { this.say(G, 'Mana insufficiente'); return; }
      this.mana -= cost; this.manaDelay = 50;
      this.useT = spd; this.swing = { t: Math.min(spd, 14), dur: 14, angle: aim, icon: S().icon(it.id), rot: Math.PI / 4 + 0.4, aim: true };
      const k = it.proj, base = TF.SPELLS[k] || {}, o0 = Object.assign({}, base);
      for (const key of ['sp', 'life', 'homing', 'pierce', 'explode', 'slow', 'poison', 'burn', 'grav', 'ghost', 'big', 'trail']) if (it[key] !== undefined) o0[key] = it[key];
      const n = it.multi || 1, dmg = it.dmg * (1 + F('magic')), sp = o0.sp || 7;
      const shoot = (x, y, a, spv) => {
        const o = { kind: k, col: it.pcol, x, y, vx: Math.cos(a) * (spv || sp), vy: Math.sin(a) * (spv || sp), dmg, kb: it.kb, life: o0.life || 70, trail: o0.trail || it.pcol || '#ff9a3c', w: 8, h: 8, crit, lifesteal: status.lifesteal,
          slow: !!o0.slow || status.slow, poison: !!o0.poison || status.poison, burn: !!o0.burn || status.burn, pierce: o0.pierce || 1, grav: o0.grav || 0, ghost: !!o0.ghost, big: !!o0.big };
        if (o0.homing) o.homing = o0.homing; if (o0.explode) o.explode = o0.explode;
        return C.proj(o);
      };
      if (it.sky) { for (let i = 0; i < n; i++) { const q = shoot(m.wx + (Math.random() - 0.5) * it.sky, m.wy - 230 - Math.random() * 60, Math.PI / 2 + (Math.random() - 0.5) * 0.06, 8); q.ghost = true; q.life = 60; } }
      else if (it.ring) { for (let i = 0; i < it.ring; i++) shoot(sx, sy, ang + (i / it.ring) * Math.PI * 2); }
      else for (let i = 0; i < n; i++) { const a = ang + (n > 1 ? (i - (n - 1) / 2) * (it.spread || 0.2) : 0); shoot(sx + Math.cos(a) * 10, sy + Math.sin(a) * 10, a); }
      G.audio.play('magic');
    } else if (it.type === 'thrown') {
      if (it.ret && C.projectiles.some((q) => q.ret && q.icon === it.id)) return;
      this.useT = spd; this.swing = { t: Math.min(spd, 12), dur: 12, angle: aim, aim: true, rot: Math.PI / 4 };
      const n = it.multi || 1, dmg = it.dmg * (1 + F('ranged'));
      for (let i = 0; i < n; i++) {
        const a = ang + (n > 1 ? (i - (n - 1) / 2) * 0.12 : 0), vel = it.vel || 8;
        const q = { kind: 'item', icon: it.id, x: sx, y: sy, vx: Math.cos(a) * vel, vy: Math.sin(a) * vel, dmg, kb: it.kb, life: it.life || 90, grav: it.grav === undefined ? 0.12 : it.grav, pierce: it.pierce || 1, w: 8, h: 8, spin: true, crit, slow: status.slow, poison: status.poison, burn: status.burn, pen: it.pen, trail: it.trail };
        if (it.boom) { q.kind = 'bomb'; q.vy -= 1.2; q.fuse = it.fuse || 90; q.contact = !!it.contact; q.r = it.boom; q.tiles = it.tiles || 0; q.pow = it.pow || 55; q.col = it.col[0]; q.pierce = 1; q.life = 99999; q.kb = it.kb === undefined ? 4 : it.kb; }
        if (it.ret) { q.ret = true; q.out = it.out || 26; q.pierce = 99; q.ghost = true; q.life = 260; q.grav = 0; }
        C.proj(q);
      }
      G.audio.play('swing');
      if (!it.ret) inv.consumeSel(1);
    }
  };

  // ---------------- aggiornamento del colpo in mischia ----------------
  Pl.updateSwing = function (G) {
    const s = this.swing;
    if (s.mineOnly) s.angle = TF.lerp(-1.5, 0.9, 1 - s.t / s.dur);
    if (!s.melee) return;
    const p = 1 - s.t / s.dur;
    if (s.stab) { s.angle = s.aimRel; s.off = Math.sin(p * Math.PI) * 9; } else s.angle = TF.lerp(-1.6, 1.0, p);
    const it = s.item, len = s.len + 4 + (s.off || 0), sx = this.cx, sy = this.y + 10, f = this.facing;
    const dmg = it.dmg * (1 + (this.fx.melee || 0));
    for (const e of G.enemies) {
      if (e.dead || s.hit.has(e)) continue;
      for (const d of [0.4, 0.7, 1]) {
        const px = sx + f * Math.cos(s.angle) * len * d, py = sy + Math.sin(s.angle) * len * d;
        if (TF.hits(e, px - 4, py - 4, 8, 8)) { s.hit.add(e); C.hitEnemy(G, e, dmg, f, s.kb, { slow: s.status.slow, poison: s.status.poison, burn: s.status.burn, lifesteal: s.status.lifesteal, pen: s.status.pen, crit: s.crit }); break; }
      }
    }
  };

  // ---------------- strumenti (tasto sinistro) ----------------
  Pl.useTool = function (G, it, tx, ty) {
    if (this.useT > 0) return;
    const inv = G.inv, w = G.world;
    if (it.mirror) { if (this.recallT > 0) return; this.recallT = it.cast || 70; this.useT = it.cast || 70; G.audio.play('magic'); return; }
    if (it.store) { G.ui.openChest(G.stores[it.store]); G.audio.play('chest'); return; }
    if (it.bucket) {
      if (!this.inReach(tx, ty)) { this.say(G, 'Troppo lontano'); return; }
      const lt = w.liqType(tx, ty), ll = w.liqLevel(tx, ty), ts = TILES[w.get(tx, ty)];
      if (it.bucket === 'empty') {
        if (!lt || ll < 6) { this.say(G, 'Serve un liquido abbondante'); return; }
        w.setLiq(tx, ty, 0, 0); inv.slots[inv.sel] = { id: lt === 2 ? 'bucket_lava' : 'bucket_water', n: 1 };
      } else {
        if (ts.solid) { this.say(G, 'Qui non si può versare'); return; }
        const type = it.bucket === 'lava' ? 2 : 1;
        if (lt && lt !== type) { w.setLiq(tx, ty, 0, 0); w.set(tx, ty, TF.T.OBSIDIAN); } else w.setLiq(tx, ty, type, 15);
        inv.slots[inv.sel] = { id: 'bucket_empty', n: 1 };
      }
      inv.touch(); this.useT = 12; G.audio.play('place'); G.particles.burst(tx * TS + 8, ty * TS + 8, it.bucket === 'lava' ? '#ff7a3c' : '#4aa8e8', 8, 1.5); return;
    }
    // strumenti con tempo di ricarica
    const cdt = (this.toolCd || (this.toolCd = {}));
    if ((cdt[it.id] || 0) > this.animT) { this.say(G, 'In ricarica: ' + Math.ceil((cdt[it.id] - this.animT) / 60) + ' s'); return; }
    if (it.useBuff) { this.buffs[it.useBuff[0]] = Math.max(this.buffs[it.useBuff[0]] || 0, it.useBuff[1] * 60); cdt[it.id] = this.animT + (it.cd || 60); this.useT = 20; G.audio.play('powerup'); G.particles.burst(this.cx, this.cy, it.col[0], 14, 2); return; }
    if (it.healSelf) {
      if (this.hp >= this.maxhp) { this.say(G, 'Vita già al massimo'); return; }
      if (this.mana < it.mana) { this.say(G, 'Mana insufficiente'); return; }
      this.mana -= it.mana; this.manaDelay = 60; this.heal(it.healSelf); cdt[it.id] = this.animT + (it.cd || 90); this.useT = 20; G.audio.play('magic'); G.particles.burst(this.cx, this.cy, '#6af08a', 12, 1.6); return;
    }
  };

  // ---------------- rampino ----------------
  Pl.useHook = function (G, it) {
    if (this.hook) { this.hook = null; return; }
    const m = G.input.mouse, sx = this.cx, sy = this.y + 10, a = Math.atan2(m.wy - sy, m.wx - sx);
    this.hook = { x: sx, y: sy, vx: Math.cos(a) * 14, vy: Math.sin(a) * 14, state: 'fly', it, t: 0, stuckT: 0 };
    G.audio.play('swing');
  };
  Pl.updateHook = function (G, jumpPress) {
    const h = this.hook, it = h.it, w = G.world; h.t++;
    if (jumpPress && h.state === 'stuck') { this.hook = null; this.vy = Math.min(this.vy, -4.5); this.jumpHeld = 20; return; }
    if (G.ui.blocking) { this.hook = null; return; }
    if (h.state === 'fly') {
      for (let i = 0; i < 2; i++) { h.x += h.vx / 2; h.y += h.vy / 2; if (P.solidAtPx(w, h.x, h.y)) { h.state = 'stuck'; G.audio.play('thunk'); break; } }
      if (h.state === 'fly' && (Math.hypot(h.x - this.cx, h.y - this.cy) > (it.range || 12) * TS || h.t > 40)) this.hook = null;
      return;
    }
    if (!P.solidAtPx(w, h.x, h.y)) { this.hook = null; return; }
    const dx = h.x - this.cx, dy = h.y - (this.y + 10), d = Math.hypot(dx, dy);
    if (d < 14) { this.hook = null; return; }
    const sp = it.pull || 8; this.vx = dx / d * sp; this.vy = dy / d * sp; this.fallStart = -1;
    h.stuckT++; if (h.stuckT > 20 && h.px !== undefined && Math.hypot(this.x - h.px, this.y - h.py) < 0.3) this.hook = null;
    if (h.stuckT > 300) this.hook = null;
    h.px = this.x; h.py = this.y;
  };

  // ---------------- specchio: ritorno al punto di rinascita ----------------
  Pl.updateRecall = function (G) {
    this.recallT--;
    if (this.sinceHurt < 2 || this.dead) { this.recallT = 0; return; }
    if (this.animT % 2 === 0) G.particles.spark(this.cx + (Math.random() - 0.5) * 14, this.y + Math.random() * this.h, '#8fe6ff');
    if (this.recallT <= 0) {
      const w = G.world, s = this.spawn || w.spawn; let ty = s.y;
      while (ty > 2 && P.rectSolid(w, s.x * TS, ty * TS - this.h, this.w, this.h)) ty--;
      while (ty < w.h - 3 && !P.rectSolid(w, s.x * TS, ty * TS + 1, this.w, 1)) ty++;
      G.particles.burst(this.cx, this.cy, '#8fe6ff', 18, 2);
      this.place(G, s.x, ty - 1); this.y = ty * TS - this.h; this.hook = null; G.camera.snap(this);
      G.particles.burst(this.cx, this.cy, '#8fe6ff', 18, 2); G.audio.play('magic'); G.ui.toast('Sei tornato a casa');
    }
  };

  // ---------------- aure degli arredi vicini ----------------
  Pl.scanAuras = function (G) {
    const w = G.world, tx = Math.floor(this.cx / TS), ty = Math.floor(this.cy / TS), found = {};
    for (let y = ty - 7; y <= ty + 7; y++) for (let x = tx - 9; x <= tx + 9; x++) { const a = TILES[w.get(x, y)].aura; if (a) found[a] = true; }
    this.auras = found;
  };

  // ---------------- individuazione dei minerali (pozione del cercatore) ----------------
  const ORE = new Uint8Array(TILES.length);
  for (const t of TILES) if (/ORE$/.test(t.key) || t.key === 'CRYSTAL' || t.key === 'LIFE_CRYSTAL' || t.key === 'MANA_CRYSTAL') ORE[t.id] = 1;
  Pl.spelunk = function (G) {
    const w = G.world, tx = Math.floor(this.cx / TS), ty = Math.floor(this.cy / TS); let n = 0;
    for (let y = ty - 20; y <= ty + 20 && n < 10; y++) for (let x = tx - 28; x <= tx + 28 && n < 10; x++) {
      const id = w.get(x, y); if (ORE[id]) { G.particles.spark(x * TS + 8, y * TS + 8, '#ffe27a'); G.particles.spark(x * TS + 8, y * TS + 6, '#ffffff'); n++; }
    }
  };

  // ---------------- effetti passivi ogni frame (inferno, ecc.) ----------------
  const baseUpdate = Pl.update;
  Pl.update = function (G) {
    baseUpdate.call(this, G);
    if (this.dead) return;
    if (this.fx.inferno && this.animT % 30 === 0) {
      for (const e of G.enemies) if (!e.dead && Math.hypot(e.x + e.w / 2 - this.cx, e.y + e.h / 2 - this.cy) < 70) C.hitEnemy(G, e, 6, 0, 0, { burn: true, crit: 0 });
      G.particles.burst(this.cx, this.cy + 4, '#ff7a3c', 4, 1.2);
    }
  };

  // ---------------- bottino extra dei nemici: gemme ----------------
  TF.EXTRA_DROPS = (G, e, cx, cy) => {
    const ty = cy / TS, deep = ty > G.world.surf[Math.floor(cx / TS)] + 14;
    if (Math.random() < (deep ? 0.07 : 0.025) * (1 + (G.player.fx.loot || 0))) {
      const gems = ['gem_topaz', 'gem_amethyst', 'gem_sapphire', 'gem_emerald', 'gem_ruby', 'gem_diamond'];
      const i = Math.min(gems.length - 1, Math.floor(Math.random() * (deep ? 6 : 3.5)));
      C.drop(G, gems[i], 1, cx, cy);
    }
    if (e.type === 'skeleton' && Math.random() < 0.08) C.drop(G, Math.random() < 0.5 ? 'knife_copper' : 'dart', 3 + ((Math.random() * 5) | 0), cx, cy);
    if (e.type === 'zombie' && Math.random() < 0.05) C.drop(G, 'bomb', 1 + ((Math.random() * 2) | 0), cx, cy);
    if (e.type === 'spider' && Math.random() < 0.08) C.drop(G, 'dart_poison', 3 + ((Math.random() * 4) | 0), cx, cy);
    if (e.type === 'slime' && Math.random() < 0.04) C.drop(G, 'bucket_empty', 1, cx, cy);
  };
})(window.TF);
