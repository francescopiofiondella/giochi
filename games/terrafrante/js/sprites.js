'use strict';
// Terrafrante - grafica procedurale: texture dei blocchi, icone, personaggio, nemici, proiettili
(function (TF) {
  const T = TF.T, TILES = TF.TILES, V = 4, COLS = 32;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const R = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const line = (g, c, x0, y0, x1, y1, th) => {
    g.fillStyle = c; th = th || 1;
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), th, th);
  };
  const S = (TF.Sprites = { cracks: [], iconCache: {}, urlCache: {} });
  S.mk = mk; S.R = R; S.line = line;

  // ---- decorazioni speciali (tile 16x16 trasparenti) ----
  const DRAW = {
    platform(g) { R(g, '#a8753f', 0, 0, 16, 4); R(g, '#c28d52', 0, 0, 16, 1); R(g, '#7e5229', 0, 3, 16, 1); R(g, '#5e3b1b', 3, 1, 1, 1); R(g, '#5e3b1b', 12, 1, 1, 1); },
    door_c(g, t, v) { R(g, '#8a5a2b', 3, 0, 10, 16); R(g, '#6b4423', 3, 0, 2, 16); R(g, '#a8753f', 11, 0, 2, 16); R(g, '#5e3b1b', 6, v ? 2 : 1, 4, 5); if (v) R(g, '#ffd84a', 10, 6, 2, 2); else R(g, '#5e3b1b', 6, 9, 4, 5); },
    door_o(g) { R(g, '#6b4423', 0, 0, 3, 16); R(g, '#8a5a2b', 1, 0, 1, 16); R(g, '#5e3b1b', 0, 2, 3, 1); R(g, '#5e3b1b', 0, 12, 3, 1); },
    torch(g) { R(g, '#7a5230', 7, 7, 2, 9); R(g, '#ff9a2e', 6, 3, 4, 5); R(g, '#ffe27a', 7, 4, 2, 3); R(g, '#ff5a1e', 6, 6, 4, 2); },
    chest(g) { R(g, '#8a5a2b', 1, 5, 14, 11); R(g, '#a8753f', 1, 5, 14, 3); R(g, '#5e3b1b', 1, 8, 14, 1); R(g, '#c8c8d0', 1, 5, 14, 1); R(g, '#c8c8d0', 1, 15, 14, 1); R(g, '#ffd84a', 7, 7, 2, 3); R(g, '#5e3b1b', 1, 5, 1, 11); R(g, '#5e3b1b', 14, 5, 1, 11); },
    bench(g) { R(g, '#a8753f', 0, 7, 16, 3); R(g, '#c28d52', 0, 7, 16, 1); R(g, '#6b4423', 1, 10, 2, 6); R(g, '#6b4423', 13, 10, 2, 6); R(g, '#d4d8df', 3, 5, 3, 2); R(g, '#7a5230', 4, 4, 1, 3); },
    furnace(g) { R(g, '#6e7078', 1, 3, 14, 13); R(g, '#8a8c94', 1, 3, 14, 2); R(g, '#2a2a30', 4, 8, 8, 8); R(g, '#ff7a2e', 5, 10, 6, 6); R(g, '#ffd070', 6, 12, 4, 4); R(g, '#4a4c54', 5, 0, 6, 3); },
    anvil(g) { R(g, '#3d3f48', 1, 5, 14, 3); R(g, '#6e7078', 2, 4, 12, 2); R(g, '#3d3f48', 5, 8, 6, 4); R(g, '#3d3f48', 3, 12, 10, 4); R(g, '#9a9ca5', 2, 4, 12, 1); },
    bed(g) { R(g, '#6b4423', 0, 8, 16, 8); R(g, '#c0392b', 1, 6, 11, 7); R(g, '#e5705f', 1, 6, 11, 2); R(g, '#f2f2f2', 9, 5, 5, 4); R(g, '#4e3018', 0, 4, 2, 12); },
    rope(g) { R(g, '#c9a96a', 7, 0, 2, 16); R(g, '#8a7040', 7, 3, 2, 1); R(g, '#8a7040', 7, 8, 2, 1); R(g, '#8a7040', 7, 13, 2, 1); },
    trunk(g, t, v, rnd) { const c = t.col; R(g, c[0], 3, 0, 10, 16); R(g, c[1], 3, 0, 2, 16); R(g, c[1], 11, 0, 2, 16); for (let i = 0; i < 4; i++) R(g, c[1], 5 + ((rnd() * 5) | 0), (rnd() * 14) | 0, 1, 3); },
    leaf(g, t, v, rnd) { const c = t.col; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const r = rnd(); if (r < 0.9) { g.fillStyle = r < 0.45 ? c[0] : r < 0.7 ? c[1] : c[2]; g.fillRect(x, y, 1, 1); } } },
    cactus(g, t, v) { R(g, '#3f9a4f', 4, 0, 8, 16); R(g, '#2e6b3a', 4, 0, 2, 16); R(g, '#6bd07a', 10, 0, 1, 16); for (let i = 0; i < 4; i++) { R(g, '#f2f2d0', 3, 2 + i * 4, 1, 1); R(g, '#f2f2d0', 12, 4 + i * 4, 1, 1); } },
    vine(g, t, v) { for (let y = 0; y < 16; y++) R(g, '#3c8a2a', 7 + Math.round(Math.sin((y + v * 3) * 0.7)), y, 2, 1); R(g, '#6bd04a', 9, 5, 2, 2); R(g, '#6bd04a', 5, 11, 2, 2); },
    tuft(g, t, v, rnd) { for (let i = 0; i < 5; i++) { const x = 2 + i * 3, h = 4 + ((rnd() * 5) | 0); R(g, i % 2 ? '#4caa3c' : '#78d257', x, 16 - h, 1, h); } },
    flower(g, t, v) { R(g, '#3c8a2a', 7, 8, 2, 8); R(g, '#ffd84a', 5, 4, 6, 4); R(g, '#e08a1e', 7, 5, 2, 2); R(g, '#fff', 4, 5, 1, 2); },
    mushroom(g) { R(g, '#d8f0ea', 7, 9, 2, 7); R(g, '#2f9a95', 4, 5, 8, 5); R(g, '#79e0d4', 5, 5, 6, 2); R(g, '#fff', 6, 7, 1, 1); },
    lifecrystal(g) { R(g, '#ff4a6a', 6, 3, 4, 13); R(g, '#a81a3a', 4, 8, 3, 8); R(g, '#ff8aa0', 9, 5, 3, 11); R(g, '#fff', 7, 4, 1, 3); R(g, '#a81a3a', 6, 14, 5, 2); },
    manacrystal(g) { R(g, '#4a8fff', 6, 3, 4, 13); R(g, '#1a3f9e', 4, 8, 3, 8); R(g, '#8ac0ff', 9, 5, 3, 11); R(g, '#fff', 7, 4, 1, 3); R(g, '#1a3f9e', 6, 14, 5, 2); },
    thorn(g, t, v, rnd) { for (let i = 0; i < 4; i++) { const x = 1 + i * 4, h = 6 + ((rnd() * 7) | 0); R(g, '#4c2a68', x + 1, 16 - h, 2, h); R(g, '#a45fd0', x + 1, 16 - h, 1, 3); } },
    cobweb(g) { for (const [a, b, c, d] of [[0, 0, 15, 15], [15, 0, 0, 15], [8, 0, 8, 15], [0, 8, 15, 8]]) line(g, 'rgba(240,240,250,0.8)', a, b, c, d); },
    furn(g, t, v) { TF.FURN_DRAW[t.fk](g, t.pal || {}, v, t); },
    lamp(g) { R(g, '#6e7078', 7, 0, 2, 3); R(g, '#8a8c94', 4, 3, 8, 2); R(g, '#8fe6ff', 5, 5, 6, 8); R(g, '#e8fcff', 7, 6, 2, 5); R(g, '#8a8c94', 4, 13, 8, 2); },
  };

  function genTile(t, v) {
    const c = mk(16, 16), g = c.getContext('2d'), rnd = TF.mulberry(t.id * 131 + v * 977 + 7);
    if (t.draw) { DRAW[t.draw](g, t, v, rnd); return c; }
    const tx = t.tx;
    if (tx.st === 'glass') { g.globalAlpha = 0.55; R(g, tx.b, 0, 0, 16, 16); g.globalAlpha = 1; R(g, tx.c, 0, 0, 16, 1); R(g, tx.c, 0, 0, 1, 16); line(g, tx.c, 3, 10, 8, 3); line(g, tx.c, 7, 13, 12, 6); return c; }
    R(g, tx.b, 0, 0, 16, 16);
    for (let i = 0; i < 34; i++) { g.fillStyle = rnd() < 0.5 ? tx.a : tx.c; g.fillRect((rnd() * 16) | 0, (rnd() * 16) | 0, 1 + ((rnd() * 2) | 0), 1); }
    if (tx.st === 'ore') for (let k = 0; k < 5; k++) { const x = 1 + ((rnd() * 12) | 0), y = 1 + ((rnd() * 12) | 0); R(g, tx.f, x, y, 3, 2); R(g, tx.f2, x, y, 1, 1); R(g, tx.f, x + 1, y + 2, 2, 1); }
    else if (tx.st === 'brick') { R(g, tx.a, 0, 7, 16, 1); R(g, tx.a, 0, 15, 16, 1); R(g, tx.a, 8, 0, 1, 7); R(g, tx.a, 0, 8, 1, 7); R(g, tx.a, 12, 8, 1, 7); R(g, tx.c, 0, 0, 8, 1); R(g, tx.c, 9, 0, 7, 1); R(g, tx.c, 1, 8, 11, 1); }
    else if (tx.st === 'plank') { for (let y = 3; y < 16; y += 4) R(g, tx.a, 0, y, 16, 1); R(g, tx.c, 0, 0, 16, 1); for (let y = 0; y < 4; y++) { R(g, tx.a, 2 + (y * 5 + v * 3) % 12, y * 4 + 1, 1, 1); } }
    else if (tx.st === 'bands') { for (let y = 2; y < 16; y += 5) R(g, tx.a, 0, y, 16, 1); }
    else if (tx.st === 'ice') { line(g, tx.c, 2, 12, 8, 4); line(g, tx.c, 8, 14, 14, 8); R(g, tx.c, 12, 2, 2, 1); }
    else if (tx.st === 'crystal') { R(g, '#18304a', 0, 0, 16, 16); for (let k = 0; k < 4; k++) { const x = 1 + k * 4, h = 5 + ((rnd() * 8) | 0); R(g, '#3a8cc9', x, 16 - h, 3, h); R(g, tx.c, x, 16 - h, 1, h - 2); R(g, '#e8fcff', x, 16 - h, 1, 1); } }
    if (tx.top) { R(g, tx.top, 0, 0, 16, 3); for (let x = 0; x < 16; x++) { R(g, tx.top, x, 3, 1, (rnd() * 3) | 0); if (rnd() < 0.4) R(g, tx.top2, x, 0, 1, 1); } R(g, tx.top2, 0, 0, 16, 1); }
    return c;
  }
  function genWall(w, v) {
    const c = mk(16, 16), g = c.getContext('2d'), rnd = TF.mulberry(w.id * 91 + v * 313 + 3);
    R(g, w.c, 0, 0, 16, 16);
    g.globalAlpha = 0.35;
    for (let i = 0; i < 30; i++) { g.fillStyle = rnd() < 0.5 ? '#000' : '#fff'; g.fillRect((rnd() * 16) | 0, (rnd() * 16) | 0, 1 + ((rnd() * 3) | 0), 1); }
    g.globalAlpha = 0.5;
    if (w.st === 'brick') { R(g, '#000', 0, 7, 16, 1); R(g, '#000', 0, 15, 16, 1); R(g, '#000', 8, 0, 1, 7); R(g, '#000', 0, 8, 1, 7); R(g, '#000', 12, 8, 1, 7); }
    else if (w.st === 'plank') { for (let y = 3; y < 16; y += 4) R(g, '#000', 0, y, 16, 1); }
    g.globalAlpha = 1; return c;
  }
  function genCracks() {
    for (let s = 0; s < 5; s++) {
      const c = mk(16, 16), g = c.getContext('2d'), r = TF.mulberry(55);
      for (let k = 0; k <= s; k++) { let x = 8, y = 8; const a = (k / (s + 1)) * Math.PI * 2 + 0.5; for (let i = 0; i < 4 + s * 2; i++) { x += Math.cos(a + (r() - 0.5)) * 1.5; y += Math.sin(a + (r() - 0.5)) * 1.5; R(g, 'rgba(0,0,0,0.8)', Math.round(x), Math.round(y), 1, 1); } }
      S.cracks.push(c);
    }
  }
  S.init = function () {
    S.atlas = mk(COLS * 16, Math.ceil((TILES.length * V) / COLS) * 16);
    const g = S.atlas.getContext('2d');
    for (const t of TILES) { if (t.id === 0) continue; for (let v = 0; v < V; v++) { const s = t.id * V + v; g.drawImage(genTile(t, v), (s % COLS) * 16, Math.floor(s / COLS) * 16); } }
    S.wallAtlas = mk(COLS * 16, Math.ceil((TF.WALLS.length * V) / COLS) * 16);
    const gw = S.wallAtlas.getContext('2d');
    for (const w of TF.WALLS) { if (!w) continue; for (let v = 0; v < V; v++) { const s = w.id * V + v; gw.drawImage(genWall(w, v), (s % COLS) * 16, Math.floor(s / COLS) * 16); } }
    genCracks();
  };
  S.tileXY = (id, v) => { const s = id * V + v; return [(s % COLS) * 16, Math.floor(s / COLS) * 16]; };
  S.V = V;

  // ---- icone degli oggetti ----
  const ICONS = {
    pick(g, c) { line(g, '#7a5230', 2, 14, 11, 5, 2); line(g, c[0], 4, 4, 8, 2); line(g, c[0], 8, 2, 12, 3); line(g, c[0], 12, 3, 14, 7); line(g, c[1] || '#555', 5, 5, 9, 3); },
    axe(g, c) { line(g, '#7a5230', 2, 14, 11, 5, 2); R(g, c[0], 9, 2, 5, 6); R(g, c[0], 7, 4, 3, 3); R(g, '#fff', 11, 2, 2, 1); R(g, '#00000040', 12, 5, 2, 3); },
    hammer(g, c) { line(g, '#7a5230', 2, 14, 10, 6, 2); R(g, c[0], 7, 1, 8, 6); R(g, '#00000040', 7, 5, 8, 2); R(g, '#ffffff80', 7, 1, 8, 1); },
    sword(g, c) { line(g, c[0], 4, 12, 13, 3, 2); line(g, '#ffffffaa', 5, 11, 13, 3); line(g, c[1], 2, 14, 4, 12, 2); line(g, c[1], 3, 9, 7, 13, 1); },
    bow(g, c) { for (let y = 1; y < 15; y++) { const x = 4 + Math.round(5 * Math.sin(((y - 1) / 14) * Math.PI)); R(g, c[0], 12 - x + 2, y, 2, 1); } line(g, '#e8e8e8', 11, 1, 11, 14); R(g, c[1], 5, 7, 6, 1); },
    staff(g, c) { line(g, c[1], 3, 14, 11, 6, 2); R(g, c[0], 10, 2, 5, 5); R(g, '#fff', 11, 3, 2, 2); R(g, '#00000040', 13, 5, 2, 2); },
    head(g, c) { R(g, c[0], 3, 3, 10, 8); R(g, c[0], 2, 5, 12, 6); R(g, c[1], 4, 7, 8, 3); R(g, '#ffffff60', 4, 3, 6, 1); R(g, '#000', 5, 8, 2, 1); R(g, '#000', 9, 8, 2, 1); },
    body(g, c) { R(g, c[0], 4, 2, 8, 12); R(g, c[0], 1, 2, 4, 6); R(g, c[0], 11, 2, 4, 6); R(g, c[1], 4, 11, 8, 2); R(g, '#ffffff50', 5, 3, 6, 1); R(g, c[1], 6, 2, 4, 2); },
    legs(g, c) { R(g, c[0], 3, 2, 10, 4); R(g, c[0], 3, 6, 4, 8); R(g, c[0], 9, 6, 4, 8); R(g, c[1], 3, 5, 10, 1); R(g, '#ffffff50', 3, 2, 10, 1); },
    boot(g, c) { R(g, c[0], 4, 3, 5, 8); R(g, c[0], 4, 9, 9, 4); R(g, c[1], 4, 12, 9, 2); R(g, '#fff', 11, 4, 3, 2); R(g, '#fff', 12, 6, 2, 1); },
    spring(g, c) { for (let i = 0; i < 4; i++) { R(g, c[0], 3, 3 + i * 3, 10, 2); R(g, c[1], 3, 5 + i * 3, 10, 1); } R(g, '#8a5a2b', 2, 14, 12, 1); },
    glove(g, c) { R(g, c[0], 4, 5, 8, 8); R(g, c[0], 3, 3, 2, 4); R(g, c[0], 6, 2, 2, 4); R(g, c[0], 9, 2, 2, 4); R(g, c[1], 4, 11, 8, 2); },
    shield(g, c) { R(g, c[0], 3, 2, 10, 9); R(g, c[0], 4, 11, 8, 2); R(g, c[0], 6, 13, 4, 1); R(g, c[1], 7, 3, 2, 9); R(g, c[1], 4, 6, 8, 2); R(g, '#fff', 4, 3, 2, 2); },
    ring(g, c) { R(g, c[0], 4, 6, 8, 7); R(g, '#00000000', 6, 8, 4, 3); g.clearRect(6, 8, 4, 3); R(g, c[1], 10, 8, 2, 4); R(g, '#fff', 6, 2, 4, 4); R(g, c[1], 7, 3, 2, 2); },
    amulet(g, c) { line(g, '#c9c9d4', 3, 1, 8, 8); line(g, '#c9c9d4', 13, 1, 8, 8); R(g, c[0], 5, 8, 6, 6); R(g, '#fff', 6, 9, 2, 2); R(g, c[1], 8, 11, 3, 3); },
    wings(g, c) { for (let i = 0; i < 3; i++) { R(g, c[0], 1 + i, 4 + i * 3, 6, 3); R(g, c[0], 9 - i, 4 + i * 3, 6, 3); } R(g, c[1], 7, 3, 2, 10); },
    potion(g, c) { R(g, '#8a5a2b', 6, 1, 4, 2); R(g, '#cfe8f0', 7, 3, 2, 3); R(g, '#cfe8f0', 4, 6, 8, 8); R(g, c[0], 5, 8, 6, 5); R(g, c[1], 5, 12, 6, 1); R(g, '#fff', 5, 7, 1, 3); },
    heart(g, c) { for (const [x, y, w] of [[3, 3, 4], [9, 3, 4], [2, 5, 12], [3, 8, 10], [4, 10, 8], [6, 12, 4], [7, 13, 2]]) R(g, c[0], x, y, w, w > 4 ? 2 : 3); R(g, '#fff', 4, 4, 2, 1); R(g, c[1], 3, 9, 10, 1); },
    star(g, c) { R(g, c[0], 7, 1, 2, 14); R(g, c[0], 1, 7, 14, 2); R(g, c[0], 4, 4, 8, 8); R(g, c[1], 6, 6, 4, 4); R(g, '#fff', 7, 7, 2, 2); },
    summon(g, c) { R(g, c[1], 3, 3, 10, 10); R(g, c[0], 4, 4, 8, 8); R(g, '#fff', 6, 5, 3, 3); R(g, c[1], 2, 7, 1, 2); R(g, c[1], 13, 7, 1, 2); R(g, c[1], 7, 2, 2, 1); },
    log(g, c) { R(g, c[1], 2, 5, 12, 8); R(g, c[0], 2, 5, 12, 2); R(g, '#c8a070', 2, 5, 3, 8); R(g, '#e0c090', 3, 7, 1, 4); },
    gel(g, c) { R(g, c[0], 3, 8, 10, 6); R(g, c[0], 5, 5, 6, 4); R(g, c[1], 3, 12, 10, 2); R(g, '#fff', 5, 7, 2, 2); },
    bone(g, c) { line(g, c[0], 4, 12, 12, 4, 2); R(g, c[0], 2, 11, 3, 3); R(g, c[0], 11, 2, 3, 3); R(g, c[1], 3, 13, 2, 1); },
    silk(g, c) { for (let i = 0; i < 4; i++) line(g, c[i % 2], 2 + i * 3, 2, 4 + i * 3, 14); line(g, c[1], 2, 8, 14, 7); },
    cloth(g, c) { R(g, c[0], 2, 3, 12, 10); R(g, c[1], 2, 11, 12, 2); line(g, c[1], 2, 6, 14, 6); line(g, c[1], 2, 9, 14, 9); },
    wing(g, c) { R(g, c[0], 2, 4, 12, 3); R(g, c[0], 3, 7, 3, 5); R(g, c[0], 7, 7, 3, 4); R(g, c[0], 11, 7, 3, 3); R(g, c[1], 2, 4, 12, 1); },
    shard(g, c) { R(g, c[0], 6, 1, 4, 14); R(g, c[0], 4, 4, 8, 8); R(g, c[1], 8, 4, 3, 9); R(g, '#fff', 6, 3, 1, 5); },
    spore(g, c) { R(g, c[0], 4, 4, 8, 8); R(g, c[0], 3, 6, 10, 4); R(g, c[1], 8, 8, 4, 4); R(g, '#fff', 5, 5, 2, 2); R(g, c[1], 1, 2, 2, 2); R(g, c[1], 13, 12, 2, 2); },
    scarab(g, c) { R(g, c[0], 4, 4, 8, 9); R(g, c[1], 7, 4, 2, 9); R(g, '#fff6c0', 5, 5, 2, 2); line(g, c[1], 2, 5, 4, 7); line(g, c[1], 14, 5, 12, 7); line(g, c[1], 2, 11, 4, 9); line(g, c[1], 14, 11, 12, 9); },
    essence(g, c) { R(g, c[1], 4, 4, 8, 8); R(g, c[0], 5, 5, 6, 6); R(g, '#fff', 7, 6, 2, 2); R(g, c[0], 7, 1, 2, 3); R(g, c[0], 7, 12, 2, 3); R(g, c[0], 1, 7, 3, 2); R(g, c[0], 12, 7, 3, 2); },
    flower(g, c) { R(g, '#3c8a2a', 7, 8, 2, 7); R(g, c[0], 4, 3, 8, 6); R(g, c[1], 6, 5, 4, 2); R(g, '#fff', 4, 4, 1, 2); },
    mush(g, c) { R(g, '#d8f0ea', 6, 8, 4, 6); R(g, c[1], 3, 4, 10, 5); R(g, c[0], 4, 4, 7, 2); R(g, '#fff', 5, 6, 1, 1); },
    cactus(g, c) { R(g, c[0], 5, 2, 6, 12); R(g, c[0], 2, 5, 3, 2); R(g, c[0], 2, 3, 2, 4); R(g, c[1], 5, 2, 2, 12); R(g, '#fff', 8, 5, 1, 1); },
    bottle(g, c) { R(g, '#8a5a2b', 6, 1, 4, 2); R(g, c[0], 7, 3, 2, 3); R(g, c[0], 4, 6, 8, 8); R(g, c[1], 5, 8, 6, 5); R(g, '#fff', 5, 7, 1, 3); },
    sap(g, c) { R(g, c[0], 6, 2, 4, 3); R(g, c[0], 4, 5, 8, 7); R(g, c[0], 5, 12, 6, 2); R(g, c[1], 8, 7, 4, 6); R(g, '#fff', 5, 6, 2, 3); },
    core(g, c) { R(g, c[1], 4, 2, 8, 12); R(g, c[1], 2, 4, 12, 8); R(g, c[0], 4, 4, 8, 8); R(g, '#fff', 5, 5, 3, 2); R(g, c[1], 9, 9, 2, 2); },
    bar(g, c) { R(g, c[1], 2, 6, 12, 7); R(g, c[0], 3, 5, 10, 6); R(g, '#fff', 3, 5, 10, 1); R(g, c[1], 3, 10, 10, 1); R(g, '#ffffff60', 4, 7, 3, 1); },
    arrow(g, c) { line(g, c[0], 3, 13, 12, 4); R(g, c[1], 12, 2, 3, 3); R(g, '#e8e8e8', 2, 11, 3, 1); R(g, '#e8e8e8', 4, 13, 1, 3); },
  };
  S.ICONS = ICONS;
  S.icon = function (id) {
    if (S.iconCache[id]) return S.iconCache[id];
    const it = TF.ITEMS[id], c = mk(16, 16), g = c.getContext('2d');
    if (it.type === 'block') { const t = TILES[it.tile]; const [sx, sy] = S.tileXY(t.id, 0); g.drawImage(S.atlas, sx, sy, 16, 16, 0, 0, 16, 16); if (t.draw === 'platform') { /* già trasparente */ } }
    else if (it.type === 'wall') { const [sx, sy] = [(it.wall * V % COLS) * 16, Math.floor(it.wall * V / COLS) * 16]; R(g, '#2a2a30', 0, 0, 16, 16); g.drawImage(S.wallAtlas, sx, sy, 16, 16, 2, 2, 12, 12); R(g, '#ffffff30', 2, 2, 12, 1); }
    else (ICONS[it.ic] || ICONS.core)(g, it.col);
    S.iconCache[id] = c; return c;
  };
  S.iconURL = (id) => S.urlCache[id] || (S.urlCache[id] = S.icon(id).toDataURL());

  // ---- personaggio ----
  const LEG = [[-2, 2], [0, 0], [2, -2], [0, 0]];
  S.drawPlayer = function (g, p, x, y, time) {
    g.save(); g.translate(Math.round(x), Math.round(y));
    if (p.facing < 0) { g.translate(12, 0); g.scale(-1, 1); }
    const L = p.look, f = p.onGround ? (Math.abs(p.vx) > 0.2 ? Math.floor(p.animT / 6) & 3 : 1) : 1;
    const air = !p.onGround, lo = air ? [-2, 2] : LEG[f];
    if (p.flying) { const a = Math.sin(time * 0.02) * 3, wc = p.wingCol || ['#5a4a78', '#8a6bff', '#3a2e52']; R(g, wc[0], -7, 6 + a, 8, 3); R(g, wc[1], -9, 8 + a, 4, 6); R(g, wc[2], -3, 6, 4, 8); }
    R(g, L.legs ? L.legs[1] : '#2a2a40', 3 + lo[0], 17, 3, 7); R(g, L.legs ? L.legs[0] : '#3b3b55', 6 + lo[1], 17, 3, 7);
    R(g, '#1c1c1c', 3 + lo[0], 22, 3, 2); R(g, '#1c1c1c', 6 + lo[1], 22, 3, 2);
    const sw = p.swing;
    R(g, L.body ? L.body[1] : '#c9a07c', 2, 9, 2, 7);
    R(g, L.body ? L.body[0] : '#3a6fc4', 3, 8, 6, 9); if (L.body) R(g, L.body[1], 3, 15, 6, 2);
    R(g, '#f2c29b', 3, 2, 6, 6); R(g, '#5a3a22', 2, 0, 8, 3); R(g, '#5a3a22', 2, 3, 1, 4); R(g, '#222', 7, 4, 1, 2);
    if (L.head) { R(g, L.head[0], 2, 0, 8, 4); R(g, L.head[0], 2, 4, 1, 3); R(g, L.head[1], 7, 3, 3, 2); R(g, L.head[0], 9, 0, 1, 5); }
    if (sw && sw.t > 0) {
      const ang = sw.angle; g.save(); g.translate(6, 10); g.rotate(ang);
      R(g, L.body ? L.body[0] : '#f2c29b', 0, -1, 7, 2);
      if (sw.icon) { g.translate(6 + (sw.off || 0), 0); g.rotate(sw.rot || Math.PI / 4); const k = sw.scale || 1; if (k !== 1) g.scale(k, k); g.drawImage(sw.icon, -3, -13, 16, 16); }
      g.restore();
    } else { R(g, L.body ? L.body[0] : '#3a6fc4', 6, 9, 2, 3); R(g, '#f2c29b', 6, 12, 2, 3); }
    g.restore();
  };

  // ---- nemici ----
  const E = {
    slime(g, e, t) { const sq = e.onGround ? 1 : 0.85, h = Math.round(11 * sq), c = e.tint || ['#6fe08a', '#3fa85a']; R(g, c[0], 1, 11 - h + 2, 12, h - 2); R(g, c[0], 3, 11 - h, 8, 2); R(g, c[1], 1, 9, 12, 2); R(g, '#ffffff90', 3, 11 - h + 2, 3, 2); R(g, '#102010', 4, 6, 2, 2); R(g, '#102010', 8, 6, 2, 2); if (e.spiky) { R(g, c[1], 2, 11 - h - 1, 1, 2); R(g, c[1], 7, 11 - h - 2, 1, 2); R(g, c[1], 11, 11 - h - 1, 1, 2); } },
    bat(g, e, t) { const fl = Math.sin(t * 0.03 + e.id) > 0, c = e.tint || ['#5a4a78', '#3a2e52']; R(g, c[1], 4, 2, 4, 5); R(g, '#ffffff', 4, 3, 1, 1); R(g, '#ffffff', 7, 3, 1, 1); R(g, c[1], 4, 1, 1, 1); R(g, c[1], 7, 1, 1, 1); if (fl) { R(g, c[0], -2, 0, 6, 3); R(g, c[0], 8, 0, 6, 3); R(g, c[1], -2, 0, 2, 1); R(g, c[1], 12, 0, 2, 1); } else { R(g, c[0], -2, 4, 6, 3); R(g, c[0], 8, 4, 6, 3); R(g, c[1], -2, 6, 2, 1); R(g, c[1], 12, 6, 2, 1); } },
    skeleton(g, e, t) { const f = Math.floor(e.animT / 8) & 1, c = e.tint || ['#e8e4d0', '#b5b09a']; R(g, c[0], 3, 0, 6, 6); R(g, '#222', 4, 2, 2, 2); R(g, '#222', 7, 2, 1, 2); R(g, c[0], 4, 6, 4, 1); R(g, c[0], 4, 7, 4, 7); R(g, c[1], 3, 8, 6, 1); R(g, c[1], 3, 10, 6, 1); R(g, c[0], 1 + f, 7, 2, 7); R(g, c[0], 9 - f, 7, 2, 7); R(g, c[0], 4, 14, 2, 10 - f); R(g, c[0], 7, 14, 2, 10 + f - 1); },
    zombie(g, e, t) { const f = Math.floor(e.animT / 9) & 1; R(g, '#6a9a5a', 3, 0, 6, 7); R(g, '#c03030', 4, 3, 2, 1); R(g, '#c03030', 7, 3, 1, 1); R(g, '#4a3a5a', 3, 8, 6, 9); R(g, '#6a9a5a', 9, 8, 3 + f, 2); R(g, '#6a9a5a', 0 - f, 8, 3, 2); R(g, '#2f3550', 3, 17, 3, 7 - f); R(g, '#2f3550', 6, 17, 3, 6 + f); },
    spider(g, e, t) { const f = Math.floor(e.animT / 5) & 1, c = e.tint || ['#3a2a3a', '#1c141c']; R(g, c[0], 4, 2, 7, 6); R(g, c[1], 5, 1, 5, 3); R(g, '#ff3030', 5, 3, 1, 1); R(g, '#ff3030', 8, 3, 1, 1); for (let i = 0; i < 4; i++) { const o = (i + f) & 1; line(g, c[1], 4, 4 + i, 0 + o, 1 + i * 2 + (o ? -1 : 0)); line(g, c[1], 10, 4 + i, 14 - o, 1 + i * 2 + (o ? -1 : 0)); } },
    worm(g, e, t) { const c = e.tint || ['#8a7a6a', '#5a4a3a']; R(g, c[1], 0, 0, 11, 11); R(g, c[0], 1, 1, 9, 8); R(g, '#ffffff40', 2, 1, 4, 2); if (e.head) { R(g, '#c03030', 7, 3, 2, 2); R(g, '#e8e4d0', 8, 7, 3, 2); R(g, '#e8e4d0', 1, 7, 3, 2); } },
    guardian(g, e, t) { const f = Math.floor(e.animT / 10) & 1, ch = e.charge > 0 ? '#ff6a3c' : '#9aa5c8'; R(g, '#2c3a5c', 4, 0, 8, 9); R(g, '#9aa5c8', 3, 0, 10, 4); R(g, ch, 5, 4, 6, 2); R(g, '#1c2438', 4, 10, 8, 10); R(g, '#9aa5c8', 3, 9, 10, 4); R(g, '#34466f', 2, 20, 5, 10 - f); R(g, '#34466f', 9, 20, 5, 9 + f); R(g, '#c8c8d0', 13, 8, 3, 18); R(g, '#34466f', 0, 11, 4, 9); R(g, '#ffd84a', 1, 14, 2, 2); },
    skullring(g, e, t) { R(g, '#fff', 0, 0, 4, 4); },
  };
  S.drawEnemy = function (g, e, x, y, time) {
    g.save(); g.translate(Math.round(x), Math.round(y));
    if (e.flash > 0) g.globalAlpha = 0.6;
    if (e.facing < 0 && !e.noFlip) { g.translate(e.w, 0); g.scale(-1, 1); }
    const fn = E[e.draw || e.type]; if (fn) fn(g, e, time);
    g.restore();
  };

  // ---- boss ----
  const BOSS = {
    ceppo(g, e, t) {
      const ph = e.phase2 ? '#a83a2a' : '#5e3b1b', sq = e.onGround ? 0 : -3;
      R(g, '#4e3018', 2, 12 + sq, 36, 44); R(g, '#6b4423', 4, 10 + sq, 32, 44); R(g, '#8a5a2b', 6, 10 + sq, 6, 44);
      R(g, '#3b8f2f', -2, 0 + sq, 44, 12); R(g, '#59b84a', 2, -4 + sq, 36, 8); R(g, '#2a6d22', 0, 8 + sq, 40, 4);
      R(g, '#201008', 10, 22 + sq, 6, 5); R(g, '#201008', 24, 22 + sq, 6, 5); R(g, e.phase2 ? '#ff4a2a' : '#ffd84a', 12, 23 + sq, 3, 3); R(g, e.phase2 ? '#ff4a2a' : '#ffd84a', 26, 23 + sq, 3, 3);
      R(g, '#201008', 14, 36 + sq, 12, 4); R(g, '#e8e4d0', 15, 36 + sq, 2, 2); R(g, '#e8e4d0', 22, 36 + sq, 2, 2);
      for (const dx of [-4, 8, 22, 34]) R(g, ph, dx, 52, 8, 4);
    },
    nottola(g, e, t) {
      const fl = Math.sin(t * 0.012) * 8, ph = e.phase3 ? '#ff4a6a' : '#8a6bff';
      R(g, '#3a2e52', 22, 6, 12, 22); R(g, '#5a4a78', 24, 8, 8, 18); R(g, '#3a2e52', 22, 2, 3, 6); R(g, '#3a2e52', 31, 2, 3, 6);
      R(g, ph, 24, 12, 2, 3); R(g, ph, 30, 12, 2, 3); R(g, '#e8e4d0', 26, 20, 2, 3); R(g, '#e8e4d0', 30, 20, 2, 3);
      for (let s = -1; s <= 1; s += 2) { const bx = s < 0 ? 0 : 34; for (let i = 0; i < 4; i++) { const ox = s * i * 8 + (s < 0 ? 20 : 0), oy = 4 + i * 3 + fl * (i + 1) / 4 * (s < 0 ? 1 : 1); R(g, '#4a3a68', s < 0 ? 22 - (i + 1) * 7 : 34 + i * 7, oy + 4, 8, 14 - i * 2); R(g, '#2a1e42', s < 0 ? 22 - (i + 1) * 7 : 34 + i * 7, oy + 4, 8, 2); } }
    },
    sire(g, e, t) {
      const fl = Math.sin(t * 0.006) * 2, ph = e.phase3 ? '#ffd070' : '#ff6a3c';
      R(g, '#1a0e12', 6, 10 + fl, 24, 36); R(g, '#2a1418', 8, 12 + fl, 20, 32); R(g, '#1a0e12', 10, 44 + fl, 4, 8); R(g, '#1a0e12', 22, 46 + fl, 4, 6);
      R(g, '#3a1c20', 10, 0 + fl, 16, 14); R(g, '#e8d0b0', 12, 4 + fl, 12, 8); R(g, ph, 14, 6 + fl, 3, 3); R(g, ph, 20, 6 + fl, 3, 3);
      R(g, '#3a1c20', 8, -6 + fl, 3, 8); R(g, '#3a1c20', 25, -6 + fl, 3, 8); R(g, ph, 8, -8 + fl, 2, 3); R(g, ph, 26, -8 + fl, 2, 3);
      R(g, ph, 14, 22 + fl, 8, 8); R(g, '#fff6c0', 16, 24 + fl, 4, 4);
      R(g, '#2a1418', 0, 14 + fl, 8, 4); R(g, '#2a1418', 28, 14 + fl, 8, 4); R(g, ph, -2, 12 + fl, 4, 4); R(g, ph, 34, 12 + fl, 4, 4);
    },
  };
  S.drawBoss = function (g, b, x, y, time) {
    g.save(); g.translate(Math.round(x), Math.round(y));
    if (b.flash > 0) g.globalAlpha = 0.6; else if (b.alpha !== undefined) g.globalAlpha = b.alpha;
    if (b.facing < 0 && b.type !== 'nottola') { g.translate(b.w, 0); g.scale(-1, 1); }
    BOSS[b.type](g, b, time); g.restore();
  };

  // ---- proiettili ----
  S.drawProj = function (g, p, x, y, time) {
    g.save(); g.translate(Math.round(x), Math.round(y));
    switch (p.kind) {
      case 'arrow': g.rotate(Math.atan2(p.vy, p.vx)); R(g, '#d9c9a0', -6, -1, 10, 2); R(g, p.col || '#c8c8d0', 3, -2, 3, 4); R(g, '#e8e8e8', -7, -2, 3, 1); R(g, '#e8e8e8', -7, 1, 3, 1); break;
      case 'bolt': g.rotate(Math.atan2(p.vy, p.vx)); R(g, '#6b4423', -5, -1, 9, 2); R(g, p.col || '#9aa0ac', 3, -2, 4, 4); R(g, '#c9c9d4', -6, -2, 2, 4); break;
      case 'dart': g.rotate(Math.atan2(p.vy, p.vx)); R(g, '#8a5a2b', -4, -1, 6, 1); R(g, p.col || '#7ad24a', 2, -1, 3, 2); R(g, '#fff', -5, -2, 2, 1); R(g, '#fff', -5, 0, 2, 1); break;
      case 'orb': { const c = p.col || '#c783f0', r = p.big ? 5 : 3; R(g, c, -r, -r, r * 2, r * 2); R(g, '#ffffffcc', -r + 1, -r + 1, Math.max(2, r - 1), Math.max(2, r - 1)); R(g, c + '66', -r - 1, -1, r * 2 + 2, 2); break; }
      case 'star': g.rotate(p.age * 0.35); R(g, p.col || '#e8e8f0', -1, -5, 2, 10); R(g, p.col || '#e8e8f0', -5, -1, 10, 2); R(g, '#fff', -1, -1, 2, 2); break;
      case 'leaf': g.rotate(Math.atan2(p.vy, p.vx)); R(g, p.col || '#5ec23a', -4, -2, 8, 4); R(g, '#2a7a22', -4, -1, 8, 1); R(g, '#b6f060', 1, -2, 3, 1); break;
      case 'bubble': g.strokeStyle = p.col || '#8fe6ff'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, 4, 0, 6.3); g.stroke(); R(g, '#ffffffaa', -2, -2, 2, 2); break;
      case 'bomb': R(g, p.col || '#3a3a44', -4, -3, 8, 7); R(g, '#1c1c24', -3, -4, 6, 1); R(g, '#8a5a2b', 0, -6, 1, 3); if (p.age % 6 < 3) R(g, '#ffb938', -1, -8, 3, 2); R(g, '#ffffff60', -3, -2, 2, 2); break;
      case 'item': { const ic = TF.Sprites.icon(p.icon), s = p.size || 1; g.rotate(p.ret || p.spin ? p.age * 0.4 : Math.atan2(p.vy, p.vx) + Math.PI / 4); if (s !== 1) g.scale(s, s); g.drawImage(ic, -8, -8, 16, 16); break; }
      case 'spark': R(g, '#8fe6ff', -2, -2, 4, 4); R(g, '#fff', -1, -1, 2, 2); break;
      case 'frost': g.rotate(Math.atan2(p.vy, p.vx)); R(g, '#bfeaff', -4, -2, 8, 4); R(g, '#fff', -4, -1, 6, 2); R(g, '#6ab8e0', 2, -3, 2, 6); break;
      case 'spore': R(g, '#5ea02a', -3, -3, 6, 6); R(g, '#b6f060', -2, -2, 4, 4); R(g, '#fff', -1, -2, 1, 1); break;
      case 'shadow': R(g, '#3a2552', -4, -4, 8, 8); R(g, '#a45fe0', -3, -3, 6, 6); R(g, '#e0b0ff', -1, -2, 2, 2); break;
      case 'fire': case 'fireball': { const r = p.big ? 6 : 4; R(g, '#a82a12', -r, -r, r * 2, r * 2); R(g, '#ff6a3c', -r + 1, -r + 1, r * 2 - 2, r * 2 - 2); R(g, '#ffd070', -r + 3, -r + 3, r * 2 - 6, r * 2 - 6); break; }
      case 'bone': g.rotate(time * 0.02); R(g, '#e8e4d0', -4, -1, 8, 2); R(g, '#e8e4d0', -5, -2, 2, 4); R(g, '#e8e4d0', 3, -2, 2, 4); break;
      case 'seed': R(g, '#5e3b1b', -3, -3, 6, 6); R(g, '#8fbf3a', -2, -2, 4, 4); R(g, '#fff', -1, -2, 1, 1); break;
      case 'sonic': { const r = 4 + (p.age % 20) * 0.2; g.strokeStyle = '#c0a8ff'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, r, 0, 6.3); g.stroke(); break; }
      case 'wave': g.rotate(Math.atan2(p.vy, p.vx)); g.fillStyle = p.col || '#ffffffcc'; g.fillRect(-2, -8, 3, 16); g.fillStyle = '#fff'; g.fillRect(0, -6, 2, 12); break;
      case 'root': R(g, '#6b4423', -4, -10, 8, 20); R(g, '#8a5a2b', -3, -10, 3, 20); R(g, '#4caa3c', -4, -11, 8, 3); break;
      case 'rain': R(g, '#ff6a3c', -3, -6, 6, 12); R(g, '#ffd070', -1, -4, 2, 8); break;
      default: R(g, '#fff', -2, -2, 4, 4);
    }
    g.restore();
  };

  // ---- cifre per i danni (font a pixel 3x5) ----
  const DIG = { 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001010010', 8: '111101111101111', 9: '111101111001111', '+': '000010111010000', '-': '000000111000000' };
  S.drawNum = function (g, text, x, y, color) {
    text = String(text); const w = text.length * 4 - 1; x = Math.round(x - w / 2); y = Math.round(y);
    for (const pass of [0, 1]) {
      let cx = x;
      for (const ch of text) {
        const m = DIG[ch]; if (m) for (let i = 0; i < 15; i++) if (m[i] === '1') { const px = cx + (i % 3), py = y + Math.floor(i / 3); if (pass === 0) { g.fillStyle = '#000'; g.fillRect(px - 1, py - 1, 3, 3); } else { g.fillStyle = color; g.fillRect(px, py, 1, 1); } }
        cx += 4;
      }
    }
  };
})(window.TF);
