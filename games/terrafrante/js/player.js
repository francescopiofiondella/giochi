'use strict';
// Terrafrante - giocatore: movimento, stato, equipaggiamento, scavo, costruzione, armi
(function (TF) {
  const TS = TF.TS, T = TF.T, TILES = TF.TILES, ITEMS = TF.ITEMS, P = TF.Physics, C = TF.Combat;
  const REACH = 6.5;

  class Player {
    constructor() {
      this.w = 12; this.h = 24; this.reset();
    }
    reset() {
      this.x = 0; this.y = 0; this.vx = 0; this.vy = 0; this.facing = 1; this.onGround = false; this.animT = 0;
      this.maxhp = 100; this.hp = 100; this.maxmana = 40; this.mana = 40; this.manaDelay = 0;
      this.invT = 0; this.flash = 0; this.dead = false; this.deathT = 0; this.sinceHurt = 999;
      this.buffs = {}; for (const k in TF.BUFFS) this.buffs[k] = 0; this.efx = {}; this.baseDef = 0; this.auras = {}; this.bsig = ''; this.hook = null; this.sit = null; this.recallT = 0; this.auraT = 0; this.wingCol = null;
      this.fx = {}; this.defense = 0; this.look = {}; this.lookVer = -1;
      this.swing = null; this.useT = 0; this.mine = null; this.fallStart = -1; this.jumpHeld = 0; this.jumpPrev = false;
      this.dj = false; this.wingT = 0; this.flying = false; this.coyote = 0; this.breath = 600; this.hazT = 0; this.regenAcc = 0;
      this.spawn = null; this.pickRange = 56; this.light = 150; this.depthTile = 0; this.rmbLock = false; this.msgCd = 0;
      this.stats = { kills: 0, blocks: 0, deaths: 0, bosses: {} };
    }
    get cx() { return this.x + this.w / 2; }
    get cy() { return this.y + this.h / 2; }

    place(G, tx, ty) { this.x = tx * TS + 2; this.y = ty * TS - this.h + TS; this.vx = this.vy = 0; this.fallStart = -1; }

    // ---- equipaggiamento -> statistiche ----
    recalc(G) {
      const inv = G.inv, fx = {}, add = TF.addFx; let def = 0; const sets = {}, look = {};
      for (const k of ['head', 'body', 'legs']) {
        const s = inv.eq[k]; if (!s) continue; const it = ITEMS[s.id];
        def += it.def; look[k] = it.col; sets[it.set] = (sets[it.set] || 0) + 1; this.setB = it.setBonus;
        if (it.fx) add(fx, it.fx);
        if (sets[it.set] === 3) { def += it.setBonus; if (it.setFx) add(fx, it.setFx); }
      }
      this.wingCol = null;
      for (const k of ['acc0', 'acc1', 'acc2']) { const s = inv.eq[k]; if (!s) continue; const it = ITEMS[s.id]; add(fx, it.fx); if (it.fx.wings && it.wc) this.wingCol = it.wc; }
      this.efx = fx; this.baseDef = def; this.look = look; this.lookVer = inv.ver; this.bsig = null; this.mergeBuffs();
    }
    // somma equipaggiamento + pozioni attive + aure degli arredi vicini
    mergeBuffs() {
      const fx = Object.assign({}, this.efx), add = TF.addFx;
      for (const k in this.buffs) if (this.buffs[k] > 0) { const b = TF.BUFFS[k]; if (b && b.fx) add(fx, b.fx); }
      for (const k in this.auras) { const a = TF.AURAS[k]; if (a) add(fx, a.fx); }
      this.fx = fx; this.defense = this.baseDef + (fx.def || 0); this.light = 150 + (fx.light || 0); this.pickRange = 56 + (fx.magnet || 0);
      this.maxmana = 40 + (this.maxmanaBonus || 0) + (fx.mana || 0); this.mana = Math.min(this.mana, this.maxmana);
    }
    buffSig() { let s = ''; for (const k in this.buffs) if (this.buffs[k] > 0) s += k + ','; for (const k in this.auras) s += '@' + k; return s; }
    totalDef() { return this.defense; }

    heal(n, quiet) { const a = Math.min(n, this.maxhp - this.hp); if (a <= 0) return; this.hp += a; if (!quiet) C.text(this.cx, this.y - 6, '+' + a, '#6af08a'); }
    hazardHit(G, dmg) {
      if (this.invT > 0 || this.dead) return;
      this.hp -= dmg; this.invT = 30; this.flash = 30; this.sinceHurt = 0; C.text(this.cx, this.y - 6, dmg, '#ff7a3a'); G.audio.play('hurt');
      if (this.hp <= 0) this.die(G);
    }
    die(G) {
      if (this.dead) return; this.dead = true; this.hook = null; this.sit = null; this.recallT = 0; this.hp = 0; this.deathT = 0; this.stats.deaths++;
      G.particles.burst(this.cx, this.cy, '#c03030', 24, 3); G.audio.play('death');
      G.enemyMgr.bossRetreat(G); G.ui.showDeath(true);
    }
    respawn(G) {
      const s = this.spawn || G.world.spawn; let ty = s.y;
      while (ty > 2 && P.rectSolid(G.world, s.x * TS, ty * TS - this.h, this.w, this.h)) ty--;
      while (ty < G.world.h - 3 && !P.rectSolid(G.world, s.x * TS, ty * TS + 1, this.w, 1)) ty++;
      this.place(G, s.x, ty - 1); this.y = ty * TS - this.h;
      this.dead = false; this.hp = this.maxhp; this.mana = this.maxmana; this.invT = 120; this.flash = 0; this.breath = 600;
      for (const k in this.buffs) this.buffs[k] = 0;
      G.camera.snap(this); G.ui.showDeath(false);
    }

    // ---- aggiornamento ----
    update(G) {
      if (this.lookVer !== G.inv.ver) this.recalc(G);
      const inp = G.input, k = inp.keys, w = G.world;
      if (this.dead) { this.deathT++; this.vy = Math.min(this.vy + 0.4, 10); P.move(this, w, {}); return; }
      if (this.invT > 0) this.invT--; if (this.flash > 0) this.flash--; if (this.useT > 0) this.useT--; if (this.msgCd > 0) this.msgCd--;
      this.sinceHurt++;
      for (const b in this.buffs) if (this.buffs[b] > 0) this.buffs[b]--;
      if (this.auraT-- <= 0) { this.auraT = 20; this.scanAuras(G); }
      const bsg = this.buffSig(); if (bsg !== this.bsig) { this.bsig = bsg; this.mergeBuffs(); }
      if (this.buffs.hunter > 0 && this.animT % 18 === 0) this.spelunk(G);
      let left = k.has('KeyA') || k.has('ArrowLeft'), right = k.has('KeyD') || k.has('ArrowRight');
      let up = k.has('Space') || k.has('KeyW') || k.has('ArrowUp'); const down = k.has('KeyS') || k.has('ArrowDown');
      if (this.sit) { const st = TILES[w.get(this.sit.tx, this.sit.ty)]; if (!st || st.interact !== 'sit' || left || right || up) { this.sit = null; this.jumpPrev = true; } else { left = right = up = false; this.vx = 0; } }
      const env = P.env(this, w);
      const inWater = env.water > 0.45, inLava = env.lava > 0.3, climbing = env.climb && !inWater;
      const spd = (2.5 * (1 + (this.fx.speed || 0))) * (inWater ? (this.fx.swim ? 0.92 : 0.62) : 1) * (env.web ? 0.35 : 1) * (inLava ? 0.5 : 1);
      const accel = this.onGround ? 0.28 : 0.16;
      const ui = G.ui.blocking;
      let dirx = 0; if (!ui) { dirx = (right ? 1 : 0) - (left ? 1 : 0); }
      if (dirx) { this.vx += dirx * accel; if (Math.abs(this.vx) > spd) this.vx = TF.lerp(this.vx, dirx * spd, 0.35); if (!this.swing) this.facing = dirx; }
      else this.vx *= this.onGround ? 0.78 : 0.94;
      if (Math.abs(this.vx) < 0.03) this.vx = 0;
      // salto / nuoto / scale / ali
      const jumpPress = up && !this.jumpPrev && !ui; this.jumpPrev = up; const wantUp = up && !ui;
      if (this.onGround) { this.coyote = 6; this.dj = this.fx.dj > 0; this.wingT = this.fx.wings; this.flying = false; } else if (this.coyote > 0) this.coyote--;
      this.flying = false;
      if (climbing && (wantUp || (down && !ui))) { this.vy = wantUp ? -2.1 : 2.1; this.fallStart = -1; }
      else if (inWater) {
        this.vy += 0.12; if (this.vy > 2.4) this.vy = 2.4;
        if (wantUp) this.vy = Math.max(this.vy - 0.5, -2.6);
        this.fallStart = -1;
      } else {
        let g = P.GRAV;
        if (this.vy < 0 && wantUp && this.jumpHeld < 18) { g *= 0.5; this.jumpHeld++; }
        if (climbing) { this.vy = Math.min(this.vy + 0.05, 1); } else this.vy = Math.min(this.vy + g, this.fx.slowFall && wantUp ? 2.2 : P.MAXFALL);
        if (env.web) this.vy = Math.min(this.vy, 1.2);
        if (jumpPress && (this.coyote > 0)) { this.vy = -(6.1 + (this.fx.jump || 0) * 0.6); this.coyote = 0; this.jumpHeld = 0; this.fallStart = -1; G.audio.play('jump'); }
        else if (jumpPress && this.dj && !this.onGround) { this.vy = -6.3; this.dj = false; this.jumpHeld = 20; G.particles.burst(this.cx, this.y + this.h, '#e8f4ff', 8, 1.4); G.audio.play('jump'); }
        else if (wantUp && this.fx.wings > 0 && !this.onGround && this.wingT > 0 && (this.vy > -0.5 || this.jumpHeld >= 18)) { this.vy = Math.max(this.vy - 0.62, -3.4); this.wingT--; this.flying = true; if (this.animT % 6 === 0) G.particles.spark(this.cx, this.y + 14, '#8a6bff'); }
      }
      if (this.onGround) this.jumpHeld = 0;
      this.drop = down && !ui;
      // lava e pericoli
      if (inLava && !this.fx.lavaImm) { this.hazT++; if (this.hazT % 20 === 1) this.hazardHit(G, 22); }
      else if (env.hurt) { this.hazT++; if (this.hazT % 20 === 1) this.hazardHit(G, env.hurt); }
      else this.hazT = 0;
      // respiro
      if (env.head && !this.fx.gills) { this.breath--; if (this.breath < 0) { this.breath = 0; if (this.animT % 25 === 0) this.hazardHit(G, 8); } } else this.breath = Math.min(600, this.breath + 12);
      if (this.hook) this.updateHook(G, jumpPress);
      // movimento fisico
      const landV = P.move(this, w, { step: dirx !== 0 && !this.swing });
      if (this.vy > 1 && !this.onGround && this.fallStart < 0) this.fallStart = this.y;
      if (this.onGround && this.fallStart >= 0) {
        const dist = (this.y - this.fallStart) / TS; this.fallStart = -1;
        if (dist > 16 && !inWater && landV > 5 && !this.fx.noFall) { const d = Math.round((dist - 16) * 5); this.hp -= d; this.flash = 20; this.invT = 20; C.text(this.cx, this.y - 6, d, '#ff7a3a'); G.audio.play('hurt'); G.camera.shake(5); if (this.hp <= 0) this.die(G); }
        else if (landV > 4) G.particles.burst(this.cx, this.y + this.h, '#a89880', 4, 0.8);
      }
      if (this.onGround && landV > 3) G.audio.play('land');
      this.animT++;
      // rigenerazione
      this.regenAcc += (this.sinceHurt > 240 ? 0.012 : 0.003) + (this.fx.regen || 0) / 60 + (this.sit ? 0.01 : 0);
      if (this.regenAcc >= 1) { const n = Math.floor(this.regenAcc); this.regenAcc -= n; this.heal(n, true); }
      if (this.manaDelay > 0) this.manaDelay--; else this.mana = Math.min(this.maxmana, this.mana + 0.16 + (this.fx.manaRegen || 0));
      if (this.swing) { this.swing.t--; if (this.swing.t <= 0) this.swing = null; else this.updateSwing(G); }
      if (this.recallT > 0) this.updateRecall(G);
      this.depthTile = Math.floor(this.cy / TS);
      if (!ui) this.updateUse(G); else { this.mine = null; }
    }

    // ---- strumenti ----
    findTool(inv, type) {
      const held = inv.selected(); if (held && ITEMS[held.id].type === type) return ITEMS[held.id];
      let best = null; for (const s of inv.slots) if (s) { const it = ITEMS[s.id]; if (it.type === type && (!best || it.power > best.power)) best = it; }
      return best;
    }
    cursorTile(G) { const m = G.input.mouse; return [Math.floor(m.wx / TS), Math.floor(m.wy / TS)]; }
    inReach(tx, ty) { const dx = tx * TS + 8 - this.cx, dy = ty * TS + 8 - this.cy; return Math.hypot(dx, dy) <= (REACH + (this.fx.reach || 0)) * TS; }
    say(G, msg) { if (this.msgCd <= 0) { G.ui.toast(msg); this.msgCd = 60; } }

    updateUse(G) {
      const m = G.input.mouse, inv = G.inv, w = G.world;
      const held = inv.selected(), it = held ? ITEMS[held.id] : null, [tx, ty] = this.cursorTile(G);
      const aimDir = m.wx < this.cx ? -1 : 1;
      const RB = m.right || m.rightPulse, LB = m.left || m.leftPulse; m.rightPulse = m.leftPulse = false;
      // --- tasto destro: interazione / piazzamento ---
      if (RB) {
        const id = w.get(tx, ty), t = TILES[id];
        if (!this.rmbLock && t.interact && this.inReach(tx, ty)) { this.interact(G, tx, ty); this.rmbLock = true; }
        else if (it && (it.type === 'block' || it.type === 'wall') && this.useT <= 0) { if (this.tryPlace(G, tx, ty, it)) this.useT = 6; }
        else if (!this.rmbLock && it && ['potion', 'perm', 'summon', 'food'].includes(it.type)) { this.consume(G, it); this.rmbLock = true; }
        else if (!this.rmbLock && t.station) { G.ui.openInventory(); this.rmbLock = true; }
      } else this.rmbLock = false;
      // --- tasto sinistro: attacco / scavo / uso ---
      if (!LB) { if (this.mine) this.mine = null; this.mineLock = false; return; }
      if (it && ['sword', 'bow', 'staff', 'thrown'].includes(it.type)) { this.mine = null; this.attack(G, it, aimDir); return; }
      if (it && ['potion', 'perm', 'summon', 'food'].includes(it.type)) { if (!this.leftLock) { this.consume(G, it); } this.leftLock = true; return; }
      if (it && it.type === 'tool') { this.mine = null; if (!this.leftLock) this.useTool(G, it, tx, ty); this.leftLock = true; return; }
      if (it && it.type === 'hook') { this.mine = null; if (!this.leftLock) this.useHook(G, it); this.leftLock = true; return; }
      this.leftLock = true;
      this.mineTarget(G, tx, ty, it, aimDir);
    }
    mineTarget(G, tx, ty, it, aimDir) {
      const w = G.world, id = w.get(tx, ty), t = TILES[id], reach = this.inReach(tx, ty);
      let type = null, wallId = 0;
      if (id !== 0 && !(t.liquid)) type = t.tool === 'any' ? 'any' : t.tool;
      else { wallId = w.getWall(tx, ty); if (wallId) type = 'hammer'; }
      if (!type || !reach) {
        this.mine = null;
        if (it && ['pick', 'axe', 'hammer'].includes(it.type)) this.attack(G, it, aimDir, true);
        return;
      }
      let tool, power;
      if (type === 'any') { const p = this.findTool(G.inv, 'pick'); tool = p; power = p ? p.power : 15; }
      else if (type === 'hammer') { tool = this.findTool(G.inv, 'hammer'); power = tool ? tool.power : 0; }
      else { tool = this.findTool(G.inv, type); power = tool ? tool.power : (type === 'axe' ? 12 : 12); }
      const hard = wallId ? 3 : t.hard, min = wallId ? 0 : t.min;
      if (!wallId && hard === Infinity) { this.mine = null; return; }
      if (power <= 0) { this.mine = null; this.say(G, 'Serve un martello per le pareti'); return; }
      if (power < min) { this.mine = null; this.say(G, 'Piccone troppo debole: serve potenza ' + min); return; }
      const key = tx + ',' + ty + (wallId ? 'w' : '');
      if (!this.mine || this.mine.key !== key) this.mine = { key, tx, ty, prog: 0, wall: wallId };
      const speed = (power * 0.1) * (1 + (this.fx.mine || 0));
      this.mine.prog += (speed / hard) / 60;
      // animazione del colpo
      if (!this.swing || this.swing.mineOnly) { if (!this.swing) { this.swing = { t: 16, dur: 16, angle: -1.2, mineOnly: true, icon: tool ? S().icon(tool.id) : null, rot: Math.PI / 4 }; this.facing = aimDir; } }
      if (this.animT % 8 === 0) { G.particles.chip(tx * TS + 8, ty * TS + 8, wallId ? TF.WALLS[wallId].c : (t.tx.b || '#888')); G.audio.play('dig', 0.5); }
      if (this.mine.prog >= 1) { if (wallId) this.breakWall(G, tx, ty); else this.breakTile(G, tx, ty); this.mine = null; }
    }
    // ---- rottura e piazzamento blocchi ----
    breakWall(G, tx, ty) {
      const w = G.world, wl = TF.WALLS[w.getWall(tx, ty)]; w.setWall(tx, ty, 0);
      C.drop(G, wl.itemId, 1, tx * TS + 8, ty * TS + 8); G.particles.chip(tx * TS + 8, ty * TS + 8, wl.c); this.stats.blocks++;
      if (TILES[w.get(tx, ty)].needsWall) this.removeTile(G, tx, ty, true);
    }
    breakTile(G, tx, ty) {
      const w = G.world, id = w.get(tx, ty), t = TILES[id];
      if (id === 0) return;
      if (t.interact === 'chest') {
        const ch = w.chestAt(tx, ty);
        if (ch && ch.slots.some(Boolean)) { this.say(G, 'Svuota prima lo scrigno'); return; }
        w.chests.delete(tx + ',' + ty);
      }
      const chain = (tid, dy) => { let y = ty; while (w.get(tx, y) === tid) { this.removeTile(G, tx, y, true); y += dy; } };
      if (t.key.startsWith('TRUNK')) { chain(id, -1); this.clearLeaves(G, tx, ty); this.afterBreak(G, tx, ty); return; }
      if (t.key === 'CACTUS') { chain(id, -1); this.afterBreak(G, tx, ty); return; }
      if (t.interact === 'door') { const o = id === T.DOOR_C ? T.DOOR_O : T.DOOR_C; for (const d of [-1, 1]) if (w.get(tx, ty + d) === id || w.get(tx, ty + d) === o) this.removeTile(G, tx, ty + d, true); }
      this.removeTile(G, tx, ty, true); this.afterBreak(G, tx, ty);
    }
    removeTile(G, tx, ty, drop) {
      const w = G.world, id = w.get(tx, ty), t = TILES[id]; if (id === 0) return;
      if (drop && t.drop) { const q = t.key === 'CACTUS' ? 1 : 1; C.drop(G, t.drop, q, tx * TS + 8, ty * TS + 8); }
      G.particles.chip(tx * TS + 8, ty * TS + 8, t.tx.b || (t.col && t.col[0]) || '#888'); G.audio.play('break', 0.6);
      w.set(tx, ty, 0); this.stats.blocks++;
    }
    afterBreak(G, tx, ty) { // decorazioni che perdono il supporto
      const w = G.world;
      let y = ty - 1; while (TILES[w.get(tx, y)].needsFloor && !this.supported(w, tx, y)) { this.removeTile(G, tx, y, true); y--; }
      y = ty + 1; while (TILES[w.get(tx, y)].needsCeil && !w.solid(tx, y - 1)) { this.removeTile(G, tx, y, true); y++; }
      for (const d of [-1, 1]) if (TILES[w.get(tx + d, ty)].needsFloor && !this.supported(w, tx + d, ty)) this.removeTile(G, tx + d, ty, true);
    }
    supported(w, x, y) { return w.solid(x, y + 1) || !!TILES[w.get(x, y + 1)].surface; }
    clearLeaves(G, tx, ty) {
      const w = G.world, LEAVES = [T.LEAF, T.PINE, T.JLEAF, T.SLEAF, T.CLEAF, T.VINE];
      let top = ty; while (TILES[w.get(tx, top - 1)].key.startsWith('TRUNK')) top--;
      for (let dy = -7; dy <= 6; dy++) for (let dx = -7; dx <= 7; dx++) { const x = tx + dx, y = top + dy; if (LEAVES.includes(w.get(x, y)) && y <= ty) w.set(x, y, 0); }
    }
    tryPlace(G, tx, ty, it) {
      const w = G.world; if (!this.inReach(tx, ty) || !w.inb(tx, ty)) return false;
      const cur = TILES[w.get(tx, ty)];
      const replace = (t) => t.id === 0 || (!t.solid && t.hard <= 0.5 && !t.interact && !t.station && !t.light);
      const near = (x, y) => w.get(x - 1, y) || w.get(x + 1, y) || w.get(x, y - 1) || w.get(x, y + 1) || w.getWall(x, y);
      if (it.type === 'wall') {
        if (w.getWall(tx, ty) || cur.solid) return false;
        if (!(near(tx, ty) || w.getWall(tx - 1, ty) || w.getWall(tx + 1, ty) || w.getWall(tx, ty - 1) || w.getWall(tx, ty + 1))) return false;
        w.setWall(tx, ty, it.wall); G.inv.consumeSel(1); G.audio.play('place'); return true;
      }
      const t = TILES[it.tile];
      if (!replace(cur)) return false;
      if (t.needsFloor && !this.supported(w, tx, ty)) { this.say(G, 'Va appoggiato su una superficie'); return false; }
      if (t.needsCeil && !w.solid(tx, ty - 1)) { this.say(G, 'Va appeso a un soffitto'); return false; }
      if (t.needsWall && !w.getWall(tx, ty)) { this.say(G, 'Va appeso a una parete'); return false; }
      if (!near(tx, ty)) return false;
      if (t.interact === 'door' && !replace(TILES[w.get(tx, ty - 1)])) return false;
      if (t.solid && !t.plat) {
        if (TF.rectsOverlap(tx * TS, ty * TS, TS, TS, this.x, this.y, this.w, this.h)) return false;
        for (const e of G.enemies) if (TF.rectsOverlap(tx * TS, ty * TS, TS, TS, e.x, e.y, e.w, e.h)) return false;
      }
      if (t.light > 0 && t.id !== T.TORCH && cur.id !== 0) return false;
      if (t.interact === 'chest') w.makeChest(tx, ty);
      w.set(tx, ty, it.tile); if (t.interact === 'door') w.set(tx, ty - 1, it.tile);
      G.inv.consumeSel(1); G.audio.play('place'); G.particles.chip(tx * TS + 8, ty * TS + 8, t.tx.b || '#aaa'); return true;
    }
    interact(G, tx, ty) {
      const w = G.world, id = w.get(tx, ty), t = TILES[id];
      if (t.interact === 'door') {
        const toOpen = id === T.DOOR_C, nid = toOpen ? T.DOOR_O : T.DOOR_C, ys = [ty];
        for (let y = ty - 1; TILES[w.get(tx, y)].interact === 'door'; y--) ys.push(y);
        for (let y = ty + 1; TILES[w.get(tx, y)].interact === 'door'; y++) ys.push(y);
        const top = Math.min(...ys), bot = Math.max(...ys);
        if (!toOpen && TF.rectsOverlap(tx * TS, top * TS, TS, (bot - top + 1) * TS, this.x, this.y, this.w, this.h)) { this.say(G, 'Qualcosa blocca la porta'); return; }
        for (const y of ys) w.set(tx, y, nid);
        G.audio.play('door');
      } else if (t.interact === 'chest') { G.ui.openChest(w.chestAt(tx, ty) || w.makeChest(tx, ty)); G.audio.play('chest'); }
      else if (t.interact === 'sit') { const nx = tx * TS + (TS - this.w) / 2; if (P.rectSolid(w, nx, this.y, this.w, this.h)) { this.say(G, 'Non c\'è spazio per sedersi'); return; } this.sit = { tx, ty }; this.x = nx; this.vx = 0; this.facing = this.cx < G.input.mouse.wx ? 1 : -1; G.audio.play('place'); }
      else if (t.interact === 'clock') { G.ui.toast('Sono le ' + TF.fmtTime(G.clock.h) + (G.clock.night ? ' (notte)' : ' (giorno)')); G.audio.play('ui'); }
      else if (t.interact === 'bed') { this.spawn = { x: tx, y: ty }; G.ui.toast('Punto di rinascita impostato'); G.particles.burst(tx * TS + 8, ty * TS, '#ff8aa0', 10, 1.5); G.audio.play('pick'); }
    }
    consume(G, it) {
      if (this.useT > 0) return; const inv = G.inv;
      if (it.type === 'potion' || it.type === 'food') {
        if (it.sick && this.buffs.sick > 0) { this.say(G, 'Malessere da pozione: attendi'); return; }
        const bl = it.buffs || (it.buff ? [it.buff] : []);
        if (it.heal && this.hp >= this.maxhp && !it.mana && !bl.length) { this.say(G, 'Vita già al massimo'); return; }
        if (it.mana && this.mana >= this.maxmana && !it.heal && !bl.length) { this.say(G, 'Mana già al massimo'); return; }
        if (it.heal) { this.heal(it.heal); if (it.sick) this.buffs.sick = 45 * 60; }
        if (it.mana) this.mana = Math.min(this.maxmana, this.mana + it.mana);
        for (const [k, sec] of bl) this.buffs[k] = Math.max(this.buffs[k] || 0, sec * 60);
        G.audio.play('drink'); inv.consumeSel(1); this.useT = it.type === 'food' ? 30 : 20;
      } else if (it.type === 'perm') {
        if (it.maxhp) { if (this.maxhp >= 500) { this.say(G, 'Vita massima raggiunta'); return; } this.maxhp += it.maxhp; this.hp += it.maxhp; G.ui.toast('Vita massima +' + it.maxhp); }
        if (it.maxmana) { if ((this.maxmanaBonus || 0) >= 160) { this.say(G, 'Mana massimo raggiunto'); return; } this.maxmanaBonus = (this.maxmanaBonus || 0) + it.maxmana; this.lookVer = -1; this.mana += it.maxmana; G.ui.toast('Mana massimo +' + it.maxmana); }
        G.audio.play('powerup'); inv.consumeSel(1); this.useT = 30; G.particles.burst(this.cx, this.cy, '#ffd84a', 16, 2);
      } else if (it.type === 'summon') {
        if (G.enemyMgr.bossAlive()) { this.say(G, 'Un boss è già presente'); return; }
        G.enemyMgr.spawnBoss(G, it.boss); inv.consumeSel(1); this.useT = 30;
      }
    }
  }
  const S = () => TF.Sprites;
  TF.Player = Player;
})(window.TF);
