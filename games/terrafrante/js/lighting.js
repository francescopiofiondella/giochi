'use strict';
// Terrafrante - illuminazione a tile con propagazione e sovrapposizione fluida
(function (TF) {
  const TS = TF.TS, TILES = TF.TILES, MAXR = 140 * 90;
  const DEC_AIR = 11, DEC_WALL = 17, DEC_SOLID = 50;
  class Lighting {
    constructor() {
      this.cv = document.createElement('canvas'); this.g = this.cv.getContext('2d');
      this.L = new Uint8Array(MAXR); this.D = new Uint8Array(MAXR);
      this.rx = 0; this.ry = 0; this.rw = 1; this.rh = 1; this.frame = 0; this.dirty = true;
      this.SOLID = TILES.map((t) => (t.solid && t.id !== TF.T.GLASS ? 1 : 0));
      this.EMIT = TILES.map((t) => t.light);
    }
    compute(G) {
      const cam = G.camera, w = G.world, M = 9;
      const rx = Math.max(0, Math.floor(cam.x / TS) - M), ry = Math.max(0, Math.floor(cam.y / TS) - M);
      const rw = Math.min(w.w - rx, Math.ceil(cam.viewW / TS) + 2 * M + 1), rh = Math.min(w.h - ry, Math.ceil(cam.viewH / TS) + 2 * M + 1);
      if (rw * rh > MAXR) return;
      this.rx = rx; this.ry = ry; this.rw = rw; this.rh = rh;
      const L = this.L, D = this.D, tiles = w.tiles, walls = w.walls, liq = w.liq, W = w.w;
      const sky = Math.round(255 * G.clock.daylight);
      for (let y = 0; y < rh; y++) {
        const wy = ry + y, row = wy * W;
        for (let x = 0; x < rw; x++) {
          const wx = rx + x, wi = row + wx, i = y * rw + x, t = tiles[wi];
          let v = this.EMIT[t];
          if (wy < w.skyY[wx] && !this.SOLID[t]) v = Math.max(v, sky);
          const lq = liq[wi]; if (lq && (lq >> 4) === 2) v = Math.max(v, 190);
          L[i] = v;
          D[i] = this.SOLID[t] ? DEC_SOLID : (walls[wi] ? DEC_WALL : DEC_AIR);
        }
      }
      // sorgenti dinamiche (giocatore, boss, proiettili luminosi)
      const add = (px, py, v) => { const x = Math.floor(px / TS) - rx, y = Math.floor(py / TS) - ry; if (x >= 0 && y >= 0 && x < rw && y < rh) { const i = y * rw + x; if (L[i] < v) L[i] = v; } };
      const p = G.player; add(p.cx, p.cy - 4, p.light); add(p.cx, p.y + 2, p.light);
      for (const e of G.enemies) if (e.glow) add(e.x + e.w / 2, e.y + e.h / 2, e.glow);
      for (const q of G.Combat.projectiles) if (q.trail || q.kind === 'fireball' || q.kind === 'rain') add(q.x, q.y, 170);
      for (const d of G.Combat.drops) add(d.x, d.y, 60);
      // propagazione (2 iterazioni, 4 direzioni)
      for (let it = 0; it < 2; it++) {
        for (let y = 0; y < rh; y++) { const b = y * rw; for (let x = 1; x < rw; x++) { const i = b + x, v = L[i - 1] - D[i]; if (v > L[i]) L[i] = v; } for (let x = rw - 2; x >= 0; x--) { const i = b + x, v = L[i + 1] - D[i]; if (v > L[i]) L[i] = v; } }
        for (let x = 0; x < rw; x++) { for (let y = 1; y < rh; y++) { const i = y * rw + x, v = L[i - rw] - D[i]; if (v > L[i]) L[i] = v; } for (let y = rh - 2; y >= 0; y--) { const i = y * rw + x, v = L[i + rw] - D[i]; if (v > L[i]) L[i] = v; } }
      }
      // pittura: colore ambiente + alpha di buio
      if (this.cv.width !== rw || this.cv.height !== rh) { this.cv.width = rw; this.cv.height = rh; this.img = this.g.createImageData(rw, rh); }
      const d = this.img.data, tint = G.clock.tint;
      for (let i = 0; i < rw * rh; i++) {
        const b = L[i] / 255, a = (1 - Math.pow(b, 0.68)) * 0.97 * 255, j = i * 4;
        d[j] = tint[0]; d[j + 1] = tint[1]; d[j + 2] = tint[2]; d[j + 3] = a;
      }
      this.g.putImageData(this.img, 0, 0);
    }
    draw(g, G) {
      if (TF.settings.light === 0) { const a = (1 - G.clock.daylight) * 0.5 * (G.player.cy / TS < G.world.surf[Math.floor(G.player.cx / TS)] + 5 ? 1 : 0); if (a > 0.01) { g.fillStyle = 'rgba(' + G.clock.tint.join(',') + ',' + a + ')'; g.fillRect(0, 0, G.camera.viewW, G.camera.viewH); } return; }
      if ((this.frame++ & 1) === 0 || this.dirty) { this.compute(G); this.dirty = false; }
      g.imageSmoothingEnabled = true;
      g.drawImage(this.cv, 0, 0, this.rw, this.rh, this.rx * TS - G.camera.ox, this.ry * TS - G.camera.oy, this.rw * TS, this.rh * TS);
      g.imageSmoothingEnabled = false;
    }
    at(G, tx, ty) { const x = tx - this.rx, y = ty - this.ry; return x >= 0 && y >= 0 && x < this.rw && y < this.rh ? this.L[y * this.rw + x] : 0; }
  }
  TF.Lighting = Lighting;
})(window.TF);
