'use strict';
// Terrafrante - vegetazione, dungeon, rifugi, scrigni e tesori
(function (TF) {
  const T = TF.T, W = TF.W;

  const LOOT = {
    hut: [['torch', 6, 12, 1], ['wood', 10, 30, 0.8], ['potion_heal_s', 1, 3, 0.7], ['rope', 10, 20, 0.5], ['copper_bar', 3, 8, 0.5], ['arrow', 20, 40, 0.4], ['bottle', 3, 6, 0.4], ['gel', 5, 15, 0.5]],
    cabin: [['torch', 8, 16, 0.9], ['iron_bar', 4, 10, 0.7], ['potion_heal_s', 1, 4, 0.7], ['potion_mana', 1, 3, 0.5], ['arrow', 30, 60, 0.5], ['rope', 15, 30, 0.5], ['crystal', 3, 8, 0.4], ['gold_bar', 3, 7, 0.35], ['mana_crystal', 1, 1, 0.08], ['boots_speed', 1, 1, 0.07], ['spring_boot', 1, 1, 0.07], ['potion_iron', 1, 2, 0.3], ['potion_mining', 1, 2, 0.3]],
    dungeon: [['torch', 10, 20, 0.9], ['bone', 10, 25, 0.8], ['gold_bar', 4, 10, 0.7], ['iron_bar', 6, 12, 0.6], ['potion_heal_l', 2, 4, 0.8], ['potion_mana', 2, 5, 0.6], ['cloth', 4, 10, 0.5], ['crystal_shield', 1, 1, 0.12], ['miner_glove', 1, 1, 0.12], ['boots_speed', 1, 1, 0.15], ['spring_boot', 1, 1, 0.15], ['vital_ring', 1, 1, 0.06], ['lantern_charm', 1, 1, 0.1], ['life_crystal', 1, 1, 0.1], ['potion_speed', 1, 3, 0.4]],
  };
  TF.LOOT = LOOT;
  function fillChest(chest, table, rng, force) {
    let n = 0;
    const put = (id, q) => { if (n < chest.slots.length) chest.slots[n++] = { id, n: q }; };
    for (const f of force || []) put(f, 1);
    for (const [id, a, b, p] of table) if (rng() < p) put(id, a + Math.floor(rng() * (b - a + 1)));
  }

  async function build(ctx, progress) {
    const { world, rng, ri, SOL, cx } = ctx;
    const w = world.w, h = world.h, tiles = world.tiles, walls = world.walls, surf = world.surf, biome = world.biome, liq = world.liq;
    const step = async (p, m) => { if (progress) progress(p, m); await TF.yieldUI(); };
    const air = (x, y) => tiles[y * w + x] === 0;
    const setT = (x, y, t) => { if (x > 0 && y > 0 && x < w - 1 && y < h - 4) { tiles[y * w + x] = t; liq[y * w + x] = 0; } };
    const setW = (x, y, t) => { if (x > 0 && y > 0 && x < w - 1 && y < h - 4) walls[y * w + x] = t; };
    const inDungeon = (x, y) => { const d = world.dungeon; return d && x >= d.x0 - 3 && x <= d.x1 + 3 && y >= d.y0 - 3 && y <= d.y1 + 3; };

    // --- Dungeon ---
    await step(0.55, 'Erigo il dungeon…');
    const cols = 10, rows = 8, cw = 14, rh = 10, dw = cols * cw + 2, dh = rows * rh + 2;
    const bx0 = Math.floor(w * 0.04);
    const x0 = ctx.flip ? w - 1 - (bx0 + dw) : bx0;
    let maxS = 0; for (let x = x0; x <= x0 + dw; x++) maxS = Math.max(maxS, surf[x]);
    const y0 = Math.max(300, maxS + 80);
    world.dungeon = { x0, y0, x1: x0 + dw, y1: y0 + dh };
    for (let y = y0; y <= y0 + dh; y++) for (let x = x0; x <= x0 + dw; x++) { setT(x, y, T.DUNGEON); setW(x, y, W.DUNGEON); liq[y * w + x] = 0; }
    const room = (c, r) => ({ ix: x0 + 1 + c * cw + 1, iy: y0 + 1 + r * rh + 1 });
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const { ix, iy } = room(c, r); for (let y = iy; y < iy + rh - 2; y++) for (let x = ix; x < ix + cw - 2; x++) setT(x, y, 0); }
    const joined = new Set(), vis = new Set(), key = (c, r) => c + ',' + r;
    const join = (c1, r1, c2, r2) => {
      joined.add(key(c1, r1) + '-' + key(c2, r2)); joined.add(key(c2, r2) + '-' + key(c1, r1));
      const a = room(c1, r1), b = room(c2, r2);
      if (r1 === r2) { const L = c1 < c2 ? a : b; for (let y = L.iy + 5; y < L.iy + 8; y++) for (let x = L.ix + cw - 2; x < L.ix + cw; x++) setT(x, y, 0); }
      else {
        const U = r1 < r2 ? a : b, D = r1 < r2 ? b : a, mx = D.ix + 6;
        for (let y = U.iy + rh - 2; y < U.iy + rh; y++) for (let x = mx - 2; x <= mx + 2; x++) setT(x, y, 0);
        for (let x = mx - 3; x <= mx - 1; x++) setT(x, D.iy + 4, T.PLATFORM);
        for (let x = mx + 1; x <= mx + 3; x++) setT(x, D.iy + 1, T.PLATFORM);
        for (let x = mx - 2; x <= mx; x++) setT(x, U.iy + 5, T.PLATFORM);
      }
    };
    const stack = [[ri(0, cols - 1), 0]]; vis.add(key(stack[0][0], 0));
    while (stack.length) {
      const [c, r] = stack[stack.length - 1];
      const nb = [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < cols && b < rows && !vis.has(key(a, b)));
      if (!nb.length) { stack.pop(); continue; }
      const [nc, nr] = nb[(rng() * nb.length) | 0]; vis.add(key(nc, nr)); join(c, r, nc, nr); stack.push([nc, nr]);
    }
    for (let k = 0; k < cols * rows * 0.5; k++) { // anelli extra
      const c = ri(0, cols - 2), r = ri(0, rows - 2), horiz = rng() < 0.5, c2 = horiz ? c + 1 : c, r2 = horiz ? r : r + 1;
      if (!joined.has(key(c, r) + '-' + key(c2, r2))) join(c, r, c2, r2);
    }
    const chestRooms = []; const guaranteed = ri(0, 3);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const { ix, iy } = room(c, r), fy = iy + rh - 3;
      if (rng() < 0.7) { setT(ix + 1, iy + 3, T.TORCH); setT(ix + cw - 4, iy + 3, T.TORCH); }
      if (rng() < 0.25) setT(ix, iy, T.COBWEB);
      if (rng() < 0.2) setT(ix + cw - 3, iy, T.COBWEB);
      if (rng() < 0.35 && r > 0) chestRooms.push([ix + ri(2, cw - 5), fy]);
    }
    let gi = 0;
    for (const [x, y] of chestRooms) {
      if (!air(x, y)) continue;
      setT(x, y, T.CHEST); const ch = world.makeChest(x, y);
      fillChest(ch, LOOT.dungeon, rng, gi === guaranteed || chestRooms.length < 3 ? ['cloud_ring'] : null); gi++;
    }
    // ingresso: scala diagonale dalla superficie
    const ent = room(Math.floor(cols / 2), 0), xt = ent.ix + 6, dir = ctx.flip ? -1 : 1;
    for (let y = y0; y < y0 + 4; y++) for (let x = xt - 2; x <= xt + 2; x++) setT(x, y, 0);
    for (let t = 0; t < 400; t++) {
      const px = xt + dir * t, py = y0 - t;
      if (px < 6 || px > w - 6) break;
      ctx.carveCircle(px, py, 2.6);
      if (py <= surf[px] - 1) break;
    }
    for (let t = 0; t < 400; t += 8) { const px = xt + dir * t, py = y0 - t + 2; if (py > surf[TF.clamp(px, 0, w - 1)] + 3 && air(px, py) && !air(px, py + 1)) setT(px, py, T.TORCH); }

    // --- stanze (rifugi di superficie e cabine sotterranee) ---
    await step(0.65, 'Costruisco rifugi e tesori…');
    const buildRoom = (x, floorY, rw, rh2, style, lootKey, surface) => {
      const T1 = style === 'brick' ? T.STONEBRICK : T.PLANKS, W1 = style === 'brick' ? W.BRICK : W.PLANKS;
      for (let yy = floorY - rh2 - 1; yy <= floorY + 1; yy++) for (let xx = x - 1; xx <= x + rw; xx++) {
        const edge = xx === x - 1 || xx === x + rw || yy === floorY - rh2 - 1 || yy === floorY + 1;
        setT(xx, yy, edge ? T1 : 0); setW(xx, yy, W1);
      }
      if (surface) for (let xx = x - 1; xx <= x + rw; xx++) for (let yy = floorY + 2; yy < h && !SOL[tiles[yy * w + xx]]; yy++) setT(xx, yy, T.DIRT);
      const side = rng() < 0.5 ? x - 1 : x + rw;
      if (surface) { setT(side, floorY, T.DOOR_C); setT(side, floorY - 1, T.DOOR_C); } else { setT(side, floorY, 0); setT(side, floorY - 1, 0); }
      setT(x + 1, floorY - rh2 + 1, T.TORCH); setT(x + rw - 2, floorY - rh2 + 1, T.TORCH);
      const cxp = x + 1 + ri(1, Math.max(1, rw - 4)); setT(cxp, floorY, T.CHEST);
      fillChest(world.makeChest(cxp, floorY), LOOT[lootKey], rng);
      if (rng() < 0.6) { const bxp = cxp + (cxp + 3 < x + rw ? 2 : -2); if (air(bxp, floorY) && bxp > x && bxp < x + rw) setT(bxp, floorY, surface ? T.BENCH : (rng() < 0.5 ? T.ANVIL : T.FURNACE)); }
    };
    let huts = 0;
    for (let k = 0; k < 400 && huts < 9; k++) {
      const x = ri(30, w - 40), rw = ri(7, 10), b = biome[x];
      if (Math.abs(x - cx) < 14 && huts > 0) continue;
      if (b === 5 || b === 4 || inDungeon(x, surf[x] + 5)) continue;
      let mn = 999, mx = 0, wet = false; for (let xx = x - 1; xx <= x + rw; xx++) { mn = Math.min(mn, surf[xx]); mx = Math.max(mx, surf[xx]); if (liq[(surf[xx] - 1) * w + xx]) wet = true; }
      if (mx - mn > 2 || wet) continue;
      buildRoom(x, mx - 1, rw, 5, 'planks', 'hut', true); huts++;
      for (let xx = x - 1; xx <= x + rw; xx++) { surf[xx] = Math.min(surf[xx], mx - 1); }
    }
    let cab = 0;
    for (let k = 0; k < 6000 && cab < 42; k++) {
      const x = ri(14, w - 20), y = ri(BASEY(surf[x]) + 40, world.deepY + 90), rw = ri(9, 13);
      if (inDungeon(x, y) || !air(x, y) || SOL[tiles[(y + 1) * w + x]] === 0) continue;
      if (world.dungeon && Math.abs(x - world.dungeon.x0) < 20) continue;
      buildRoom(x - 4, y, rw, 5, y > 330 ? 'brick' : 'planks', 'cabin', false); cab++;
    }
    function BASEY(s) { return s; }

    // --- alberi e vegetazione ---
    await step(0.8, 'Faccio crescere la foresta…');
    const hasLiq = (x, y) => liq[y * w + x] !== 0;
    const put = (x, y, t) => { if (x > 0 && x < w - 1 && y > 1 && air(x, y)) tiles[y * w + x] = t; };
    const blob = (x, y, rx, ry, t) => { for (let dy = -ry; dy <= ry; dy++) for (let dx = -rx; dx <= rx; dx++) if ((dx * dx) / (rx * rx + 0.5) + (dy * dy) / (ry * ry + 0.5) <= 1.05) put(x + dx, y + dy, t); };
    const trunk = (x, s, ht, t) => { for (let k = 1; k <= ht; k++) { if (!air(x, s - k)) return k - 1; tiles[(s - k) * w + x] = t; } return ht; };
    let x = 3;
    while (x < w - 4) {
      const b = biome[x], s = surf[x];
      const gap = [ri(4, 9), ri(10, 26), ri(4, 8), ri(3, 6), ri(5, 10), ri(9, 24)][b];
      x += gap;
      if (x >= w - 4 || Math.abs(x - cx) < 6) continue;
      const bb = biome[x], ss = surf[x], g = tiles[ss * w + x];
      if (!SOL[g] || hasLiq(x, ss - 1) || !air(x, ss - 1) || tiles[(ss - 1) * w + x - 1] === T.CHEST) continue;
      if (inDungeon(x, ss)) continue;
      if (bb === 0) { const ht = trunk(x, ss, ri(7, 12), T.TRUNK); if (ht > 3) blob(x, ss - ht - 1, 3, 3, T.LEAF); }
      else if (bb === 2) { const ht = trunk(x, ss, ri(8, 14), T.TRUNK); for (let k = 0; k < ht - 2; k++) for (let dx = -Math.min(3, (k + 1) >> 1); dx <= Math.min(3, (k + 1) >> 1); dx++) put(x + dx, ss - ht - 1 + k, T.PINE); }
      else if (bb === 3) { const ht = trunk(x, ss, ri(12, 20), T.TRUNK_J); if (ht > 6) { blob(x, ss - ht - 1, 5, 2, T.JLEAF); for (let k = 0; k < 3; k++) { const vx = x + ri(-4, 4); for (let vy = 0; vy < ri(2, 6); vy++) put(vx, ss - ht + 1 + vy, T.VINE); } } }
      else if (bb === 4) { const ht = trunk(x, ss, ri(5, 9), T.TRUNK_D); if (ht > 3) { blob(x, ss - ht - 1, 3, 2, T.SLEAF); for (let k = -2; k <= 2; k += 2) for (let vy = 0; vy < ri(1, 4); vy++) put(x + k, ss - ht + 1 + vy, T.VINE); } }
      else if (bb === 5) { const ht = trunk(x, ss, ri(4, 9), T.TRUNK_D); if (ht > 3) { blob(x + 1, ss - ht, 1, 1, T.CLEAF); blob(x - 2, ss - ht + 2, 1, 1, T.CLEAF); } }
      else if (bb === 1) { trunk(x, ss, ri(3, 6), T.CACTUS); }
    }
    for (let xx = 2; xx < w - 2; xx++) {
      const s = surf[xx], g = tiles[s * w + xx], b = biome[xx];
      if (!air(xx, s - 1) || hasLiq(xx, s - 1) || inDungeon(xx, s)) continue;
      const r = rng();
      if (g === T.GRASS || g === T.JGRASS || g === T.MOSS) { if (r < 0.4) tiles[(s - 1) * w + xx] = T.TUFT; else if (r < 0.46 && b === 0) tiles[(s - 1) * w + xx] = T.FLOWER; }
      else if (g === T.CGRASS && r < 0.2) tiles[(s - 1) * w + xx] = T.THORN;
    }
    // vegetazione nelle caverne + ragnatele
    for (let xx = 2; xx < w - 2; xx++) {
      const b = biome[xx], s = surf[xx];
      for (let y = s + 22; y < world.deepY + 120; y++) {
        const i = y * w + xx, t = tiles[i];
        if (!SOL[t] || t === T.CRYSTAL || t === T.ICE) continue;
        if (tiles[i - w] === 0 && !liq[i - w]) { if (rng() < 0.012) tiles[i - w] = T.MUSHROOM; }
        else if (tiles[i + w] === 0 && !liq[i + w] && (b === 3 || b === 4) && rng() < 0.1) { const L = ri(1, 6); for (let k = 1; k <= L && tiles[i + k * w] === 0; k++) tiles[i + k * w] = T.VINE; }
        else if (tiles[i + w] === 0 && !liq[i + w] && y > s + 50 && rng() < 0.012 && (SOL[tiles[i + 1 + w]] || SOL[tiles[i - 1 + w]] || tiles[i + 2 * w] === 0)) tiles[i + w] = T.COBWEB;
      }
    }
    // cristalli di vita / arcani
    const crystal = (t, count, ymin, ymax) => {
      for (let k = 0, n = 0; k < 20000 && n < count; k++) {
        const xx = ri(5, w - 6), y = ri(ymin(xx), ymax);
        const i = y * w + xx;
        if (tiles[i] !== 0 || liq[i] || !SOL[tiles[i + w]] || tiles[i + w] === T.BEDROCK || inDungeon(xx, y) || walls[i] === 0) continue;
        tiles[i] = t; n++;
      }
    };
    crystal(T.LIFE_CRYSTAL, 28, (xx) => surf[xx] + 50, world.deepY + 120);
    crystal(T.MANA_CRYSTAL, 12, (xx) => surf[xx] + 120, h - 60);

    // --- rifinitura ---
    for (let i = 0; i < tiles.length; i++) if (liq[i] && SOL[tiles[i]]) liq[i] = 0;
    for (let xx = 0; xx < w; xx++) { tiles[(h - 1) * w + xx] = T.BEDROCK; tiles[(h - 2) * w + xx] = T.BEDROCK; }
    for (let yy = 0; yy < h; yy++) { tiles[yy * w] = tiles[yy * w] || (yy > 150 ? T.BEDROCK : 0); }
    world.updateAllSky();
    world.spawn = { x: cx, y: surf[cx] - 3 };
    await step(0.97, 'Ultimi ritocchi…');
  }
  TF.Structures = { build, fillChest };
})(window.TF);
