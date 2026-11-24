'use strict';
// Terrafrante - boss: Ceppo Antico, Nottola Regina, Sire dell'Abisso
(function (TF) {
  const TS = TF.TS, P = TF.Physics, C = TF.Combat;
  const DEFS = {
    ceppo: { name: 'Ceppo Antico', w: 40, h: 56, hp: 950, dmg: 24, def: 4, ground: true, tint: '#4caa3c' },
    nottola: { name: 'Nottola Regina', w: 56, h: 34, hp: 2300, dmg: 32, def: 6, flying: true, tint: '#8a6bff' },
    sire: { name: 'Sire dell\'Abisso', w: 36, h: 52, hp: 6000, dmg: 48, def: 10, flying: true, tint: '#ff6a3c' },
  };
  const DROPS = {
    ceppo: [['sap', 6], ['bark_shield', 1], ['root_blade', 1], ['life_crystal', 2], ['wood', 30], ['gel', 20]],
    nottola: [['night_core', 8], ['wings_bat', 1], ['night_scythe', 1], ['bow_sonic', 1], ['life_crystal', 3], ['mana_crystal', 2], ['wing', 6]],
    sire: [['abyss_core', 6], ['lord_blade', 1], ['staff_sire', 1], ['life_crystal', 4], ['mana_crystal', 3], ['potion_heal_l', 5], ['abyss_bar', 6]],
  };
  const MSG = { ceppo: 'Il Ceppo Antico si risveglia!', nottola: 'La Nottola Regina squarcia il cielo!', sire: 'Il Sire dell\'Abisso emerge dalle fiamme!' };
  const WIN = { ceppo: 'Hai sconfitto il Ceppo Antico! Ora puoi forgiare il Fischietto Spettrale.', nottola: 'La Nottola Regina è caduta! Il Cuore dell\'Abisso ti attende.', sire: 'Il Sire dell\'Abisso è sconfitto! Il mondo è salvo. Puoi continuare a esplorare.' };

  const B = (TF.Bosses = {
    DEFS,
    spawn(G, type) {
      const d = DEFS[type], p = G.player, w = G.world, side = Math.random() < 0.5 ? -1 : 1;
      let x = p.cx + side * (G.camera.viewW / 2 + 30), y = p.cy - 140;
      if (d.ground) {
        const tx = Math.floor(x / TS); let ty = Math.floor(p.cy / TS) - 14; while (ty < w.h - 5 && !w.solid(tx, ty)) ty++;
        x = tx * TS; y = ty * TS - d.h - 2;
      }
      const e = {
        id: G.enemyMgr.nextId++, type, boss: true, name: d.name, x: x - d.w / 2, y, w: d.w, h: d.h, vx: 0, vy: 0, hp: d.hp, maxhp: d.hp, dmg: d.dmg, def: d.def, kbRes: 1,
        flying: !!d.flying, facing: 1, onGround: false, animT: 0, flash: 0, t: 0, st: 0, state: 'enter', dead: false, noFlip: false, tint: [d.tint, d.tint], bloodCol: d.tint, phase: 1, drops: [], aggro: 9999, alpha: 1, glow: type === 'sire' ? 200 : type === 'nottola' ? 60 : 0,
      };
      G.enemies.push(e); G.ui.toast(MSG[type], 'boss'); G.audio.play('roar'); G.camera.shake(8); return e;
    },
    update(G, e) {
      if (e.leaving) { e.leaveT--; e.y -= 6; e.alpha = Math.max(0, e.leaveT / 60); if (e.leaveT <= 0) e.dead = true; return; }
      e.t++;
      const p = G.player; if (p.dead) { e.vx *= 0.9; return; }
      B[e.type](G, e, p);
    },
    // ---- Ceppo Antico (terrestre) ----
    ceppo(G, e, p) {
      const w = G.world, r = e.hp / e.maxhp, p2 = r < 0.5; e.phase2 = p2;
      const dx = p.cx - (e.x + e.w / 2), dist = Math.abs(dx), dir = Math.sign(dx) || 1;
      e.cd = (e.cd === undefined ? 90 : e.cd) - 1;
      const sp = p2 ? 1.45 : 1.05;
      e.vy = Math.min(e.vy + P.GRAV, P.MAXFALL);
      if (e.state === 'enter' || e.state === 'walk') {
        e.state = 'walk'; e.facing = dir; e.vx = TF.lerp(e.vx, dir * sp, 0.1);
        if (e.hitX && e.onGround) e.vy = -7;
        if (e.cd <= 0) {
          const roll = Math.random();
          if (roll < 0.35) { e.state = 'crouch'; e.st = 24; }
          else if (roll < 0.65) { e.state = 'seeds'; e.st = 0; e.vol = 0; }
          else if (roll < 0.85 || !p2) { e.state = 'roots'; e.st = 0; }
          else { e.state = 'summon'; e.st = 40; }
        }
      } else if (e.state === 'crouch') { e.vx *= 0.8; if (--e.st <= 0) { e.state = 'leap'; e.vx = dir * (p2 ? 3.6 : 2.8) * Math.min(1, dist / 120 + 0.5); e.vy = -(8.5 + (p.cy < e.y - 60 ? 1.5 : 0)); e.onGround = false; e.st = 6; G.audio.play('jump'); } }
      else if (e.state === 'leap') { e.st--; if (e.onGround && e.st < 0) { this.quake(G, e, p2 ? 5 : 3); e.state = 'walk'; e.cd = p2 ? 70 : 100; } }
      else if (e.state === 'seeds') {
        e.vx *= 0.85; e.facing = dir; e.st++;
        if (e.st % 22 === 10 && e.vol < (p2 ? 4 : 3)) { e.vol++; const cx = e.x + e.w / 2, cy = e.y + 8, a = Math.atan2(p.cy - cy, p.cx - cx); for (let k = -1; k <= 1; k++) C.proj({ kind: 'seed', x: cx, y: cy, vx: Math.cos(a + k * 0.22) * 5.2, vy: Math.sin(a + k * 0.22) * 5.2 - 2, dmg: Math.round(e.dmg * 0.6), friendly: false, grav: 0.14, life: 140, w: 8, h: 8 }); G.audio.play('magic'); }
        if (e.st > 80) { e.state = 'walk'; e.cd = 80; }
      } else if (e.state === 'roots') {
        e.vx *= 0.85; e.st++;
        if (e.st === 18) for (const o of [-34, -17, 0, 17, 34, ...(p2 ? [-51, 51] : [])]) this.root(G, p.cx + o);
        if (e.st > 52) { e.state = 'walk'; e.cd = 85; }
      } else if (e.state === 'summon') {
        e.vx *= 0.85; if (--e.st === 0) { let n = G.enemies.filter((q) => q.type === 'slime').length; for (let k = 0; k < 3 && n < 5; k++, n++) { const s = G.enemyMgr.spawn(G, 'slime', e.x + 10 + k * 8, e.y - 12, { biome: 'forest' }); s.vx = (k - 1) * 2.5; s.vy = -5; s.aggro = 600; s.drops = []; } G.audio.play('roar'); }
        if (e.st < -30) { e.state = 'walk'; e.cd = 100; } else if (e.st === 0) e.st = -1; else if (e.st < 0) e.st--;
      }
      P.move(e, w, { step: true });
      if (e.onGround && Math.abs(e.vx) > 0.5 && e.animT % 14 === 0) G.camera.shake(1);
    },
    quake(G, e, n) {
      G.camera.shake(8); G.audio.play('boom');
      for (let i = 1; i <= n; i++) { this.root(G, e.x + e.w / 2 - i * 22 - 8); this.root(G, e.x + e.w / 2 + i * 22 + 8); }
      G.particles.burst(e.x + e.w / 2, e.y + e.h, '#8a6a4a', 20, 3);
    },
    root(G, x) {
      const w = G.world, tx = Math.floor(x / TS); let ty = Math.floor(G.player.cy / TS) - 4; let guard = 0;
      while (ty < w.h - 3 && !w.solid(tx, ty) && guard++ < 40) ty++;
      if (!w.solid(tx, ty)) return;
      while (w.solid(tx, ty - 1) && guard++ < 60) ty--;
      C.proj({ kind: 'root', x: tx * TS + 8, y: ty * TS - 10, w: 10, h: 24, dmg: Math.round(DEFS.ceppo.dmg * 0.8), friendly: false, life: 44, ghost: true });
    },
    // ---- Nottola Regina (volante) ----
    nottola(G, e, p) {
      const r = e.hp / e.maxhp; e.phase = r < 0.33 ? 3 : r < 0.66 ? 2 : 1; e.phase3 = e.phase === 3;
      const cx = e.x + e.w / 2, cy = e.y + e.h / 2, dx = p.cx - cx, dy = p.cy - cy;
      e.cd = (e.cd === undefined ? 60 : e.cd) - 1;
      if (e.state === 'enter' || e.state === 'hover') {
        e.state = 'hover';
        const tx = p.cx + Math.sin(e.t * 0.02) * 170, ty = p.cy - 120 + Math.sin(e.t * 0.05) * 20, k = 0.035 * (e.phase === 3 ? 1.5 : 1);
        e.vx = TF.lerp(e.vx, (tx - cx) * k, 0.12); e.vy = TF.lerp(e.vy, (ty - cy) * k, 0.12);
        e.facing = Math.sign(e.vx) || e.facing;
        if (e.cd <= 0) {
          const roll = Math.random();
          if (roll < 0.5) { e.state = 'windup'; e.st = 22; e.swoops = e.phase; }
          else if (roll < 0.8) { e.state = 'sonic'; e.st = 40; }
          else if (e.phase >= 2) { e.state = 'summon'; e.st = 30; }
          else { e.state = 'windup'; e.st = 22; e.swoops = 1; }
        }
      } else if (e.state === 'windup') {
        e.vx *= 0.85; e.vy = TF.lerp(e.vy, -1.2, 0.1); e.flash = e.st % 6 < 3 ? 2 : 0;
        if (--e.st <= 0) { const l = Math.hypot(dx, dy) || 1, s = e.phase === 3 ? 9.5 : 8; e.vx = dx / l * s; e.vy = dy / l * s; e.state = 'dash'; e.st = 36; G.audio.play('roar'); }
      } else if (e.state === 'dash') {
        e.facing = Math.sign(e.vx) || e.facing; e.vx *= 0.99; e.vy *= 0.99; if (e.t % 3 === 0) G.particles.spark(cx, cy, '#8a6bff');
        if (--e.st <= 0) { e.swoops--; if (e.swoops > 0) { e.state = 'windup'; e.st = 14; } else { e.state = 'hover'; e.cd = e.phase === 3 ? 45 : 80; } }
      } else if (e.state === 'sonic') {
        e.vx *= 0.9; e.vy *= 0.9; e.st--;
        if (e.st === 20) { const n = 8 + e.phase * 2; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + e.t * 0.01; C.proj({ kind: 'sonic', x: cx, y: cy, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, dmg: Math.round(e.dmg * 0.6), friendly: false, life: 170, w: 10, h: 10, ghost: true }); } G.audio.play('sonic'); G.camera.shake(3); }
        if (e.st <= 0) { e.state = 'hover'; e.cd = 70; }
      } else if (e.state === 'summon') {
        e.vx *= 0.9; e.vy *= 0.9;
        if (--e.st === 0) { let n = G.enemies.filter((q) => q.type === 'bat').length; for (let k = 0; k < 3 && n < 6; k++, n++) { const b = G.enemyMgr.spawn(G, 'bat', cx - 20 + k * 20, cy - 10, { biome: 'under', under: true }); b.aggro = 900; b.drops = []; b.vy = -2; } G.audio.play('roar'); }
        if (e.st <= -20) { e.state = 'hover'; e.cd = 70; } else if (e.st === 0) e.st = -1; else if (e.st < 0) e.st--;
      }
      e.x += e.vx; e.y += e.vy;
    },
    // ---- Sire dell'Abisso (volante, teletrasporto) ----
    sire(G, e, p) {
      const r = e.hp / e.maxhp; e.phase = r < 0.33 ? 3 : r < 0.66 ? 2 : 1; e.phase3 = e.phase === 3;
      const cx = e.x + e.w / 2, cy = e.y + e.h / 2, dx = p.cx - cx, dy = p.cy - cy, dist = Math.hypot(dx, dy) || 1;
      e.cd = (e.cd === undefined ? 70 : e.cd) - 1; e.facing = Math.sign(dx) || e.facing;
      const fire = (a, sp, mul, big) => C.proj({ kind: 'fireball', x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: Math.round(e.dmg * mul), friendly: false, life: 160, w: 10, h: 10, big, trail: '#ff9a3c' });
      if (e.state === 'enter' || e.state === 'float') {
        e.state = 'float'; e.alpha = Math.min(1, e.alpha + 0.05);
        const tx = p.cx + (dx > 0 ? -1 : 1) * 130, ty = p.cy - 90 + Math.sin(e.t * 0.04) * 20;
        e.vx = TF.lerp(e.vx, (tx - cx) * 0.03, 0.1); e.vy = TF.lerp(e.vy, (ty - cy) * 0.03, 0.1);
        if (e.cd <= 0) {
          const roll = Math.random(), opts = ['aim', 'burst', 'tele'].concat(e.phase >= 2 ? ['rain', 'rain'] : [], e.phase >= 3 ? ['summon'] : []);
          e.state = opts[(roll * opts.length) | 0]; e.st = 0;
        }
      } else if (e.state === 'aim') {
        e.vx *= 0.9; e.vy *= 0.9; e.st++;
        if (e.st === 20 || (e.phase >= 2 && e.st === 32)) { const a = Math.atan2(dy, dx); G.audio.play('magic'); for (let k = -1; k <= 1; k++) fire(a + k * 0.18, 4.8, 0.65); }
        if (e.st > 46) { e.state = 'float'; e.cd = e.phase === 3 ? 45 : 70; }
      } else if (e.state === 'burst') {
        e.vx *= 0.9; e.vy *= 0.9; e.st++;
        if (e.st === 24) { const n = 10 + e.phase * 3; for (let i = 0; i < n; i++) fire((i / n) * Math.PI * 2 + e.t * 0.02, 3.1, 0.55); G.audio.play('boom'); G.camera.shake(4); }
        if (e.st > 50) { e.state = 'float'; e.cd = 60; }
      } else if (e.state === 'tele') {
        e.st++; e.vx *= 0.8; e.vy *= 0.8;
        if (e.st <= 15) e.alpha = 1 - e.st / 15;
        if (e.st === 16) { const s = Math.random() < 0.5 ? -1 : 1; e.x = p.cx + s * (90 + Math.random() * 80) - e.w / 2; e.y = p.cy - 70 - Math.random() * 60; G.particles.burst(e.x + e.w / 2, e.y + 20, '#ff6a3c', 20, 3); }
        if (e.st > 16) e.alpha = Math.min(1, (e.st - 16) / 15);
        if (e.st === 34) { const n = 8; for (let i = 0; i < n; i++) fire((i / n) * Math.PI * 2, 3.6, 0.55); }
        if (e.st > 44) { e.state = 'float'; e.cd = 55; e.alpha = 1; }
      } else if (e.state === 'rain') {
        e.vx *= 0.9; e.vy *= 0.9; e.st++;
        if (e.st % 5 === 0 && e.st < 56) { const x = p.cx + (Math.random() - 0.5) * 460; C.proj({ kind: 'rain', x, y: p.cy - 230, vx: 0, vy: 5.2, dmg: Math.round(e.dmg * 0.6), friendly: false, life: 90, w: 8, h: 12, trail: '#ff9a3c' }); }
        if (e.st > 70) { e.state = 'float'; e.cd = 60; }
      } else if (e.state === 'summon') {
        e.vx *= 0.9; e.vy *= 0.9; e.st++;
        if (e.st === 25) { let n = G.enemies.filter((q) => !q.boss).length; for (let k = 0; k < 2 && n < 6; k++, n++) { const s = G.enemyMgr.spawn(G, k ? 'bat' : 'skeleton', cx - 20 + k * 40, cy + 10, { biome: 'deep', under: true }); s.aggro = 900; s.drops = []; } G.audio.play('roar'); }
        if (e.st > 50) { e.state = 'float'; e.cd = 70; }
      }
      e.x += e.vx; e.y += e.vy;
      if (e.t % 4 === 0) G.particles.spark(cx + (Math.random() - 0.5) * 24, cy + 10 + Math.random() * 20, '#ff7a3c');
    },
    onDeath(G, e) {
      const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
      G.player.stats.bosses[e.type] = true; G.progress.bosses[e.type] = true;
      for (let i = 0; i < 6; i++) setTimeout(() => { if (G.particles) G.particles.explosion(cx + (Math.random() - 0.5) * e.w, cy + (Math.random() - 0.5) * e.h, 26); }, i * 140);
      G.camera.shake(12); G.audio.play('bossdie');
      for (const [id, n] of DROPS[e.type]) { const it = TF.ITEMS[id]; if (it.stack > 1) { C.drop(G, id, n, cx + (Math.random() - 0.5) * 20, cy); } else for (let k = 0; k < n; k++) C.drop(G, id, 1, cx + (Math.random() - 0.5) * 20, cy); }
      G.ui.toast(WIN[e.type], 'boss');
      for (const q of G.enemies) if (!q.boss && !q.dead && q.drops && q.drops.length === 0) q.dead = true;
    },
  });
})(window.TF);
