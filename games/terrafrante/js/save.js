'use strict';
// Terrafrante - salvataggio persistente con IndexedDB (mondo, giocatore, progressi)
(function (TF) {
  const DB = 'terrafrante', STORE = 'saves', KEY = 'slot1';
  let dbp = null;
  function open() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      if (!window.indexedDB) { rej(new Error('IndexedDB non disponibile')); return; }
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  const tx = (mode, fn) => open().then((db) => new Promise((res, rej) => { const t = db.transaction(STORE, mode), s = t.objectStore(STORE), r = fn(s); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }));
  TF.Save = {
    async write(data) { try { await tx('readwrite', (s) => { s.put(data, KEY); s.put({ name: data.name, day: data.clock.day, playtime: data.playtime, time: Date.now(), version: data.version }, 'meta'); }); return true; } catch (e) { console.warn('Salvataggio fallito', e); return false; } },
    async read() { try { return await tx('readonly', (s) => s.get(KEY)); } catch (e) { return null; } },
    async info() { try { return (await tx('readonly', (s) => s.get('meta'))) || null; } catch (e) { return null; } },
    async remove() { try { await tx('readwrite', (s) => { s.delete(KEY); s.delete('meta'); }); } catch (e) { /* ignora */ } },
    // serializza lo stato di gioco
    pack(G) {
      const w = G.world, p = G.player;
      return {
        version: 1, name: G.name, seed: w.seed, w: w.w, h: w.h, flip: !!w.flip, tiles: w.tiles, walls: w.walls, liq: w.liq, biome: w.biome, surf: w.surf,
        chests: [...w.chests.values()].map((c) => ({ x: c.x, y: c.y, slots: c.slots })), spawn: w.spawn, dungeon: w.dungeon, deepY: w.deepY,
        player: { x: p.x, y: p.y, hp: p.hp, maxhp: p.maxhp, mana: p.mana, maxmanaBonus: p.maxmanaBonus || 0, spawn: p.spawn, stats: p.stats, buffs: p.buffs, facing: p.facing },
        inv: G.inv.toJSON(), stores: G.stores ? { piggy: G.stores.piggy.slots, safe: G.stores.safe.slots } : null, clock: { h: G.clock.h, day: G.clock.day }, progress: G.progress, playtime: Math.floor(G.playtime),
      };
    },
    unpack(G, d) {
      const w = new TF.World(d.w, d.h, d.seed);
      w.tiles = d.tiles; w.walls = d.walls; w.liq = d.liq; w.biome = d.biome; w.surf = d.surf; w.flip = d.flip; w.spawn = d.spawn; w.dungeon = d.dungeon; w.deepY = d.deepY;
      for (const c of d.chests) w.chests.set(c.x + ',' + c.y, { x: c.x, y: c.y, slots: c.slots });
      w.updateAllSky();
      G.world = w; G.name = d.name; G.progress = d.progress || { bosses: {} }; G.progress.bosses = G.progress.bosses || {}; G.playtime = d.playtime || 0;
      G.clock.h = d.clock.h; G.clock.day = d.clock.day;
      const p = G.player; p.reset(); Object.assign(p, { hp: d.player.hp, maxhp: d.player.maxhp, mana: d.player.mana, maxmanaBonus: d.player.maxmanaBonus, spawn: d.player.spawn, facing: d.player.facing || 1 });
      Object.assign(p.stats, d.player.stats); Object.assign(p.buffs, d.player.buffs || {});
      p.x = d.player.x; p.y = d.player.y; G.inv.fromJSON(d.inv);
      TF.resetStores(G); if (d.stores) for (const k of ['piggy', 'safe']) if (d.stores[k]) G.stores[k].slots = d.stores[k].map((s) => (s && TF.ITEMS[s.id] ? s : null));
    },
  };
})(window.TF);
