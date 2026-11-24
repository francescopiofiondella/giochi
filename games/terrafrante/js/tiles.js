'use strict';
// Terrafrante - definizioni di blocchi (tile) e pareti
(function (TF) {
  const TILES = (TF.TILES = []);
  const T = (TF.T = {});
  function tile(key, name, o) {
    const id = TILES.length;
    const t = Object.assign({ id, key, name, solid: true, hard: 2, min: 0, tool: 'pick', light: 0, tx: {} }, o || {});
    if (t.item !== false && t.drop === undefined) t.drop = t.itemId || key.toLowerCase();
    if (t.item !== false && !t.itemId) t.itemId = key.toLowerCase();
    TILES.push(t); T[key] = id; return t;
  }
  const stoneTx = { b: '#7d7f86', a: '#5d5f68', c: '#9a9ca5' };
  const ore = (b, f, f2) => ({ b: b.b, a: b.a, c: b.c, st: 'ore', f, f2 });
  const dirtTx = { b: '#7b5535', a: '#5f3f26', c: '#946a43' };
  const mudTx = { b: '#5a4636', a: '#42342a', c: '#705843' };
  const cdirtTx = { b: '#4b3a56', a: '#362a40', c: '#62496f' };
  const cstoneTx = { b: '#4d4560', a: '#383247', c: '#665c7d' };
  const basaltTx = { b: '#33333f', a: '#23232d', c: '#474755' };

  tile('AIR', 'Aria', { solid: false, hard: 0, item: false });
  tile('DIRT', 'Terra', { hard: 2, tx: dirtTx });
  tile('GRASS', 'Erba', { hard: 2, item: false, drop: 'dirt', base: 'DIRT', tx: Object.assign({ top: '#4caa3c', top2: '#78d257' }, dirtTx) });
  tile('STONE', 'Pietra', { hard: 6, tx: stoneTx });
  tile('SAND', 'Sabbia', { hard: 1.5, tx: { b: '#d9c27a', a: '#bfa65f', c: '#ecdc9b' } });
  tile('SANDSTONE', 'Arenaria', { hard: 4, tx: { b: '#c49b55', a: '#a98140', c: '#d9b46f', st: 'bands' } });
  tile('SNOW', 'Neve', { hard: 1.5, tx: { b: '#eef4fa', a: '#cdd9e6', c: '#ffffff' } });
  tile('ICE', 'Ghiaccio', { hard: 3, tx: { b: '#9fd4ee', a: '#7ab9dd', c: '#d6f1ff', st: 'ice' } });
  tile('MUD', 'Fango', { hard: 2, tx: mudTx });
  tile('JGRASS', 'Erba della Giungla', { hard: 2, item: false, drop: 'mud', base: 'MUD', tx: Object.assign({ top: '#58b92f', top2: '#8be04a' }, mudTx) });
  tile('MOSS', 'Fango Muschioso', { hard: 2, item: false, drop: 'mud', base: 'MUD', tx: Object.assign({ top: '#4d7a45', top2: '#86ab62' }, mudTx) });
  tile('CGRASS', 'Erba Livida', { hard: 2.5, item: false, drop: 'cdirt', base: 'CDIRT', tx: Object.assign({ top: '#8a4fb0', top2: '#b574d8' }, cdirtTx) });
  tile('CDIRT', 'Terra Livida', { hard: 3, tx: cdirtTx });
  tile('CSTONE', 'Pietra Livida', { hard: 7, tx: cstoneTx });
  tile('BASALT', 'Basalto', { hard: 14, min: 50, tx: basaltTx });
  tile('COPPER_ORE', 'Minerale di Rame', { hard: 5, tx: ore(stoneTx, '#d98b4a', '#f4b777') });
  tile('IRON_ORE', 'Minerale di Ferro', { hard: 7, tx: ore(stoneTx, '#b89c8a', '#e6d6c9') });
  tile('GOLD_ORE', 'Minerale d\'Oro', { hard: 9, min: 50, tx: ore(stoneTx, '#f2c63c', '#fff08a') });
  tile('SHADOW_ORE', 'Ombrite Grezza', { hard: 12, min: 60, light: 25, tx: ore(cstoneTx, '#9b5bd6', '#dca4ff') });
  tile('ABYSS_ORE', 'Abissite Grezza', { hard: 16, min: 75, light: 70, tx: ore(basaltTx, '#ff6a3c', '#ffd070') });
  tile('CRYSTAL', 'Cristallo Lucente', { hard: 6, light: 130, tx: { b: '#2f5f8c', a: '#244a70', c: '#8fe6ff', st: 'crystal' } });
  tile('OBSIDIAN', 'Ossidiana', { hard: 14, min: 60, tx: { b: '#1f1634', a: '#120c20', c: '#3d2a66', st: 'ice' } });
  tile('BEDROCK', 'Roccia Eterna', { hard: Infinity, item: false, tx: { b: '#1b1b22', a: '#101016', c: '#2a2a35' } });
  tile('PLANKS', 'Assi di Legno', { hard: 3, tx: { b: '#a8753f', a: '#7e5229', c: '#c28d52', st: 'plank' } });
  tile('STONEBRICK', 'Mattone di Pietra', { hard: 5, tx: { b: '#8a8c94', a: '#5d5f68', c: '#a9abb3', st: 'brick' } });
  tile('DUNGEON', 'Mattone Spettrale', { hard: 12, min: 50, tx: { b: '#34466f', a: '#232f4f', c: '#4b6199', st: 'brick' } });
  tile('GLASS', 'Vetro', { hard: 1, tx: { b: '#bfe7f2', a: '#9fcfe0', c: '#ffffff', st: 'glass' } });
  // Strutture e arredi
  tile('PLATFORM', 'Piattaforma', { hard: 1, plat: true, tx: { st: 'platform' }, draw: 'platform', tool: 'any' });
  tile('DOOR_C', 'Porta', { hard: 2, itemId: 'door', drop: 'door', interact: 'door', tool: 'axe', draw: 'door_c' });
  tile('DOOR_O', 'Porta Aperta', { hard: 2, solid: false, item: false, drop: 'door', interact: 'door', tool: 'axe', draw: 'door_o' });
  tile('TORCH', 'Torcia', { solid: false, hard: 0.1, light: 235, tool: 'any', draw: 'torch', torch: true });
  tile('CHEST', 'Scrigno', { solid: false, hard: 3, interact: 'chest', tool: 'axe', draw: 'chest' });
  tile('BENCH', 'Banco da Lavoro', { solid: false, hard: 2, station: 'bench', tool: 'axe', draw: 'bench' });
  tile('FURNACE', 'Fornace', { solid: false, hard: 3, station: 'furnace', light: 130, draw: 'furnace' });
  tile('ANVIL', 'Incudine', { solid: false, hard: 4, station: 'anvil', draw: 'anvil' });
  tile('BED', 'Giaciglio', { solid: false, hard: 2, interact: 'bed', tool: 'axe', draw: 'bed' });
  tile('ROPE', 'Corda', { solid: false, hard: 0.1, climb: true, tool: 'any', draw: 'rope' });
  // Vegetazione e decorazioni naturali
  tile('TRUNK', 'Tronco', { solid: false, hard: 4, tool: 'axe', item: false, drop: 'wood', draw: 'trunk', col: ['#6b4423', '#4e3018'] });
  tile('TRUNK_J', 'Tronco di Mogano', { solid: false, hard: 4, tool: 'axe', item: false, drop: 'wood', draw: 'trunk', col: ['#7a3d28', '#592616'] });
  tile('TRUNK_D', 'Tronco Morto', { solid: false, hard: 4, tool: 'axe', item: false, drop: 'wood', draw: 'trunk', col: ['#5a4f63', '#3c3445'] });
  tile('LEAF', 'Fogliame', { solid: false, hard: 0.3, tool: 'any', item: false, drop: null, draw: 'leaf', col: ['#3b8f2f', '#59b84a', '#2a6d22'] });
  tile('PINE', 'Aghi di Pino', { solid: false, hard: 0.3, tool: 'any', item: false, drop: null, draw: 'leaf', col: ['#2a6b4a', '#e8f2f6', '#1d4f37'] });
  tile('JLEAF', 'Fogliame Tropicale', { solid: false, hard: 0.3, tool: 'any', item: false, drop: null, draw: 'leaf', col: ['#2f9a2a', '#7ee04a', '#1f6d1c'] });
  tile('SLEAF', 'Fogliame Palustre', { solid: false, hard: 0.3, tool: 'any', item: false, drop: null, draw: 'leaf', col: ['#57703a', '#8fa85a', '#3d5128'] });
  tile('CLEAF', 'Fogliame Livido', { solid: false, hard: 0.3, tool: 'any', item: false, drop: null, draw: 'leaf', col: ['#6b3a8f', '#a45fd0', '#4c2a68'] });
  tile('CACTUS', 'Cactus', { solid: false, hard: 1.5, hurt: 9, tool: 'axe', item: false, drop: 'cactus', draw: 'cactus' });
  tile('VINE', 'Liana', { solid: false, hard: 0.1, climb: true, tool: 'any', item: false, drop: null, needsCeil: true, draw: 'vine' });
  tile('TUFT', 'Erba Alta', { solid: false, hard: 0.1, tool: 'any', item: false, drop: null, needsFloor: true, draw: 'tuft' });
  tile('FLOWER', 'Fiore Solare', { solid: false, hard: 0.1, tool: 'any', item: false, drop: 'flower', needsFloor: true, draw: 'flower' });
  tile('MUSHROOM', 'Fungo Cavernicolo', { solid: false, hard: 0.1, light: 45, tool: 'any', item: false, drop: 'mushroom', needsFloor: true, draw: 'mushroom' });
  tile('LIFE_CRYSTAL', 'Cristallo Vitale', { solid: false, hard: 6, light: 120, item: false, drop: 'life_crystal', needsFloor: true, draw: 'lifecrystal' });
  tile('MANA_CRYSTAL', 'Cristallo Arcano', { solid: false, hard: 6, light: 120, item: false, drop: 'mana_crystal', needsFloor: true, draw: 'manacrystal' });
  tile('THORN', 'Spine Livide', { solid: false, hard: 0.4, hurt: 12, tool: 'any', item: false, drop: null, needsFloor: true, draw: 'thorn' });
  tile('COBWEB', 'Ragnatela', { solid: false, hard: 0.2, slow: true, tool: 'any', item: false, drop: 'silk', draw: 'cobweb' });
  tile('LAMP', 'Lanterna di Cristallo', { solid: false, hard: 1, light: 255, draw: 'lamp', tool: 'any' });

  // Liquidi (array separato): 1 = acqua, 2 = lava
  TF.LIQ = { WATER: 1, LAVA: 2 };

  // Pareti di sfondo
  const WALLS = (TF.WALLS = [null]);
  const W = (TF.W = {});
  function wall(key, name, c, st) { const id = WALLS.length; WALLS.push({ id, key, name, c, st: st || 'sp', itemId: 'wall_' + key.toLowerCase() }); W[key] = id; }
  wall('DIRT', 'Parete di Terra', '#5a3f28');
  wall('STONE', 'Parete di Pietra', '#4d4f58');
  wall('PLANKS', 'Parete di Legno', '#6b4a2a', 'plank');
  wall('BRICK', 'Parete di Mattoni', '#555a66', 'brick');
  wall('DUNGEON', 'Parete Spettrale', '#2c3a5c', 'brick');
  wall('SANDSTONE', 'Parete di Arenaria', '#8c6d3c');
  wall('ICE', 'Parete di Ghiaccio', '#5f8ea8');
  wall('MUD', 'Parete di Fango', '#3b2e25');
  wall('CSTONE', 'Parete Livida', '#352f45');
  wall('BASALT', 'Parete di Basalto', '#22222b');

  TF.tileDef = tile;
  // Insiemi utili
  TF.isSolidId = (id) => TILES[id].solid;
  // tile equivalenti "base" per erba sepolta
  TF.GRASS_BASE = {};
  for (const t of TILES) if (t.base) TF.GRASS_BASE[t.id] = T[t.base];
})(window.TF);
