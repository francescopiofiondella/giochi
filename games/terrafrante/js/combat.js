'use strict';
// Terrafrante - combattimento: proiettili, danni, knockback, drop di oggetti, testi fluttuanti
(function (TF) {
  const TS = TF.TS, P = TF.Physics;
  const C = (TF.Combat = {
    projectiles: [], drops: [], texts: [], nextId: 1,
    reset() { this.projectiles.length = 0; this.drops.length = 0; this.texts.length = 0; },

    text(x, y, text, color) { this.texts.push({ x, y, vy: -0.7, t: 0, text, color }); if (this.texts.length > 60) this.texts.shift(); },

    proj(o) {
      const p = Object.assign({ kind: 'spark', x: 0, y: 0, vx: 0, vy: 0, w: 6, h: 6, dmg: 1, kb: 2, friendly: true, life: 120, grav: 0, pierce: 1, age: 0, hit: null }, o);
      p.hit = p.pierce > 1 ? new Set() : null;
      this.projectiles.push(p); return p;
    },

    // ---- danno ai nemici ----
    hitEnemy(G, e, raw, dirX, kb, o) {
      if (e.dead) return 0;
      o = o || {};
      const crit = Math.random() < (o.crit || 0.06);
      let dmg = Math.max(1, Math.round((raw - (e.def || 0) * 0.5 * (1 - (o.pen || 0))) * (crit ? 2 : 1) * (0.92 + Math.random() * 0.16)));
      e.hp -= dmg; e.flash = 8; e.aggro = 600;
      const res = e.kbRes === undefined ? 0 : e.kbRes;
      if (kb && res < 1) { e.vx += dirX * kb * (1 - res); if (!e.flying || e.type === 'bat') e.vy = Math.min(e.vy, -2.2 * (1 - res)); else e.vy -= 1 * (1 - res); }
      if (o.slow) e.slowT = 180;
      if (o.poison) e.poisonT = 240;
      if (o.burn) e.burnT = 240;
      this.text(e.x + e.w / 2, e.y - 4, dmg, crit ? '#ffd84a' : '#ffffff');
      G.particles.burst(e.x + e.w / 2, e.y + e.h / 2, e.bloodCol || '#c03030', 4, 1.6);
      G.audio.play('hit');
      if (o.lifesteal && G.player.hp < G.player.maxhp) G.player.heal(Math.max(1, Math.round(dmg * o.lifesteal)), true);
      if (e.hp <= 0) { e.hp = 0; G.enemyMgr.kill(G, e); }
      return dmg;
    },

    // ---- danno al giocatore ----
    hurtPlayer(G, raw, srcX, attacker, kbMul) {
      const p = G.player;
      if (p.dead || p.invT > 0 || G.state !== 'play') return false;
      if (p.fx.dodge && Math.random() < p.fx.dodge) { p.invT = 25; this.text(p.x + p.w / 2, p.y - 6, 'Schivata', '#bfeaff'); return false; }
      const dmg = Math.max(1, Math.round((raw - p.totalDef() * 0.5) * (1 - Math.min(0.5, p.fx.dr || 0)) * (0.9 + Math.random() * 0.2)));
      p.hp -= dmg; p.invT = 45; p.flash = 45; p.sinceHurt = 0;
      if (!p.fx.kbImmune) { const d = p.x + p.w / 2 < srcX ? -1 : 1; p.vx = d * 3.2 * (kbMul === undefined ? 1 : kbMul); p.vy = Math.min(p.vy, -3.2 * (kbMul === undefined ? 1 : kbMul)); }
      this.text(p.x + p.w / 2, p.y - 6, dmg, '#ff4a4a');
      G.particles.burst(p.x + p.w / 2, p.y + p.h / 2, '#c03030', 8, 2);
      G.audio.play('hurt'); G.camera.shake(4);
      if (p.fx.thorns && attacker && !attacker.dead && attacker.hp !== undefined) this.hitEnemy(G, attacker, p.fx.thorns, p.x < attacker.x ? 1 : -1, 2);
      if (p.hp <= 0) p.die(G);
      return true;
    },

    explode(G, x, y, r, dmg, friendly) {
      G.particles.explosion(x, y, r);
      G.audio.play('boom'); G.camera.shake(3);
      if (friendly) for (const e of G.enemies) { const d = Math.hypot(e.x + e.w / 2 - x, e.y + e.h / 2 - y); if (d < r + e.w / 2) this.hitEnemy(G, e, dmg, e.x + e.w / 2 < x ? -1 : 1, 3); }
      else { const p = G.player; if (Math.hypot(p.x + p.w / 2 - x, p.y + p.h / 2 - y) < r) this.hurtPlayer(G, dmg, x); }
    },

    updateProjectiles(G) {
      const list = this.projectiles, w = G.world, p = G.player;
      for (let i = list.length - 1; i >= 0; i--) {
        const q = list[i];
        q.age++;
        if (q.grav) q.vy = Math.min(q.vy + q.grav, 12);
        if (q.homing && q.friendly) {
          let best = null, bd = 190;
          for (const e of G.enemies) { const d = Math.hypot(e.x + e.w / 2 - q.x, e.y + e.h / 2 - q.y); if (d < bd) { bd = d; best = e; } }
          if (best) { const a = Math.atan2(best.y + best.h / 2 - q.y, best.x + best.w / 2 - q.x), sp = Math.hypot(q.vx, q.vy), ca = Math.atan2(q.vy, q.vx); let da = a - ca; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283; const na = ca + TF.clamp(da, -q.homing, q.homing); q.vx = Math.cos(na) * sp; q.vy = Math.sin(na) * sp; }
        }
        if (q.fuse !== undefined) { if (this.updateBomb(G, q)) list.splice(i, 1); continue; }
        if (q.ret) { if (this.updateBoomerang(G, q)) { list.splice(i, 1); continue; } }
        else if (q.kind === 'root') { if (q.age === 14) G.audio.play('root'); }
        else { q.x += q.vx; q.y += q.vy; }
        if (q.trail && q.age % 2 === 0) G.particles.spark(q.x, q.y, q.trail);
        let dead = q.age > q.life;
        if (!dead && q.kind !== 'root' && !q.ghost && P.solidAtPx(w, q.x, q.y)) { dead = true; if (q.kind === 'arrow') G.audio.play('thunk'); if (q.explode) this.explode(G, q.x - q.vx, q.y - q.vy, q.explode, q.dmg * 0.6, q.friendly); else G.particles.burst(q.x, q.y, '#bbb', 3, 1); list.splice(i, 1); continue; }
        if (!dead && q.friendly) {
          for (const e of G.enemies) {
            if (e.dead || (q.hit && q.hit.has(e))) continue;
            if (TF.hits(e, q.x - q.w / 2, q.y - q.h / 2, q.w, q.h)) {
              this.hitEnemy(G, e, q.dmg, Math.sign(q.vx) || 1, q.kb, { slow: q.slow, poison: q.poison, burn: q.burn, crit: q.crit, lifesteal: q.lifesteal, pen: q.pen });
              if (q.explode) { this.explode(G, q.x, q.y, q.explode, q.dmg * 0.6, true); dead = true; break; }
              if (q.hit) q.hit.add(e);
              if (--q.pierce <= 0) { dead = true; break; }
            }
          }
        } else if (!dead && !q.friendly) {
          const armed = q.kind !== 'root' || (q.age > 12 && q.age < 36);
          if (armed && TF.rectsOverlap(q.x - q.w / 2, q.y - q.h / 2, q.w, q.h, p.x, p.y, p.w, p.h)) {
            this.hurtPlayer(G, q.dmg, q.x);
            if (q.kind !== 'root' && q.kind !== 'sonic') dead = true;
            if (q.explode) this.explode(G, q.x, q.y, q.explode, q.dmg, false);
          }
        }
        if (dead) { if (q.explode && q.age > q.life) this.explode(G, q.x, q.y, q.explode, q.dmg * 0.6, q.friendly); list.splice(i, 1); }
      }
    },

    // ---- bombe (miccia, rimbalzo, scoppio) ----
    updateBomb(G, q) {
      const w = G.world;
      q.vy = Math.min(q.vy + 0.28, 9);
      let nx = q.x + q.vx, ny = q.y + q.vy;
      if (P.solidAtPx(w, nx, q.y)) { q.vx *= -0.45; nx = q.x; }
      if (P.solidAtPx(w, q.x, ny)) { if (q.vy > 0) q.vx *= 0.7; q.vy *= -0.35; if (Math.abs(q.vy) < 0.6) q.vy = 0; ny = q.y; }
      q.x = nx; q.y = ny;
      let boom = --q.fuse <= 0;
      if (!boom && q.contact) for (const e of G.enemies) if (!e.dead && TF.hits(e, q.x - 4, q.y - 4, 8, 8)) { boom = true; break; }
      if (boom) { this.blast(G, q.x, q.y, q); return true; }
      return false;
    },
    // ---- boomerang: va, torna, colpisce due volte ----
    updateBoomerang(G, q) {
      const p = G.player;
      if (!q.turned && (q.age > q.out || P.solidAtPx(G.world, q.x + q.vx, q.y + q.vy))) { q.turned = true; if (q.hit) q.hit.clear(); }
      if (q.turned) {
        const dx = p.cx - q.x, dy = p.cy - q.y, d = Math.hypot(dx, dy) || 1, sp = Math.min(13, Math.hypot(q.vx, q.vy) + 0.45);
        if (d < 14) return true;
        q.vx = dx / d * sp; q.vy = dy / d * sp;
      }
      q.x += q.vx; q.y += q.vy; return false;
    },
    // ---- esplosione con distruzione di blocchi ----
    blast(G, x, y, o) {
      const p = G.player, r = o.r || 40;
      G.particles.explosion(x, y, r); G.audio.play('boom'); G.camera.shake(Math.min(8, 3 + r / 20));
      for (const e of G.enemies) {
        if (e.dead) continue;
        const d = Math.hypot(e.x + e.w / 2 - x, e.y + e.h / 2 - y);
        if (d < r + e.w / 2) this.hitEnemy(G, e, o.dmg, e.x + e.w / 2 < x ? -1 : 1, o.kb === undefined ? 4 : o.kb, { burn: o.burn, slow: o.slow, poison: o.poison, crit: 0 });
      }
      if (!p.dead && Math.hypot(p.cx - x, p.cy - y) < r) this.hurtPlayer(G, Math.round(o.dmg * 0.35), x);
      if (o.tiles > 0) this.blastTiles(G, x, y, o.tiles, o.pow || 50);
    },
    blastTiles(G, x, y, r, pow) {
      const w = G.world, pl = G.player, tx0 = Math.floor(x / TS), ty0 = Math.floor(y / TS), rm = [];
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r + 1) continue;
        const tx = tx0 + dx, ty = ty0 + dy; if (!w.inb(tx, ty)) continue;
        const id = w.get(tx, ty); if (!id) continue;
        const t = TF.TILES[id];
        if (t.hard === Infinity || t.liquid || t.interact === 'chest' || t.interact === 'door' || (t.min || 0) > pow) continue;
        if (t.drop) this.drop(G, t.drop, 1, tx * TS + 8, ty * TS + 8);
        w.set(tx, ty, 0); rm.push([tx, ty]);
        if (rm.length % 3 === 0) G.particles.chip(tx * TS + 8, ty * TS + 8, t.tx.b || '#888');
      }
      for (const [tx, ty] of rm) pl.afterBreak(G, tx, ty);
      pl.stats.blocks += rm.length;
    },

    // ---- oggetti a terra ----
    drop(G, id, n, x, y, vx, vy) {
      if (!id || n <= 0) return;
      this.drops.push({ id, n, x: x - 4, y: y - 4, w: 8, h: 8, vx: vx === undefined ? (Math.random() - 0.5) * 3 : vx, vy: vy === undefined ? -2 - Math.random() * 2 : vy, age: 0, delay: 20, onGround: false });
    },
    updateDrops(G) {
      const list = this.drops, p = G.player, w = G.world;
      for (let i = list.length - 1; i >= 0; i--) {
        const d = list[i]; d.age++;
        if (d.age > 21600) { list.splice(i, 1); continue; }
        const dx = p.x + p.w / 2 - (d.x + 4), dy = p.y + p.h / 2 - (d.y + 4), dist = Math.hypot(dx, dy);
        if (!p.dead && d.age > d.delay && dist < p.pickRange && G.inv.canAdd(d.id, 1)) {
          const s = 0.9 + (p.pickRange - dist) * 0.04; d.vx += (dx / dist) * s * 0.5; d.vy += (dy / dist) * s * 0.5; d.vx *= 0.88; d.vy *= 0.88; d.mag = true;
        } else { d.vy = Math.min(d.vy + 0.3, 8); if (d.onGround) d.vx *= 0.8; else d.vx *= 0.99; d.mag = false; }
        if (d.mag) { d.x += d.vx; d.y += d.vy; } else {
          // un oggetto incastrato in un blocco (es. boss morto dentro la roccia) viene fatto riemergere verso l'alto
          if (P.rectSolid(w, d.x, d.y, d.w, d.h)) { let k = 0; while (k++ < 60 && P.rectSolid(w, d.x, d.y, d.w, d.h)) d.y -= 4; d.vy = 0; }
          P.move(d, w, {});
        }
        const tx = Math.floor((d.x + 4) / TS), ty = Math.floor((d.y + 4) / TS);
        if (w.liqType(tx, ty) === 2) { list.splice(i, 1); continue; }
        if (!p.dead && d.age > d.delay && dist < 14) {
          const left = G.inv.add(d.id, d.n);
          if (left < d.n) { G.ui.pickup(d.id, d.n - left); G.audio.play('pick'); G.player.checkAutoEquipHint && 0; }
          if (left <= 0) { list.splice(i, 1); } else d.n = left;
        }
      }
    },
    updateTexts() { const t = this.texts; for (let i = t.length - 1; i >= 0; i--) { const a = t[i]; a.t++; a.y += a.vy; a.vy *= 0.96; if (a.t > 50) t.splice(i, 1); } },
  });
})(window.TF);
