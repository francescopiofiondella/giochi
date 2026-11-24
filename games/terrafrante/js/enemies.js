'use strict';
// Terrafrante - nemici comuni: definizioni, IA distinte, generazione dinamica, drop
(function (TF) {
  const TS = TF.TS, P = TF.Physics, C = TF.Combat, W = TF.W;
  // test di collisione che tiene conto delle parti (verme a segmenti)
  TF.hits = (e, x, y, w, h) => {
    if (e.parts) { for (const p of e.parts) if (TF.rectsOverlap(x, y, w, h, p.x, p.y, p.w, p.h)) return true; return false; }
    return TF.rectsOverlap(x, y, w, h, e.x, e.y, e.w, e.h);
  };

  const DEFS = {
    slime: { name: 'Melma', w: 14, h: 11, hp: 18, dmg: 9, def: 0, kbRes: 0.1, drops: [['gel', 1, 3, 0.9]], walker: true },
    bat: { name: 'Pipistrello', w: 12, h: 8, hp: 12, dmg: 8, def: 0, flying: true, drops: [['wing', 1, 1, 0.2]] },
    skeleton: { name: 'Scheletro', w: 12, h: 24, hp: 46, dmg: 15, def: 3, drops: [['bone', 1, 3, 0.8], ['arrow', 3, 8, 0.2]], walker: true },
    zombie: { name: 'Errante', w: 12, h: 24, hp: 32, dmg: 12, def: 1, drops: [['cloth', 1, 2, 0.35], ['gel', 1, 2, 0.3]], walker: true },
    spider: { name: 'Ragno', w: 14, h: 9, hp: 32, dmg: 13, def: 1, drops: [['silk', 1, 3, 0.7]], walker: true },
    worm: { name: 'Verme di Roccia', w: 11, h: 11, hp: 70, dmg: 15, def: 2, flying: true, noClip: true, kbRes: 0.5, drops: [['copper_ore', 2, 5, 0.7], ['iron_ore', 1, 3, 0.5], ['gold_ore', 1, 2, 0.15]] },
    guardian: { name: 'Guardiano del Dungeon', w: 16, h: 30, hp: 160, dmg: 28, def: 8, kbRes: 0.75, drops: [['bone', 3, 8, 1], ['gold_bar', 1, 3, 0.4], ['potion_heal_s', 1, 2, 0.45], ['life_crystal', 1, 1, 0.04]], walker: true },
  };
  // varianti per bioma
  const SLIME_TINT = { forest: ['#6fe08a', '#3fa85a'], desert: ['#e8c34a', '#b0902a'], snow: ['#9fd4ee', '#5a9ac8'], jungle: ['#a8e04a', '#5a9a2a'], swamp: ['#9bb35a', '#66783a'], corrupt: ['#b574d8', '#6a3a8a'], under: ['#6a8ae8', '#3a4a9a'], deep: ['#ff7a3c', '#a83a12'] };
  const BAT_TINT = { snow: ['#bfeaff', '#6ab8e0'], corrupt: ['#a45fd0', '#4c2a68'], deep: ['#ff6a3c', '#a82a12'], jungle: ['#4aa05a', '#2a5a30'] };
  const SK_TINT = { snow: ['#cfe8f6', '#9ac0d8'], dungeon: ['#c8c8e0', '#8a8aa8'], deep: ['#d8a070', '#8a5a3a'] };

  class EnemyMgr {
    constructor() { this.timer = 0; this.nextId = 1; }
    count(G, type) { let n = 0; for (const e of G.enemies) if (!e.boss && (!type || e.type === type)) n++; return n; }
    bossAlive() { return TF.game.enemies.some((e) => e.boss && !e.dead && !e.leaving); }
    spawn(G, type, x, y, o) {
      const d = DEFS[type]; const bm = G.biomeKey || 'forest';
      const night = G.clock.night, e = Object.assign({
        id: this.nextId++, type, x, y, w: d.w, h: d.h, vx: 0, vy: 0, hp: d.hp, maxhp: d.hp, dmg: d.dmg, def: d.def, kbRes: d.kbRes || 0, flying: !!d.flying, facing: 1, onGround: false,
        animT: 0, flash: 0, aggro: 0, t: 0, state: 'idle', cd: 60, slowT: 0, poisonT: 0, drops: d.drops, name: d.name, dead: false, bloodCol: '#c03030',
      }, o || {});
      const k = e.biome || 'forest';
      if (type === 'slime') { e.tint = SLIME_TINT[k] || SLIME_TINT.forest; if (k === 'jungle') e.spiky = true; if (k === 'under' || k === 'deep') { e.maxhp = e.hp = Math.round(d.hp * 1.6); e.dmg = Math.round(d.dmg * 1.4); } if (k === 'deep') { e.maxhp = e.hp = Math.round(d.hp * 3); e.dmg = Math.round(d.dmg * 2.2); e.def = 4; } }
      if (type === 'bat') { e.tint = BAT_TINT[k]; if (k === 'deep') { e.maxhp = e.hp = 36; e.dmg = 18; } else if (e.under) { e.maxhp = e.hp = 18; e.dmg = 10; } }
      if (type === 'skeleton') { e.tint = SK_TINT[k]; if (k === 'dungeon') { e.maxhp = e.hp = 70; e.dmg = 20; e.def = 5; } if (k === 'deep') { e.maxhp = e.hp = 110; e.dmg = 32; e.def = 8; } }
      if (type === 'spider') { if (k === 'jungle') e.tint = ['#3f9a4f', '#1f5a2a']; if (k === 'deep') { e.maxhp = e.hp = 70; e.dmg = 28; e.def = 5; } }
      if (type === 'worm') { if (e.y / TS > G.world.deepY) { e.maxhp = e.hp = 160; e.dmg = 30; e.def = 6; } e.parts = []; const n = 8; e.segs = []; for (let i = 0; i < n; i++) e.segs.push({ x, y }); this.syncParts(e); }
      if (type === 'zombie' && k === 'corrupt') { e.maxhp = e.hp = 50; e.dmg = 18; e.def = 3; }
      if (night) { e.maxhp = e.hp = Math.round(e.hp * 1.25); e.dmg = Math.round(e.dmg * 1.3); }
      G.enemies.push(e); return e;
    }
    syncParts(e) { e.parts = e.segs.map((s, i) => ({ x: s.x, y: s.y, w: 11, h: 11, head: i === 0 })); e.x = e.segs[0].x; e.y = e.segs[0].y; }

    // ---- generazione ----
    trySpawn(G) {
      const p = G.player, w = G.world, tx0 = Math.floor(p.cx / TS), ty0 = Math.floor(p.cy / TS), cam = G.camera;
      const night = G.clock.night, zone = w.biomeAt(tx0, ty0), under = ty0 > w.surf[tx0] + 12;
      let cap = under ? 9 : night ? 10 : 5; if (zone.key === 'dungeon') cap = 10;
      if (this.count(G) >= cap) return;
      if (G.enemies.some((e) => e.boss && !e.dead)) cap = Math.min(cap, 3);
      for (let a = 0; a < 14; a++) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const dx = Math.round(cam.viewW / TS / 2 + 4 + Math.random() * 14), tx = tx0 + side * dx, ty = ty0 + Math.round((Math.random() - 0.5) * 36);
        if (!w.inb(tx, ty) || ty < 3) continue;
        if (w.get(tx, ty) !== 0 || w.liqLevel(tx, ty) > 0) continue;
        const wl = w.getWall(tx, ty); if (wl === W.PLANKS || wl === W.BRICK) continue;
        const bz = w.biomeAt(tx, ty); const k = bz.key;
        const surfaceHere = ty < w.surf[tx] - 1 && w.skyY[tx] >= ty;
        const grounded = w.solid(tx, ty + 1) && w.get(tx, ty - 1) === 0 && w.get(tx, ty - 2) === 0;
        let type = this.pickType(G, k, surfaceHere, night, ty, tx);
        if (!type) continue;
        const d = DEFS[type];
        if (d.walker && !grounded) continue;
        if (d.flying && (w.get(tx + 1, ty) || w.get(tx - 1, ty) || w.get(tx, ty - 1) || w.get(tx, ty + 1))) continue;
        if (type === 'guardian' && this.count(G, 'guardian') >= 3) continue;
        if (type === 'worm' && this.count(G, 'worm') >= 2) continue;
        if (k === 'dungeon' && wl !== W.DUNGEON) continue;
        const px = tx * TS + (TS - d.w) / 2, py = (ty + 1) * TS - d.h;
        const biomeKey = k === 'dungeon' ? 'dungeon' : (bz.id === 9 ? 'deep' : (bz.under && type !== 'zombie' ? 'under' : k));
        const e = this.spawn(G, type, px, py, { biome: type === 'slime' ? (bz.id === 9 ? 'deep' : bz.under ? 'under' : k) : (bz.id === 9 ? 'deep' : k), under: !!bz.under, bz });
        e.bm = bz; return;
      }
    }
    pickType(G, k, surface, night, ty, tx) {
      const r = Math.random();
      if (k === 'dungeon') return r < 0.45 ? 'skeleton' : r < 0.75 ? 'guardian' : 'bat';
      if (k === 'deep') return r < 0.22 ? 'skeleton' : r < 0.42 ? 'spider' : r < 0.6 ? 'worm' : r < 0.82 ? 'bat' : 'slime';
      if (surface) {
        if (!night) return k === 'jungle' && r < 0.2 ? 'spider' : (r < 0.8 ? 'slime' : null);
        if (k === 'desert') return r < 0.35 ? 'skeleton' : r < 0.6 ? 'zombie' : r < 0.8 ? 'bat' : 'slime';
        if (k === 'corrupt') return r < 0.4 ? 'zombie' : r < 0.7 ? 'bat' : 'slime';
        return r < 0.45 ? 'zombie' : r < 0.65 ? 'slime' : r < 0.85 ? 'bat' : (k === 'jungle' ? 'spider' : 'skeleton');
      }
      const deep = ty > G.world.surf[tx] + 40;
      return r < 0.28 ? 'slime' : r < 0.5 ? 'bat' : r < 0.7 ? 'skeleton' : r < 0.88 ? 'spider' : (deep ? 'worm' : 'slime');
    }

    // ---- aggiornamento ----
    update(G) {
      const p = G.player, w = G.world, list = G.enemies;
      this.timer++;
      if (this.timer % 25 === 0 && !p.dead && G.state === 'play') { const rate = (G.clock.night ? 0.6 : 0.3) * Math.max(0.1, 1 - (p.fx.calm || 0) + (p.fx.battle || 0)); if (Math.random() < rate) this.trySpawn(G); }
      for (let i = list.length - 1; i >= 0; i--) {
        const e = list[i];
        if (e.dead) { list.splice(i, 1); continue; }
        e.animT++; if (e.flash > 0) e.flash--;
        if (e.poisonT > 0) { e.poisonT--; if (e.poisonT % 30 === 0) { e.hp -= 2; C.text(e.x + e.w / 2, e.y - 4, 2, '#8fe05a'); G.particles.spark(e.x + e.w / 2, e.y + 2, '#8fe05a'); if (e.hp <= 0) { this.kill(G, e); continue; } } }
        if (e.burnT > 0) { e.burnT--; if (e.burnT % 30 === 0) { e.hp -= 3; C.text(e.x + e.w / 2, e.y - 4, 3, '#ff9a3c'); G.particles.spark(e.x + e.w / 2, e.y + 2, '#ff9a3c'); if (e.hp <= 0) { this.kill(G, e); continue; } } }
        if (e.slowT > 0) e.slowT--;
        if (e.boss) { TF.Bosses.update(G, e); }
        else {
          const dx = Math.abs(e.x - p.x) / TS, dy = Math.abs(e.y - p.y) / TS;
          if (dx > 75 || dy > 60 || (e.type === 'zombie' && !G.clock.night && !e.aggro && Math.random() < 0.01 && dx > 20) || (e.biome === 'dungeon' && false)) { list.splice(i, 1); continue; }
          this.ai(G, e, p, w);
        }
        if (e.dead) continue;
        // danno da contatto
        if (!p.dead && !e.noContact && TF.hits(e, p.x, p.y, p.w, p.h)) C.hurtPlayer(G, e.dmg, e.x + e.w / 2, e);
      }
    }
    ai(G, e, p, w) {
      const slow = e.slowT > 0 ? 0.5 : 1, pdx = p.cx - (e.x + e.w / 2), pdy = p.cy - (e.y + e.h / 2), dist = Math.hypot(pdx, pdy);
      const near = dist < 18 * TS || e.aggro > 0; if (e.aggro > 0) e.aggro--;
      if (p.dead) { e.vx *= 0.9; }
      const fn = this['ai_' + e.type]; if (fn) fn.call(this, G, e, p, w, { slow, pdx, pdy, dist, near });
      if (e.type === 'worm' || e.type === 'bat') return;
      if (!e.flying) {
        const env = P.env(e, w);
        e.vy = Math.min(e.vy + (env.water > 0.4 ? 0.12 : P.GRAV), env.water > 0.4 ? 2 : P.MAXFALL);
        if (env.lava > 0.3 && e.biome !== 'deep') { e.hp -= 0.4; if (e.hp <= 0) this.kill(G, e); }
      }
      P.move(e, w, { step: !!DEFS[e.type].walker && e.type !== 'slime' });
    }
    ai_slime(G, e, p, w, c) {
      if (e.onGround) {
        e.vx *= 0.7; e.t--;
        if (e.t <= 0 && (c.near || Math.random() < 0.3)) {
          const dir = c.near ? Math.sign(c.pdx) || 1 : (Math.random() < 0.5 ? -1 : 1);
          e.facing = dir; e.vx = dir * (1.4 + Math.random() * 0.9) * c.slow; e.vy = -(4 + Math.random() * 1.6) - (c.pdy < -40 && c.near ? 1.6 : 0); e.t = 40 + Math.random() * 40 | 0;
          if (e.hitX) e.vy -= 1;
        }
      }
    }
    ai_zombie(G, e, p, w, c) {
      const sp = (G.clock.night ? 1.15 : 0.9) * c.slow;
      if (c.near && !p.dead) { e.facing = Math.sign(c.pdx) || e.facing; e.vx = TF.lerp(e.vx, e.facing * sp, 0.15); } else e.vx *= 0.9;
      if (e.hitX && e.onGround) e.vy = -5.6;
    }
    ai_skeleton(G, e, p, w, c) {
      const sp = 1.0 * c.slow; e.cd--;
      if (c.near && !p.dead) {
        e.facing = Math.sign(c.pdx) || e.facing;
        if (Math.abs(c.pdx) > 90) e.vx = TF.lerp(e.vx, e.facing * sp, 0.15); else if (Math.abs(c.pdx) < 50) e.vx = TF.lerp(e.vx, -e.facing * sp * 0.7, 0.1); else e.vx *= 0.9;
        if (e.cd <= 0 && c.dist < 11 * TS) { e.cd = 110 + Math.random() * 40; const a = Math.atan2(c.pdy - 10, c.pdx), sp2 = 5; C.proj({ kind: 'bone', x: e.x + e.w / 2, y: e.y + 6, vx: Math.cos(a) * sp2, vy: Math.sin(a) * sp2 - 1.4, dmg: Math.round(e.dmg * 0.7), friendly: false, grav: 0.14, life: 120, w: 8, h: 8 }); }
      } else e.vx *= 0.9;
      if (e.hitX && e.onGround) e.vy = -5.8;
    }
    ai_spider(G, e, p, w, c) {
      e.cd--; const sp = 1.3 * c.slow;
      if (c.near && !p.dead) {
        e.facing = Math.sign(c.pdx) || e.facing;
        if (e.onGround) { e.vx = TF.lerp(e.vx, e.facing * sp, 0.2); if (e.cd <= 0 && Math.abs(c.pdx) < 9 * TS && Math.abs(c.pdx) > 24) { e.vx = e.facing * 3.4; e.vy = -4.6; e.cd = 70 + Math.random() * 40; } }
        if (e.hitX) { e.vy = -2.2; e.climb = 6; }
      } else e.vx *= 0.9;
      if (e.climb > 0) { e.climb--; e.vy = Math.min(e.vy, -1.2); }
    }
    ai_bat(G, e, p, w, c) {
      e.cd--;
      if (c.near && !p.dead && c.dist < 28 * TS) {
        const tx = p.cx + Math.cos(e.animT * 0.04 + e.id) * 40, ty = p.cy - 24 + Math.sin(e.animT * 0.07 + e.id) * 20;
        let ax = tx - (e.x + e.w / 2), ay = ty - (e.y + e.h / 2); const l = Math.hypot(ax, ay) || 1;
        const acc = 0.07 * c.slow; e.vx += ax / l * acc + (Math.random() - 0.5) * 0.12; e.vy += ay / l * acc + (Math.random() - 0.5) * 0.12;
        if (e.cd <= 0 && c.dist < 14 * TS) { e.cd = 150 + Math.random() * 60; e.vx = c.pdx / c.dist * 3.8; e.vy = c.pdy / c.dist * 3.8; }
        const m = (G.clock.night ? 2.5 : 2.1) * c.slow, s = Math.hypot(e.vx, e.vy); if (s > m && e.cd < 130) { e.vx *= m / s; e.vy *= m / s; }
        e.facing = Math.sign(e.vx) || e.facing;
      } else { e.vx += (Math.random() - 0.5) * 0.1; e.vy += (Math.random() - 0.5) * 0.1; e.vx *= 0.97; e.vy *= 0.97; }
      P.move(e, w, {}); if (e.hitX) e.vx = -e.vx * 0.5; if (e.onGround || e.hitCeil) e.vy = -e.vy * 0.5;
    }
    ai_guardian(G, e, p, w, c) {
      e.cd--; const sp = 0.85 * c.slow;
      if (e.state === 'windup') { e.vx *= 0.8; e.charge = e.cd; if (e.cd <= 0) { e.state = 'dash'; e.cd = 38; e.dashDir = Math.sign(c.pdx) || e.facing; G.audio.play('roar'); } }
      else if (e.state === 'dash') { e.vx = e.dashDir * 4.2; e.facing = e.dashDir; e.charge = 0; if (e.cd <= 0 || e.hitX) { e.state = 'idle'; e.cd = 110; e.vx = 0; } if (e.onGround && Math.abs(e.vx) > 3 && e.animT % 6 === 0) G.particles.burst(e.x + e.w / 2, e.y + e.h, '#8a8aa8', 2, 1); }
      else {
        e.charge = 0;
        if (c.near && !p.dead) { e.facing = Math.sign(c.pdx) || e.facing; e.vx = TF.lerp(e.vx, e.facing * sp, 0.12); if (e.cd <= 0 && c.dist < 12 * TS && c.dist > 2 * TS) { e.state = 'windup'; e.cd = 34; } }
        else e.vx *= 0.9;
        if (e.hitX && e.onGround) e.vy = -5.6;
      }
    }
    ai_worm(G, e, p, w, c) {
      const head = e.segs[0], tgtOn = c.dist < 34 * TS && !p.dead;
      let ax, ay;
      if (tgtOn) { ax = c.pdx; ay = c.pdy; const l = Math.hypot(ax, ay) || 1; ax /= l; ay /= l; e.vx += ax * 0.09 * c.slow; e.vy += ay * 0.09 * c.slow + Math.sin(e.animT * 0.1) * 0.03; }
      else { e.vx += Math.cos(e.animT * 0.02 + e.id) * 0.03; e.vy += Math.sin(e.animT * 0.017 + e.id) * 0.03; }
      const mx = 2.1 * c.slow, s = Math.hypot(e.vx, e.vy); if (s > mx) { e.vx *= mx / s; e.vy *= mx / s; }
      head.x = TF.clamp(head.x + e.vx, 4, w.w * TS - 16); head.y = TF.clamp(head.y + e.vy, 4, (w.h - 6) * TS);
      e.facing = Math.sign(e.vx) || e.facing;
      for (let i = 1; i < e.segs.length; i++) { const a = e.segs[i - 1], b = e.segs[i]; const dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy) || 1; if (d > 8) { b.x += dx / d * (d - 8); b.y += dy / d * (d - 8); } }
      this.syncParts(e);
      if (e.animT % 9 === 0 && P.solidAtPx(w, head.x + 5, head.y + 5)) G.particles.chip(head.x + 5, head.y + 5, '#7a6a5a');
    }

    // ---- morte e bottino ----
    kill(G, e) {
      if (e.dead) return; e.dead = true;
      const cx = e.x + e.w / 2, cy = e.y + e.h / 2, p = G.player;
      G.particles.burst(cx, cy, e.tint ? e.tint[0] : (e.bloodCol || '#c03030'), e.boss ? 40 : 12, e.boss ? 4 : 2.2); G.audio.play(e.boss ? 'bossdie' : 'die');
      if (e.boss) { TF.Bosses.onDeath(G, e); }
      else {
        for (const [id, a, b, ch] of (e.drops || [])) if (Math.random() < ch) C.drop(G, id, a + ((Math.random() * (b - a + 1)) | 0), cx, cy);
        const bz = e.bm || G.world.biomeAt(cx / TS | 0, cy / TS | 0);
        if (bz && bz.mat && Math.random() < (e.type === 'slime' ? 0.4 : 0.22)) C.drop(G, bz.mat, 1 + (Math.random() < 0.3 ? 1 : 0), cx, cy);
        if (Math.random() < 0.025 * (1 + (p.fx.loot || 0)) && e.maxhp > 20) C.drop(G, 'potion_heal_s', 1, cx, cy);
        if (TF.EXTRA_DROPS && e.maxhp > 20) TF.EXTRA_DROPS(G, e, cx, cy);
        p.stats.kills++;
        const s = p.stats.byType || (p.stats.byType = {}); s[e.type] = (s[e.type] || 0) + 1;
      }
    }
    bossAliveGet(G) { return G.enemies.find((e) => e.boss && !e.dead && !e.leaving); }
    spawnBoss(G, type) { return TF.Bosses.spawn(G, type); }
    bossRetreat(G) { for (const e of G.enemies) if (e.boss && !e.dead) { e.leaving = true; e.leaveT = 120; } }
  }
  TF.EnemyMgr = EnemyMgr; TF.ENEMY_DEFS = DEFS;
})(window.TF);
