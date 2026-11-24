'use strict';
// Terrafrante - oggetti 2/4: sistemi di effetti (fx, pozioni, aure, incantesimi), gemme, armi da mischia, archi, magia, lancio, munizioni
(function (TF) {
  const ITEMS = TF.ITEMS, item = TF.itemDef, R = TF.addRecipe;

  // ================= effetti dell'equipaggiamento =================
  TF.addFx = (t, f) => { if (!f) return t; for (const n in f) t[n] = n === 'wings' ? Math.max(t[n] || 0, f[n]) : (t[n] || 0) + f[n]; return t; };
  // chiave: [etichetta, tipo]  (% = percentuale, + = valore, f = capacità, s = per secondo)
  const FXN = {
    speed: ['Velocità', '%'], jump: ['Salto', '+'], mine: ['Velocità di scavo', '%'], def: ['Difesa', '+'], regen: ['Rigenerazione vita', 's'], mana: ['Mana massimo', '+'], light: ['Luce', '+'],
    wings: ['Permette di volare', 'f'], thorns: ['Danni riflessi', '+'], dj: ['Doppio salto', 'f'], kbImmune: ['Immune al knockback', 'f'], lavaImm: ['Immune alla lava', 'f'],
    melee: ['Danno in mischia', '%'], ranged: ['Danno a distanza', '%'], magic: ['Danno magico', '%'], crit: ['Probabilità critico', '%'], manaCost: ['Costo mana ridotto', '%'],
    noFall: ['Niente danni da caduta', 'f'], slowFall: ['Caduta lenta (tieni SPAZIO)', 'f'], magnet: ['Raggio di raccolta', '+'], ammoSave: ['Munizioni risparmiate', '%'], gills: ['Respira sott\'acqua', 'f'],
    swim: ['Nuoto veloce', 'f'], dodge: ['Schivata', '%'], dr: ['Danni subiti ridotti', '%'], vamp: ['Furto di vita', '%'], atkspd: ['Velocità d\'attacco', '%'], knock: ['Potenza del knockback', '%'],
    reach: ['Portata di costruzione', '+'], calm: ['Meno nemici', '%'], battle: ['Più nemici', '%'], loot: ['Bottino migliore', '%'], burnHit: ['I colpi bruciano', 'f'], frostHit: ['I colpi rallentano', 'f'],
    poisonHit: ['I colpi avvelenano', 'f'], inferno: ['Fiamme attorno a te', 'f'], manaRegen: ['Rigenerazione mana', 'ms'], compass: ['Mostra la posizione', 'f'], radar: ['Conta i nemici vicini', 'f'], tally: ['Conta le uccisioni', 'f'],
  };
  TF.describeFx = (fx) => {
    const out = []; if (!fx) return out;
    for (const k in fx) {
      const d = FXN[k]; if (!d) continue; const v = fx[k];
      if (d[1] === 'f') out.push(d[0]);
      else if (d[1] === '%') out.push(`${d[0]} ${v > 0 ? '+' : ''}${Math.round(v * 100)}%`);
      else if (d[1] === 's') out.push(`${d[0]} +${v}/s`);
      else if (d[1] === 'ms') out.push(`${d[0]} +${(v * 60).toFixed(1)}/s`);
      else out.push(`${d[0]} ${v > 0 ? '+' : ''}${v}`);
    }
    return out;
  };
  TF.AMMO_NAME = { arrow: 'frecce', bolt: 'quadrelli per balestra', dart: 'dardi da cerbottana' };

  // ================= incantesimi dei bastoni (parametri di base per tipo di proiettile) =================
  TF.SPELLS = {
    spark: { sp: 8, trail: '#8fe6ff' }, frost: { sp: 7, slow: true, trail: '#bfeaff' }, spore: { sp: 7, homing: 0.06, poison: true, life: 90, trail: '#b6f060' },
    shadow: { sp: 7, homing: 0.1, life: 100, trail: '#a45fe0' }, fire: { sp: 6.5, explode: 30, big: true, life: 80, trail: '#ff9a3c' },
    orb: { sp: 7 }, star: { sp: 8, life: 70 }, leaf: { sp: 7.5, life: 60, trail: '#b6f060' }, bubble: { sp: 4, life: 90, pierce: 2, slow: true, trail: '#bfeaff' },
  };

  // ================= pozioni e cibi: effetti temporanei =================
  const BUFFS = (TF.BUFFS = {});
  const B = (key, name, desc, fx) => { BUFFS[key] = { name, desc, fx }; };
  B('speed', 'Velocità', 'Corri più veloce', { speed: 0.3 });
  B('mining', 'Scavo', 'Scavi più in fretta', { mine: 0.4 });
  B('iron', 'Pelle di ferro', 'Difesa +8', { def: 8 });
  B('sick', 'Malessere', 'Non puoi bere altre pozioni di vita', null);
  B('regen', 'Rigenerazione', 'Recuperi vita nel tempo', { regen: 2.5 });
  B('archery', 'Tiro con l\'arco', 'Danno a distanza +20%', { ranged: 0.2 });
  B('magicpow', 'Potere magico', 'Danno magico +20%', { magic: 0.2 });
  B('wrath', 'Ira', 'Danno in mischia +12%, critici +8%', { melee: 0.12, crit: 0.08 });
  B('endure', 'Resistenza', 'Danni subiti -10%', { dr: 0.1 });
  B('thorns', 'Spine', 'Rifletti 10 danni', { thorns: 10 });
  B('feather', 'Piuma', 'Cadi lentamente, nessun danno da caduta', { slowFall: 1, noFall: 1 });
  B('leap', 'Salto potenziato', 'Salti molto più in alto', { jump: 2 });
  B('obsidian', 'Pelle d\'ossidiana', 'Immune alla lava', { lavaImm: 1 });
  B('gills', 'Branchie', 'Respiri sott\'acqua', { gills: 1 });
  B('swim', 'Nuotatore', 'Nuoti veloce', { swim: 1 });
  B('nightowl', 'Occhio notturno', 'Vedi meglio al buio', { light: 90 });
  B('shine', 'Splendore', 'Emetti molta luce', { light: 180 });
  B('hunter', 'Cercatore', 'Rivela i minerali vicini', null);
  B('calm', 'Calma', 'Meno nemici nei dintorni', { calm: 0.45 });
  B('battle', 'Battaglia', 'Più nemici nei dintorni', { battle: 0.5 });
  B('magnetic', 'Magnetismo', 'Raccogli da più lontano', { magnet: 130 });
  B('builder', 'Costruttore', 'Portata +3 blocchi', { reach: 3 });
  B('manaregen', 'Flusso arcano', 'Il mana si rigenera più in fretta', { manaRegen: 0.12 });
  B('ammo', 'Risparmio', '25% di munizioni risparmiate', { ammoSave: 0.25 });
  B('lucky', 'Fortuna', 'Bottino migliore', { loot: 1 });
  B('inferno', 'Inferno', 'Fiamme bruciano i nemici vicini', { inferno: 1, lavaImm: 1 });
  B('dodge', 'Schivata', 'Probabilità di schivare +12%', { dodge: 0.12 });
  B('critp', 'Colpi critici', 'Critici +12%', { crit: 0.12 });
  B('lifesteal', 'Sete di sangue', 'Rubi il 6% dei danni', { vamp: 0.06 });
  B('rapid', 'Rapidità', 'Attacchi più veloci del 20%', { atkspd: 0.2 });
  B('titan', 'Titano', 'Knockback +50%, mischia +6%', { knock: 0.5, melee: 0.06 });
  B('focus', 'Concentrazione', 'Costo del mana -20%', { manaCost: 0.2 });
  B('warding', 'Protezione', 'Difesa +5', { def: 5 });
  B('radar', 'Senso del pericolo', 'Conta i nemici vicini', { radar: 1 });
  B('fed', 'Ben nutrito', 'Rigenerazione e danni leggermente migliori', { regen: 1, melee: 0.03, ranged: 0.03, magic: 0.03 });
  B('feast', 'Banchetto', 'Molti piccoli bonus', { regen: 1.5, def: 2, speed: 0.08, melee: 0.06, ranged: 0.06, magic: 0.06, mine: 0.12, crit: 0.03 });
  B('flask_fire', 'Lama di fuoco', 'I tuoi colpi bruciano', { burnHit: 1 });
  B('flask_frost', 'Lama di ghiaccio', 'I tuoi colpi rallentano', { frostHit: 1 });
  B('flask_poison', 'Lama velenosa', 'I tuoi colpi avvelenano', { poisonHit: 1 });
  B('flask_vamp', 'Lama vampirica', 'Rubi vita con i colpi', { vamp: 0.05 });

  // ================= aure degli arredi =================
  const AURAS = (TF.AURAS = {});
  const A = (key, name, desc, fx) => { AURAS[key] = { name, desc, fx }; };
  A('cozy', 'Accogliente', 'Rigenerazione vita +1', { regen: 1 });
  A('hearty', 'Cuore caldo', 'Rigenerazione vita +3', { regen: 3 });
  A('starlit', 'Stellato', 'Mana rigenerato più in fretta', { manaRegen: 0.1 });
  A('study', 'Studio', 'Mana rigenerato un po\' più in fretta', { manaRegen: 0.06 });
  A('calm', 'Pace', 'Meno nemici', { calm: 0.5 });
  A('battle', 'Battaglia', 'Più nemici', { battle: 0.5 });
  A('happy', 'Allegria', 'Più veloce, meno nemici', { speed: 0.1, calm: 0.25 });
  A('stoneguard', 'Guardia di pietra', 'Difesa +4', { def: 4 });
  A('clairvoyance', 'Chiaroveggenza', 'Danno magico +10%', { magic: 0.1 });
  A('serene', 'Sereno', 'Rigenerazione vita +1', { regen: 1 });
  A('harmony', 'Armonia', 'Vita e mana rigenerati', { regen: 1.5, manaRegen: 0.05 });
  A('glory', 'Gloria', 'Danni +4%', { melee: 0.04, ranged: 0.04, magic: 0.04 });

  // ================= materiali nuovi =================
  const MAT = (id, name, ic, c0, c1, desc, rar) => item(id, name, 'mat', { ic, col: [c0, c1], desc: desc || '', rar: rar || 0 });
  MAT('gunpowder', 'Polvere da Sparo', 'sack', '#5a5a64', '#2a2a30', 'Per bombe ed esplosivi');
  const GEMS = [['topaz', 'Topazio', '#ffd84a', '#c9971a'], ['amethyst', 'Ametista', '#c783f0', '#7a3fa8'], ['sapphire', 'Zaffiro', '#4a8fff', '#1a3f9e'], ['emerald', 'Smeraldo', '#4aff8a', '#1f8a4a'], ['ruby', 'Rubino', '#ff4a5a', '#a81a2a'], ['diamond', 'Diamante', '#e8fcff', '#8fd0f0']];
  GEMS.forEach(([k, n, c0, c1], i) => MAT('gem_' + k, n, 'gem', c0, c1, 'Gemma: la trovi nelle profondità', Math.min(3, 1 + (i >> 1))));
  R('gunpowder', 3, { gel: 2, stone: 3 }, 'bench');
  const GEMREC = { topaz: { scarab: 2 }, amethyst: { livid_essence: 2 }, sapphire: { frost_shard: 2 }, emerald: { jungle_spore: 2 }, ruby: { gel: 6, flower: 2 }, diamond: { night_core: 1, flower: 4 } };
  for (const [k] of GEMS) R('gem_' + k, 1, Object.assign({ crystal: 3 }, GEMREC[k]), 'furnace');

  // ================= armi da mischia =================
  const TI = [
    { k: 'copper', of: 'di Rame', c: ['#e08a4a', '#8a5a2b'], bar: 'copper_bar', dmg: 10, spd: 22, kb: 4, r: 0, st: 'anvil' },
    { k: 'iron', of: 'di Ferro', c: ['#d4d8df', '#6b4423'], bar: 'iron_bar', dmg: 15, spd: 21, kb: 4.5, r: 1, st: 'anvil' },
    { k: 'gold', of: 'd\'Oro', c: ['#ffd84a', '#6b4423'], bar: 'gold_bar', dmg: 20, spd: 20, kb: 5, r: 2, st: 'anvil' },
    { k: 'shadow', of: 'd\'Ombrite', c: ['#a45fe0', '#3a2552'], bar: 'shadow_bar', dmg: 29, spd: 19, kb: 5.5, r: 3, st: 'mythic' },
    { k: 'abyss', of: 'd\'Abissite', c: ['#ff7a3c', '#401c10'], bar: 'abyss_bar', dmg: 41, spd: 17, kb: 6, r: 4, st: 'mythic' },
  ];
  TF.TI = TI;
  // famiglia: chiave, nome, icona, moltiplicatore danno, velocità, knockback, lunghezza, barre, extra, proprietà
  const FAM = [
    ['dagger', 'Pugnale', 'dagger', 0.55, 0.6, 0.5, 18, 5, null, { style: 'stab', desc: 'Velocissimo, portata corta' }],
    ['spear', 'Lancia', 'spear', 1.1, 1.15, 1, 42, 8, { wood: 6 }, { style: 'stab', desc: 'Lunga portata, colpisce in linea' }],
    ['mace', 'Mazza', 'mace', 1.55, 1.7, 2.2, 26, 10, null, { scale: 1.15, desc: 'Lenta ma devastante, grande knockback' }],
    ['waraxe', 'Ascia da Guerra', 'waraxe', 1.3, 1.3, 1.5, 28, 9, { wood: 4 }, { pen: 0.3, desc: 'Ignora il 30% della difesa' }],
    ['katana', 'Katana', 'katana', 0.85, 0.8, 0.8, 34, 8, null, { crit: 0.08, desc: 'Veloce, critici +8%' }],
    ['greatsword', 'Spadone', 'greatsword', 1.75, 1.75, 1.8, 44, 14, null, { scale: 1.3, desc: 'Enorme portata e danno' }],
    ['scythe', 'Falce', 'scythe', 1.2, 1.2, 1.1, 38, 9, { wood: 4 }, { lifesteal: 0.025, desc: 'Ruba un po\' di vita' }],
    ['rapier', 'Stocco', 'rapier', 0.75, 0.7, 0.6, 36, 7, null, { style: 'stab', crit: 0.06, desc: 'Affondi rapidi e precisi' }],
  ];
  for (const t of TI) for (const [fk, fn, ic, dm, sm, km, len, nb, ex, props] of FAM) {
    const id = fk + '_' + t.k;
    item(id, fn + ' ' + t.of, 'sword', Object.assign({ dmg: Math.round(t.dmg * dm), spd: Math.max(8, Math.round(t.spd * sm)), kb: +(t.kb * km).toFixed(1), len: Math.round(len + t.r * 1.5), col: t.c, rar: t.r, ic }, props));
    R(id, 1, Object.assign({ [t.bar]: nb + t.r }, ex || {}), t.st);
  }

  // armi speciali: id, nome, icona, dmg, spd, kb, len, colori, rarità, proprietà, ricetta, stazione
  const SW = (id, name, ic, dmg, spd, kb, len, col, rar, props, rec, st) => { item(id, name, 'sword', Object.assign({ dmg, spd, kb, len, col, rar, ic }, props)); R(id, 1, rec, st); };
  SW('sword_bone', 'Lama d\'Osso', 'sword', 12, 21, 4, 28, ['#e8e4d0', '#9a957c'], 0, { desc: 'Economica ma solida' }, { bone: 12, wood: 2 }, 'bench');
  SW('gladius_fire', 'Gladio Infuocato', 'sword', 27, 19, 5, 32, ['#ff9a3c', '#6b2a12'], 2, { burn: true, desc: 'Incendia i nemici' }, { gold_bar: 8, obsidian: 6 }, 'anvil');
  SW('sword_vamp', 'Lama Vampirica', 'sword', 33, 19, 5, 34, ['#c03030', '#2a0e18'], 3, { lifesteal: 0.06, desc: 'Ruba il 6% dei danni' }, { shadow_bar: 8, wing: 6 }, 'mythic');
  SW('sword_storm', 'Lama Tempestosa', 'sword', 30, 18, 5, 33, ['#8fe6ff', '#2f5f8c'], 3, { sproj: 'spark', sdmg: 0.7, desc: 'Lancia scintille elettriche' }, { gold_bar: 6, crystal: 12, gem_topaz: 2 }, 'anvil');
  SW('sword_crystal', 'Spada di Cristallo', 'sword', 26, 19, 5, 32, ['#8fe6ff', '#3a8cc9'], 2, { sproj: 'orb', sdmg: 0.6, desc: 'Lancia sfere di cristallo' }, { crystal: 20, iron_bar: 6 }, 'anvil');
  SW('scimitar_dune', 'Scimitarra delle Dune', 'katana', 22, 17, 4, 32, ['#e8c34a', '#8a6a1e'], 2, { crit: 0.1, desc: 'Critici +10%' }, { scarab: 10, sandstone: 10, iron_bar: 5 }, 'anvil');
  SW('sword_obsidian', 'Lama d\'Ossidiana', 'sword', 31, 19, 5, 36, ['#6a4cb0', '#1f1634'], 3, { burn: true, desc: 'Vetro vulcanico ardente' }, { obsidian: 18, shadow_bar: 4 }, 'anvil');
  SW('spear_ice', 'Lancia di Ghiaccio', 'spear', 25, 24, 4, 44, ['#bfeaff', '#4a8fb8'], 2, { style: 'stab', slow: true, desc: 'Rallenta i nemici' }, { frost_shard: 14, iron_bar: 6 }, 'anvil');
  SW('spear_jungle', 'Lancia della Giungla', 'spear', 31, 22, 4, 46, ['#9be04a', '#3a6b1e'], 3, { style: 'stab', poison: true, desc: 'Avvelena i nemici' }, { jungle_spore: 14, gold_bar: 6 }, 'anvil');
  SW('trident_abyss', 'Tridente Abissale', 'trident', 48, 22, 5, 48, ['#ff7a3c', '#401c10'], 4, { style: 'stab', burn: true, desc: 'Trafigge e brucia' }, { abyss_bar: 14, obsidian: 8 }, 'mythic');
  SW('mace_livid', 'Mazza Livida', 'mace', 44, 30, 9, 28, ['#c783f0', '#4a2468'], 3, { scale: 1.15, poison: true, desc: 'Schianto velenoso' }, { livid_essence: 12, shadow_bar: 6 }, 'mythic');
  SW('hammer_sire', 'Martello del Sire', 'mace', 70, 32, 12, 30, ['#ff6a3c', '#2a0e08'], 4, { scale: 1.3, desc: 'Forgiato col Nucleo d\'Abisso' }, { abyss_bar: 10, abyss_core: 3 }, 'mythic');
  SW('scythe_moon', 'Falce della Luna', 'scythe', 42, 18, 5, 40, ['#c0d0ff', '#2a1e5e'], 3, { wave: 0.6, lifesteal: 0.04, desc: 'Mezzelune lunari' }, { night_core: 4, shadow_bar: 8 }, 'mythic');
  SW('scythe_hell', 'Falce Infernale', 'scythe', 55, 17, 6, 42, ['#ff6a3c', '#401c10'], 4, { wave: 0.7, burn: true, desc: 'Onde di fuoco' }, { abyss_bar: 10, abyss_core: 2, obsidian: 6 }, 'mythic');
  SW('sword_wind', 'Lama del Vento', 'katana', 22, 12, 2, 32, ['#e8f4ff', '#8fb5c4'], 2, { wave: 0.4, desc: 'Leggerissima, tagli d\'aria' }, { wing: 8, silk: 10, iron_bar: 6 }, 'anvil');
  SW('sword_star', 'Spada Stellare', 'sword', 36, 17, 5, 34, ['#ffe27a', '#41279e'], 4, { sproj: 'star', sdmg: 0.7, spierce: 3, desc: 'Lancia stelle perforanti' }, { gem_diamond: 2, gold_bar: 8, crystal: 10 }, 'mythic');
  SW('katana_shadow', 'Katana d\'Ombra', 'katana', 38, 13, 4, 38, ['#a45fe0', '#1c1428'], 3, { crit: 0.18, desc: 'Critici +18%' }, { shadow_bar: 10, livid_essence: 5 }, 'mythic');
  SW('sword_thorn', 'Spada di Spine', 'sword', 19, 20, 3, 30, ['#4aa05a', '#2e6b3a'], 1, { poison: true, desc: 'Spine avvelenate' }, { cactus: 14, gel: 6 }, 'bench');
  SW('sword_royal', 'Spada Reale', 'sword', 33, 18, 6, 36, ['#ffd84a', '#8a1f3a'], 3, { desc: 'Gemme su lama d\'oro' }, { gold_bar: 12, gem_ruby: 2, gem_sapphire: 2, gem_emerald: 2 }, 'anvil');
  SW('greatsword_ice', 'Spadone di Ghiaccio', 'greatsword', 45, 30, 8, 46, ['#bfeaff', '#4a8fb8'], 3, { scale: 1.3, slow: true, wave: 0.5, desc: 'Onde gelide, rallenta' }, { frost_shard: 20, ice: 10, iron_bar: 8 }, 'anvil');
  SW('spear_bone', 'Lancia d\'Osso', 'spear', 17, 24, 3, 40, ['#e8e4d0', '#9a957c'], 0, { style: 'stab', desc: 'Lancia primitiva' }, { bone: 14, wood: 6 }, 'bench');
  SW('dagger_venom', 'Pugnale Avvelenato', 'dagger', 12, 11, 2, 20, ['#9bb35a', '#3a4a1e'], 1, { style: 'stab', poison: true, desc: 'Fulmineo e velenoso' }, { iron_bar: 5, bog_goo: 4 }, 'anvil');
  SW('sword_guardian', 'Lama del Guardiano', 'greatsword', 40, 24, 8, 42, ['#7088c8', '#232f4f'], 3, { scale: 1.2, desc: 'Strappata ai guardiani del dungeon' }, { dungeon: 25, shadow_bar: 6 }, 'mythic');

  // ================= archi, balestre, cerbottane =================
  const BW = (id, name, ic, dmg, spd, vel, col, rar, props, rec, st) => { item(id, name, 'bow', Object.assign({ dmg, spd, vel, kb: 2, col, rar, ic }, props)); R(id, 1, rec, st); };
  BW('bow_short', 'Arco Corto', 'bow', 8, 18, 9, ['#a8753f', '#e8e4d0'], 0, { desc: 'Rapido e leggero' }, { wood: 8, silk: 4 }, 'bench');
  BW('bow_long', 'Arco Lungo', 'bow', 24, 34, 16, ['#8a5a2b', '#d4d8df'], 1, { pierce: 2, desc: 'Lento, frecce veloci e perforanti' }, { iron_bar: 8, wood: 6 }, 'anvil');
  BW('bow_composite', 'Arco Composito', 'bow', 18, 22, 12, ['#e8e4d0', '#a8753f'], 1, {}, { bone: 12, silk: 8, iron_bar: 4 }, 'anvil');
  BW('bow_burst', 'Arco a Raffica', 'bow', 13, 26, 11, ['#ffd84a', '#6b4423'], 2, { multi: 3, spread: 0.2, desc: 'Tre frecce a ventaglio' }, { gold_bar: 8, wing: 4 }, 'anvil');
  BW('bow_hunter', 'Arco del Cacciatore', 'bow', 26, 21, 13, ['#9be04a', '#3a5a2a'], 2, { homing: 0.04, desc: 'Le frecce correggono la mira' }, { gold_bar: 10, jungle_spore: 8 }, 'anvil');
  BW('bow_fire', 'Arco Infuocato', 'bow', 28, 22, 13, ['#ff9a3c', '#6b2a12'], 3, { burn: true, desc: 'Frecce incendiarie' }, { obsidian: 8, gold_bar: 8 }, 'anvil');
  BW('bow_frost', 'Arco Gelido', 'bow', 21, 22, 12, ['#bfeaff', '#4a8fb8'], 2, { slow: true, desc: 'Frecce che rallentano' }, { frost_shard: 14, iron_bar: 6 }, 'anvil');
  BW('bow_venom', 'Arco Venefico', 'bow', 27, 21, 12, ['#9bb35a', '#3a4a1e'], 3, { poison: true, desc: 'Frecce avvelenate' }, { bog_goo: 10, gold_bar: 6 }, 'anvil');
  BW('bow_ghost', 'Arco Fantasma', 'bow', 36, 20, 14, ['#c0d0ff', '#41279e'], 3, { homing: 0.08, pierce: 2, desc: 'Frecce spettrali teleguidate' }, { shadow_bar: 8, livid_essence: 8 }, 'mythic');
  BW('bow_crystal', 'Arco di Cristallo', 'bow', 30, 19, 14, ['#8fe6ff', '#2f5f8c'], 3, { pierce: 3, desc: 'Le frecce trapassano tre nemici' }, { crystal: 14, iron_bar: 6 }, 'anvil');
  BW('bow_celestial', 'Arco Celeste', 'bow', 46, 15, 15, ['#fff6d0', '#e8c34a'], 4, { multi: 2, spread: 0.1, pierce: 2, desc: 'Due frecce celesti' }, { abyss_bar: 10, wing: 10, gem_diamond: 1 }, 'mythic');
  BW('xbow_wood', 'Balestra di Legno', 'crossbow', 12, 30, 12, ['#a8753f', '#6b4423'], 0, { af: 'bolt', grav: 0.04, desc: 'Usa quadrelli per balestra' }, { planks: 6, wood: 8, copper_bar: 2 }, 'bench');
  BW('xbow_iron', 'Balestra di Ferro', 'crossbow', 19, 28, 14, ['#d4d8df', '#6b4423'], 1, { af: 'bolt', grav: 0.04 }, { iron_bar: 10 }, 'anvil');
  BW('xbow_gold', 'Balestra d\'Oro', 'crossbow', 27, 26, 15, ['#ffd84a', '#6b4423'], 2, { af: 'bolt', grav: 0.04 }, { gold_bar: 10 }, 'anvil');
  BW('xbow_shadow', 'Balestra d\'Ombrite', 'crossbow', 38, 24, 16, ['#a45fe0', '#3a2552'], 3, { af: 'bolt', grav: 0.03 }, { shadow_bar: 10 }, 'mythic');
  BW('xbow_abyss', 'Balestra d\'Abissite', 'crossbow', 52, 22, 17, ['#ff7a3c', '#401c10'], 4, { af: 'bolt', grav: 0.03 }, { abyss_bar: 10 }, 'mythic');
  BW('xbow_auto', 'Balestra Automatica', 'crossbow', 24, 11, 14, ['#9aa0ac', '#3a3a44'], 3, { af: 'bolt', inacc: 0.12, desc: 'Cadenza altissima' }, { gold_bar: 8, iron_bar: 8, crystal: 6 }, 'anvil');
  BW('xbow_double', 'Balestra Doppia', 'crossbow', 30, 28, 16, ['#c783f0', '#3a2552'], 3, { af: 'bolt', multi: 2, spread: 0.08, desc: 'Due dardi insieme' }, { shadow_bar: 6, iron_bar: 8 }, 'mythic');
  BW('xbow_heavy', 'Balestra Pesante', 'crossbow', 60, 44, 18, ['#6e7078', '#1c1c24'], 4, { af: 'bolt', pierce: 3, kb: 5, desc: 'Un colpo, tre bersagli' }, { abyss_bar: 8, obsidian: 10 }, 'mythic');
  BW('blow_wood', 'Cerbottana di Legno', 'blowgun', 5, 22, 11, ['#a8753f', '#6b4423'], 0, { af: 'dart', grav: 0.05, desc: 'Usa dardi da cerbottana' }, { wood: 10 }, 'bench');
  BW('blow_cactus', 'Cerbottana di Cactus', 'blowgun', 9, 18, 12, ['#4aa05a', '#2e6b3a'], 1, { af: 'dart', grav: 0.05 }, { cactus: 14 }, 'bench');
  BW('blow_jungle', 'Cerbottana della Giungla', 'blowgun', 15, 15, 13, ['#9be04a', '#3a6b1e'], 2, { af: 'dart', grav: 0.04, poison: true, desc: 'Dardi avvelenati' }, { jungle_spore: 10, gold_bar: 4 }, 'anvil');
  BW('blow_obsidian', 'Cerbottana d\'Ossidiana', 'blowgun', 24, 14, 14, ['#6a4cb0', '#1f1634'], 3, { af: 'dart', grav: 0.03 }, { obsidian: 12, iron_bar: 4 }, 'anvil');
  BW('blow_ghost', 'Cerbottana Spettrale', 'blowgun', 31, 12, 15, ['#c0d0ff', '#41279e'], 4, { af: 'dart', grav: 0.02, homing: 0.05, desc: 'Dardi teleguidati' }, { shadow_bar: 8, livid_essence: 6 }, 'mythic');

  // ---- munizioni: id, nome, kind, dmg, colori, tip, props, ricetta (quantità prodotta, ingredienti), stazione ----
  const AM = (id, name, ic, af, dmg, col, rar, props, out, rec, st) => { item(id, name, 'ammo', Object.assign({ dmg, ic, af, col, rar, tip: col[1] }, props)); R(id, out, rec, st); };
  AM('arrow_bone', 'Freccia d\'Osso', 'arrow', 'arrow', 6, ['#e8e4d0', '#9a957c'], 0, {}, 10, { wood: 1, bone: 1 }, 'bench');
  AM('arrow_iron', 'Freccia di Ferro', 'arrow', 'arrow', 9, ['#d9c9a0', '#d4d8df'], 1, {}, 15, { iron_bar: 1, wood: 2 }, 'anvil');
  AM('arrow_gold', 'Freccia d\'Oro', 'arrow', 'arrow', 14, ['#d9c9a0', '#ffd84a'], 2, {}, 15, { gold_bar: 1, wood: 2 }, 'anvil');
  AM('arrow_fire', 'Freccia Infuocata', 'arrow', 'arrow', 7, ['#d9c9a0', '#ff6a3c'], 1, { burn: true, trail: '#ff9a3c' }, 10, { arrow: 10, torch: 1 }, 'bench');
  AM('arrow_frost', 'Freccia Gelida', 'arrow', 'arrow', 7, ['#d9c9a0', '#bfeaff'], 1, { slow: true, trail: '#bfeaff' }, 10, { arrow: 10, frost_shard: 1 }, 'bench');
  AM('arrow_poison', 'Freccia Velenosa', 'arrow', 'arrow', 7, ['#d9c9a0', '#9be04a'], 1, { poison: true, trail: '#b6f060' }, 10, { arrow: 10, bog_goo: 1 }, 'bench');
  AM('arrow_crystal', 'Freccia di Cristallo', 'arrow', 'arrow', 12, ['#d9c9a0', '#8fe6ff'], 2, { pierce: 2 }, 10, { arrow: 10, crystal: 1 }, 'anvil');
  AM('arrow_explosive', 'Freccia Esplosiva', 'arrow', 'arrow', 8, ['#d9c9a0', '#ff4a4a'], 2, { explode: 36, trail: '#ff9a3c' }, 5, { arrow: 5, gunpowder: 2 }, 'bench');
  AM('arrow_shadow', 'Freccia d\'Ombra', 'arrow', 'arrow', 16, ['#d9c9a0', '#a45fe0'], 3, { homing: 0.07, trail: '#a45fe0' }, 10, { arrow: 10, livid_essence: 1 }, 'anvil');
  AM('arrow_star', 'Freccia Stellare', 'arrow', 'arrow', 18, ['#d9c9a0', '#ffe27a'], 3, { pierce: 3, trail: '#ffe27a' }, 10, { arrow: 10, gem_topaz: 1 }, 'anvil');
  AM('bolt', 'Quadrello', 'bolt', 'bolt', 5, ['#9aa0ac', '#c9c9d4'], 0, {}, 8, { wood: 1, copper_bar: 1 }, 'bench');
  AM('bolt_iron', 'Quadrello di Ferro', 'bolt', 'bolt', 9, ['#d4d8df', '#9aa0ac'], 1, {}, 12, { iron_bar: 1, wood: 1 }, 'anvil');
  AM('bolt_fire', 'Quadrello Infuocato', 'bolt', 'bolt', 7, ['#ff9a3c', '#ff6a3c'], 1, { burn: true, trail: '#ff9a3c' }, 10, { bolt: 10, torch: 1 }, 'bench');
  AM('bolt_frost', 'Quadrello Gelido', 'bolt', 'bolt', 7, ['#bfeaff', '#6ab8e0'], 1, { slow: true, trail: '#bfeaff' }, 10, { bolt: 10, frost_shard: 1 }, 'bench');
  AM('bolt_poison', 'Quadrello Velenoso', 'bolt', 'bolt', 7, ['#9be04a', '#5ea02a'], 1, { poison: true, trail: '#b6f060' }, 10, { bolt: 10, bog_goo: 1 }, 'bench');
  AM('bolt_explosive', 'Quadrello Esplosivo', 'bolt', 'bolt', 8, ['#ff4a4a', '#a82a12'], 2, { explode: 40, trail: '#ff9a3c' }, 5, { bolt: 5, gunpowder: 2 }, 'bench');
  AM('dart', 'Dardo di Legno', 'dart', 'dart', 3, ['#8a5a2b', '#c8a070'], 0, {}, 12, { wood: 1 }, 'bench');
  AM('dart_poison', 'Dardo Velenoso', 'dart', 'dart', 5, ['#7ad24a', '#3a6b1e'], 1, { poison: true, trail: '#b6f060' }, 10, { dart: 10, bog_goo: 1 }, 'bench');
  AM('dart_fire', 'Dardo Infuocato', 'dart', 'dart', 5, ['#ff9a3c', '#ff6a3c'], 1, { burn: true, trail: '#ff9a3c' }, 10, { dart: 10, torch: 1 }, 'bench');
  AM('dart_frost', 'Dardo Gelido', 'dart', 'dart', 5, ['#bfeaff', '#6ab8e0'], 1, { slow: true, trail: '#bfeaff' }, 10, { dart: 10, frost_shard: 1 }, 'bench');
  AM('dart_crystal', 'Dardo di Cristallo', 'dart', 'dart', 9, ['#8fe6ff', '#3a8cc9'], 2, { pierce: 2 }, 10, { dart: 10, crystal: 1 }, 'anvil');
  AM('dart_explosive', 'Dardo Esplosivo', 'dart', 'dart', 6, ['#ff4a4a', '#a82a12'], 2, { explode: 30, trail: '#ff9a3c' }, 5, { dart: 5, gunpowder: 2 }, 'bench');

  // ================= bastoni, bacchette, tomi =================
  const ST = (id, name, ic, dmg, spd, mana, proj, col, rar, props, rec, st) => { item(id, name, 'staff', Object.assign({ dmg, spd, mana, proj, col, rar, ic, kb: 2 }, props)); R(id, 1, rec, st); };
  ST('staff_ruby', 'Bastone di Rubino', 'gemstaff', 28, 22, 7, 'fire', ['#ff4a5a', '#a81a2a'], 2, { desc: 'Palle di fuoco esplosive' }, { gem_ruby: 8, wood: 8 }, 'anvil');
  ST('staff_sapphire', 'Bastone di Zaffiro', 'gemstaff', 22, 20, 5, 'frost', ['#4a8fff', '#1a3f9e'], 2, { desc: 'Schegge di ghiaccio' }, { gem_sapphire: 8, wood: 8 }, 'anvil');
  ST('staff_emerald', 'Bastone di Smeraldo', 'gemstaff', 25, 22, 6, 'spore', ['#4aff8a', '#1f8a4a'], 2, { desc: 'Spore teleguidate avvelenate' }, { gem_emerald: 8, wood: 8 }, 'anvil');
  ST('staff_topaz', 'Bastone di Topazio', 'gemstaff', 20, 18, 5, 'spark', ['#ffd84a', '#c9971a'], 2, { pierce: 3, desc: 'Fulmini che perforano' }, { gem_topaz: 8, wood: 8 }, 'anvil');
  ST('staff_amethyst', 'Bastone d\'Ametista', 'gemstaff', 26, 21, 7, 'shadow', ['#c783f0', '#7a3fa8'], 2, { desc: 'Sfere d\'ombra teleguidate' }, { gem_amethyst: 8, wood: 8 }, 'anvil');
  ST('staff_diamond', 'Bastone di Diamante', 'gemstaff', 40, 18, 10, 'orb', ['#e8fcff', '#8fd0f0'], 4, { pcol: '#e8fcff', pierce: 3, homing: 0.05, desc: 'Sfere diamantine teleguidate' }, { gem_diamond: 6, crystal: 10, gold_bar: 6 }, 'mythic');
  ST('wand_wood', 'Bacchetta di Legno', 'wand', 9, 20, 2, 'spark', ['#c8924f', '#6b4423'], 0, { desc: 'Piccole scintille a basso costo' }, { wood: 6, crystal: 1 }, 'bench');
  ST('wand_sparkle', 'Bacchetta Scintillante', 'wand', 15, 20, 4, 'spark', ['#8fe6ff', '#2f5f8c'], 1, { multi: 2, spread: 0.1, desc: 'Due scintille' }, { gold_bar: 3, crystal: 4 }, 'anvil');
  ST('wand_leaf', 'Bacchetta Verde', 'wand', 14, 20, 4, 'leaf', ['#5ec23a', '#2a7a22'], 1, { pcol: '#5ec23a', multi: 3, spread: 0.25, desc: 'Ventaglio di foglie' }, { jungle_spore: 6, wood: 4 }, 'bench');
  ST('wand_bubble', 'Bacchetta delle Bolle', 'wand', 12, 24, 3, 'bubble', ['#8fe6ff', '#2f5f8c'], 1, { pcol: '#8fe6ff', desc: 'Bolle lente che frenano' }, { frost_shard: 4, glass: 4 }, 'bench');
  ST('wand_wind', 'Bacchetta del Vento', 'wand', 18, 18, 4, 'orb', ['#e8f4ff', '#8fb5c4'], 2, { pcol: '#e8f4ff', sp: 10, multi: 2, spread: 0.12, desc: 'Raffiche veloci' }, { wing: 4, crystal: 2 }, 'anvil');
  ST('tome_fire', 'Tomo del Fuoco', 'tome', 22, 34, 14, 'fire', ['#ff6a3c', '#6b2a12'], 2, { ring: 8, desc: 'Esplosione di fuoco a stella' }, { cloth: 6, obsidian: 6, crystal: 6 }, 'arcane');
  ST('tome_frost', 'Tomo del Gelo', 'tome', 16, 30, 12, 'frost', ['#bfeaff', '#4a8fb8'], 2, { ring: 10, desc: 'Anello di ghiaccio' }, { cloth: 6, frost_shard: 10, crystal: 4 }, 'arcane');
  ST('tome_nature', 'Tomo della Natura', 'tome', 14, 24, 8, 'leaf', ['#5ec23a', '#2a7a22'], 2, { pcol: '#5ec23a', multi: 5, spread: 0.3, desc: 'Cinque foglie a ventaglio' }, { cloth: 6, jungle_spore: 10, gold_bar: 2 }, 'arcane');
  ST('tome_dark', 'Tomo Oscuro', 'tome', 28, 28, 12, 'shadow', ['#a45fe0', '#2a1e42'], 3, { multi: 3, spread: 0.3, desc: 'Tre sfere d\'ombra' }, { cloth: 6, shadow_bar: 6, livid_essence: 6 }, 'arcane');
  ST('tome_star', 'Tomo delle Stelle', 'tome', 30, 30, 16, 'star', ['#ffe27a', '#41279e'], 3, { pcol: '#ffe27a', sky: 120, multi: 4, pierce: 2, desc: 'Pioggia di stelle sul bersaglio' }, { cloth: 6, gem_topaz: 3, crystal: 10 }, 'arcane');
  ST('tome_thunder', 'Tomo del Tuono', 'tome', 20, 26, 10, 'spark', ['#8fe6ff', '#2f5f8c'], 3, { multi: 4, spread: 0.16, pierce: 2, desc: 'Quattro fulmini' }, { cloth: 6, gem_topaz: 2, gold_bar: 6 }, 'arcane');
  ST('tome_abyss', 'Tomo dell\'Abisso', 'tome', 40, 34, 22, 'fire', ['#ff7a3c', '#401c10'], 4, { ring: 12, burn: true, desc: 'Corona di fuoco infernale' }, { cloth: 8, abyss_bar: 8, abyss_core: 2 }, 'mythic');
  ST('staff_rain', 'Bastone della Pioggia', 'staff', 18, 26, 8, 'orb', ['#6ab8e0', '#2f5f8c'], 2, { pcol: '#6ab8e0', sky: 120, multi: 5, desc: 'Fa piovere sfere sul bersaglio' }, { frost_shard: 6, crystal: 6, silk: 4 }, 'anvil');
  ST('staff_star', 'Bastone Stellare', 'staff', 26, 20, 8, 'star', ['#ffe27a', '#6b4423'], 3, { pcol: '#ffe27a', pierce: 3, desc: 'Stelle perforanti' }, { gem_topaz: 4, gold_bar: 6 }, 'anvil');
  ST('staff_ghost', 'Bastone Spettrale', 'staff', 30, 20, 9, 'orb', ['#c0d0ff', '#41279e'], 3, { pcol: '#c0d0ff', ghost: true, homing: 0.08, life: 100, desc: 'Attraversa i muri' }, { livid_essence: 8, shadow_bar: 6 }, 'mythic');
  ST('staff_lava', 'Bastone di Lava', 'staff', 36, 22, 11, 'fire', ['#ff7a3c', '#401c10'], 3, { multi: 2, spread: 0.15, burn: true, desc: 'Due colate esplosive' }, { obsidian: 10, abyss_bar: 4 }, 'mythic');

  // ================= armi da lancio =================
  const TH = (id, name, ic, dmg, spd, vel, col, rar, props, out, rec, st) => { item(id, name, 'thrown', Object.assign({ dmg, spd, vel, kb: 2, col, rar, ic }, props)); R(id, out, rec, st); };
  TI.forEach((t, i) => TH('knife_' + t.k, 'Coltello da Lancio ' + t.of, 'knife', [8, 12, 17, 25, 36][i], 14, 9, t.c, t.r, { grav: 0.1, desc: 'Si lancia: consumabile' }, 15, { [t.bar]: 1 }, t.k === 'copper' ? 'bench' : 'anvil'));
  TH('shuriken_iron', 'Shuriken di Ferro', 'shuriken', 11, 12, 10, ['#d4d8df', '#6b717c'], 1, { pierce: 2, grav: 0.06 }, 12, { iron_bar: 1 }, 'anvil');
  TH('shuriken_gold', 'Shuriken d\'Oro', 'shuriken', 16, 11, 10, ['#ffd84a', '#c9971a'], 2, { pierce: 2, grav: 0.06 }, 12, { gold_bar: 1 }, 'anvil');
  TH('shuriken_shadow', 'Shuriken d\'Ombrite', 'shuriken', 26, 10, 11, ['#a45fe0', '#3a2552'], 3, { pierce: 3, grav: 0.05 }, 12, { shadow_bar: 1 }, 'mythic');
  TH('javelin_wood', 'Giavellotto di Legno', 'javelin', 14, 24, 10, ['#c8a070', '#8a5a2b'], 0, { pierce: 2, grav: 0.16, kb: 3 }, 6, { wood: 4, stone: 1 }, 'bench');
  TH('javelin_iron', 'Giavellotto di Ferro', 'javelin', 22, 22, 10, ['#d4d8df', '#8a5a2b'], 1, { pierce: 2, grav: 0.15, kb: 3 }, 6, { iron_bar: 1, wood: 3 }, 'anvil');
  TH('javelin_gold', 'Giavellotto d\'Oro', 'javelin', 31, 21, 11, ['#ffd84a', '#8a5a2b'], 2, { pierce: 3, grav: 0.14, kb: 3 }, 6, { gold_bar: 1, wood: 3 }, 'anvil');
  TH('javelin_obsidian', 'Giavellotto d\'Ossidiana', 'javelin', 42, 20, 12, ['#6a4cb0', '#1f1634'], 3, { pierce: 3, grav: 0.12, kb: 4 }, 6, { obsidian: 2, wood: 3 }, 'anvil');
  TH('throwaxe_iron', 'Ascia da Lancio di Ferro', 'throwaxe', 20, 20, 8, ['#d4d8df', '#6b4423'], 1, { kb: 4 }, 6, { iron_bar: 1, wood: 2 }, 'anvil');
  TH('throwaxe_gold', 'Ascia da Lancio d\'Oro', 'throwaxe', 28, 19, 8, ['#ffd84a', '#6b4423'], 2, { kb: 4 }, 6, { gold_bar: 1, wood: 2 }, 'anvil');
  TH('throwaxe_abyss', 'Ascia da Lancio d\'Abissite', 'throwaxe', 48, 17, 9, ['#ff7a3c', '#401c10'], 4, { kb: 5, pierce: 2 }, 6, { abyss_bar: 1, wood: 2 }, 'mythic');
  // boomerang: non consumabili, ritornano
  const BM = (id, name, dmg, spd, col, rar, props, rec, st) => { item(id, name, 'thrown', Object.assign({ dmg, spd, vel: 9, kb: 3, col, rar, ic: 'boomerang', ret: true, stack: 1, desc: 'Torna da te. Uno alla volta' }, props)); R(id, 1, rec, st); };
  BM('boomerang_wood', 'Boomerang di Legno', 12, 20, ['#c8924f', '#6b4423'], 0, {}, { wood: 12 }, 'bench');
  BM('boomerang_iron', 'Boomerang di Ferro', 20, 18, ['#d4d8df', '#6b717c'], 1, {}, { iron_bar: 8 }, 'anvil');
  BM('boomerang_ice', 'Boomerang di Ghiaccio', 24, 18, ['#bfeaff', '#4a8fb8'], 2, { slow: true }, { frost_shard: 12, iron_bar: 4 }, 'anvil');
  BM('boomerang_fire', 'Boomerang di Fuoco', 32, 17, ['#ff9a3c', '#6b2a12'], 3, { burn: true, trail: '#ff9a3c' }, { obsidian: 8, gold_bar: 6 }, 'anvil');
  BM('boomerang_crystal', 'Boomerang di Cristallo', 36, 16, ['#8fe6ff', '#2f5f8c'], 3, { out: 34 }, { crystal: 14, iron_bar: 4 }, 'anvil');
  BM('boomerang_shadow', 'Boomerang d\'Ombrite', 42, 15, ['#a45fe0', '#3a2552'], 4, { out: 32, trail: '#a45fe0' }, { shadow_bar: 10, livid_essence: 4 }, 'mythic');
  // esplosivi: lanciati con mira parabolica, con miccia. 'tiles' = raggio di distruzione dei blocchi
  const BO = (id, name, ic, dmg, boom, tiles, pow, col, rar, props, out, rec, st) => { item(id, name, 'thrown', Object.assign({ dmg, spd: 28, vel: 7, kb: 4, col, rar, ic, boom, tiles, pow, fuse: 85, grav: 0.28 }, props)); R(id, out, rec, st); };
  BO('bomb', 'Bomba', 'bomb', 55, 42, 3, 55, ['#3a3a44', '#1c1c24'], 1, { desc: 'Esplode dopo 1,5 s e scava il terreno' }, 3, { gunpowder: 4, iron_bar: 1 }, 'bench');
  BO('bomb_sticky', 'Bomba Adesiva', 'bomb', 50, 36, 2, 55, ['#6fe08a', '#3fa85a'], 1, { contact: true, desc: 'Esplode al contatto coi nemici' }, 3, { gunpowder: 3, gel: 4 }, 'bench');
  BO('dynamite', 'Dinamite', 'dynamite', 120, 66, 5, 65, ['#d83a3a', '#8a1f1f'], 2, { fuse: 105, desc: 'Grande esplosione, rompe anche roccia dura' }, 2, { gunpowder: 8, cloth: 1 }, 'bench');
  BO('bomb_ice', 'Bomba di Ghiaccio', 'bomb', 45, 46, 0, 0, ['#bfeaff', '#4a8fb8'], 2, { slow: true, desc: 'Congela i nemici, non scava' }, 3, { gunpowder: 3, frost_shard: 3 }, 'bench');
  BO('bomb_fire', 'Bomba Incendiaria', 'bomb', 60, 46, 2, 55, ['#ff9a3c', '#a82a12'], 2, { burn: true, desc: 'Brucia i nemici' }, 3, { gunpowder: 3, torch: 4, obsidian: 1 }, 'bench');
  BO('bomb_poison', 'Bomba Velenosa', 'bomb', 45, 46, 0, 0, ['#9be04a', '#3a6b1e'], 2, { poison: true, desc: 'Nube velenosa, non scava' }, 3, { gunpowder: 3, bog_goo: 4 }, 'bench');
  BO('grenade', 'Granata', 'grenade', 42, 30, 0, 0, ['#4a6a4a', '#2a3a2a'], 1, { contact: true, fuse: 60, desc: 'Piccola, esplode al contatto, non scava' }, 4, { gunpowder: 3, iron_bar: 1 }, 'anvil');
  BO('bomb_mega', 'Mega Bomba', 'bomb', 200, 92, 8, 80, ['#ff4a4a', '#701010'], 4, { fuse: 120, desc: 'Cratere enorme. Attento a te!' }, 1, { gunpowder: 16, abyss_bar: 2, obsidian: 4 }, 'mythic');
})(window.TF);
