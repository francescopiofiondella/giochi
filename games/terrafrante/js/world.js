'use strict';
// Terrafrante - struttura dati del mondo, chunk, liquidi
(function (TF) {
  const T = TF.T, TILES = TF.TILES;
  TF.CH = 32; // lato chunk in tile
  TF.BIOMES = [
    { id: 0, key: 'forest', name: 'Foresta', mat: null },
    { id: 1, key: 'desert', name: 'Deserto', mat: 'scarab' },
    { id: 2, key: 'snow', name: 'Tundra Innevata', mat: 'frost_shard' },
    { id: 3, key: 'jungle', name: 'Giungla', mat: 'jungle_spore' },
    { id: 4, key: 'swamp', name: 'Palude', mat: 'bog_goo' },
    { id: 5, key: 'corrupt', name: 'Terre Corrotte', mat: 'livid_essence' },
  ];

  class World {
    constructor(w, h, seed) {
      this.w = w; this.h = h; this.seed = seed;
      this.tiles = new Uint8Array(w * h);
      this.walls = new Uint8Array(w * h);
      this.liq = new Uint8Array(w * h); // (tipo<<4)|livello(1..15)
      this.skyY = new Int16Array(w); // prima riga che blocca la luce solare
      this.surf = new Int16Array(w); // quota superficie
      this.biome = new Uint8Array(w);
      this.cw = Math.ceil(w / TF.CH); this.chh = Math.ceil(h / TF.CH);
      this.chunkVer = new Uint32Array(this.cw * this.chh).fill(1);
      this.chests = new Map();
      this.spawn = { x: w >> 1, y: 100 };
      this.deepY = (h * 0.72) | 0;
      this.dungeon = null;
      this.liqToggle = 0;
    }
    inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
    get(x, y) { if (x < 0 || x >= this.w || y >= this.h) return T.BEDROCK; if (y < 0) return 0; return this.tiles[y * this.w + x]; }
    getWall(x, y) { return this.inb(x, y) ? this.walls[y * this.w + x] : 0; }
    solid(x, y) { return TILES[this.get(x, y)].solid; }
    // solido per le collisioni (le piattaforme sono gestite a parte)
    markDirty(x, y) {
      const cx = (x / TF.CH) | 0, cy = (y / TF.CH) | 0, cw = this.cw;
      this.chunkVer[cy * cw + cx]++;
      const lx = x - cx * TF.CH, ly = y - cy * TF.CH, m = TF.CH - 1;
      if (lx === 0 && cx > 0) this.chunkVer[cy * cw + cx - 1]++;
      if (lx === m && cx < cw - 1) this.chunkVer[cy * cw + cx + 1]++;
      if (ly === 0 && cy > 0) this.chunkVer[(cy - 1) * cw + cx]++;
      if (ly === m && cy < this.chh - 1) this.chunkVer[(cy + 1) * cw + cx]++;
    }
    set(x, y, id) {
      if (!this.inb(x, y)) return;
      const i = y * this.w + x;
      if (this.tiles[i] === id) return;
      this.tiles[i] = id;
      if (TILES[id].solid) this.liq[i] = 0;
      this.markDirty(x, y);
      this.updateSky(x);
    }
    setWall(x, y, id) {
      if (!this.inb(x, y)) return;
      const i = y * this.w + x;
      if (this.walls[i] === id) return;
      this.walls[i] = id; this.markDirty(x, y); this.updateSky(x);
    }
    updateSky(x) {
      let y = 0; const w = this.w, h = this.h, t = this.tiles, wl = this.walls;
      while (y < h && !TILES[t[y * w + x]].solid && !wl[y * w + x]) y++;
      this.skyY[x] = y;
    }
    updateAllSky() { for (let x = 0; x < this.w; x++) this.updateSky(x); }
    liqType(x, y) { return this.inb(x, y) ? this.liq[y * this.w + x] >> 4 : 0; }
    liqLevel(x, y) { return this.inb(x, y) ? this.liq[y * this.w + x] & 15 : 0; }
    setLiq(x, y, type, level) { if (this.inb(x, y)) this.liq[y * this.w + x] = level > 0 ? (type << 4) | Math.min(15, level) : 0; }
    biomeAt(x, y) {
      const b = TF.BIOMES[this.biome[TF.clamp(x | 0, 0, this.w - 1)]];
      if (y >= this.deepY) return { name: 'Grotte Profonde', key: 'deep', mat: 'abyss_core', id: 9 };
      const d = this.dungeon;
      if (d && x >= d.x0 && x <= d.x1 && y >= d.y0 && y <= d.y1) return { name: 'Dungeon Spettrale', key: 'dungeon', mat: 'bone', id: 8 };
      if (y > this.surf[TF.clamp(x | 0, 0, this.w - 1)] + 14) return { name: 'Caverne · ' + b.name, key: b.key, mat: b.mat, id: b.id, under: true };
      return b;
    }
    // ---- scrigni ----
    chestAt(x, y) { return this.chests.get(x + ',' + y); }
    makeChest(x, y) { const c = { x, y, slots: new Array(20).fill(null) }; this.chests.set(x + ',' + y, c); return c; }
    // ---- simulazione dei liquidi nell'area attiva (zone vicine al giocatore) ----
    stepLiquids(x0, y0, x1, y1) {
      x0 = Math.max(1, x0); x1 = Math.min(this.w - 2, x1); y0 = Math.max(0, y0); y1 = Math.min(this.h - 2, y1);
      const w = this.w, liq = this.liq, tiles = this.tiles;
      this.liqToggle ^= 1;
      for (let y = y1; y >= y0; y--) {
        for (let k = x0; k <= x1; k++) {
          const x = this.liqToggle ? k : x1 - (k - x0);
          const i = y * w + x; let v = liq[i];
          if (!v) continue;
          const t = v >> 4; let l = v & 15;
          if (TILES[tiles[i]].solid) { liq[i] = 0; continue; }
          // verso il basso
          const bi = i + w;
          if (!TILES[tiles[bi]].solid) {
            const bv = liq[bi];
            if (bv && (bv >> 4) !== t) { this.set(x, y + 1, T.OBSIDIAN); liq[bi] = 0; l--; if (l <= 0) { liq[i] = 0; continue; } }
            else { const bl = bv & 15, mv = Math.min(l, 15 - bl); if (mv > 0) { liq[bi] = (t << 4) | (bl + mv); l -= mv; } }
          }
          if (l > 0) {
            const first = Math.random() < 0.5 ? -1 : 1;
            for (let s = 0; s < 2 && l > 1; s++) {
              const nx = x + (s === 0 ? first : -first), ni = y * w + nx;
              if (TILES[tiles[ni]].solid) continue;
              const nv = liq[ni];
              if (nv && (nv >> 4) !== t) { this.set(nx, y, T.OBSIDIAN); liq[ni] = 0; l--; continue; }
              const nl = nv & 15;
              if (l - nl >= 2) { const mv = (l - nl) >> 1; liq[ni] = (t << 4) | (nl + mv); l -= mv; }
            }
          }
          liq[i] = l > 0 ? (t << 4) | l : 0;
        }
      }
    }
  }
  TF.World = World;
})(window.TF);
