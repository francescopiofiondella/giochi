'use strict';
// Terrafrante - generazione procedurale: biomi, superficie, strati, caverne, minerali, liquidi
(function (TF) {
  const T = TF.T, W = TF.W;
  TF.yieldUI = () => new Promise((r) => setTimeout(r, 0));
  // biomi lungo l'asse X (frazione del mondo): neve, foresta, deserto, foresta(spawn), palude, giungla, corruzione
  const SEG = [[2, 0.15], [0, 0.33], [1, 0.46], [0, 0.6], [4, 0.68], [3, 0.82], [5, 1.01]];
  const AMP = [22, 10, 26, 18, 4, 32];
  const WALL_OF = {};
  WALL_OF[T.DIRT] = WALL_OF[T.GRASS] = W.DIRT; WALL_OF[T.STONE] = W.STONE; WALL_OF[T.SAND] = WALL_OF[T.SANDSTONE] = W.SANDSTONE;
  WALL_OF[T.SNOW] = WALL_OF[T.ICE] = W.ICE; WALL_OF[T.MUD] = WALL_OF[T.JGRASS] = WALL_OF[T.MOSS] = W.MUD;
  WALL_OF[T.CDIRT] = WALL_OF[T.CGRASS] = WALL_OF[T.CSTONE] = W.CSTONE; WALL_OF[T.BASALT] = W.BASALT;

  async function generate(world, progress) {
    const w = world.w, h = world.h, seed = world.seed;
    const tiles = world.tiles, walls = world.walls, liq = world.liq, surf = world.surf, biome = world.biome;
    const rng = TF.mulberry(seed ^ 0x9e3779b9);
    const N = new TF.Noise(seed), N2 = new TF.Noise(seed + 77), N3 = new TF.Noise(seed + 1313);
    const ctx = { world, rng, N, N2, N3 };
    const step = async (p, msg) => { if (progress) progress(p, msg); await TF.yieldUI(); };
    const SOL = TF.TILES.map((t) => (t.solid ? 1 : 0));
    const ri = (a, b) => a + ((rng() * (b - a + 1)) | 0);
    const cx = w >> 1, BASE = 200, deepY = world.deepY;
    const flip = rng() < 0.5; world.flip = flip;
    ctx.flip = flip; ctx.cx = cx; ctx.SOL = SOL; ctx.ri = ri; ctx.BASE = BASE;

    // --- 1. mappa dei biomi ---
    await step(0.02, 'Disegno i biomi…');
    for (let x = 0; x < w; x++) {
      const xx = flip ? w - 1 - x : x;
      const u = xx / w + N.n1(xx * 0.012) * 0.014 + N.n1(xx * 0.05 + 9) * 0.004;
      let b = 5; for (const s of SEG) if (u < s[1]) { b = s[0]; break; }
      biome[x] = b;
    }
    // --- 2. altezza della superficie ---
    const amp = new Float32Array(w);
    for (let x = 0; x < w; x++) amp[x] = AMP[biome[x]];
    const amp2 = new Float32Array(w);
    for (let x = 0; x < w; x++) { let s = 0, c = 0; for (let k = -20; k <= 20; k++) { const xi = x + k; if (xi >= 0 && xi < w) { s += amp[xi]; c++; } } amp2[x] = s / c; }
    for (let x = 0; x < w; x++) {
      const n = N.fbm(x * 0.006, 1.7, 4, 2, 0.5) * 1.8 + N.n1(x * 0.03 + 5) * 0.22;
      surf[x] = TF.clamp(Math.round(BASE + n * amp2[x]), BASE - 48, BASE + 48);
    }
    for (let pass = 0; pass < 2; pass++) for (let x = 1; x < w - 1; x++) surf[x] = Math.round((surf[x - 1] + surf[x] + surf[x + 1]) / 3);
    for (let x = cx - 34; x <= cx + 34; x++) { const t = TF.clamp((Math.abs(x - cx) - 16) / 18, 0, 1); surf[x] = Math.round(TF.lerp(surf[cx], surf[x], t)); }
    // laghi: modifica della superficie prima di riempire
    const lakes = (ctx.lakes = []);
    for (let a = 0; a < 80 && lakes.length < 26; a++) {
      const lw = ri(16, 34), x0 = ri(30, w - 30 - lw), x1 = x0 + lw, mid = (x0 + x1) >> 1, b = biome[mid];
      if (b === 1 || b === 5 || Math.abs(mid - cx) < 40) continue;
      if (biome[x0] !== b || biome[x1] !== b) continue;
      if (lakes.some((l) => x0 < l.x1 + 12 && x1 > l.x0 - 12)) continue;
      if (b === 4 || lakes.length > 8 || rng() < 0.7) {
        const Y0 = surf[mid], d = ri(4, 9);
        for (let x = x0 - 6; x <= x1 + 6; x++) {
          if (x < x0 || x > x1) surf[x] = Math.round(TF.lerp(surf[x], Y0, 0.8));
          else { const t = (2 * (x - x0)) / lw - 1; surf[x] = Y0 + Math.round(d * (1 - t * t)); }
        }
        lakes.push({ x0, x1, Y0 });
      }
    }
    // --- 3. riempimento a strati ---
    await step(0.08, 'Scolpisco i continenti…');
    for (let x = 0; x < w; x++) {
      const b = biome[x], s = surf[x];
      const dirtD = 7 + Math.floor((N.n1(x * 0.05 + 3) + 1) * 3), sandD = 24 + Math.floor((N.n1(x * 0.04) + 1) * 6);
      for (let y = s; y < h; y++) {
        const d = y - s, i = y * w + x;
        let t;
        if (y >= h - 3) { tiles[i] = T.BEDROCK; walls[i] = W.BASALT; continue; }
        const patch = d > 3 && d < 200 ? N2.n2(x * 0.06, y * 0.06) : 0;
        const deep = y >= deepY + Math.floor(N3.n1(x * 0.03) * 8);
        switch (b) {
          case 1: // deserto
            if (d < sandD) t = (d > 3 && patch > 0.45 && d > 12) ? T.SANDSTONE : T.SAND;
            else if (d < sandD + 48) t = patch < -0.4 ? T.SAND : T.SANDSTONE;
            else t = T.STONE; break;
          case 2: // neve
            if (d < 4) t = T.SNOW; else if (d < dirtD + 2) t = patch > 0.3 ? T.ICE : T.DIRT;
            else t = patch > 0.2 ? T.ICE : (patch < -0.42 ? T.SNOW : T.STONE); break;
          case 3: // giungla
            if (d === 0) t = T.JGRASS; else if (d < dirtD + 12) t = patch > 0.4 ? T.STONE : T.MUD;
            else t = patch < -0.15 ? T.MUD : T.STONE; break;
          case 4: // palude
            if (d === 0) t = T.MOSS; else if (d < dirtD + 8) t = T.MUD; else t = patch < -0.05 ? T.MUD : T.STONE; break;
          case 5: // corruzione
            if (d === 0) t = T.CGRASS; else if (d < dirtD + 2) t = patch > 0.35 ? T.CSTONE : T.CDIRT;
            else t = patch < -0.42 ? T.CDIRT : T.CSTONE; break;
          default: // foresta
            if (d === 0) t = T.GRASS; else if (d < dirtD) t = patch > 0.32 && d > 3 ? T.STONE : T.DIRT;
            else t = patch < -0.4 ? T.DIRT : T.STONE;
        }
        if (deep && t !== T.SAND) t = T.BASALT;
        tiles[i] = t;
        if (d >= 3) walls[i] = WALL_OF[t] || W.STONE;
      }
    }
    // spiaggia dei laghi: sabbia/fango sul fondo
    for (const l of lakes) for (let x = l.x0 - 2; x <= l.x1 + 2; x++) for (let k = 0; k < 3; k++) {
      const i = (surf[x] + k) * w + x, b = biome[x];
      if (SOL[tiles[i]] && tiles[i] !== T.STONE) tiles[i] = b === 4 || b === 3 ? T.MUD : T.SAND;
    }
    for (const l of lakes) for (let x = l.x0; x <= l.x1; x++) for (let y = l.Y0; y < surf[x]; y++) { liq[y * w + x] = (1 << 4) | 15; }
    world.updateAllSky();
    await step(0.2, 'Scavo le caverne…');

    // --- 4. caverne ---
    const carve = (x, y) => { if (x < 1 || x >= w - 1 || y < 4 || y >= h - 4) return; const i = y * w + x; if (tiles[i] !== T.BEDROCK) tiles[i] = 0; };
    const carveCircle = (x, y, r) => { const r2 = r * r; for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r2) carve((x + xx) | 0, (y + yy) | 0); };
    ctx.carveCircle = carveCircle;
    for (let x = 1; x < w - 1; x++) {
      const s = surf[x], nearSpawn = Math.abs(x - cx) < 22;
      for (let y = s + 8; y < h - 6; y++) {
        const d = y - s;
        if (nearSpawn && d < 32) continue;
        const i = y * w + x; if (!SOL[tiles[i]]) continue;
        const A = N.n2(x * 0.017, y * 0.022);
        let c = false;
        if (Math.abs(A) < 0.07) { const B = N2.n2(x * 0.017 + 50, y * 0.022 + 50), thr = 0.05 + Math.min(0.03, d / 4000); c = Math.abs(A) < thr && Math.abs(B) < thr; }
        if (!c && d > 28) c = N3.n2(x * 0.011, y * 0.017 + 9) > (d > 220 ? 0.37 : 0.43) + (d < 60 ? 0.06 : 0);
        if (c) tiles[i] = 0;
      }
      if (x % 200 === 0) await step(0.2 + 0.1 * (x / w), 'Scavo le caverne…');
    }
    // tunnel sinuosi + ingressi in superficie
    const walkers = 120, shafts = 46;
    for (let k = 0; k < walkers + shafts; k++) {
      const shaft = k >= walkers;
      let x = ri(10, w - 10), y = shaft ? surf[x] + 2 : ri(BASE + 30, h - 80);
      if (Math.abs(x - cx) < 24 && shaft) continue;
      let ang = shaft ? Math.PI / 2 + (rng() - 0.5) * 0.8 : rng() * Math.PI * 2;
      const len = shaft ? ri(35, 90) : ri(90, 300), r = shaft ? 1.7 + rng() * 1.2 : 1.5 + rng() * 2.2;
      for (let s = 0; s < len; s++) {
        carveCircle(x, y, r + Math.sin(s * 0.2 + k) * 0.5);
        ang += (rng() - 0.5) * (shaft ? 0.5 : 0.55);
        if (shaft) ang = TF.clamp(ang, 0.5, Math.PI - 0.5);
        x += Math.cos(ang) * 1.5; y += Math.sin(ang) * 1.5;
        if (y > h - 70 || y < BASE - 40 || x < 4 || x > w - 4) break;
      }
    }
    // spaccature nella corruzione
    for (let k = 0; k < 9; k++) {
      let x = 0, tries = 0; do { x = ri(5, w - 5); } while (biome[x] !== 5 && ++tries < 300);
      if (biome[x] !== 5) continue;
      let y = surf[x] - 2; const r0 = 2.2 + rng() * 1.8;
      for (let s = 0; s < 150; s++) { carveCircle(x, y, r0 + Math.abs(N.n1(s * 0.2 + k * 9)) * 2.5); y += 1; x += (N.n1(s * 0.08 + k * 31) * 1.2); }
    }
    // pavimento infernale: grandi camere e lava
    for (let x = 2; x < w - 2; x++) for (let y = h - 46; y < h - 4; y++) {
      const i = y * w + x;
      if (SOL[tiles[i]] && N3.n2(x * 0.018, y * 0.07 + 400) > 0.05) tiles[i] = 0;
      if (!tiles[i] && y >= h - 18) liq[i] = (2 << 4) | 15;
    }
    await step(0.35, 'Nascondo i minerali…');

    // --- 5. minerali ---
    const OREBASE = new Set([T.STONE, T.CSTONE, T.BASALT, T.SANDSTONE, T.ICE]);
    const vein = (tile, x, y, size) => {
      for (let n = 0; n < size; n++) {
        if (x > 0 && y > 0 && x < w - 1 && y < h - 6) { const i = y * w + x; if (OREBASE.has(tiles[i])) tiles[i] = tile; }
        x += ri(-1, 1); y += ri(-1, 1);
      }
    };
    const veins = (tile, count, s0, s1, ymin, ymax, only) => {
      for (let k = 0; k < count; k++) {
        const x = ri(2, w - 3); if (only !== undefined && biome[x] !== only) continue;
        const lo = typeof ymin === 'function' ? ymin(x) : ymin, hi = Math.min(h - 8, ymax);
        if (hi <= lo) continue;
        vein(tile, x, ri(lo, hi), ri(s0, s1));
      }
    };
    veins(T.COPPER_ORE, 700, 8, 16, (x) => surf[x] + 8, 470);
    veins(T.IRON_ORE, 520, 8, 14, (x) => surf[x] + 45, 640);
    veins(T.GOLD_ORE, 360, 6, 11, 360, 740);
    veins(T.SHADOW_ORE, 900, 8, 14, (x) => surf[x] + 20, 560, 5);
    veins(T.ABYSS_ORE, 260, 7, 12, deepY + 8, h - 28);
    // cristalli lucenti vicino alle caverne
    for (let k = 0; k < 5200; k++) {
      let x = ri(3, w - 4), y = ri(surf[x] + 60, h - 40);
      const i = y * w + x; if (!SOL[tiles[i]] || tiles[i] === T.BEDROCK) continue;
      if (SOL[tiles[i + 1]] && SOL[tiles[i - 1]] && SOL[tiles[i + w]] && SOL[tiles[i - w]]) continue;
      for (let n = 0, cn = ri(3, 7); n < cn; n++) { const j = y * w + x; if (SOL[tiles[j]] && tiles[j] !== T.BEDROCK) tiles[j] = T.CRYSTAL; x += ri(-1, 1); y += ri(-1, 1); }
    }
    await step(0.45, 'Riempio laghi e pozze…');

    // --- 6. pozze sotterranee d'acqua e lava ---
    const solidAt = (x, y) => SOL[tiles[y * w + x]] === 1;
    const pool = (type, x, y, maxH, maxW) => {
      let fy = y; while (fy < h - 6 && !solidAt(x, fy + 1)) fy++;
      const rows = []; let pl = x, pr = x;
      for (let r = 0; r < maxH; r++) {
        const yy = fy - r; if (solidAt(x, yy)) break;
        let l = x, rr = x;
        while (l > x - maxW && !solidAt(l - 1, yy)) l--;
        while (rr < x + maxW && !solidAt(rr + 1, yy)) rr++;
        if (!solidAt(l - 1, yy) || !solidAt(rr + 1, yy)) return false;
        for (let xx = l; xx <= rr; xx++) { if (r === 0 ? !solidAt(xx, yy + 1) : !(xx >= pl && xx <= pr) && !solidAt(xx, yy + 1)) return false; }
        rows.push([yy, l, rr]); pl = l; pr = rr;
      }
      if (rows.length < 1) return false;
      for (const [yy, l, rr] of rows) for (let xx = l; xx <= rr; xx++) liq[yy * w + xx] = (type << 4) | 15;
      return true;
    };
    let wp = 0, lp = 0;
    for (let k = 0; k < 9000 && (wp < 90 || lp < 70); k++) {
      const x = ri(5, w - 6), y = ri(surf[x] + 30, h - 30);
      if (SOL[tiles[y * w + x]] || liq[y * w + x]) continue;
      if (y < deepY - 10 && wp < 90) { if (pool(1, x, y, ri(2, 6), 26)) wp++; }
      else if (y > deepY + 30 && lp < 70) { if (pool(2, x, y, ri(3, 9), 30)) lp++; }
    }
    world.updateAllSky();
    ctx.carveCircle = carveCircle;
    return ctx;
  }
  TF.Terrain = { generate };
})(window.TF);
