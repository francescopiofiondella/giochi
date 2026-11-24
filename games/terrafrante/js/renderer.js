'use strict';
// Terrafrante - rendering: cielo, parallasse, chunk di tile in cache, entità, liquidi, effetti
(function (TF) {
  const TS = 16, CH = TF.CH, CPX = CH * TS, T = TF.T, TILES = TF.TILES, S = TF.Sprites;
  const SKY = [
    [0, [4, 6, 26], [16, 26, 58]], [4.6, [4, 6, 26], [16, 26, 58]], [5.8, [58, 74, 138], [255, 150, 106]], [7.6, [58, 142, 224], [168, 216, 255]],
    [16.4, [58, 142, 224], [168, 216, 255]], [18, [48, 44, 112], [255, 122, 74]], [19.6, [4, 6, 26], [16, 26, 58]], [24, [4, 6, 26], [16, 26, 58]],
  ];
  const HILLS = { forest: ['#4f8a52', '#3d7344', '#2e5a36'], desert: ['#e0c27a', '#cba85e', '#b08f48'], snow: ['#dbe8f2', '#b9d0e2', '#9ab8d0'], jungle: ['#3a9444', '#2c7a38', '#1f5e2c'], swamp: ['#5a7a58', '#486648', '#385238'], corrupt: ['#7a4a9a', '#613a7e', '#4a2c62'] };
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const css = (c) => 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')';

  class Renderer {
    constructor(canvas) {
      this.cv = canvas; this.g = canvas.getContext('2d'); this.g.imageSmoothingEnabled = false;
      this.chunks = new Map(); this.frame = 0; this.hill = HILLS.forest.map(hex);
      const r = TF.mulberry(99); this.stars = Array.from({ length: 90 }, () => [r(), r() * 0.7, r()]);
      this.clouds = Array.from({ length: 8 }, () => [r() * 1200, 20 + r() * 90, 30 + r() * 40, 0.1 + r() * 0.2]);
    }
    resize(w, h) { this.cv.width = w; this.cv.height = h; this.g.imageSmoothingEnabled = false; }
    reset() { this.chunks.clear(); }

    // ---- chunk di tile in cache ----
    chunk(G, cx, cy) {
      const key = cy * G.world.cw + cx; let c = this.chunks.get(key);
      if (!c) {
        if (this.chunks.size > 70) { let oldest = null, ok; for (const [k, v] of this.chunks) if (!oldest || v.used < oldest.used) { oldest = v; ok = k; } this.chunks.delete(ok); }
        const cv = document.createElement('canvas'); cv.width = cv.height = CPX; c = { cv, ver: -1, used: 0 }; this.chunks.set(key, c);
      }
      c.used = this.frame;
      const ver = G.world.chunkVer[key];
      if (c.ver !== ver) { this.paintChunk(G, c.cv, cx, cy); c.ver = ver; }
      return c.cv;
    }
    paintChunk(G, cv, cx, cy) {
      const w = G.world, g = cv.getContext('2d'), atlas = S.atlas, wa = S.wallAtlas, W = w.w;
      g.clearRect(0, 0, CPX, CPX);
      for (let ty = 0; ty < CH; ty++) for (let tx = 0; tx < CH; tx++) {
        const wx = cx * CH + tx, wy = cy * CH + ty; if (wx >= W || wy >= w.h) continue;
        const i = wy * W + wx, t = w.tiles[i], wl = w.walls[i], def = TILES[t], px = tx * TS, py = ty * TS;
        const v = (TF.hash(wx, wy, 7) * 4) | 0;
        if (wl && (!def.solid || t === T.GLASS || def.plat)) { const s = wl * S.V + v; g.drawImage(wa, (s % 32) * 16, ((s / 32) | 0) * 16, 16, 16, px, py, 16, 16); }
        if (!t) continue;
        let id = t, vv = v;
        if (TF.GRASS_BASE[t] && TILES[w.get(wx, wy - 1)].solid) id = TF.GRASS_BASE[t];
        if (def.interact === 'door') vv = TILES[w.get(wx, wy - 1)].interact === 'door' ? 1 : 0;
        const s = id * S.V + vv; g.drawImage(atlas, (s % 32) * 16, ((s / 32) | 0) * 16, 16, 16, px, py, 16, 16);
        if (def.solid && !def.plat && t !== T.GLASS) {
          const up = !TILES[w.get(wx, wy - 1)].solid, dn = !TILES[w.get(wx, wy + 1)].solid, lf = !TILES[w.get(wx - 1, wy)].solid, rt = !TILES[w.get(wx + 1, wy)].solid;
          if (up || dn || lf || rt) {
            g.fillStyle = 'rgba(0,0,0,0.32)';
            if (dn) g.fillRect(px, py + 15, 16, 1); if (lf) g.fillRect(px, py, 1, 16); if (rt) g.fillRect(px + 15, py, 1, 16);
            if (up) { g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(px, py, 16, 1); }
          }
        }
      }
    }

    // ---- cielo e parallasse ----
    skyColors(h) {
      for (let i = 1; i < SKY.length; i++) if (h <= SKY[i][0]) { const a = SKY[i - 1], b = SKY[i], t = (h - a[0]) / (b[0] - a[0]); return [mix(a[1], b[1], t), mix(a[2], b[2], t)]; }
      return [SKY[0][1], SKY[0][2]];
    }
    sky(G) {
      const g = this.g, cam = G.camera, W = cam.viewW, H = cam.viewH, h = G.clock.h;
      const cx = TF.clamp(Math.floor((cam.x + W / 2) / TS), 0, G.world.w - 1), surf = G.world.surf[cx];
      const depth = (cam.y + H / 2) / TS - surf;
      if (depth > 34) { g.fillStyle = '#0a0a12'; g.fillRect(0, 0, W, H); return; }
      const [top, bot] = this.skyColors(h), grd = g.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, css(top)); grd.addColorStop(1, css(bot)); g.fillStyle = grd; g.fillRect(0, 0, W, H);
      const nightAmt = 1 - G.clock.daylightN;
      if (nightAmt > 0.05) for (const s of this.stars) { g.globalAlpha = nightAmt * (0.4 + 0.6 * Math.abs(Math.sin(this.frame * 0.02 + s[2] * 20))); g.fillStyle = '#fff'; g.fillRect((s[0] * W) | 0, (s[1] * H) | 0, 1 + (s[2] > 0.9), 1 + (s[2] > 0.9)); }
      g.globalAlpha = 1;
      // sole e luna
      const sf = (h - 5.5) / 13;
      if (sf > -0.05 && sf < 1.05) { const x = W * (0.08 + 0.84 * sf), y = H * 0.62 - Math.sin(Math.PI * TF.clamp(sf, 0, 1)) * H * 0.5; g.fillStyle = 'rgba(255,230,140,0.25)'; g.fillRect(x - 14, y - 14, 28, 28); g.fillStyle = '#ffe27a'; g.fillRect(x - 8, y - 8, 16, 16); g.fillStyle = '#fff6c0'; g.fillRect(x - 5, y - 5, 10, 10); }
      const mf = ((h < 5.5 ? h + 24 : h) - 18.5) / 11;
      if (mf > -0.05 && mf < 1.05) { const x = W * (0.08 + 0.84 * mf), y = H * 0.62 - Math.sin(Math.PI * TF.clamp(mf, 0, 1)) * H * 0.5; g.fillStyle = '#dfe6f5'; g.fillRect(x - 7, y - 7, 14, 14); g.fillStyle = '#b8c2dc'; g.fillRect(x - 3, y - 3, 3, 3); g.fillRect(x + 2, y + 1, 3, 3); g.fillStyle = bot ? css(top) : '#000'; g.fillRect(x + 3, y - 7, 4, 14); }
      // nuvole
      g.fillStyle = 'rgba(255,255,255,' + (0.1 + 0.55 * G.clock.daylightN).toFixed(2) + ')';
      for (const c of this.clouds) { const x = ((c[0] + this.frame * c[3] * 0.3 - cam.x * 0.15) % (W + 160) + W + 160) % (W + 160) - 80, y = c[1] - (cam.y - surf * TS) * 0.05 + 10; g.fillRect(x, y, c[2], 8); g.fillRect(x + 8, y - 5, c[2] * 0.6, 6); g.fillRect(x + 4, y + 6, c[2] * 0.8, 4); }
      // colline per bioma
      const key = TF.BIOMES[G.world.biome[cx]].key, tgt = (HILLS[key] || HILLS.forest).map(hex);
      for (let i = 0; i < 3; i++) this.hill[i] = mix(this.hill[i], tgt[i], 0.03);
      const base = surf * TS - cam.y;
      for (let l = 0; l < 3; l++) {
        const f = 0.15 + l * 0.12; g.fillStyle = css(this.hill[l]);
        for (let x = 0; x < W; x += 4) { const wx = x + cam.x * f, hh = 26 + l * 6 + Math.sin(wx * 0.011 + l * 2) * 16 + Math.sin(wx * 0.029 + l) * 8; const y = base - hh + (l - 2) * -2; g.fillRect(x, y, 4, H - y); }
      }
    }

    // ---- passaggio principale ----
    draw(G) {
      const g = this.g, cam = G.camera, W = cam.viewW, H = cam.viewH, w = G.world, ox = cam.ox, oy = cam.oy;
      this.frame++;
      this.sky(G);
      // chunk visibili
      const c0 = Math.max(0, Math.floor(ox / CPX)), c1 = Math.min(w.cw - 1, Math.floor((ox + W) / CPX)), r0 = Math.max(0, Math.floor(oy / CPX)), r1 = Math.min(w.chh - 1, Math.floor((oy + H) / CPX));
      for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) g.drawImage(this.chunk(G, cx, cy), cx * CPX - ox, cy * CPX - oy);
      this.torches(G, ox, oy);
      this.entities(G, ox, oy);
      this.liquids(G, ox, oy);
      G.particles.draw(g, ox, oy);
      this.cursor(G, ox, oy);
      for (const t of G.Combat.texts) S.drawNum(g, t.text, t.x - ox, t.y - oy, t.color);
      // sott'acqua
      const cx = Math.floor((cam.x + W / 2) / TS), cy = Math.floor((cam.y + H / 2) / TS);
      if (w.liqLevel(cx, cy) > 3) { g.fillStyle = w.liqType(cx, cy) === 1 ? 'rgba(30,90,200,0.22)' : 'rgba(255,90,20,0.35)'; g.fillRect(0, 0, W, H); }
      G.lighting.draw(g, G);
      if (G.player.flash > 0 && G.player.hp < G.player.maxhp * 0.3 && !G.player.dead) { g.fillStyle = 'rgba(200,0,0,' + (0.1 + 0.1 * Math.sin(this.frame * 0.3)) + ')'; g.fillRect(0, 0, W, H); }
    }
    torches(G, ox, oy) {
      if (!TF.settings.particles || this.frame % 6) return;
      const w = G.world, x0 = Math.floor(ox / TS), y0 = Math.floor(oy / TS), x1 = x0 + Math.ceil(G.camera.viewW / TS) + 1, y1 = y0 + Math.ceil(G.camera.viewH / TS) + 1;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const t = w.get(x, y); if ((t === T.TORCH || t === T.FURNACE) && Math.random() < 0.3) G.particles.spark(x * TS + 8, y * TS + 4, '#ffb84a'); }
    }
    entities(G, ox, oy) {
      const g = this.g, W = G.camera.viewW, H = G.camera.viewH, time = performance.now();
      const vis = (x, y, w, h) => x + w > ox - 20 && x < ox + W + 20 && y + h > oy - 20 && y < oy + H + 20;
      for (const e of G.enemies) {
        if (e.parts) {
          e.parts.forEach((p, i) => { if (vis(p.x, p.y, 11, 11)) S.drawEnemy(g, { type: 'worm', head: p.head, tint: e.tint, flash: e.flash, facing: 1, w: 11, noFlip: true, draw: 'worm' }, p.x - ox, p.y - oy, time); });
        } else if (vis(e.x, e.y, e.w + 20, e.h)) {
          if (e.boss) S.drawBoss(g, e, e.x - ox, e.y - oy, time); else S.drawEnemy(g, e, e.x - ox, e.y - oy, time);
          if (!e.boss && e.hp < e.maxhp) { const bw = Math.max(14, e.w), bx = Math.round(e.x - ox + e.w / 2 - bw / 2), by = Math.round(e.y - oy - 6); g.fillStyle = '#000'; g.fillRect(bx - 1, by - 1, bw + 2, 4); g.fillStyle = '#4a1a1a'; g.fillRect(bx, by, bw, 2); g.fillStyle = e.hp / e.maxhp > 0.4 ? '#5ae05a' : '#e05a3a'; g.fillRect(bx, by, Math.max(1, Math.round(bw * e.hp / e.maxhp)), 2); }
          if (e.type === 'guardian' && e.charge > 0) { g.fillStyle = 'rgba(255,100,40,' + (0.3 + 0.3 * Math.sin(time * 0.05)) + ')'; g.fillRect(Math.round(e.x - ox), Math.round(e.y - oy), e.w, e.h); }
        }
      }
      for (const d of G.Combat.drops) { if (!vis(d.x, d.y, 8, 8)) continue; const bob = Math.sin((d.age + d.x) * 0.1) * 1.2; g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(Math.round(d.x - ox), Math.round(d.y - oy + 9), 8, 2); g.drawImage(S.icon(d.id), Math.round(d.x - ox - 2), Math.round(d.y - oy - 3 + bob), 12, 12); }
      for (const q of G.Combat.projectiles) { if (vis(q.x - 8, q.y - 8, 16, 16)) S.drawProj(g, q, q.x - ox, q.y - oy, time); }
      const p = G.player;
      if (p.hook) { const h = p.hook; g.strokeStyle = '#d9c9a0'; g.lineWidth = 1; g.beginPath(); g.moveTo(Math.round(p.cx - ox), Math.round(p.y + 10 - oy)); g.lineTo(Math.round(h.x - ox), Math.round(h.y - oy)); g.stroke(); g.fillStyle = h.state === 'stuck' ? '#fff' : '#9aa0ac'; g.fillRect(Math.round(h.x - ox) - 2, Math.round(h.y - oy) - 2, 4, 4); }
      if (!p.dead && !(p.invT > 0 && (this.frame >> 2) % 2 && p.invT < 40 && p.flash > 0 && false)) {
        if (!(p.flash > 0 && (this.frame >> 2) & 1)) S.drawPlayer(g, p, p.x - ox, p.y - oy, time);
      }
    }
    liquids(G, ox, oy) {
      const g = this.g, w = G.world, W = G.camera.viewW, H = G.camera.viewH, x0 = Math.max(0, Math.floor(ox / TS)), y0 = Math.max(0, Math.floor(oy / TS)), x1 = Math.min(w.w - 1, x0 + Math.ceil(W / TS) + 1), y1 = Math.min(w.h - 1, y0 + Math.ceil(H / TS) + 1), t = this.frame;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const v = w.liq[y * w.w + x]; if (!v) continue;
        const type = v >> 4, l = v & 15, above = w.liq[(y - 1) * w.w + x] >> 4 === type && y > 0 && w.liq[(y - 1) * w.w + x] !== 0;
        const h = above ? 16 : Math.max(2, Math.round((l / 15) * 16)), px = x * TS - ox, py = y * TS - oy + 16 - h;
        if (type === 1) { g.fillStyle = 'rgba(48,110,220,0.6)'; g.fillRect(px, py, 16, h); if (!above) { g.fillStyle = 'rgba(160,210,255,0.55)'; g.fillRect(px, py, 16, 1); g.fillRect(px + ((x * 5 + (t >> 3)) % 12), py + 1, 3, 1); } }
        else { g.fillStyle = '#e8501a'; g.fillRect(px, py, 16, h); g.fillStyle = '#ffb030'; g.fillRect(px + ((x * 7 + (t >> 3)) % 11), py + (above ? 5 : 1), 4, 1); if (!above) { g.fillStyle = '#ffe070'; g.fillRect(px, py, 16, 1); } }
      }
    }
    cursor(G, ox, oy) {
      const p = G.player, g = this.g; if (p.dead || G.ui.blocking || G.state !== 'play') return;
      const [tx, ty] = p.cursorTile(G), reach = p.inReach(tx, ty), px = tx * TS - ox, py = ty * TS - oy;
      const held = G.inv.selected(), it = held ? TF.ITEMS[held.id] : null;
      if (it && (it.type === 'block' || it.type === 'wall') && reach) { g.globalAlpha = 0.4; g.drawImage(S.icon(it.id), px, py); g.globalAlpha = 1; }
      if (p.mine && p.mine.prog > 0) { g.drawImage(S.cracks[Math.min(4, Math.floor(p.mine.prog * 5))], p.mine.tx * TS - ox, p.mine.ty * TS - oy); }
      g.strokeStyle = reach ? 'rgba(255,255,255,0.85)' : 'rgba(255,70,70,0.7)'; g.lineWidth = 1; g.strokeRect(px + 0.5, py + 0.5, 15, 15);
    }
  }
  TF.Renderer = Renderer;
})(window.TF);
