'use strict';
// Terrafrante - crafting: stazioni vicine, controllo materiali, fabbricazione
(function (TF) {
  const T = TF.T, TILES = TF.TILES, ITEMS = TF.ITEMS;
  const RANGE = 5;
  TF.Crafting = {
    // stazioni presenti entro RANGE tile dal giocatore
    stations(world, px, py) {
      const st = { bench: false, furnace: false, anvil: false, alchemy: false, loom: false, cook: false, arcane: false, mythic: false }, tx = Math.floor(px / TF.TS), ty = Math.floor(py / TF.TS);
      for (let y = ty - RANGE; y <= ty + RANGE; y++) for (let x = tx - RANGE - 1; x <= tx + RANGE + 1; x++) { const t = TILES[world.get(x, y)], s = t.station; if (s) { st[s] = true; if (t.also) for (const a of t.also) st[a] = true; } }
      return st;
    },
    stationName: { bench: 'Banco da Lavoro', furnace: 'Fornace', anvil: 'Incudine', alchemy: 'Tavolo d\'Alchimia', loom: 'Telaio', cook: 'Pentola da Cucina', arcane: 'Altare Arcano', mythic: 'Incudine Mistica' },
    canCraft(inv, rec, st) {
      if (rec.st && !st[rec.st]) return false;
      for (const k in rec.ing) if (!inv.has(k, rec.ing[k])) return false;
      return inv.canAdd(rec.out, rec.n) || Object.keys(rec.ing).some((k) => inv.count(k) === rec.ing[k]);
    },
    craft(inv, rec, st) {
      if (!this.canCraft(inv, rec, st)) return false;
      for (const k in rec.ing) inv.remove(k, rec.ing[k]);
      const left = inv.add(rec.out, rec.n);
      return left === 0 ? true : left; // se l'inventario è pieno restituisce quantità rimasta da lasciar cadere
    },
    list(inv, st, cat) {
      const out = [];
      for (const r of TF.RECIPES) {
        if (cat && cat !== 'Tutto' && r.cat !== cat) continue;
        out.push({ r, ok: this.canCraft(inv, r, st), station: !r.st || st[r.st] });
      }
      out.sort((a, b) => (b.ok - a.ok) || (b.station - a.station));
      return out;
    },
  };
})(window.TF);
