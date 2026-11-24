'use strict';
// Terrafrante - oggetti 3/4: armature (22 set + pezzi singoli) e accessori (ali, scudi, anelli, utilità)
(function (TF) {
  const item = TF.itemDef, R = TF.addRecipe;

  // ================= set di armatura =================
  // chiave, nome, colori, difesa [elmo, corazza, schinieri], bonus set, rarità, [ing. elmo, corazza, schinieri], stazione, fx dei 3 pezzi, fx del set completo, descrizione
  const SETS = [
    ['bone', 'd\'Osso', ['#e8e4d0', '#9a957c'], [3, 4, 3], 1, 1, [{ bone: 14 }, { bone: 20 }, { bone: 16 }], 'bench', [{ crit: 0.02 }, { thorns: 3 }, { speed: 0.04 }], { crit: 0.05, thorns: 4 }],
    ['cactus', 'di Cactus', ['#4aa05a', '#2e6b3a'], [2, 3, 2], 1, 0, [{ cactus: 12 }, { cactus: 18 }, { cactus: 14 }], 'bench', [{}, { thorns: 4 }, {}], { thorns: 6, dr: 0.03 }],
    ['ice', 'di Ghiaccio', ['#bfeaff', '#4a8fb8'], [4, 5, 4], 3, 1, [{ frost_shard: 10, iron_bar: 2 }, { frost_shard: 16, iron_bar: 3 }, { frost_shard: 12, iron_bar: 2 }], 'anvil', [{ light: 30 }, { dr: 0.03 }, {}], { frostHit: 1, dr: 0.05 }],
    ['jungle', 'della Giungla', ['#9be04a', '#3a6b1e'], [5, 6, 4], 3, 2, [{ jungle_spore: 10, gold_bar: 3 }, { jungle_spore: 16, gold_bar: 4 }, { jungle_spore: 12, gold_bar: 3 }], 'anvil', [{ regen: 0.5 }, { regen: 0.5 }, { speed: 0.05 }], { regen: 1.5, poisonHit: 1 }],
    ['desert', 'del Deserto', ['#e8c34a', '#8a6a1e'], [4, 5, 4], 3, 1, [{ scarab: 8, sandstone: 10 }, { scarab: 12, sandstone: 16 }, { scarab: 10, sandstone: 12 }], 'anvil', [{ dodge: 0.02 }, { dodge: 0.02 }, { dodge: 0.02 }], { dodge: 0.06, speed: 0.08 }],
    ['mushroom', 'di Funghi', ['#79e0d4', '#2f9a95'], [3, 4, 3], 2, 1, [{ mushroom: 10, glass: 4 }, { mushroom: 16, glass: 6 }, { mushroom: 12, glass: 4 }], 'bench', [{ mana: 20 }, { mana: 20 }, {}], { manaRegen: 0.05, magic: 0.06 }],
    ['bog', 'della Palude', ['#9bb35a', '#66783a'], [4, 5, 4], 2, 1, [{ bog_goo: 10, iron_bar: 2 }, { bog_goo: 16, iron_bar: 3 }, { bog_goo: 12, iron_bar: 2 }], 'anvil', [{ gills: 1 }, {}, { swim: 1 }], { regen: 1, dr: 0.04 }],
    ['hunter', 'del Cacciatore', ['#a8753f', '#3a5a2a'], [4, 5, 4], 2, 1, [{ cloth: 6, iron_bar: 4 }, { cloth: 10, iron_bar: 6 }, { cloth: 8, iron_bar: 4 }], 'anvil', [{ ranged: 0.05 }, { ammoSave: 0.08 }, { speed: 0.05 }], { ranged: 0.1, ammoSave: 0.12, crit: 0.03 }],
    ['ninja', 'del Ninja', ['#2a2a40', '#7a7aa0'], [3, 4, 3], 2, 2, [{ cloth: 6, iron_bar: 4 }, { cloth: 10, iron_bar: 6 }, { cloth: 8, iron_bar: 4 }], 'anvil', [{ crit: 0.03 }, { dodge: 0.03 }, { speed: 0.06 }], { dodge: 0.06, speed: 0.08, crit: 0.04 }],
    ['knight', 'del Cavaliere', ['#cfd3da', '#8a3a3a'], [6, 8, 5], 4, 2, [{ iron_bar: 10, gold_bar: 4 }, { iron_bar: 14, gold_bar: 6 }, { iron_bar: 12, gold_bar: 5 }], 'anvil', [{}, { dr: 0.04 }, {}], { melee: 0.08, dr: 0.05 }],
    ['wizard', 'del Mago', ['#3a2a8a', '#ffd84a'], [2, 3, 2], 1, 2, [{ cloth: 6, crystal: 4 }, { cloth: 10, crystal: 6 }, { cloth: 8, crystal: 4 }], 'arcane', [{ mana: 30, magic: 0.06 }, { mana: 40 }, { manaCost: 0.05 }], { magic: 0.12, manaCost: 0.12 }],
    ['crystal', 'di Cristallo', ['#8fe6ff', '#2f5f8c'], [6, 8, 5], 4, 2, [{ crystal: 10, iron_bar: 4 }, { crystal: 16, iron_bar: 6 }, { crystal: 12, iron_bar: 5 }], 'anvil', [{ magic: 0.05 }, { mana: 30 }, { speed: 0.04 }], { magic: 0.1, ranged: 0.05, manaRegen: 0.04 }],
    ['miner', 'del Minatore', ['#ffd84a', '#6b4423'], [2, 3, 2], 1, 1, [{ iron_bar: 4, torch: 4, cloth: 2 }, { iron_bar: 6, cloth: 4 }, { iron_bar: 5, cloth: 3 }], 'bench', [{ light: 70, mine: 0.1 }, { magnet: 30 }, { mine: 0.1 }], { mine: 0.25, light: 40 }],
    ['builder', 'del Costruttore', ['#e08a4a', '#2a5a9a'], [2, 3, 2], 1, 1, [{ copper_bar: 4, planks: 6, cloth: 2 }, { copper_bar: 6, planks: 8, cloth: 3 }, { copper_bar: 5, planks: 6, cloth: 2 }], 'bench', [{ reach: 1 }, { reach: 1 }, { reach: 1 }], { reach: 2, mine: 0.1 }],
    ['diver', 'del Palombaro', ['#d8b050', '#2a5a9a'], [3, 4, 3], 1, 1, [{ glass: 6, copper_bar: 5, cloth: 2 }, { copper_bar: 10, cloth: 4 }, { copper_bar: 8, cloth: 3 }], 'bench', [{ gills: 1 }, { dr: 0.04 }, { swim: 1 }], { light: 60, speed: 0.05 }],
    ['dungeon', 'del Dungeon', ['#4b6199', '#232f4f'], [8, 10, 7], 6, 3, [{ dungeon: 18, iron_bar: 4 }, { dungeon: 28, iron_bar: 6 }, { dungeon: 22, iron_bar: 5 }], 'mythic', [{ crit: 0.03 }, {}, {}], { melee: 0.1, regen: 1.5 }],
    ['obsidian', 'd\'Ossidiana', ['#6a4cb0', '#1f1634'], [7, 9, 6], 5, 3, [{ obsidian: 14, iron_bar: 4 }, { obsidian: 22, iron_bar: 6 }, { obsidian: 18, iron_bar: 5 }], 'anvil', [{}, { lavaImm: 1 }, {}], { thorns: 12, lavaImm: 1, dr: 0.05 }],
    ['livid', 'della Corruzione', ['#c783f0', '#7a3fa8'], [9, 11, 8], 7, 3, [{ livid_essence: 10, shadow_bar: 4 }, { livid_essence: 16, shadow_bar: 6 }, { livid_essence: 12, shadow_bar: 5 }], 'mythic', [{ magic: 0.05 }, { vamp: 0.02 }, { speed: 0.05 }], { vamp: 0.04, magic: 0.1 }],
    ['night', 'della Notte', ['#8a6bff', '#2a1e5e'], [11, 13, 10], 9, 4, [{ night_core: 2, shadow_bar: 8 }, { night_core: 3, shadow_bar: 12 }, { night_core: 2, shadow_bar: 10 }], 'mythic', [{ crit: 0.04 }, { dodge: 0.03 }, { jump: 1 }], { speed: 0.12, dodge: 0.06, crit: 0.06 }],
    ['sire', 'del Sire', ['#ff6a3c', '#2a0e08'], [13, 17, 11], 11, 4, [{ abyss_core: 1, abyss_bar: 10 }, { abyss_core: 2, abyss_bar: 14 }, { abyss_core: 1, abyss_bar: 12 }], 'mythic', [{ melee: 0.04 }, { ranged: 0.04 }, { magic: 0.04 }], { melee: 0.1, ranged: 0.1, magic: 0.1 }],
    ['angel', 'dell\'Angelo', ['#fff6d0', '#e8c34a'], [5, 6, 5], 3, 3, [{ wing: 4, gold_bar: 4, silk: 4 }, { wing: 6, gold_bar: 6, silk: 6 }, { wing: 4, gold_bar: 5, silk: 4 }], 'anvil', [{}, { slowFall: 1 }, { noFall: 1 }], { jump: 1, slowFall: 1, noFall: 1 }],
    ['vampire', 'del Vampiro', ['#6a1a2a', '#c03030'], [8, 9, 7], 5, 3, [{ wing: 3, livid_essence: 4, cloth: 4 }, { wing: 5, livid_essence: 6, cloth: 6 }, { wing: 4, livid_essence: 5, cloth: 4 }], 'anvil', [{ vamp: 0.02 }, { vamp: 0.02 }, { speed: 0.04 }], { vamp: 0.05, dodge: 0.05 }],
  ];
  const PARTS = [['helm', 'Elmo', 'head'], ['chest', 'Corazza', 'body'], ['legs', 'Schinieri', 'legs']];
  for (const [k, of, col, def, sb, rar, ing, st, pfx, sfx] of SETS) {
    PARTS.forEach((p, i) => {
      const id = p[0] + '_' + k;
      item(id, p[1] + ' ' + of, p[2], { def: def[i], set: k, setBonus: sb, setFx: sfx, fx: pfx[i], col, rar, ic: p[2] });
      R(id, 1, ing[i], st);
    });
  }

  // ================= pezzi singoli (cappelli, tuniche, pantaloni) =================
  const PC = (id, name, type, ic, def, col, rar, fx, desc, rec, st) => { item(id, name, type, { def, set: id, setBonus: 0, fx, col, rar, ic, desc }); R(id, 1, rec, st); };
  PC('hat_wizard', 'Cappello da Mago', 'head', 'hat', 1, ['#3a2a8a', '#ffd84a'], 1, { mana: 30, magic: 0.08 }, 'Punta a stelle', { cloth: 6, crystal: 3 }, 'loom');
  PC('hat_top', 'Cilindro Elegante', 'head', 'hat', 2, ['#2a2a30', '#8a1f3a'], 1, { loot: 0.2, magnet: 30 }, 'Porta fortuna', { cloth: 8, gold_bar: 2 }, 'loom');
  PC('helm_horned', 'Elmo Cornuto', 'head', 'head', 5, ['#c9c9d4', '#e8e4d0'], 2, { melee: 0.08, knock: 0.2 }, 'Per i guerrieri', { iron_bar: 8, bone: 6 }, 'anvil');
  PC('band_ninja', 'Fascia Ninja', 'head', 'mask', 2, ['#c03030', '#2a2a30'], 1, { crit: 0.05, speed: 0.1 }, 'Silenziosa', { cloth: 5, iron_bar: 2 }, 'loom');
  PC('goggles_diver', 'Occhiali da Palombaro', 'head', 'goggles', 1, ['#d8b050', '#6b4423'], 1, { gills: 1, light: 40 }, 'Respira sott\'acqua', { glass: 4, copper_bar: 4, cloth: 2 }, 'bench');
  PC('lamp_helm', 'Elmo con Lampada', 'head', 'head', 3, ['#ffd84a', '#6e7078'], 1, { light: 140, mine: 0.1 }, 'Luce per le caverne', { iron_bar: 6, torch: 6, glass: 2 }, 'anvil');
  PC('crown_royal', 'Corona Regale', 'head', 'crown', 4, ['#ffd84a', '#c9971a'], 3, { regen: 1, def: 1, dr: 0.03 }, 'Pesa sul capo', { gold_bar: 10, gem_ruby: 1, gem_sapphire: 1, gem_emerald: 1 }, 'anvil');
  PC('hood_ghost', 'Cappuccio Spettrale', 'head', 'mask', 3, ['#c0d0ff', '#41279e'], 3, { dodge: 0.05, light: 30 }, 'Sfuggente come un fantasma', { cloth: 8, livid_essence: 4, silk: 6 }, 'loom');
  PC('helm_winged', 'Elmo Alato', 'head', 'head', 4, ['#e8e4d0', '#fff6d0'], 2, { slowFall: 1, noFall: 1 }, 'Piume sulle tempie', { iron_bar: 6, wing: 4, silk: 4 }, 'anvil');
  PC('mask_scholar', 'Maschera del Sapiente', 'head', 'mask', 2, ['#e8e4d0', '#41279e'], 2, { manaCost: 0.08, mana: 20 }, 'Studio e silenzio', { cloth: 6, crystal: 4, bone: 4 }, 'loom');
  PC('robe_wizard', 'Tunica del Mago', 'body', 'robe', 2, ['#3a2a8a', '#ffd84a'], 1, { mana: 40, magic: 0.06 }, 'Ricamata di stelle', { cloth: 12, crystal: 4, gold_bar: 2 }, 'loom');
  PC('vest_aviator', 'Giubbotto d\'Aviatore', 'body', 'body', 3, ['#a8753f', '#e8e4d0'], 2, { slowFall: 1, noFall: 1 }, 'Per chi vola', { cloth: 10, wing: 3, iron_bar: 3 }, 'loom');
  PC('mail_chain', 'Cotta di Maglia', 'body', 'body', 6, ['#9aa0ac', '#6b717c'], 1, { thorns: 3 }, 'Anelli di ferro', { iron_bar: 18 }, 'anvil');
  PC('robe_monk', 'Tunica Monacale', 'body', 'robe', 3, ['#e8c34a', '#a8753f'], 2, { regen: 1.5, dodge: 0.03 }, 'Calma interiore', { cloth: 12, flower: 6, sap: 1 }, 'loom');
  PC('legs_runner', 'Pantaloni da Corridore', 'legs', 'legs', 2, ['#6ab8e0', '#e8e8f0'], 1, { speed: 0.15 }, 'Leggerissimi', { cloth: 8, iron_bar: 2 }, 'loom');
  PC('legs_jumper', 'Gambali del Saltatore', 'legs', 'legs', 3, ['#6af0a0', '#1f8a55'], 2, { jump: 1.5, noFall: 1 }, 'Con molle nascoste', { cloth: 6, iron_bar: 4, gel: 6 }, 'anvil');
  PC('legs_diver', 'Calzoni Subacquei', 'legs', 'legs', 2, ['#4aa8e8', '#2a5a9a'], 1, { swim: 1, gills: 1 }, 'Impermeabili', { cloth: 6, gel: 8, bog_goo: 3 }, 'loom');

  // ================= accessori =================
  const AC = (id, name, ic, col, fx, rar, rec, st, props) => { item(id, name, 'acc', Object.assign({ ic, col, fx, rar }, props)); R(id, 1, rec, st); };
  // movimento
  AC('acc_runner', 'Scarpe da Corsa', 'boot', ['#e8e8f0', '#6ab8e0'], { speed: 0.15 }, 0, { cloth: 4, copper_bar: 3 }, 'bench');
  AC('acc_horseshoe', 'Ferro di Cavallo Fortunato', 'horseshoe', ['#d4d8df', '#8a8f9a'], { noFall: 1, jump: 0.5 }, 1, { iron_bar: 6 }, 'anvil');
  AC('acc_fire_boots', 'Stivali Ignifughi', 'boot', ['#ff7a3c', '#401c10'], { speed: 0.2, lavaImm: 1 }, 3, { boots_speed: 1, obsidian: 12, shadow_bar: 6 }, 'anvil');
  AC('acc_balloon', 'Palloncino Saltatore', 'balloon', ['#ff6a7a', '#a82a3a'], { jump: 2 }, 1, { silk: 6, gel: 4, bottle: 1 }, 'bench');
  AC('acc_cape', 'Mantello Lieve', 'cape', ['#8a6bff', '#41279e'], { slowFall: 1, noFall: 1 }, 2, { cloth: 8, wing: 2 }, 'loom');
  AC('acc_flippers', 'Pinne da Sub', 'fin', ['#4aa8e8', '#2a5a9a'], { swim: 1, gills: 1 }, 1, { gel: 8, bog_goo: 4, cloth: 2 }, 'bench');
  AC('acc_ghost_boots', 'Stivali Spettrali', 'boot', ['#c0d0ff', '#41279e'], { speed: 0.3, jump: 1, noFall: 1 }, 3, { boots_speed: 1, livid_essence: 8, wing: 4 }, 'anvil');
  AC('acc_star_spring', 'Molla Cosmica', 'spring', ['#ffe27a', '#c9971a'], { jump: 3, noFall: 1 }, 3, { spring_boot: 1, gem_topaz: 3, night_core: 1 }, 'anvil');
  AC('acc_belt_adv', 'Cintura da Avventuriero', 'belt', ['#a8753f', '#6b4423'], { speed: 0.1, jump: 1, noFall: 1 }, 2, { cloth: 6, iron_bar: 4, gel: 4 }, 'anvil');
  // ali
  const WG = (id, name, col, wc, fx, rar, rec, st) => AC(id, name, 'wings', col, fx, rar, rec, st, { wc, desc: 'Tieni SPAZIO in aria per volare' });
  WG('wings_feather', 'Ali di Piuma', ['#f2f2f2', '#c9c9d4'], ['#f2f2f2', '#d8d8e8', '#a8a8b8'], { wings: 200 }, 2, { wing: 8, silk: 12, cloth: 4 }, 'anvil');
  WG('wings_fire', 'Ali di Fuoco', ['#ff9a3c', '#a82a12'], ['#a82a12', '#ff9a3c', '#6b1a0a'], { wings: 240, lavaImm: 1 }, 3, { wing: 6, obsidian: 8, abyss_bar: 4 }, 'anvil');
  WG('wings_frost', 'Ali di Gelo', ['#bfeaff', '#4a8fb8'], ['#4a8fb8', '#bfeaff', '#2a5a8a'], { wings: 240 }, 3, { wing: 6, frost_shard: 14, silk: 6 }, 'anvil');
  WG('wings_gold', 'Ali Dorate', ['#ffd84a', '#c9971a'], ['#c9971a', '#ffe27a', '#8a6a1e'], { wings: 260, def: 2 }, 3, { wing: 8, gold_bar: 10 }, 'anvil');
  WG('wings_ghost', 'Ali Spettrali', ['#c0d0ff', '#41279e'], ['#41279e', '#c0d0ff', '#2a1e5e'], { wings: 300, speed: 0.1 }, 4, { wings_bat: 1, livid_essence: 10, shadow_bar: 6 }, 'mythic');
  WG('wings_crystal', 'Ali di Cristallo', ['#8fe6ff', '#2f5f8c'], ['#2f5f8c', '#8fe6ff', '#1a3f6a'], { wings: 320, magic: 0.06 }, 4, { wing: 8, crystal: 16, gem_diamond: 1 }, 'mythic');
  WG('wings_abyss', 'Ali dell\'Abisso', ['#ff6a3c', '#401c10'], ['#401c10', '#ff6a3c', '#a82a12'], { wings: 400, speed: 0.15, lavaImm: 1 }, 4, { wings_fire: 1, abyss_bar: 10, abyss_core: 3 }, 'mythic');
  // difesa
  AC('acc_shield_iron', 'Scudo di Ferro', 'shield', ['#d4d8df', '#6b717c'], { def: 2 }, 1, { iron_bar: 8 }, 'anvil');
  AC('acc_shield_gold', 'Scudo d\'Oro', 'shield', ['#ffd84a', '#c9971a'], { def: 4 }, 2, { gold_bar: 8 }, 'anvil');
  AC('acc_shield_obsidian', 'Scudo d\'Ossidiana', 'shield', ['#6a4cb0', '#1f1634'], { def: 5, lavaImm: 1 }, 3, { obsidian: 14, iron_bar: 6 }, 'anvil');
  AC('acc_shield_spike', 'Scudo Spinato', 'shield', ['#9aa0ac', '#4aa05a'], { def: 3, thorns: 14 }, 2, { iron_bar: 8, cactus: 8 }, 'anvil');
  AC('acc_ankh', 'Amuleto Ankh', 'amulet', ['#ffd84a', '#8a6a1e'], { def: 4, kbImmune: 1, dr: 0.04 }, 3, { gold_bar: 6, crystal: 8, scarab: 6 }, 'anvil');
  AC('acc_belt_iron', 'Cintura di Ferro', 'belt', ['#9aa0ac', '#6b717c'], { def: 3, dr: 0.03 }, 1, { iron_bar: 6, cloth: 3 }, 'anvil');
  AC('acc_dragon_scale', 'Scaglia di Drago', 'badge', ['#ff6a3c', '#a82a12'], { dr: 0.08, def: 2 }, 3, { abyss_bar: 4, obsidian: 8, gem_ruby: 1 }, 'anvil');
  AC('acc_shield_celestial', 'Scudo Celestiale', 'shield', ['#fff6d0', '#e8c34a'], { def: 6, dodge: 0.05 }, 4, { wing: 6, gold_bar: 10, gem_diamond: 1 }, 'mythic');
  AC('acc_medal', 'Medaglia d\'Onore', 'badge', ['#ffd84a', '#8a1f3a'], { def: 2, regen: 1 }, 2, { gold_bar: 4, cloth: 4, flower: 4 }, 'anvil');
  AC('acc_philo', 'Pietra Filosofale', 'orb', ['#ff9a3c', '#a82a12'], { regen: 2, def: 2, manaRegen: 0.04 }, 3, { gem_ruby: 2, sap: 4, gold_bar: 4, crystal: 6 }, 'arcane');
  // offesa
  AC('acc_ring_warrior', 'Anello del Guerriero', 'ring', ['#ff6a7a', '#a82a3a'], { melee: 0.1 }, 2, { gold_bar: 5, gem_ruby: 1 }, 'anvil');
  AC('acc_ring_hunter', 'Anello del Cacciatore', 'ring', ['#6af08a', '#1f8a4a'], { ranged: 0.1 }, 2, { gold_bar: 5, gem_emerald: 1 }, 'anvil');
  AC('acc_ring_mystic', 'Anello Mistico', 'ring', ['#6ab8ff', '#2a3f9e'], { magic: 0.1 }, 2, { gold_bar: 5, gem_sapphire: 1 }, 'anvil');
  AC('acc_berserker', 'Guanto del Berserker', 'glove', ['#c03030', '#6b1a1a'], { melee: 0.1, atkspd: 0.12 }, 3, { shadow_bar: 6, cloth: 4, gem_ruby: 2 }, 'anvil');
  AC('acc_champion', 'Cintura del Campione', 'belt', ['#ffd84a', '#8a1f3a'], { melee: 0.08, knock: 0.4 }, 2, { gold_bar: 6, bone: 6, cloth: 3 }, 'anvil');
  AC('acc_hawk', 'Occhio di Falco', 'eye', ['#ffd84a', '#8a6a1e'], { crit: 0.08, ranged: 0.04 }, 2, { gem_topaz: 2, gold_bar: 4, silk: 4 }, 'anvil');
  AC('acc_fang', 'Dente di Vampiro', 'tooth', ['#f2f2f2', '#c03030'], { vamp: 0.05 }, 3, { bone: 6, gem_ruby: 1, livid_essence: 4 }, 'anvil');
  AC('acc_quiver', 'Faretra Infinita', 'quiver', ['#8a5a2b', '#a8753f'], { ammoSave: 0.25 }, 2, { cloth: 6, gold_bar: 4, scarab: 3 }, 'anvil');
  AC('acc_mana_band', 'Fascia del Mago', 'amulet', ['#6ab8ff', '#2a3f9e'], { manaCost: 0.15 }, 2, { crystal: 8, cloth: 4, gem_sapphire: 1 }, 'anvil');
  AC('acc_amulet_fire', 'Amuleto del Fuoco', 'amulet', ['#ff7a3c', '#a82a12'], { burnHit: 1 }, 2, { obsidian: 6, gold_bar: 3 }, 'anvil');
  AC('acc_amulet_frost', 'Amuleto del Gelo', 'amulet', ['#bfeaff', '#4a8fb8'], { frostHit: 1 }, 2, { frost_shard: 8, gold_bar: 3 }, 'anvil');
  AC('acc_amulet_venom', 'Amuleto del Veleno', 'amulet', ['#9be04a', '#3a6b1e'], { poisonHit: 1 }, 2, { bog_goo: 8, gold_bar: 3 }, 'anvil');
  AC('acc_dragon_heart', 'Cuore di Drago', 'heart', ['#ff6a3c', '#a82a12'], { regen: 2, def: 2, melee: 0.04 }, 3, { life_crystal: 1, abyss_bar: 4, gem_ruby: 2 }, 'mythic');
  // magia
  AC('acc_star_pendant', 'Pendente Stellare', 'star', ['#ffe27a', '#c9971a'], { mana: 40, manaRegen: 0.03 }, 2, { crystal: 6, gem_topaz: 1, gold_bar: 3 }, 'anvil');
  AC('acc_chalice', 'Calice Arcano', 'orb', ['#6ab8ff', '#2a3f9e'], { mana: 80, manaRegen: 0.05 }, 3, { crystal: 12, gold_bar: 6, mana_crystal: 2 }, 'arcane');
  AC('acc_gem_mage', 'Gemma del Mago', 'gem', ['#8a6bff', '#41279e'], { magic: 0.1, mana: 40 }, 3, { gem_amethyst: 2, crystal: 8, gold_bar: 4 }, 'arcane');
  AC('acc_phial', 'Fiala di Mana', 'flask', ['#4a8fff', '#1a3f9e'], { mana: 40 }, 1, { bottle: 2, crystal: 3, mushroom: 2 }, 'bench');
  // utilità
  AC('acc_magnet', 'Calamita', 'magnet', ['#d83a3a', '#e8e8f0'], { magnet: 80 }, 1, { iron_bar: 4, gel: 2 }, 'anvil');
  AC('acc_magnet_big', 'Magnete Potente', 'magnet', ['#ff4a4a', '#4a4aff'], { magnet: 170 }, 2, { acc_magnet: 1, gold_bar: 4, crystal: 4 }, 'anvil');
  AC('acc_lantern', 'Lanterna Magica', 'lantern', ['#fff08a', '#c9971a'], { light: 200 }, 2, { crystal: 6, gold_bar: 3, torch: 8 }, 'anvil');
  AC('acc_miner_goggles', 'Occhiali del Minatore', 'goggles', ['#8fe6ff', '#6b4423'], { mine: 0.15, light: 60 }, 1, { glass: 4, iron_bar: 3, cloth: 2 }, 'bench');
  AC('acc_builder_gloves', 'Guanti del Costruttore', 'glove', ['#e08a4a', '#2a5a9a'], { reach: 3, mine: 0.1 }, 2, { cloth: 6, iron_bar: 4, planks: 10 }, 'anvil');
  AC('acc_compass', 'Bussola', 'compass', ['#d83a3a', '#c9971a'], { compass: 1 }, 1, { iron_bar: 3, glass: 2, gold_bar: 1 }, 'anvil');
  AC('acc_radar', 'Radar dei Nemici', 'eye', ['#ff4a4a', '#6b717c'], { radar: 1 }, 2, { crystal: 4, iron_bar: 4, gold_bar: 2 }, 'anvil');
  AC('acc_tally', 'Contatore di Uccisioni', 'badge', ['#e8e4d0', '#6b717c'], { tally: 1 }, 1, { bone: 6, iron_bar: 2 }, 'anvil');
  AC('acc_gills', 'Branchie Artificiali', 'fin', ['#79e0d4', '#2f9a95'], { gills: 1 }, 1, { bog_goo: 6, glass: 2, iron_bar: 2 }, 'anvil');
  AC('acc_clover', 'Quadrifoglio Dorato', 'flower', ['#ffd84a', '#4caa3c'], { loot: 0.6 }, 2, { flower: 8, gold_bar: 4, scarab: 2 }, 'anvil');
  AC('acc_calm_ring', 'Anello della Calma', 'ring', ['#bfeaff', '#4a8fb8'], { calm: 0.4 }, 2, { silk: 6, gold_bar: 3, flower: 4 }, 'anvil');
  AC('acc_war_horn', 'Corno di Guerra', 'horn', ['#e8e4d0', '#8a1f3a'], { battle: 0.5, melee: 0.06 }, 2, { bone: 8, gold_bar: 3 }, 'anvil');
  AC('acc_explorer_pack', 'Zaino da Esploratore', 'sack', ['#a8753f', '#6b4423'], { magnet: 60, mine: 0.1, light: 60 }, 2, { cloth: 10, iron_bar: 3, torch: 5 }, 'loom');
  AC('acc_ninja_scarf', 'Sciarpa del Ninja', 'cape', ['#c03030', '#2a2a40'], { dodge: 0.06, speed: 0.08 }, 2, { cloth: 8, silk: 6, iron_bar: 3 }, 'loom');
})(window.TF);
