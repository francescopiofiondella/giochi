'use strict';
// Terrafrante - oggetti, equipaggiamento e ricette
(function (TF) {
  const ITEMS = (TF.ITEMS = {});
  function item(id, name, type, o) {
    const stackable = ['block', 'wall', 'mat', 'ammo', 'potion', 'thrown', 'food'].includes(type);
    ITEMS[id] = Object.assign({ id, name, type, stack: stackable ? 999 : 1, rar: 0, desc: '', col: ['#ccc', '#888'] }, o || {});
    return ITEMS[id];
  }
  // Blocchi derivati dai tile
  for (const t of TF.TILES) {
    if (t.id === 0 || t.item === false) continue;
    item(t.itemId, t.name, 'block', { tile: t.id, rar: t.rar || 0, cat: t.cat, desc: t.desc || (t.station ? 'Stazione di lavoro' : t.interact ? 'Si usa con il tasto destro' : '') });
  }
  for (const w of TF.WALLS) if (w) item(w.itemId, w.name, 'wall', { wall: w.id });
  for (const id of ['bench', 'chest', 'bed', 'door', 'torch', 'lamp', 'furnace', 'anvil']) if (ITEMS[id]) ITEMS[id].cat = 'Mobili';
  TF.itemDef = item;

  const M = (id, name, ic, c1, c2, desc) => item(id, name, 'mat', { ic, col: [c1, c2], desc: desc || '' });
  M('wood', 'Legno', 'log', '#8a5a2b', '#5e3b1b');
  M('gel', 'Gelatina', 'gel', '#6fe08a', '#3fa85a', 'Viscida e infiammabile');
  M('bone', 'Osso', 'bone', '#e8e4d0', '#b5b09a');
  M('silk', 'Seta di Ragno', 'silk', '#f2f2f2', '#c9c9d4');
  M('cloth', 'Tessuto', 'cloth', '#d9d2c0', '#a79f8a');
  M('wing', 'Ala di Pipistrello', 'wing', '#5a4a78', '#3a2e52');
  M('frost_shard', 'Scheggia Gelida', 'shard', '#bfeaff', '#6ab8e0', 'Bioma: Neve');
  M('jungle_spore', 'Spora della Giungla', 'spore', '#b6f060', '#5ea02a', 'Bioma: Giungla');
  M('bog_goo', 'Melma Palustre', 'gel', '#9bb35a', '#66783a', 'Bioma: Palude');
  M('scarab', 'Scarabeo Dorato', 'scarab', '#e8c34a', '#8a6a1e', 'Bioma: Deserto');
  M('livid_essence', 'Essenza Livida', 'essence', '#c783f0', '#7a3fa8', 'Bioma: Terre Corrotte');
  M('flower', 'Fiore Solare', 'flower', '#ffd84a', '#e08a1e');
  M('mushroom', 'Fungo Cavernicolo', 'mush', '#79e0d4', '#2f9a95');
  M('cactus', 'Cactus', 'cactus', '#4aa05a', '#2e6b3a');
  M('bottle', 'Bottiglia', 'bottle', '#cfe8f0', '#8fb5c4');
  M('sap', 'Linfa Antica', 'sap', '#ffb938', '#c07a12', 'Dal Ceppo Antico');
  M('night_core', 'Nucleo Notturno', 'core', '#8a6bff', '#41279e', 'Dalla Nottola Regina');
  M('abyss_core', 'Nucleo d\'Abisso', 'core', '#ff6a3c', '#a82a12', 'Dal Sire dell\'Abisso');
  M('copper_bar', 'Lingotto di Rame', 'bar', '#e08a4a', '#a85a24');
  M('iron_bar', 'Lingotto di Ferro', 'bar', '#cfd3da', '#8a8f9a');
  M('gold_bar', 'Lingotto d\'Oro', 'bar', '#ffd84a', '#c9971a');
  M('shadow_bar', 'Lingotto d\'Ombrite', 'bar', '#a45fe0', '#5f2f99');
  M('abyss_bar', 'Lingotto d\'Abissite', 'bar', '#ff7a3c', '#a83a12');
  item('arrow', 'Freccia', 'ammo', { dmg: 4, ic: 'arrow', col: ['#d9c9a0', '#8a8f9a'] });

  // Livelli di equipaggiamento
  // k, di, c1, c2, picco, ascia, martello, [dmg, vel], [arco dmg, vel, velocità freccia], armatura [e,c,g], bonus set, lingotti
  const TIERS = [
    { k: 'wood', of: 'di Legno', c: ['#a8753f', '#6b4423'], armor: [1, 2, 1], set: 0, bar: 'wood', n: [15, 25, 20], bow: [6, 28, 9] },
    { k: 'copper', of: 'di Rame', c: ['#e08a4a', '#8a5a2b'], pick: 40, axe: 35, ham: 40, sword: [10, 22, 4], armor: [2, 3, 2], set: 1, bar: 'copper_bar', n: [6, 10, 8], r: 0 },
    { k: 'iron', of: 'di Ferro', c: ['#d4d8df', '#6b4423'], pick: 50, axe: 45, ham: 55, sword: [15, 21, 4.5], bow: [10, 26, 10], armor: [3, 5, 3], set: 2, bar: 'iron_bar', n: [8, 12, 10], r: 1 },
    { k: 'gold', of: 'd\'Oro', c: ['#ffd84a', '#6b4423'], pick: 60, axe: 55, sword: [20, 20, 5], bow: [15, 24, 11], armor: [4, 6, 4], set: 3, bar: 'gold_bar', n: [10, 14, 12], r: 2 },
    { k: 'shadow', of: 'd\'Ombrite', c: ['#a45fe0', '#3a2552'], pick: 75, axe: 70, ham: 80, sword: [29, 19, 5.5], bow: [22, 22, 12], armor: [7, 9, 6], set: 5, bar: 'shadow_bar', n: [12, 18, 14], r: 3 },
    { k: 'abyss', of: 'd\'Abissite', c: ['#ff7a3c', '#401c10'], pick: 100, axe: 90, sword: [41, 17, 6], bow: [32, 19, 13], armor: [10, 14, 9], set: 8, bar: 'abyss_bar', n: [14, 22, 16], r: 4 },
  ];
  TF.TIERS = TIERS;
  for (const t of TIERS) {
    const r = t.r || 0;
    if (t.pick) item('pick_' + t.k, 'Piccone ' + t.of, 'pick', { power: t.pick, dmg: 3 + r * 2, spd: 20, kb: 2, col: t.c, rar: r, ic: 'pick', desc: 'Scava blocchi' });
    if (t.axe) item('axe_' + t.k, 'Ascia ' + t.of, 'axe', { power: t.axe, dmg: 5 + r * 2, spd: 22, kb: 3, col: t.c, rar: r, ic: 'axe', desc: 'Abbatte alberi e legno' });
    if (t.ham) item('hammer_' + t.k, 'Martello ' + t.of, 'hammer', { power: t.ham, dmg: 6 + r * 3, spd: 26, kb: 4, col: t.c, rar: r, ic: 'hammer', desc: 'Rimuove le pareti' });
    if (t.sword) item('sword_' + t.k, 'Spada ' + t.of, 'sword', { dmg: t.sword[0], spd: t.sword[1], kb: t.sword[2], len: 26 + r * 2, col: t.c, rar: r, ic: 'sword' });
    if (t.bow) item('bow_' + t.k, 'Arco ' + t.of, 'bow', { dmg: t.bow[0], spd: t.bow[1], vel: t.bow[2], kb: 2, col: t.c, rar: r, ic: 'bow', desc: 'Usa frecce' });
    const nm = [['helm', 'Elmo', 'head'], ['chest', 'Corazza', 'body'], ['legs', 'Schinieri', 'legs']];
    nm.forEach((p, i) => item(p[0] + '_' + t.k, p[1] + ' ' + t.of, p[2], { def: t.armor[i], set: t.k, setBonus: t.set, col: t.c, rar: r, ic: p[2] }));
  }
  const W = (id, name, o) => item(id, name, 'sword', Object.assign({ ic: 'sword' }, o));
  W('sword_frost', 'Lama del Gelo', { dmg: 24, spd: 20, kb: 4, len: 30, col: ['#bfeaff', '#4a8fb8'], rar: 2, slow: true, desc: 'Rallenta i nemici' });
  W('sword_jungle', 'Lama Spinosa', { dmg: 30, spd: 18, kb: 4, len: 30, col: ['#9be04a', '#3a6b1e'], rar: 3, poison: true, desc: 'Avvelena i nemici' });
  W('root_blade', 'Lama Radicale', { dmg: 24, spd: 17, kb: 5, len: 32, col: ['#a8753f', '#4caa3c'], rar: 2, wave: 0.5, desc: 'Lancia onde di radici' });
  W('night_scythe', 'Falce Notturna', { dmg: 38, spd: 16, kb: 5, len: 34, col: ['#8a6bff', '#2a1e5e'], rar: 3, wave: 0.6, lifesteal: 0.03, desc: 'Lancia mezzelune. Ruba vita' });
  W('lord_blade', 'Lama del Sire', { dmg: 62, spd: 14, kb: 7, len: 38, col: ['#ff6a3c', '#2a0e08'], rar: 4, wave: 0.7, desc: 'Lancia onde infuocate' });
  const B = (id, name, o) => item(id, name, 'bow', Object.assign({ ic: 'bow', kb: 2 }, o));
  B('bow_dune', 'Arco delle Dune', { dmg: 17, spd: 23, vel: 11, col: ['#e8c34a', '#4aa05a'], rar: 2, pierce: 2, desc: 'Le frecce trapassano i nemici' });
  B('bow_sonic', 'Arco Sonico', { dmg: 34, spd: 20, vel: 13, col: ['#8a6bff', '#2a1e5e'], rar: 3, multi: 2, desc: 'Scocca due frecce' });
  const S = (id, name, o) => item(id, name, 'staff', Object.assign({ ic: 'staff', kb: 2 }, o));
  S('staff_spark', 'Bastone Scintilla', { dmg: 13, spd: 24, mana: 4, proj: 'spark', col: ['#8fe6ff', '#6b4423'], rar: 1, desc: 'Lancia scintille magiche' });
  S('staff_frost', 'Bastone del Gelo', { dmg: 19, spd: 22, mana: 6, proj: 'frost', col: ['#bfeaff', '#4a8fb8'], rar: 2, desc: 'Schegge che rallentano' });
  S('staff_spore', 'Bastone delle Spore', { dmg: 24, spd: 22, mana: 7, proj: 'spore', col: ['#b6f060', '#3a6b1e'], rar: 3, desc: 'Spore teleguidate velenose' });
  S('staff_shadow', 'Bastone d\'Ombra', { dmg: 32, spd: 20, mana: 9, proj: 'shadow', col: ['#c783f0', '#3a2552'], rar: 3, desc: 'Sfere d\'ombra teleguidate' });
  S('staff_abyss', 'Bastone d\'Abisso', { dmg: 45, spd: 18, mana: 11, proj: 'fire', col: ['#ff7a3c', '#401c10'], rar: 4, desc: 'Palle di fuoco esplosive' });
  S('staff_sire', 'Scettro del Sire', { dmg: 62, spd: 16, mana: 13, proj: 'fire', multi: 3, col: ['#ff6a3c', '#ffd070'], rar: 4, desc: 'Tre fiammate esplosive' });

  const A = (id, name, ic, col, fx, desc, rar) => item(id, name, 'acc', { ic, col, fx, desc, rar: rar || 1 });
  A('boots_speed', 'Stivali del Vento', 'boot', ['#6ab8e0', '#2a4f70'], { speed: 0.25 }, '+25% velocità di corsa');
  A('spring_boot', 'Molla Saltatrice', 'spring', ['#d4d8df', '#6b4423'], { jump: 1.5 }, 'Salti più alti');
  A('miner_glove', 'Guanto del Minatore', 'glove', ['#ffd84a', '#a8753f'], { mine: 0.3 }, '+30% velocità di scavo', 2);
  A('crystal_shield', 'Scudo di Cristallo', 'shield', ['#8fe6ff', '#2f5f8c'], { def: 3, kbImmune: 1 }, '+3 difesa, immune al knockback', 2);
  A('vital_ring', 'Anello Vitale', 'ring', ['#ff6a7a', '#a82a3a'], { regen: 1.5 }, 'Rigenera vita', 2);
  A('arcane_amulet', 'Amuleto Arcano', 'amulet', ['#6ab8ff', '#2a3f9e'], { mana: 60 }, '+60 mana massimo', 2);
  A('lantern_charm', 'Amuleto Luminoso', 'amulet', ['#fff08a', '#c9971a'], { light: 110 }, 'Illumina attorno a te', 2);
  A('lava_charm', 'Talismano Magmatico', 'amulet', ['#ff7a3c', '#401c10'], { lavaImm: 1 }, 'Immune alla lava', 3);
  A('cloud_ring', 'Anello delle Nubi', 'ring', ['#e8f4ff', '#8fb5c4'], { dj: 1 }, 'Doppio salto', 2);
  A('bark_shield', 'Scudo di Corteccia', 'shield', ['#a8753f', '#4caa3c'], { def: 2, thorns: 8 }, '+2 difesa, riflette danni', 2);
  A('wings_bat', 'Ali di Pipistrello', 'wings', ['#5a4a78', '#8a6bff'], { wings: 160 }, 'Tieni SPAZIO in aria per volare', 3);

  const P = (id, name, col, o) => item(id, name, 'potion', Object.assign({ ic: 'potion', col, rar: 1, use: 30 }, o));
  P('potion_heal_s', 'Pozione di Vita', ['#ff4a5a', '#a81a2a'], { heal: 60, sick: 1, desc: 'Ripristina 60 vita' });
  P('potion_heal_l', 'Pozione di Vita Maggiore', ['#ff2a4a', '#701020'], { heal: 130, sick: 1, desc: 'Ripristina 130 vita', rar: 2 });
  P('potion_mana', 'Pozione di Mana', ['#4a8fff', '#1a3f9e'], { mana: 90, desc: 'Ripristina 90 mana' });
  P('potion_speed', 'Pozione di Velocità', ['#6af0a0', '#1f8a55'], { buff: ['speed', 120], desc: 'Velocità +30% per 2 minuti' });
  P('potion_mining', 'Pozione dello Scavo', ['#ffd84a', '#a8761a'], { buff: ['mining', 120], desc: 'Scavo +40% per 2 minuti' });
  P('potion_iron', 'Pozione Ferrea', ['#cfd3da', '#6b717c'], { buff: ['iron', 120], desc: 'Difesa +8 per 2 minuti' });
  item('life_crystal', 'Cristallo Vitale', 'perm', { maxhp: 20, ic: 'heart', col: ['#ff4a6a', '#a81a3a'], stack: 99, rar: 2, desc: 'Vita massima +20 (max 500)' });
  item('mana_crystal', 'Cristallo Arcano', 'perm', { maxmana: 20, ic: 'star', col: ['#6ab8ff', '#2a4f9e'], stack: 99, rar: 2, desc: 'Mana massimo +20 (max 200)' });
  const SU = (id, name, boss, col, desc) => item(id, name, 'summon', { boss, ic: 'summon', col, rar: 3, stack: 20, desc });
  SU('acorn_ancient', 'Ghianda Antica', 'ceppo', ['#c8923f', '#5e3b1b'], 'Risveglia il Ceppo Antico');
  SU('whistle', 'Fischietto Spettrale', 'nottola', ['#a58aff', '#41279e'], 'Evoca la Nottola Regina');
  SU('abyss_heart', 'Cuore dell\'Abisso', 'sire', ['#ff6a3c', '#a82a12'], 'Evoca il Sire dell\'Abisso');

  // ------- Ricette -------
  const RECIPES = (TF.RECIPES = []);
  const R = (out, n, ing, st, cat) => {
    const it = ITEMS[out];
    if (!it) throw new Error('Ricetta: oggetto sconosciuto ' + out);
    for (const k in ing) if (!ITEMS[k]) throw new Error('Ricetta ' + out + ': ingrediente sconosciuto ' + k);
    RECIPES.push({ out, n, ing, st: st || null, cat: cat || catOf(it) });
  };
  function catOf(it) {
    if (it.cat) return it.cat;
    if (['pick', 'axe', 'hammer', 'tool', 'hook'].includes(it.type)) return 'Strumenti';
    if (['sword', 'bow', 'staff', 'thrown'].includes(it.type)) return 'Armi';
    if (it.type === 'ammo') return 'Munizioni';
    if (['head', 'body', 'legs'].includes(it.type)) return 'Armature';
    if (it.type === 'block' || it.type === 'wall') return 'Blocchi';
    if (it.type === 'acc') return 'Accessori';
    if (it.type === 'potion') return 'Pozioni';
    if (['food', 'summon', 'perm'].includes(it.type)) return 'Consumabili';
    return 'Materiali';
  }
  TF.RECIPE_CATS = ['Tutto', 'Strumenti', 'Armi', 'Munizioni', 'Armature', 'Accessori', 'Pozioni', 'Consumabili', 'Mobili', 'Blocchi', 'Materiali'];

  TF.addRecipe = R;
  // base
  R('bench', 1, { wood: 10 }, null);
  R('torch', 3, { wood: 1, gel: 1 }, null);
  R('planks', 1, { wood: 1 }, 'bench'); R('platform', 2, { wood: 1 }, 'bench'); R('door', 1, { wood: 6 }, 'bench');
  R('chest', 1, { wood: 8 }, 'bench'); R('bed', 1, { wood: 12, cloth: 3 }, 'bench'); R('rope', 4, { wood: 1 }, 'bench');
  R('furnace', 1, { stone: 20, wood: 4, torch: 3 }, 'bench'); R('anvil', 1, { iron_bar: 5 }, 'bench');
  R('stonebrick', 1, { stone: 2 }, 'bench'); R('glass', 1, { sand: 2 }, 'furnace'); R('lamp', 1, { crystal: 3, torch: 1 }, 'bench');
  R('wall_planks', 4, { wood: 1 }, 'bench'); R('wall_stone', 4, { stone: 1 }, 'bench'); R('wall_dirt', 4, { dirt: 1 }, 'bench');
  R('wall_brick', 4, { stonebrick: 1 }, 'bench'); R('wall_sandstone', 4, { sandstone: 1 }, 'bench'); R('wall_ice', 4, { ice: 1 }, 'bench');
  R('cloth', 1, { silk: 3 }, 'bench'); R('bottle', 2, { glass: 1 }, 'bench'); R('arrow', 5, { wood: 1, stone: 1 }, 'bench');
  R('bow_wood', 1, { wood: 10 }, 'bench');
  // fusione
  for (const [k, n] of [['copper', 3], ['iron', 3], ['gold', 4], ['shadow', 5], ['abyss', 6]]) R(k + '_bar', 1, { [k + '_ore']: n }, 'furnace');
  // consumabili
  R('potion_heal_s', 1, { bottle: 1, gel: 2, flower: 1 }, 'bench'); R('potion_heal_l', 1, { bottle: 1, gel: 5, flower: 3, mushroom: 3 }, 'bench');
  R('potion_mana', 1, { bottle: 1, mushroom: 2, crystal: 1 }, 'bench'); R('potion_speed', 1, { bottle: 1, flower: 2, jungle_spore: 1 }, 'bench');
  R('potion_mining', 1, { bottle: 1, mushroom: 2, iron_ore: 1 }, 'bench'); R('potion_iron', 1, { bottle: 1, iron_bar: 1, flower: 1 }, 'bench');
  R('acorn_ancient', 1, { wood: 15, gel: 8 }, 'bench');
  // equipaggiamento a livelli
  for (const t of TIERS) {
    const st = t.k === 'wood' ? 'bench' : 'anvil';
    const b = t.bar, w = t.k === 'wood' ? {} : { wood: 3 };
    const need = (n) => Object.assign({ [b]: n }, w);
    R('helm_' + t.k, 1, { [b]: t.n[0] }, st); R('chest_' + t.k, 1, { [b]: t.n[1] }, st); R('legs_' + t.k, 1, { [b]: t.n[2] }, st);
    if (t.pick) { R('pick_' + t.k, 1, need(8 + (t.r || 0) * 2), st); R('axe_' + t.k, 1, need(8 + (t.r || 0) * 2), st); }
    if (t.ham) R('hammer_' + t.k, 1, need(6 + (t.r || 0) * 2), st);
    if (t.sword) R('sword_' + t.k, 1, need(8 + (t.r || 0) * 2), st);
    if (t.bow && t.k !== 'wood') R('bow_' + t.k, 1, need(7 + (t.r || 0) * 2), st);
  }
  // armi speciali e accessori
  R('sword_frost', 1, { iron_bar: 8, frost_shard: 12 }, 'anvil'); R('sword_jungle', 1, { gold_bar: 8, jungle_spore: 14 }, 'anvil');
  R('bow_dune', 1, { iron_bar: 8, scarab: 10, cactus: 10 }, 'anvil');
  R('staff_spark', 1, { wood: 10, crystal: 8 }, 'anvil'); R('staff_frost', 1, { iron_bar: 6, frost_shard: 12 }, 'anvil');
  R('staff_spore', 1, { gold_bar: 6, jungle_spore: 12 }, 'anvil'); R('staff_shadow', 1, { shadow_bar: 10, livid_essence: 6 }, 'anvil');
  R('staff_abyss', 1, { abyss_bar: 12, crystal: 10 }, 'anvil');
  R('boots_speed', 1, { iron_bar: 6, cloth: 4 }, 'anvil'); R('spring_boot', 1, { iron_bar: 8, cloth: 2, bog_goo: 4 }, 'anvil');
  R('miner_glove', 1, { gold_bar: 6, cloth: 4 }, 'anvil'); R('crystal_shield', 1, { crystal: 12, iron_bar: 8 }, 'anvil');
  R('vital_ring', 1, { gold_bar: 6, bog_goo: 10, flower: 4 }, 'anvil'); R('arcane_amulet', 1, { crystal: 10, gold_bar: 5, mana_crystal: 1 }, 'anvil');
  R('lantern_charm', 1, { crystal: 8, torch: 10, iron_bar: 4 }, 'anvil'); R('lava_charm', 1, { obsidian: 20, shadow_bar: 8 }, 'anvil');
  R('whistle', 1, { wing: 8, sap: 5, iron_bar: 6 }, 'anvil'); R('abyss_heart', 1, { abyss_bar: 8, night_core: 6, livid_essence: 12 }, 'anvil');
})(window.TF);
