'use strict';
// Terrafrante - arredamento: mobili in 14 materiali, stazioni di lavoro, torce colorate, decorazioni e arredi con aura
(function (TF) {
  const tile = TF.tileDef;
  const R = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const FD = (TF.FURN_DRAW = {});
  const GLOW = 'rgba(255,255,255,0.28)';

  // ---------------- materiali ----------------
  // key, frase, palette {m,d,l,a,c = stoffa}, ingrediente base, moltiplicatore, stazione, rarità
  const MATS = [
    ['wood', 'di Legno', { m: '#a8753f', d: '#6b4423', l: '#c8924f', a: '#e0c090', c: '#b8403a' }, 'planks', 1, 'bench', 0],
    ['mahogany', 'di Mogano', { m: '#8f4a30', d: '#592616', l: '#b0654a', a: '#d9a070', c: '#3a7a44' }, 'planks', 1, 'bench', 1],
    ['bone', 'd\'Osso', { m: '#e8e4d0', d: '#9a957c', l: '#fffdf0', a: '#c9c4a8', c: '#6a5a8a' }, 'bone', 1, 'bench', 1],
    ['ice', 'di Ghiaccio', { m: '#9fd4ee', d: '#5a9cc4', l: '#e6f8ff', a: '#ffffff', c: '#4a7ab0' }, 'ice', 1, 'bench', 1],
    ['stone', 'di Pietra', { m: '#8a8c94', d: '#5d5f68', l: '#b4b6be', a: '#d0d2d8', c: '#7a5a3a' }, 'stonebrick', 1, 'bench', 0],
    ['sandstone', 'd\'Arenaria', { m: '#c49b55', d: '#8c6a30', l: '#e0b97a', a: '#f0d9a0', c: '#a8503a' }, 'sandstone', 1, 'bench', 1],
    ['copper', 'di Rame', { m: '#e08a4a', d: '#8a5a2b', l: '#f4b777', a: '#ffd9a8', c: '#3a6a8a' }, 'copper_bar', 0.5, 'anvil', 0],
    ['iron', 'di Ferro', { m: '#9aa0ac', d: '#5a5f6a', l: '#cfd3da', a: '#e8ebf0', c: '#8a3a3a' }, 'iron_bar', 0.5, 'anvil', 1],
    ['gold', 'd\'Oro', { m: '#e8b82a', d: '#a8761a', l: '#ffe27a', a: '#fff6c0', c: '#8a1f3a' }, 'gold_bar', 0.5, 'anvil', 2],
    ['crystal', 'di Cristallo', { m: '#3a8cc9', d: '#1f4a7a', l: '#8fe6ff', a: '#e8fcff', c: '#2a5a9a' }, 'crystal', 1, 'anvil', 2],
    ['obsidian', 'd\'Ossidiana', { m: '#3d2a66', d: '#1f1634', l: '#6a4cb0', a: '#a98aff', c: '#7a1f5a' }, 'obsidian', 1, 'anvil', 3],
    ['dungeon', 'del Dungeon', { m: '#4b6199', d: '#232f4f', l: '#7088c8', a: '#a8b8e8', c: '#2a3a6a' }, 'dungeon', 1, 'anvil', 2],
    ['shadow', 'd\'Ombrite', { m: '#a45fe0', d: '#5f2f99', l: '#d4a0ff', a: '#f0d8ff', c: '#3a2060' }, 'shadow_bar', 0.5, 'anvil', 3],
    ['abyss', 'd\'Abissite', { m: '#ff7a3c', d: '#a83a12', l: '#ffb070', a: '#ffe0a0', c: '#401c10' }, 'abyss_bar', 0.5, 'anvil', 4],
  ].map((a) => ({ key: a[0], of: a[1], pal: a[2], base: a[3], mul: a[4], st: a[5], rar: a[6] }));

  // kind, nome, proprietà del tile, quantità base, ingrediente extra, materiali ammessi (null = tutti)
  const KINDS = [
    ['chair', 'Sedia', { interact: 'sit', needsFloor: true, hard: 1 }, 4, null, null],
    ['table', 'Tavolo', { needsFloor: true, surface: true, hard: 1.5 }, 8, null, null],
    ['sofa', 'Divano', { interact: 'sit', needsFloor: true, hard: 1.5 }, 5, { cloth: 3 }, null],
    ['bookcase', 'Libreria', { needsFloor: true, hard: 2, aura: 'study', desc: 'Studio: +mana rigenerato vicino' }, 10, { cloth: 3 }, ['wood', 'mahogany', 'bone', 'stone', 'iron', 'gold', 'dungeon', 'shadow']],
    ['clock', 'Orologio a Pendolo', { interact: 'clock', needsFloor: true, hard: 2, desc: 'Tasto destro: mostra l\'ora' }, 8, { iron_bar: 2 }, ['wood', 'mahogany', 'stone', 'iron', 'gold', 'crystal', 'obsidian', 'dungeon', 'abyss']],
    ['lamp', 'Lampada', { needsFloor: true, light: 215, hard: 1 }, 3, { torch: 1 }, null],
    ['chandelier', 'Lampadario', { needsCeil: true, light: 240, hard: 1 }, 4, { torch: 4 }, null],
    ['candelabra', 'Candelabro', { needsFloor: true, light: 190, hard: 1 }, 3, { torch: 3 }, null],
    ['chest', 'Scrigno', { interact: 'chest', hard: 3, desc: 'Contenitore da 20 slot' }, 8, null, null],
    ['bed', 'Letto', { interact: 'bed', needsFloor: true, hard: 2, desc: 'Imposta il punto di rinascita' }, 12, { cloth: 4 }, null],
  ];

  const FURN = (TF.FURN = { MATS, list: [] });
  const add = (key, name, o, rec) => { const t = tile(key, name, Object.assign({ solid: false, hard: 2, tool: 'any', draw: 'furn', cat: 'Mobili' }, o)); FURN.list.push({ id: t.itemId, key, rec }); return t; };

  for (const m of MATS) for (const k of KINDS) {
    if (k[5] && !k[5].includes(m.key)) continue;
    const key = k[0].toUpperCase() + '_' + m.key.toUpperCase();
    add(key, k[1] + ' ' + m.of, Object.assign({ fk: k[0], pal: m.pal, rar: m.rar, tx: { b: m.pal.m } }, k[2]), { kind: k[0], mat: m, q: k[3], extra: k[4] });
  }

  // ---------------- stazioni di lavoro ----------------
  const ST = (key, name, station, o, rec) => add(key, name, Object.assign({ fk: key.toLowerCase(), station, tx: { b: '#a8753f' } }, o), rec);
  ST('ALCHEMY', 'Tavolo d\'Alchimia', 'alchemy', { light: 60, desc: 'Stazione: pozioni avanzate' }, { ing: { wood: 10, bottle: 4, glass: 2 }, st: 'bench' });
  ST('LOOM', 'Telaio', 'loom', { desc: 'Stazione: tessuti e abiti' }, { ing: { wood: 12, silk: 4 }, st: 'bench' });
  ST('COOK', 'Pentola da Cucina', 'cook', { light: 120, desc: 'Stazione: cibi e bevande' }, { ing: { iron_bar: 4, wood: 6, torch: 2 }, st: 'anvil' });
  ST('ARCANE', 'Altare Arcano', 'arcane', { light: 100, rar: 2, desc: 'Stazione: oggetti magici' }, { ing: { crystal: 12, wood: 10, gold_bar: 4, cloth: 4 }, st: 'anvil' });
  ST('MYTHIC', 'Incudine Mistica', 'mythic', { light: 90, rar: 3, also: ['anvil'], desc: 'Stazione: equipaggiamento superiore (vale come incudine)' }, { ing: { shadow_bar: 10, obsidian: 10, iron_bar: 10 }, st: 'anvil' });

  // ---------------- torce colorate ----------------
  const TORCHES = [['ICE', 'Torcia Gelida', ['#4aa8e8', '#bfeaff', '#ffffff'], { frost_shard: 1 }], ['JUNGLE', 'Torcia Verde', ['#4caa2a', '#b6f060', '#ffffff'], { jungle_spore: 1 }],
    ['GHOST', 'Torcia Spettrale', ['#6a8fff', '#c0d0ff', '#ffffff'], { bone: 1 }], ['SHADOW', 'Torcia d\'Ombra', ['#a45fe0', '#e0b0ff', '#ffffff'], { livid_essence: 1 }],
    ['CURSE', 'Torcia Maledetta', ['#2ad05a', '#a0ffb0', '#ffffff'], { bog_goo: 1 }], ['HELL', 'Torcia Infernale', ['#ff3a1a', '#ff9a3c', '#ffe0a0'], { obsidian: 1 }]];
  for (const [k, n, f, ex] of TORCHES) add('TORCH_' + k, n, { fk: 'torch_c', flame: f, light: 235, hard: 0.1, torch: true, tx: { b: f[0] } }, { torch: true, ing: Object.assign({ torch: 3 }, ex), n: 3, st: 'bench' });

  // ---------------- arredi con effetto (aure) ----------------
  const AU = (key, name, o, rec) => add(key, name, Object.assign({ fk: key.toLowerCase(), tx: { b: '#a8753f' } }, o), rec);
  AU('CAMPFIRE', 'Falò', { needsFloor: true, light: 190, aura: 'cozy', desc: 'Accogliente: rigenerazione vicino' }, { ing: { wood: 10, torch: 5 }, st: 'bench' });
  AU('FIREPLACE', 'Camino', { needsFloor: true, light: 170, aura: 'cozy', desc: 'Accogliente: rigenerazione vicino' }, { ing: { stonebrick: 18, wood: 6, torch: 3 }, st: 'bench' });
  AU('HEART_LANTERN', 'Lanterna Cuore', { needsCeil: true, light: 150, aura: 'hearty', rar: 1, desc: 'Cuore: forte rigenerazione vicino' }, { ing: { iron_bar: 4, gel: 6, flower: 3 }, st: 'anvil' });
  AU('STAR_BOTTLE', 'Stella in Bottiglia', { needsCeil: true, light: 120, aura: 'starlit', rar: 1, desc: 'Stellato: mana rigenerato vicino' }, { ing: { bottle: 1, crystal: 4, torch: 2 }, st: 'bench' });
  AU('PEACE_CANDLE', 'Candela della Pace', { needsFloor: true, light: 120, aura: 'calm', rar: 2, desc: 'Calma: meno nemici vicino' }, { ing: { wood: 4, silk: 4, flower: 2 }, st: 'bench' });
  AU('WATER_CANDLE', 'Candela dell\'Acqua', { needsFloor: true, light: 120, aura: 'battle', rar: 2, desc: 'Battaglia: più nemici vicino' }, { ing: { wood: 4, bog_goo: 4, mushroom: 2 }, st: 'bench' });
  AU('SUNFLOWER', 'Girasole in Vaso', { needsFloor: true, aura: 'happy', desc: 'Allegria: più veloce e meno nemici' }, { ing: { flower: 6, wood: 2, dirt: 5 }, st: 'bench' });
  AU('GUARDIAN', 'Statua Guardiana', { needsFloor: true, aura: 'stoneguard', rar: 1, desc: 'Guardia di pietra: +4 difesa vicino' }, { ing: { stonebrick: 25, iron_bar: 3 }, st: 'anvil' });
  AU('CRYSTAL_BALL', 'Sfera di Cristallo', { needsFloor: true, light: 110, aura: 'clairvoyance', rar: 2, desc: 'Chiaroveggenza: +10% danno magico vicino' }, { ing: { crystal: 10, gold_bar: 3, glass: 4 }, st: 'anvil' });
  AU('AQUARIUM', 'Acquario', { needsFloor: true, light: 90, aura: 'serene', rar: 1, desc: 'Sereno: rigenerazione vicino' }, { ing: { glass: 20, wood: 6, gel: 4 }, st: 'bench' });
  AU('PIANO', 'Pianoforte', { needsFloor: true, aura: 'harmony', rar: 1, desc: 'Armonia: rigenera vita e mana vicino' }, { ing: { planks: 15, bone: 4, iron_bar: 2 }, st: 'bench' });
  AU('GLOBE', 'Mappamondo', { needsFloor: true, desc: 'Decorazione' }, { ing: { glass: 6, wood: 6, copper_bar: 2 }, st: 'bench' });

  // ---------------- decorazioni ----------------
  const DE = (key, name, o, rec) => add(key, name, Object.assign({ tx: { b: '#a8753f' } }, o), rec);
  const PAINTS = ['Colline', 'Tramonto', 'Notte Stellata', 'Veliero', 'Castello', 'Teschio'];
  PAINTS.forEach((n, i) => DE('PAINTING_' + (i + 1), 'Dipinto: ' + n, { fk: 'painting', design: i, needsWall: true, hard: 1 }, { ing: { wood: 4, cloth: 2, flower: 1 }, st: 'loom' }));
  const BANNERS = [['RED', 'Rosso', '#b8403a'], ['BLUE', 'Blu', '#3a64b8'], ['GREEN', 'Verde', '#3a8a44'], ['PURPLE', 'Viola', '#7a3ab8'], ['GOLD', 'Dorato', '#d8a82a']];
  for (const [k, n, c] of BANNERS) DE('BANNER_' + k, 'Stendardo ' + n, { fk: 'banner', bc: c, needsCeil: true, hard: 0.5 }, { ing: { cloth: 4, wood: 2 }, st: 'loom' });
  const VASE_REC = [{ ing: { dirt: 10 }, st: 'furnace' }, { ing: { stonebrick: 4, gold_bar: 1 }, st: 'furnace' }, { ing: { glass: 3, flower: 2 }, st: 'bench' }];
  ['Vaso di Terracotta', 'Vaso Decorato', 'Vaso di Fiori'].forEach((n, i) => DE('VASE_' + (i + 1), n, { fk: 'vase', design: i, needsFloor: true, hard: 0.5 }, VASE_REC[i]));
  [['KNIGHT', 'Statua del Cavaliere', { stonebrick: 20, iron_bar: 4 }], ['ANGEL', 'Statua dell\'Angelo', { stonebrick: 20, gold_bar: 4, silk: 4 }], ['DRAGON', 'Statua del Drago', { stonebrick: 24, obsidian: 6 }]]
    .forEach(([k, n, ing], i) => DE('STATUE_' + k, n, { fk: 'statue', design: i, needsFloor: true, rar: 1 }, { ing, st: 'anvil' }));
  [['CEPPO', 'Trofeo del Ceppo Antico', { sap: 8, wood: 10 }], ['NOTTOLA', 'Trofeo della Nottola Regina', { night_core: 4, wing: 4, wood: 10 }], ['SIRE', 'Trofeo del Sire dell\'Abisso', { abyss_core: 4, abyss_bar: 4, wood: 10 }]]
    .forEach(([k, n, ing], i) => DE('TROPHY_' + k, n, { fk: 'trophy', design: i, needsWall: true, rar: 3, aura: 'glory', desc: 'Gloria: +4% danno vicino' }, { ing, st: 'anvil' }));
  DE('MIRROR', 'Specchio', { fk: 'mirror', needsWall: true, hard: 0.5, light: 40 }, { ing: { glass: 6, gold_bar: 2 }, st: 'bench' });
  DE('BARREL', 'Botte', { fk: 'barrel', interact: 'chest', hard: 3, desc: 'Contenitore da 20 slot' }, { ing: { wood: 10, iron_bar: 2 }, st: 'bench' });
  DE('CRATE', 'Cassa', { fk: 'crate', interact: 'chest', hard: 3, desc: 'Contenitore da 20 slot' }, { ing: { wood: 12, iron_bar: 1 }, st: 'bench' });
  DE('DRESSER', 'Cassettiera', { fk: 'dresser', interact: 'chest', hard: 3, desc: 'Contenitore da 20 slot' }, { ing: { wood: 14, cloth: 2 }, st: 'bench' });

  if (TF.TILES.length > 250) throw new Error('Troppi tipi di tile: ' + TF.TILES.length);

  // =============== disegno dei tile 16x16 ===============
  FD.chair = (g, P) => { R(g, P.m, 3, 1, 3, 15); R(g, P.l, 3, 1, 1, 14); R(g, P.m, 3, 9, 10, 3); R(g, P.l, 3, 9, 10, 1); R(g, P.d, 3, 12, 10, 1); R(g, P.d, 3, 13, 2, 3); R(g, P.d, 11, 13, 2, 3); R(g, P.a, 3, 0, 3, 1); R(g, P.d, 5, 3, 1, 6); };
  FD.table = (g, P) => { R(g, P.m, 1, 7, 14, 3); R(g, P.l, 1, 7, 14, 1); R(g, P.d, 1, 10, 14, 1); R(g, P.m, 2, 11, 2, 5); R(g, P.m, 12, 11, 2, 5); R(g, P.d, 3, 11, 1, 5); R(g, P.d, 13, 11, 1, 5); R(g, P.a, 4, 5, 4, 2); R(g, P.l, 5, 4, 2, 1); R(g, '#d8dce6', 10, 4, 2, 3); R(g, '#fff', 10, 4, 2, 1); };
  FD.sofa = (g, P) => { R(g, P.m, 1, 4, 14, 8); R(g, P.c, 2, 5, 12, 4); R(g, GLOW, 2, 5, 12, 1); R(g, P.c, 3, 9, 10, 3); R(g, P.d, 3, 11, 10, 1); R(g, P.m, 0, 6, 3, 9); R(g, P.m, 13, 6, 3, 9); R(g, P.l, 0, 6, 3, 1); R(g, P.l, 13, 6, 3, 1); R(g, P.d, 1, 14, 2, 2); R(g, P.d, 13, 14, 2, 2); R(g, P.a, 7, 6, 2, 2); };
  FD.bookcase = (g, P) => { R(g, P.m, 1, 0, 14, 16); R(g, P.d, 2, 1, 12, 14); const cols = ['#b53c3c', '#3c6ab5', '#3cb56a', '#e0b030', '#8a3cb5', '#e8e4d0']; [4, 9, 14].forEach((b, row) => { R(g, P.m, 2, b, 12, 1); let x = 2, i = 0; while (x < 13) { const w = 1 + (i % 2), h = 3 + ((i * 5 + row) % 2); R(g, cols[(i * 5 + row * 2) % 6], x, b - h, w, h); x += w; i++; } }); R(g, P.l, 1, 0, 14, 1); };
  FD.clock = (g, P) => { R(g, P.m, 4, 0, 8, 16); R(g, P.l, 4, 0, 1, 16); R(g, P.d, 11, 0, 1, 16); R(g, P.d, 3, 14, 10, 2); R(g, '#f2e8c0', 5, 1, 6, 5); R(g, '#222', 8, 2, 1, 3); R(g, '#222', 8, 4, 2, 1); R(g, '#1c1c24', 6, 7, 4, 6); R(g, P.a, 7, 10, 2, 2); R(g, P.a, 7, 8, 2, 1); };
  FD.lamp = (g, P) => { R(g, P.d, 5, 14, 6, 2); R(g, P.m, 7, 6, 2, 8); R(g, P.l, 7, 6, 1, 8); R(g, '#d8a840', 4, 1, 8, 5); R(g, '#fff0b0', 5, 2, 6, 3); R(g, '#ffffffa0', 7, 2, 2, 2); R(g, P.a, 4, 0, 8, 1); };
  FD.chandelier = (g, P) => { R(g, P.d, 7, 0, 2, 3); R(g, P.m, 2, 3, 12, 2); R(g, P.m, 1, 4, 2, 4); R(g, P.m, 13, 4, 2, 4); R(g, P.m, 6, 5, 4, 2); R(g, P.a, 7, 7, 2, 3); for (const x of [1, 7, 13]) { R(g, '#f2f2f2', x, 6, 2, 3); R(g, '#ffd060', x, 4, 2, 2); R(g, '#fff6c0', x, 4, 1, 1); } R(g, P.l, 2, 3, 12, 1); };
  FD.candelabra = (g, P) => { R(g, P.d, 5, 14, 6, 2); R(g, P.m, 7, 6, 2, 8); R(g, P.m, 3, 6, 10, 1); R(g, P.m, 3, 4, 1, 3); R(g, P.m, 12, 4, 1, 3); R(g, P.m, 7, 3, 2, 3); for (const x of [3, 7, 12]) { R(g, '#f2f2f2', x, 3 + (x === 7 ? 0 : 1), 1 + (x === 7 ? 2 : 1), 2); R(g, '#ffd060', x, 1 + (x === 7 ? 0 : 1), 1 + (x === 7 ? 2 : 1), 2); } R(g, P.l, 7, 7, 1, 7); };
  FD.chest = (g, P) => { R(g, P.m, 1, 5, 14, 11); R(g, P.l, 1, 5, 14, 3); R(g, P.d, 1, 8, 14, 1); R(g, P.a, 1, 5, 14, 1); R(g, P.a, 1, 15, 14, 1); R(g, '#ffd84a', 7, 7, 2, 3); R(g, P.d, 1, 5, 1, 11); R(g, P.d, 14, 5, 1, 11); R(g, P.d, 4, 9, 1, 6); R(g, P.d, 11, 9, 1, 6); };
  FD.bed = (g, P) => { R(g, P.d, 0, 11, 16, 5); R(g, P.m, 0, 4, 2, 12); R(g, P.l, 0, 4, 2, 1); R(g, P.c, 2, 7, 12, 5); R(g, GLOW, 2, 7, 12, 1); R(g, '#f4f4f4', 2, 6, 5, 3); R(g, P.d, 14, 9, 2, 7); R(g, P.a, 12, 7, 1, 5); };
  // stazioni
  FD.alchemy = (g) => { R(g, '#6b4423', 0, 8, 16, 3); R(g, '#a8753f', 0, 8, 16, 1); R(g, '#4e3018', 1, 11, 2, 5); R(g, '#4e3018', 13, 11, 2, 5); R(g, '#6ab8ff', 2, 4, 3, 4); R(g, '#cfe8f0', 2, 3, 3, 1); R(g, '#ff4a5a', 7, 5, 3, 3); R(g, '#cfe8f0', 7, 4, 3, 1); R(g, '#6af0a0', 11, 3, 3, 5); R(g, '#cfe8f0', 12, 2, 1, 1); R(g, '#ffffff90', 3, 5, 1, 2); };
  FD.loom = (g) => { R(g, '#6b4423', 1, 1, 2, 15); R(g, '#6b4423', 13, 1, 2, 15); R(g, '#8a5a2b', 1, 1, 14, 2); R(g, '#8a5a2b', 1, 13, 14, 2); for (let x = 4; x < 13; x += 2) R(g, '#d9d2c0', x, 3, 1, 10); R(g, '#b8403a', 4, 7, 9, 1); R(g, '#3a64b8', 4, 9, 9, 1); R(g, '#e5c04a', 4, 11, 9, 1); };
  FD.cook = (g) => { R(g, '#3d3f48', 2, 6, 12, 8); R(g, '#6e7078', 1, 5, 14, 2); R(g, '#8a8c94', 1, 5, 14, 1); R(g, '#c97a2a', 3, 7, 10, 2); R(g, '#e8a84a', 4, 7, 8, 1); R(g, '#2a2a30', 3, 13, 10, 3); R(g, '#ff7a2e', 5, 14, 2, 2); R(g, '#ffd070', 9, 14, 2, 2); R(g, '#8a5a2b', 13, 3, 2, 3); };
  FD.arcane = (g) => { R(g, '#3a2060', 1, 8, 14, 8); R(g, '#7a4ac8', 1, 8, 14, 2); R(g, '#d4a0ff', 3, 11, 10, 1); R(g, '#a45fe0', 7, 10, 2, 5); R(g, '#8fe6ff', 6, 2, 4, 5); R(g, '#e8fcff', 7, 3, 1, 2); R(g, '#3a8cc9', 8, 5, 2, 2); R(g, '#ffd84a', 2, 12, 1, 1); R(g, '#ffd84a', 13, 12, 1, 1); };
  FD.mythic = (g) => { R(g, '#2a1e42', 1, 5, 14, 3); R(g, '#a45fe0', 2, 4, 12, 2); R(g, '#d4a0ff', 2, 4, 12, 1); R(g, '#2a1e42', 5, 8, 6, 4); R(g, '#2a1e42', 3, 12, 10, 4); R(g, '#ffd84a', 6, 9, 4, 1); R(g, '#8fe6ff', 7, 2, 2, 2); R(g, '#ffffff', 7, 1, 2, 1); };
  FD.torch_c = (g, P, v, t) => { const f = t.flame; R(g, '#7a5230', 7, 7, 2, 9); R(g, f[0], 6, 3, 4, 5); R(g, f[1], 7, 4, 2, 3); R(g, f[2], 7, 5, 2, 1); R(g, f[0], 6, 6, 4, 2); };
  // arredi con aura
  FD.campfire = (g) => { R(g, '#6b4423', 1, 13, 14, 3); R(g, '#8a5a2b', 2, 12, 12, 2); R(g, '#4e3018', 4, 14, 8, 1); R(g, '#ff5a1e', 4, 5, 8, 8); R(g, '#ff9a2e', 5, 3, 6, 9); R(g, '#ffe27a', 6, 6, 4, 6); R(g, '#fff6c0', 7, 9, 2, 3); };
  FD.fireplace = (g) => { R(g, '#6e7078', 0, 0, 16, 16); R(g, '#8a8c94', 0, 0, 16, 2); R(g, '#4a4c54', 0, 7, 16, 1); R(g, '#1c1c24', 3, 5, 10, 11); R(g, '#ff5a1e', 5, 9, 6, 7); R(g, '#ff9a2e', 6, 8, 4, 8); R(g, '#ffe27a', 7, 11, 2, 5); R(g, '#4a4c54', 0, 3, 3, 1); R(g, '#4a4c54', 13, 11, 3, 1); };
  FD.heart_lantern = (g) => { R(g, '#6e7078', 7, 0, 2, 3); R(g, '#d4a82a', 4, 3, 8, 1); R(g, '#d4a82a', 4, 13, 8, 1); R(g, '#d4a82a', 4, 3, 1, 11); R(g, '#d4a82a', 11, 3, 1, 11); R(g, '#ff4a6a', 5, 5, 2, 3); R(g, '#ff4a6a', 9, 5, 2, 3); R(g, '#ff4a6a', 5, 7, 6, 3); R(g, '#ff4a6a', 6, 10, 4, 2); R(g, '#fff', 6, 5, 1, 1); };
  FD.star_bottle = (g) => { R(g, '#6e7078', 7, 0, 2, 3); R(g, '#cfe8f0', 5, 3, 6, 11); R(g, '#8fb5c4', 6, 2, 4, 1); R(g, '#1a1f48', 6, 4, 4, 9); R(g, '#ffe27a', 7, 6, 2, 5); R(g, '#ffe27a', 6, 8, 4, 1); R(g, '#fff', 7, 8, 1, 1); R(g, '#8a5a2b', 6, 1, 4, 1); };
  const candle = (g, c1, c2) => { R(g, '#6b4423', 4, 14, 8, 2); R(g, '#eae6d8', 6, 7, 4, 7); R(g, '#c9c4a8', 6, 11, 4, 1); R(g, '#3a3a3a', 8, 5, 1, 2); R(g, c1, 7, 2, 3, 4); R(g, c2, 8, 3, 1, 2); };
  FD.peace_candle = (g) => candle(g, '#8fe6ff', '#ffffff');
  FD.water_candle = (g) => candle(g, '#7a3ab8', '#e0b0ff');
  FD.sunflower = (g) => { R(g, '#a85a3a', 4, 11, 8, 5); R(g, '#c9764e', 4, 11, 8, 1); R(g, '#3c8a2a', 7, 5, 2, 7); R(g, '#3c8a2a', 4, 8, 3, 1); R(g, '#ffd84a', 4, 1, 8, 6); R(g, '#ffd84a', 6, 0, 4, 8); R(g, '#6b4423', 6, 3, 4, 3); R(g, '#e08a1e', 4, 1, 1, 1); R(g, '#e08a1e', 11, 6, 1, 1); };
  FD.guardian = (g) => { R(g, '#8a8c94', 4, 14, 8, 2); R(g, '#a9abb3', 5, 6, 6, 8); R(g, '#8a8c94', 4, 7, 2, 6); R(g, '#8a8c94', 10, 7, 2, 6); R(g, '#a9abb3', 5, 1, 6, 5); R(g, '#5d5f68', 6, 3, 1, 1); R(g, '#5d5f68', 9, 3, 1, 1); R(g, '#d0d2d8', 5, 1, 6, 1); R(g, '#5d5f68', 7, 8, 2, 4); R(g, '#c8c8d0', 12, 4, 2, 9); };
  FD.crystal_ball = (g) => { R(g, '#6b4423', 4, 13, 8, 3); R(g, '#4e3018', 5, 12, 6, 1); R(g, '#7a4ac8', 4, 3, 8, 9); R(g, '#7a4ac8', 3, 5, 10, 5); R(g, '#c9a8ff', 5, 4, 6, 7); R(g, '#e8d8ff', 6, 5, 3, 3); R(g, '#fff', 6, 5, 1, 2); };
  FD.aquarium = (g) => { R(g, '#6b4423', 0, 4, 16, 2); R(g, '#6b4423', 0, 14, 16, 2); R(g, '#3a8cc9', 1, 6, 14, 8); R(g, '#6ab8e0', 1, 6, 14, 2); R(g, '#d6c27a', 1, 13, 14, 1); R(g, '#ff8a3c', 4, 9, 4, 2); R(g, '#ff8a3c', 3, 10, 1, 1); R(g, '#fff', 6, 9, 1, 1); R(g, '#7af0a0', 10, 8, 3, 2); R(g, '#3c8a2a', 12, 10, 1, 3); R(g, '#ffffff70', 2, 7, 1, 5); };
  FD.piano = (g) => { R(g, '#2a2a34', 0, 2, 16, 14); R(g, '#3d3f48', 0, 2, 16, 2); R(g, '#f2f2f2', 1, 8, 14, 4); for (let x = 3; x < 15; x += 2) R(g, '#111', x, 8, 1, 3); R(g, '#2a2a34', 2, 12, 12, 1); R(g, '#d0d2d8', 4, 5, 8, 2); R(g, '#555', 1, 13, 2, 3); R(g, '#555', 13, 13, 2, 3); };
  FD.globe = (g) => { R(g, '#6b4423', 6, 14, 4, 2); R(g, '#8a5a2b', 7, 11, 2, 3); R(g, '#3a8cc9', 4, 2, 8, 9); R(g, '#3a8cc9', 3, 4, 10, 5); R(g, '#4caa3c', 5, 4, 3, 3); R(g, '#4caa3c', 9, 6, 3, 3); R(g, '#e0c090', 3, 6, 1, 3); R(g, '#e0c090', 12, 4, 1, 4); R(g, '#ffffff80', 5, 3, 2, 1); };
  // decorazioni
  FD.painting = (g, P, v, t) => {
    R(g, '#6b4423', 1, 2, 14, 12); R(g, '#c28d52', 1, 2, 14, 1); R(g, '#a8753f', 2, 3, 12, 10);
    const d = t.design;
    if (d === 0) { R(g, '#78b8f0', 2, 3, 12, 6); R(g, '#4caa3c', 2, 8, 12, 5); R(g, '#3b8f2f', 4, 6, 6, 3); R(g, '#ffe27a', 11, 4, 2, 2); }
    else if (d === 1) { R(g, '#ff8a3c', 2, 3, 12, 4); R(g, '#a82a5a', 2, 6, 12, 3); R(g, '#2a1e42', 2, 9, 12, 4); R(g, '#ffd070', 6, 5, 4, 3); R(g, '#0a0a20', 2, 11, 12, 2); }
    else if (d === 2) { R(g, '#1a1f48', 2, 3, 12, 10); R(g, '#ffe27a', 4, 5, 1, 1); R(g, '#fff', 9, 4, 1, 1); R(g, '#ffe27a', 7, 9, 1, 1); R(g, '#fff', 12, 8, 1, 1); R(g, '#e8e4d0', 10, 5, 2, 2); }
    else if (d === 3) { R(g, '#8fd0f0', 2, 3, 12, 6); R(g, '#2a5a9a', 2, 9, 12, 4); R(g, '#6b4423', 6, 8, 5, 2); R(g, '#f2f2f2', 7, 4, 3, 4); R(g, '#6b4423', 8, 3, 1, 6); }
    else if (d === 4) { R(g, '#78b8f0', 2, 3, 12, 10); R(g, '#8a8c94', 4, 6, 8, 7); R(g, '#5d5f68', 4, 4, 2, 3); R(g, '#5d5f68', 10, 4, 2, 3); R(g, '#1c1c24', 7, 9, 2, 4); R(g, '#5d5f68', 7, 4, 2, 3); }
    else { R(g, '#1c1c24', 2, 3, 12, 10); R(g, '#e8e4d0', 5, 4, 6, 5); R(g, '#e8e4d0', 6, 9, 4, 2); R(g, '#1c1c24', 6, 6, 1, 2); R(g, '#1c1c24', 9, 6, 1, 2); R(g, '#1c1c24', 7, 9, 1, 2); R(g, '#1c1c24', 9, 9, 1, 2); }
  };
  FD.banner = (g, P, v, t) => { R(g, '#6b4423', 2, 0, 12, 2); R(g, t.bc, 3, 2, 10, 11); R(g, t.bc, 4, 13, 3, 2); R(g, t.bc, 9, 13, 3, 2); R(g, '#00000040', 3, 2, 2, 11); R(g, '#ffffff50', 11, 2, 1, 11); R(g, '#ffd84a', 7, 5, 2, 4); R(g, '#ffd84a', 6, 6, 4, 2); };
  FD.vase = (g, P, v, t) => { const d = t.design; if (d === 0) { R(g, '#b8603a', 5, 6, 6, 9); R(g, '#b8603a', 4, 8, 8, 5); R(g, '#d98a5a', 5, 6, 2, 8); R(g, '#8a4020', 4, 14, 8, 2); R(g, '#8a4020', 5, 5, 6, 1); } else if (d === 1) { R(g, '#f2f2f2', 5, 6, 6, 9); R(g, '#f2f2f2', 4, 8, 8, 5); R(g, '#3a64b8', 5, 9, 6, 1); R(g, '#3a64b8', 5, 12, 6, 1); R(g, '#3a64b8', 6, 4, 4, 2); R(g, '#ffd84a', 7, 10, 2, 1); } else { R(g, '#cfe8f0', 5, 8, 6, 7); R(g, '#8fb5c4', 4, 14, 8, 2); R(g, '#3c8a2a', 7, 3, 1, 5); R(g, '#3c8a2a', 9, 4, 1, 4); R(g, '#ff5a8a', 5, 1, 4, 3); R(g, '#ffd84a', 9, 2, 3, 3); R(g, '#fff', 6, 2, 1, 1); } };
  FD.statue = (g, P, v, t) => { const d = t.design; R(g, '#6e7078', 3, 13, 10, 3); R(g, '#8a8c94', 3, 13, 10, 1); if (d === 0) { R(g, '#a9abb3', 5, 6, 6, 7); R(g, '#a9abb3', 5, 1, 6, 5); R(g, '#5d5f68', 6, 3, 4, 1); R(g, '#5d5f68', 7, 0, 2, 1); R(g, '#c8c8d0', 11, 3, 1, 10); R(g, '#8a8c94', 4, 8, 2, 4); } else if (d === 1) { R(g, '#e8eaf0', 6, 5, 4, 8); R(g, '#e8eaf0', 6, 2, 4, 3); R(g, '#e8eaf0', 1, 4, 5, 5); R(g, '#e8eaf0', 10, 4, 5, 5); R(g, '#c8ccd8', 2, 8, 3, 1); R(g, '#ffd84a', 6, 1, 4, 1); } else { R(g, '#6a8f4a', 2, 9, 12, 4); R(g, '#6a8f4a', 8, 4, 6, 6); R(g, '#4a6a30', 2, 12, 12, 1); R(g, '#ff4a2a', 11, 6, 1, 1); R(g, '#e8e4d0', 12, 9, 2, 1); R(g, '#6a8f4a', 3, 5, 2, 5); R(g, '#8fb86a', 9, 4, 4, 1); } };
  FD.trophy = (g, P, v, t) => { const d = t.design; R(g, '#6b4423', 2, 1, 12, 14); R(g, '#c28d52', 2, 1, 12, 1); R(g, '#3a2a1a', 3, 2, 10, 12);
    if (d === 0) { R(g, '#3b8f2f', 4, 3, 8, 3); R(g, '#6b4423', 5, 6, 6, 6); R(g, '#ffd84a', 6, 8, 1, 1); R(g, '#ffd84a', 9, 8, 1, 1); }
    else if (d === 1) { R(g, '#5a4a78', 7, 5, 2, 5); R(g, '#8a6bff', 3, 4, 4, 3); R(g, '#8a6bff', 9, 4, 4, 3); R(g, '#e8e4d0', 7, 9, 1, 1); R(g, '#e8e4d0', 8, 9, 1, 1); }
    else { R(g, '#ff6a3c', 7, 6, 2, 5); R(g, '#e8d0b0', 5, 5, 6, 5); R(g, '#ff6a3c', 4, 2, 1, 4); R(g, '#ff6a3c', 11, 2, 1, 4); R(g, '#ffd070', 6, 7, 1, 1); R(g, '#ffd070', 9, 7, 1, 1); }
    R(g, '#ffd84a', 6, 12, 4, 1); };
  FD.mirror = (g) => { R(g, '#d4a82a', 3, 1, 10, 14); R(g, '#8fd0f0', 4, 2, 8, 12); R(g, '#e8fcff', 5, 3, 2, 5); R(g, '#e8fcff', 5, 9, 1, 2); R(g, '#ffffff', 10, 4, 1, 1); };
  FD.barrel = (g) => { R(g, '#8a5a2b', 3, 1, 10, 15); R(g, '#a8753f', 3, 1, 10, 14); R(g, '#8a5a2b', 2, 4, 12, 9); R(g, '#c28d52', 4, 1, 2, 15); R(g, '#6e7078', 2, 3, 12, 1); R(g, '#6e7078', 2, 12, 12, 1); R(g, '#4e3018', 8, 1, 1, 15); R(g, '#4e3018', 12, 4, 1, 9); };
  FD.crate = (g) => { R(g, '#a8753f', 1, 2, 14, 14); R(g, '#6b4423', 1, 2, 14, 2); R(g, '#6b4423', 1, 14, 14, 2); R(g, '#6b4423', 1, 2, 2, 14); R(g, '#6b4423', 13, 2, 2, 14); R(g, '#8a5a2b', 3, 4, 10, 10); R(g, '#6b4423', 3, 8, 10, 1); for (let i = 0; i < 10; i++) R(g, '#6b4423', 3 + i, 4 + i, 1, 1); };
  FD.dresser = (g) => { R(g, '#8a5a2b', 1, 3, 14, 13); R(g, '#a8753f', 1, 3, 14, 2); R(g, '#6b4423', 2, 6, 12, 4); R(g, '#6b4423', 2, 11, 12, 4); R(g, '#c28d52', 2, 6, 12, 1); R(g, '#c28d52', 2, 11, 12, 1); R(g, '#ffd84a', 7, 8, 2, 1); R(g, '#ffd84a', 7, 13, 2, 1); R(g, '#4e3018', 1, 15, 2, 1); R(g, '#4e3018', 13, 15, 2, 1); };
})(window.TF);
