'use strict';
// Terrafrante - oggetti 4/4: pozioni, cibi, strumenti (piccozze, rampini, specchi, secchi), ricette di tutti gli arredi
(function (TF) {
  const item = TF.itemDef, R = TF.addRecipe, ITEMS = TF.ITEMS;
  const mins = (s) => (s >= 60 ? Math.round(s / 60) + ' min' : s + ' s');

  // ================= pozioni di cura e mana =================
  const HP = (id, name, heal, col, rar, desc, rec, st) => { item(id, name, 'potion', { ic: 'potion', col, rar, use: 30, heal, sick: 1, desc }); R(id, 1, rec, st); };
  const MP = (id, name, mana, col, rar, desc, rec, st) => { item(id, name, 'potion', { ic: 'potion', col, rar, use: 30, mana, desc }); R(id, 1, rec, st); };
  HP('potion_heal_xs', 'Pozione di Vita Minore', 30, ['#ff7a8a', '#b03a4a'], 0, 'Ripristina 30 vita', { bottle: 1, gel: 1 }, 'bench');
  HP('potion_heal_g', 'Pozione di Vita Superiore', 220, ['#ff1a3a', '#5a0a1a'], 3, 'Ripristina 220 vita', { bottle: 1, gel: 8, flower: 5, gem_ruby: 1 }, 'alchemy');
  HP('potion_heal_x', 'Pozione di Vita Suprema', 340, ['#ff0a30', '#3a0510'], 4, 'Ripristina 340 vita', { bottle: 1, gem_diamond: 1, flower: 8, sap: 2 }, 'alchemy');
  MP('potion_mana_s', 'Pozione di Mana Minore', 40, ['#7ab0ff', '#3a63b0'], 0, 'Ripristina 40 mana', { bottle: 1, mushroom: 1 }, 'bench');
  MP('potion_mana_l', 'Pozione di Mana Maggiore', 160, ['#3a7aff', '#12338a'], 2, 'Ripristina 160 mana', { bottle: 1, mushroom: 4, crystal: 2 }, 'alchemy');
  MP('potion_mana_g', 'Pozione di Mana Superiore', 260, ['#2a5aff', '#0a2070'], 3, 'Ripristina 260 mana', { bottle: 1, crystal: 3, gem_sapphire: 1, mushroom: 4 }, 'alchemy');
  MP('potion_mana_x', 'Pozione di Mana Suprema', 420, ['#1a3aff', '#06104a'], 4, 'Ripristina 420 mana', { bottle: 1, crystal: 5, gem_diamond: 1, night_core: 1 }, 'alchemy');
  item('potion_restore', 'Pozione di Ripristino', 'potion', { ic: 'potion', col: ['#c783f0', '#5a2a80'], rar: 3, use: 30, heal: 80, mana: 120, sick: 1, desc: 'Ripristina 80 vita e 120 mana' });
  R('potion_restore', 1, { bottle: 1, potion_heal_s: 1, potion_mana: 1 }, 'alchemy');

  // ================= pozioni a tempo: id, nome, effetto, secondi, colori, rarità, ricetta =================
  const BP = (id, name, buff, sec, col, rar, rec, ic) => {
    item(id, name, 'potion', { ic: ic || 'potion', col, rar, use: 30, buff: [buff, sec], desc: TF.BUFFS[buff].desc + ' per ' + mins(sec) });
    R(id, 1, Object.assign({ bottle: 1 }, rec), 'alchemy');
  };
  BP('potion_regen', 'Pozione di Rigenerazione', 'regen', 300, ['#ff6a9a', '#a02a5a'], 1, { gel: 3, flower: 2 });
  BP('potion_archery', 'Pozione dell\'Arciere', 'archery', 300, ['#d9c9a0', '#8a6a3a'], 1, { flower: 2, arrow: 5 });
  BP('potion_magic', 'Pozione del Mago', 'magicpow', 300, ['#a45fe0', '#41279e'], 1, { mushroom: 2, crystal: 1 });
  BP('potion_wrath', 'Pozione dell\'Ira', 'wrath', 240, ['#ff4a3a', '#8a1a12'], 2, { bog_goo: 3, gem_ruby: 1 });
  BP('potion_endure', 'Pozione della Resistenza', 'endure', 300, ['#9aa0ac', '#4a505c'], 1, { iron_bar: 1, bone: 3 });
  BP('potion_thorns', 'Pozione di Spine', 'thorns', 300, ['#4aa05a', '#1f5a2a'], 1, { cactus: 3, jungle_spore: 1 });
  BP('potion_feather', 'Pozione di Piuma', 'feather', 300, ['#f2f2f2', '#a8a8b8'], 1, { wing: 1, silk: 2 });
  BP('potion_leap', 'Pozione del Salto', 'leap', 240, ['#6af0a0', '#1f8a55'], 1, { bog_goo: 2, gel: 3 });
  BP('potion_obsidian', 'Pozione d\'Ossidiana', 'obsidian', 300, ['#6a4cb0', '#1f1634'], 2, { obsidian: 2 });
  BP('potion_gills', 'Pozione delle Branchie', 'gills', 300, ['#79e0d4', '#2f9a95'], 1, { bog_goo: 2, mushroom: 1 });
  BP('potion_swim', 'Pozione del Nuotatore', 'swim', 300, ['#4aa8e8', '#1a5a9a'], 1, { gel: 2, frost_shard: 1 });
  BP('potion_owl', 'Pozione del Gufo', 'nightowl', 600, ['#ffe27a', '#8a6a1e'], 1, { mushroom: 2, flower: 1 });
  BP('potion_shine', 'Pozione dello Splendore', 'shine', 600, ['#fff08a', '#c9971a'], 1, { torch: 3, flower: 2 });
  BP('potion_hunter', 'Pozione del Cercatore', 'hunter', 300, ['#ffd84a', '#a8761a'], 1, { iron_ore: 2, mushroom: 2 });
  BP('potion_calm', 'Pozione della Calma', 'calm', 600, ['#bfeaff', '#4a8fb8'], 1, { flower: 3, silk: 1 });
  BP('potion_battle', 'Pozione della Battaglia', 'battle', 300, ['#c03030', '#601010'], 1, { bog_goo: 2, bone: 2 });
  BP('potion_magnet', 'Pozione Magnetica', 'magnetic', 300, ['#d83a3a', '#4a4aff'], 1, { iron_bar: 1, gel: 2 });
  BP('potion_builder', 'Pozione del Costruttore', 'builder', 300, ['#e08a4a', '#2a5a9a'], 1, { wood: 5, flower: 1 });
  BP('potion_manaregen', 'Pozione del Flusso Arcano', 'manaregen', 300, ['#6ab8ff', '#2a3f9e'], 1, { crystal: 1, flower: 2 });
  BP('potion_ammo', 'Pozione del Risparmio', 'ammo', 300, ['#c9971a', '#6b4423'], 2, { scarab: 1, arrow: 3 });
  BP('potion_lucky', 'Pozione della Fortuna', 'lucky', 300, ['#4aff8a', '#1f8a4a'], 2, { gold_bar: 1, flower: 3 });
  BP('potion_inferno', 'Pozione dell\'Inferno', 'inferno', 240, ['#ff7a3c', '#a82a12'], 3, { obsidian: 2, gem_ruby: 1 });
  BP('potion_dodge', 'Pozione della Schivata', 'dodge', 240, ['#c0d0ff', '#6a7ab0'], 2, { wing: 1, cloth: 2 });
  BP('potion_crit', 'Pozione del Critico', 'critp', 240, ['#ffd84a', '#c9971a'], 2, { gem_topaz: 1, mushroom: 1 });
  BP('potion_vamp', 'Pozione Vampirica', 'lifesteal', 240, ['#c03030', '#4a0a14'], 3, { wing: 2, gem_ruby: 1 });
  BP('potion_rapid', 'Pozione della Rapidità', 'rapid', 240, ['#6af08a', '#1f8a4a'], 2, { jungle_spore: 2, gem_emerald: 1 });
  BP('potion_titan', 'Pozione del Titano', 'titan', 240, ['#a8753f', '#4a2a10'], 2, { bone: 4, iron_bar: 1 });
  BP('potion_focus', 'Pozione della Concentrazione', 'focus', 300, ['#c783f0', '#7a3fa8'], 2, { crystal: 1, gem_amethyst: 1 });
  BP('potion_warding', 'Pozione di Protezione', 'warding', 300, ['#cfd3da', '#6b717c'], 1, { stone: 5, iron_bar: 1 });
  BP('potion_radar', 'Pozione del Radar', 'radar', 300, ['#ff6a6a', '#8a2a2a'], 1, { scarab: 1, mushroom: 1 });
  // fiasche per le armi
  BP('flask_fire', 'Fiasca di Fuoco', 'flask_fire', 600, ['#ff7a3c', '#a82a12'], 2, { torch: 3, obsidian: 1 }, 'flask');
  BP('flask_frost', 'Fiasca di Gelo', 'flask_frost', 600, ['#bfeaff', '#4a8fb8'], 2, { frost_shard: 3 }, 'flask');
  BP('flask_poison', 'Fiasca di Veleno', 'flask_poison', 600, ['#9be04a', '#3a6b1e'], 2, { bog_goo: 3, jungle_spore: 1 }, 'flask');
  BP('flask_vamp', 'Fiasca Vampirica', 'flask_vamp', 600, ['#c03030', '#4a0a14'], 3, { wing: 2, gem_ruby: 1 }, 'flask');

  // ================= elisir: più effetti in una sola bottiglia =================
  const EL = (id, name, buffs, sec, col, rar, rec, props) => {
    item(id, name, 'potion', Object.assign({ ic: 'flask', col, rar, use: 30, buffs: buffs.map((b) => [b, sec]), desc: 'Unisce più effetti per ' + mins(sec) }, props));
    R(id, 1, Object.assign({ bottle: 1 }, rec), 'alchemy');
  };
  EL('elixir_warrior', 'Elisir del Guerriero', ['wrath', 'iron', 'regen'], 480, ['#ff4a3a', '#8a1a12'], 3, { potion_wrath: 1, potion_iron: 1, potion_regen: 1 });
  EL('elixir_mage', 'Elisir dell\'Arcimago', ['magicpow', 'manaregen', 'focus'], 480, ['#a45fe0', '#41279e'], 3, { potion_magic: 1, potion_manaregen: 1, potion_focus: 1 });
  EL('elixir_archer', 'Elisir dell\'Arciere Leggendario', ['archery', 'ammo', 'critp'], 480, ['#d9c9a0', '#8a6a3a'], 3, { potion_archery: 1, potion_ammo: 1, potion_crit: 1 });
  EL('elixir_miner', 'Elisir del Minatore', ['mining', 'hunter', 'shine', 'builder'], 480, ['#ffd84a', '#a8761a'], 3, { potion_mining: 1, potion_hunter: 1, potion_shine: 1, potion_builder: 1 });
  EL('elixir_explorer', 'Elisir dell\'Esploratore', ['speed', 'leap', 'feather', 'nightowl'], 480, ['#6af0a0', '#1f8a55'], 3, { potion_speed: 1, potion_leap: 1, potion_feather: 1, potion_owl: 1 });
  EL('elixir_diver', 'Elisir del Palombaro', ['gills', 'swim', 'shine'], 480, ['#4aa8e8', '#1a5a9a'], 3, { potion_gills: 1, potion_swim: 1, potion_shine: 1 });
  EL('elixir_fortress', 'Elisir della Fortezza', ['iron', 'endure', 'thorns', 'warding'], 480, ['#cfd3da', '#6b717c'], 3, { potion_iron: 1, potion_endure: 1, potion_thorns: 1, potion_warding: 1 });
  EL('elixir_life', 'Elisir di Lunga Vita', ['regen', 'magnetic'], 600, ['#ff6a9a', '#a02a5a'], 4, { potion_heal_g: 1, potion_regen: 1, potion_magnet: 1 }, { heal: 100, sick: 1, desc: 'Cura 100 vita e dà regen e magnetismo per 10 min' });

  // ================= cibi (stazione: pentola da cucina) =================
  const FO = (id, name, ic, col, rar, props, rec) => {
    const buffs = (props.buffs || []).map((b) => (typeof b === 'string' ? [b, 180] : b));
    item(id, name, 'food', Object.assign({ ic, col, rar, use: 30 }, props, { buffs }));
    R(id, 1, rec, 'cook');
    const bits = []; if (props.heal) bits.push('Vita +' + props.heal); if (props.mana) bits.push('Mana +' + props.mana); ITEMS[id].desc = bits.join(', ');
  };
  FO('food_mushroom_roast', 'Funghi Arrostiti', 'skewer', ['#c8924f', '#79e0d4'], 0, { heal: 25, buffs: [['fed', 180]] }, { mushroom: 3 });
  FO('food_cactus_salad', 'Insalata di Cactus', 'bowl', ['#4aa05a', '#bfe87a'], 0, { heal: 30, buffs: [['fed', 180]] }, { cactus: 3, flower: 1 });
  FO('food_gel_tart', 'Crostata di Gelatina', 'cake', ['#e8c070', '#6fe08a'], 0, { heal: 20, mana: 20, buffs: [['fed', 120]] }, { gel: 4, flower: 1 });
  FO('food_sap_honey', 'Sciroppo di Linfa', 'mug', ['#e8a83a', '#8a5a1a'], 1, { heal: 35, buffs: [['regen', 120]] }, { sap: 1, flower: 2 });
  FO('food_bone_broth', 'Brodo d\'Ossa', 'bowl', ['#e8e4d0', '#c9a060'], 1, { heal: 40, buffs: [['iron', 120]] }, { bone: 3, mushroom: 1 });
  FO('food_frost_cream', 'Gelato Gelido', 'cake', ['#bfeaff', '#f2f2f2'], 1, { heal: 25, buffs: [['calm', 180]] }, { frost_shard: 2, flower: 1 });
  FO('food_spore_skewer', 'Spiedino di Spore', 'skewer', ['#9be04a', '#c8924f'], 1, { heal: 30, buffs: [['speed', 120]] }, { jungle_spore: 2, mushroom: 1 });
  FO('food_scarab_cake', 'Torta Dorata', 'cake', ['#ffd84a', '#c9971a'], 1, { heal: 30, buffs: [['critp', 180]] }, { scarab: 2, flower: 2 });
  FO('food_bog_stew', 'Stufato Palustre', 'bowl', ['#9bb35a', '#5a6a2a'], 1, { heal: 45, buffs: [['fed', 300]] }, { bog_goo: 3, mushroom: 2 });
  FO('food_tea', 'Tisana di Fiori', 'mug', ['#ff9ac8', '#f2f2f2'], 0, { mana: 40, buffs: [['manaregen', 120]] }, { flower: 3 });
  FO('food_mead', 'Idromele', 'mug', ['#ffd84a', '#c9971a'], 1, { heal: 20, buffs: [['wrath', 120]] }, { flower: 2, sap: 1 });
  FO('food_cider', 'Sidro di Spore', 'mug', ['#9be04a', '#3a6b1e'], 1, { mana: 30, buffs: [['leap', 120]] }, { jungle_spore: 2, flower: 1 });
  FO('food_bread', 'Pagnotta di Spore', 'bread', ['#e0b070', '#a8753f'], 0, { heal: 15, buffs: [['fed', 240]] }, { jungle_spore: 1, flower: 1, gel: 1 });
  FO('food_roast', 'Arrosto del Dungeon', 'roast', ['#a8581a', '#6b3a10'], 2, { heal: 60, buffs: [['feast', 300]] }, { bone: 2, mushroom: 3, gel: 3 });
  FO('food_soup', 'Zuppa del Sapiente', 'bowl', ['#c783f0', '#f2f2f2'], 2, { mana: 60, buffs: [['focus', 240]] }, { mushroom: 4, crystal: 1, flower: 2 });
  FO('food_star_sweet', 'Dolcetto Stellare', 'cake', ['#ffe27a', '#8a6bff'], 3, { heal: 50, buffs: [['feast', 300]] }, { gem_topaz: 1, flower: 3, sap: 1 });
  FO('food_banquet', 'Banchetto Reale', 'roast', ['#ffd84a', '#8a1f3a'], 3, { heal: 100, mana: 60, buffs: [['feast', 600]] }, { food_roast: 1, food_tea: 1, food_sap_honey: 1, food_scarab_cake: 1 });

  // ================= strumenti: piccozze, asce, martelli intermedi =================
  const TL = (id, name, type, ic, power, dmg, col, rar, desc, rec, st) => { item(id, name, type, { power, dmg, spd: type === 'hammer' ? 26 : type === 'axe' ? 22 : 20, kb: type === 'axe' ? 3 : 2, col, rar, ic, desc }); R(id, 1, rec, st); };
  TL('pick_bone', 'Piccone d\'Osso', 'pick', 'pick', 44, 4, ['#e8e4d0', '#9a957c'], 0, 'Scava blocchi', { bone: 10, wood: 3 }, 'bench');
  TL('pick_ice', 'Piccone di Ghiaccio', 'pick', 'pick', 55, 6, ['#bfeaff', '#4a8fb8'], 1, 'Scava blocchi', { frost_shard: 8, iron_bar: 4 }, 'anvil');
  TL('pick_jungle', 'Piccone della Giungla', 'pick', 'pick', 66, 8, ['#9be04a', '#3a6b1e'], 2, 'Scava blocchi', { jungle_spore: 10, gold_bar: 5 }, 'anvil');
  TL('pick_crystal', 'Piccone di Cristallo', 'pick', 'pick', 82, 10, ['#8fe6ff', '#2f5f8c'], 3, 'Scava blocchi', { crystal: 12, shadow_bar: 4 }, 'anvil');
  TL('pick_obsidian', 'Piccone d\'Ossidiana', 'pick', 'pick', 88, 10, ['#6a4cb0', '#1f1634'], 3, 'Scava blocchi', { obsidian: 14, iron_bar: 6 }, 'anvil');
  TL('pick_night', 'Piccone della Notte', 'pick', 'pick', 95, 12, ['#8a6bff', '#2a1e5e'], 4, 'Scava blocchi', { night_core: 3, shadow_bar: 8 }, 'mythic');
  TL('axe_bone', 'Ascia d\'Osso', 'axe', 'axe', 40, 6, ['#e8e4d0', '#9a957c'], 0, 'Abbatte alberi e legno', { bone: 10, wood: 3 }, 'bench');
  TL('axe_ice', 'Ascia di Ghiaccio', 'axe', 'axe', 50, 8, ['#bfeaff', '#4a8fb8'], 1, 'Abbatte alberi e legno', { frost_shard: 8, iron_bar: 4 }, 'anvil');
  TL('axe_jungle', 'Ascia della Giungla', 'axe', 'axe', 62, 10, ['#9be04a', '#3a6b1e'], 2, 'Abbatte alberi e legno', { jungle_spore: 10, gold_bar: 5 }, 'anvil');
  TL('axe_crystal', 'Ascia di Cristallo', 'axe', 'axe', 80, 12, ['#8fe6ff', '#2f5f8c'], 3, 'Abbatte alberi e legno', { crystal: 12, shadow_bar: 4 }, 'anvil');
  TL('axe_obsidian', 'Ascia d\'Ossidiana', 'axe', 'axe', 84, 12, ['#6a4cb0', '#1f1634'], 3, 'Abbatte alberi e legno', { obsidian: 14, iron_bar: 6 }, 'anvil');
  TL('hammer_bone', 'Martello d\'Osso', 'hammer', 'hammer', 45, 7, ['#e8e4d0', '#9a957c'], 0, 'Rimuove le pareti', { bone: 10, wood: 3 }, 'bench');
  TL('hammer_jungle', 'Martello della Giungla', 'hammer', 'hammer', 65, 12, ['#9be04a', '#3a6b1e'], 2, 'Rimuove le pareti', { jungle_spore: 10, gold_bar: 5 }, 'anvil');
  TL('hammer_crystal', 'Martello di Cristallo', 'hammer', 'hammer', 85, 17, ['#8fe6ff', '#2f5f8c'], 3, 'Rimuove le pareti', { crystal: 12, shadow_bar: 4 }, 'anvil');
  TL('hammer_obsidian', 'Martello d\'Ossidiana', 'hammer', 'hammer', 90, 18, ['#6a4cb0', '#1f1634'], 3, 'Rimuove le pareti', { obsidian: 14, iron_bar: 6 }, 'anvil');

  // ================= rampini (tasto sinistro: lancia, ancora, tira) =================
  const HK = (id, name, range, pull, col, rar, rec, st) => { item(id, name, 'hook', { range, pull, col, rar, ic: 'hook', desc: 'Clic: lancia. Ti tira verso il blocco. SPAZIO: stacca. Portata ' + range + ' blocchi' }); R(id, 1, Object.assign({ rope: 2 }, rec), st); };
  HK('hook_copper', 'Rampino di Rame', 10, 7, ['#e08a4a', '#8a5a2b'], 0, { copper_bar: 8 }, 'anvil');
  HK('hook_bone', 'Rampino d\'Osso', 11, 8, ['#e8e4d0', '#9a957c'], 0, { bone: 10 }, 'bench');
  HK('hook_iron', 'Rampino di Ferro', 12, 8, ['#d4d8df', '#6b717c'], 1, { iron_bar: 8 }, 'anvil');
  HK('hook_frost', 'Rampino di Gelo', 13, 9, ['#bfeaff', '#4a8fb8'], 2, { frost_shard: 10, iron_bar: 4 }, 'anvil');
  HK('hook_gold', 'Rampino d\'Oro', 13, 9, ['#ffd84a', '#c9971a'], 2, { gold_bar: 8 }, 'anvil');
  HK('hook_jungle', 'Rampino della Giungla', 14, 9, ['#9be04a', '#3a6b1e'], 2, { jungle_spore: 10, gold_bar: 6 }, 'anvil');
  HK('hook_crystal', 'Rampino di Cristallo', 15, 10, ['#8fe6ff', '#2f5f8c'], 3, { crystal: 12, iron_bar: 6 }, 'anvil');
  HK('hook_shadow', 'Rampino d\'Ombrite', 16, 10, ['#a45fe0', '#3a2552'], 3, { shadow_bar: 8 }, 'mythic');
  HK('hook_abyss', 'Rampino d\'Abissite', 18, 11, ['#ff7a3c', '#401c10'], 4, { abyss_bar: 10 }, 'mythic');

  // ================= specchi, secchi, depositi, utilità =================
  const TO = (id, name, ic, col, rar, props, rec, st) => { item(id, name, 'tool', Object.assign({ ic, col, rar }, props)); if (rec) R(id, 1, rec, st); };
  TO('mirror_magic', 'Specchio Magico', 'mirror', ['#8fe6ff', '#c9971a'], 2, { mirror: true, cast: 70, desc: 'Clic: dopo un attimo torni al punto di rinascita (se vieni colpito si interrompe)' }, { glass: 8, gold_bar: 3, crystal: 3 }, 'anvil');
  TO('mirror_ice', 'Specchio di Ghiaccio', 'mirror', ['#bfeaff', '#4a8fb8'], 3, { mirror: true, cast: 35, desc: 'Clic: ritorno rapido a casa' }, { mirror_magic: 1, frost_shard: 10, gem_sapphire: 1 }, 'anvil');
  TO('recall_stone', 'Pietra del Ritorno', 'orb', ['#c0d0ff', '#41279e'], 1, { mirror: true, cast: 150, desc: 'Clic: ritorno lento e a basso costo' }, { crystal: 3, glass: 2 }, 'bench');
  TO('bucket_empty', 'Secchio Vuoto', 'bucket', ['#9aa0ac', null], 1, { bucket: 'empty', desc: 'Clic su un liquido profondo per raccoglierlo' }, { iron_bar: 4 }, 'anvil');
  TO('bucket_water', 'Secchio d\'Acqua', 'bucket', ['#9aa0ac', '#4aa8e8'], 1, { bucket: 'water', desc: 'Clic per versare acqua' });
  TO('bucket_lava', 'Secchio di Lava', 'bucket', ['#9aa0ac', '#ff7a3c'], 2, { bucket: 'lava', desc: 'Clic per versare lava (a contatto con l\'acqua diventa ossidiana)' });
  TO('piggy_bank', 'Salvadanaio', 'piggy', ['#ff9ab0', '#c0506a'], 1, { store: 'piggy', desc: 'Deposito portatile da 20 slot: clic per aprirlo' }, { copper_bar: 6, gel: 4 }, 'bench');
  TO('safe_box', 'Cassaforte Portatile', 'safe', ['#6e7078', '#2a2a30'], 2, { store: 'safe', desc: 'Secondo deposito portatile da 20 slot' }, { iron_bar: 10, gold_bar: 2 }, 'anvil');
  TO('tool_lantern', 'Lanterna del Minatore', 'lantern', ['#fff08a', '#c9971a'], 1, { useBuff: ['shine', 120], cd: 9000, desc: 'Clic: splendore per 2 minuti (ricarica 2,5 min)' }, { iron_bar: 3, glass: 2, torch: 3 }, 'anvil');
  TO('tool_detector', 'Rilevatore di Minerali', 'compass', ['#ffd84a', '#6b717c'], 2, { useBuff: ['hunter', 60], cd: 5400, desc: 'Clic: rivela i minerali per 1 minuto (ricarica 1,5 min)' }, { iron_bar: 5, crystal: 2, gem_topaz: 1 }, 'anvil');
  TO('tool_bell', 'Campana della Quiete', 'bell', ['#ffd84a', '#c9971a'], 2, { useBuff: ['calm', 180], cd: 14400, desc: 'Clic: calma per 3 minuti (ricarica 4 min)' }, { gold_bar: 4, silk: 4 }, 'anvil');
  TO('tool_horn', 'Corno da Battaglia', 'horn', ['#e8e4d0', '#8a1f3a'], 2, { useBuff: ['battle', 180], cd: 14400, desc: 'Clic: più nemici per 3 minuti (ricarica 4 min)' }, { bone: 6, gold_bar: 2 }, 'anvil');
  TO('wand_heal', 'Bastone Curativo', 'wand', ['#6af08a', '#1f8a4a'], 2, { healSelf: 60, mana: 25, cd: 120, desc: 'Clic: cura 60 vita per 25 mana' }, { crystal: 6, flower: 6, gold_bar: 3 }, 'anvil');
  TO('scepter_life', 'Scettro della Vita', 'gemstaff', ['#ff6a9a', '#a02a5a'], 3, { healSelf: 120, mana: 40, cd: 150, desc: 'Clic: cura 120 vita per 40 mana' }, { shadow_bar: 6, flower: 10, gem_ruby: 2 }, 'mythic');

  // ================= ricette di tutti gli arredi =================
  for (const f of TF.FURN.list) {
    const r = f.rec; let ing, st, n = 1;
    if (r.kind) {
      const m = r.mat; ing = {};
      ing[m.base] = Math.max(1, Math.ceil(r.q * m.mul));
      if (m.key === 'mahogany') ing.mud = Math.max(1, Math.ceil(r.q / 2));
      if (r.extra) for (const k in r.extra) ing[k] = (ing[k] || 0) + r.extra[k];
      st = m.st;
    } else { ing = r.ing; st = r.st; n = r.n || 1; }
    R(f.id, n, ing, st);
  }
})(window.TF);
