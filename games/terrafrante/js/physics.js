'use strict';
// Terrafrante - fisica AABB contro la griglia di tile (collisioni, piattaforme, liquidi, ambiente)
(function (TF) {
  const TS = TF.TS, TILES = TF.TILES;
  const BLOCK = TILES.map((t) => t.solid && !t.plat);
  const P = (TF.Physics = {
    GRAV: 0.38, MAXFALL: 11,
    // tile bloccante per le collisioni orizzontali / verticali
    block(world, tx, ty) { return BLOCK[world.get(tx, ty)]; },
    solidAtPx(world, px, py) { return BLOCK[world.get(Math.floor(px / TS), Math.floor(py / TS))]; },
    rectSolid(world, x, y, w, h) {
      const x0 = Math.floor(x / TS), x1 = Math.floor((x + w - 0.001) / TS), y0 = Math.floor(y / TS), y1 = Math.floor((y + h - 0.001) / TS);
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (BLOCK[world.get(tx, ty)]) return true;
      return false;
    },
    // muove l'entità e risolve le collisioni; restituisce impatto verticale (velocità prima dell'atterraggio)
    move(e, world, opts) {
      opts = opts || {};
      e.hitX = false; e.hitCeil = false; let landV = 0;
      let vx = TF.clamp(e.vx, -15, 15), vy = TF.clamp(e.vy, -15, 15);
      // --- asse X ---
      if (vx !== 0) {
        e.x += vx;
        const dir = vx > 0 ? 1 : -1;
        const ty0 = Math.floor(e.y / TS), ty1 = Math.floor((e.y + e.h - 0.001) / TS);
        const tx = dir > 0 ? Math.floor((e.x + e.w - 0.001) / TS) : Math.floor(e.x / TS);
        let top = -1;
        for (let ty = ty0; ty <= ty1; ty++) if (BLOCK[world.get(tx, ty)]) { top = ty; break; }
        if (top >= 0) {
          const stepH = e.y + e.h - top * TS;
          if (opts.step && e.onGround && stepH <= TS + 0.5 && !P.rectSolid(world, e.x, e.y - stepH - 0.1, e.w, e.h)) { e.y -= stepH + 0.05; e.vy = 0; }
          else { e.x = dir > 0 ? tx * TS - e.w : (tx + 1) * TS; e.vx = 0; e.hitX = true; }
        }
        if (e.x < 0) { e.x = 0; e.vx = 0; }
        if (e.x + e.w > world.w * TS) { e.x = world.w * TS - e.w; e.vx = 0; }
      }
      // --- asse Y ---
      const prevBottom = e.y + e.h;
      e.y += vy; e.onGround = false;
      const x0 = Math.floor(e.x / TS), x1 = Math.floor((e.x + e.w - 0.001) / TS);
      if (vy >= 0) {
        const ty = Math.floor((e.y + e.h - 0.001) / TS);
        for (let tx = x0; tx <= x1; tx++) {
          const id = world.get(tx, ty);
          if (BLOCK[id] || (TILES[id].plat && !e.drop && prevBottom <= ty * TS + 0.01 && vy > 0) || (TILES[id].plat && !e.drop && prevBottom <= ty * TS + 0.01)) {
            landV = e.vy; e.y = ty * TS - e.h; e.vy = 0; e.onGround = true; break;
          }
        }
      } else {
        const ty = Math.floor(e.y / TS);
        for (let tx = x0; tx <= x1; tx++) if (BLOCK[world.get(tx, ty)]) { e.y = (ty + 1) * TS; e.vy = 0; e.hitCeil = true; break; }
      }
      if (e.y < 0) { e.y = 0; e.vy = 0; }
      return landV;
    },
    // ambiente attorno all'entità: liquidi, rampicabili, spine, ragnatele
    env(e, world) {
      const x0 = Math.floor(e.x / TS), x1 = Math.floor((e.x + e.w - 0.001) / TS), y0 = Math.floor(e.y / TS), y1 = Math.floor((e.y + e.h - 0.001) / TS);
      const r = { water: 0, lava: 0, climb: false, web: false, hurt: 0, head: false };
      let rows = 0, wet = 0, hot = 0;
      for (let ty = y0; ty <= y1; ty++) {
        rows++; let ww = false, ll = false;
        for (let tx = x0; tx <= x1; tx++) {
          const lv = world.liqLevel(tx, ty);
          if (lv >= 2 || (lv >= 1 && ty < y1)) { if (world.liqType(tx, ty) === 1) ww = true; else ll = true; }
          const t = TILES[world.get(tx, ty)];
          if (t.climb) r.climb = true; if (t.slow) r.web = true; if (t.hurt && t.hurt > r.hurt) r.hurt = t.hurt;
        }
        if (ww) wet++; if (ll) hot++;
      }
      r.water = wet / rows; r.lava = hot / rows;
      const hy = Math.floor((e.y + 3) / TS), hx = Math.floor((e.x + e.w / 2) / TS);
      r.head = world.liqLevel(hx, hy) >= 3 && world.liqType(hx, hy) === 1;
      return r;
    },
  });
})(window.TF);
