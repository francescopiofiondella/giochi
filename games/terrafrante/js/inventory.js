'use strict';
// Terrafrante - inventario, equipaggiamento, interazioni a slot (click, trascinamento, shift-click)
(function (TF) {
  const ITEMS = TF.ITEMS;
  const SIZE = 40, HOT = 10;
  const EQ_KEYS = ['head', 'body', 'legs', 'acc0', 'acc1', 'acc2'];
  const EQ_TYPE = { head: 'head', body: 'body', legs: 'legs', acc0: 'acc', acc1: 'acc', acc2: 'acc' };

  class Inventory {
    constructor() {
      this.slots = new Array(SIZE).fill(null);
      this.eq = { head: null, body: null, legs: null, acc0: null, acc1: null, acc2: null };
      this.sel = 0; this.cursor = null; this.ver = 1;
      this.chest = null;
    }
    touch() { this.ver++; }
    maxStack(id) { return ITEMS[id].stack; }
    selected() { return this.slots[this.sel]; }
    count(id) { let n = 0; for (const s of this.slots) if (s && s.id === id) n += s.n; return n; }
    has(id, n) { return this.count(id) >= (n || 1); }
    canAdd(id, n) {
      let room = 0; const m = this.maxStack(id);
      for (const s of this.slots) { if (!s) room += m; else if (s.id === id) room += m - s.n; }
      return room >= n;
    }
    // aggiunge; restituisce quanti non è riuscito a inserire
    add(id, n) {
      const m = this.maxStack(id);
      for (let pass = 0; pass < 2 && n > 0; pass++)
        for (let i = 0; i < SIZE && n > 0; i++) {
          const s = this.slots[i];
          if (pass === 0 && s && s.id === id && s.n < m) { const a = Math.min(n, m - s.n); s.n += a; n -= a; }
          else if (pass === 1 && !s) { const a = Math.min(n, m); this.slots[i] = { id, n: a }; n -= a; }
        }
      this.touch(); return n;
    }
    remove(id, n) {
      if (!this.has(id, n)) return false;
      for (let i = SIZE - 1; i >= 0 && n > 0; i--) { const s = this.slots[i]; if (s && s.id === id) { const a = Math.min(n, s.n); s.n -= a; n -= a; if (s.n <= 0) this.slots[i] = null; } }
      this.touch(); return true;
    }
    consumeSel(n) { const s = this.slots[this.sel]; if (!s) return; s.n -= n || 1; if (s.n <= 0) this.slots[this.sel] = null; this.touch(); }
    // ---- riferimenti a slot ----
    get(ref) {
      if (ref.t === 'inv') return this.slots[ref.i];
      if (ref.t === 'eq') return this.eq[ref.k];
      if (ref.t === 'chest') return this.chest ? this.chest.slots[ref.i] : null;
    }
    set(ref, v) {
      if (ref.t === 'inv') this.slots[ref.i] = v;
      else if (ref.t === 'eq') this.eq[ref.k] = v;
      else if (ref.t === 'chest' && this.chest) this.chest.slots[ref.i] = v;
      this.touch();
    }
    accepts(ref, stack) {
      if (!stack) return true;
      if (ref.t === 'eq') return ITEMS[stack.id].type === EQ_TYPE[ref.k];
      return true;
    }
    // click sinistro (0) / destro (2) in stile Terraria
    click(ref, button) {
      const slot = this.get(ref), cur = this.cursor;
      if (cur && !this.accepts(ref, cur)) return;
      if (button === 0) {
        if (!cur) { if (slot) { this.cursor = slot; this.set(ref, null); } }
        else if (!slot) { this.set(ref, cur); this.cursor = null; }
        else if (slot.id === cur.id) { const m = this.maxStack(slot.id), a = Math.min(cur.n, m - slot.n); slot.n += a; cur.n -= a; if (cur.n <= 0) this.cursor = null; this.touch(); }
        else { this.set(ref, cur); this.cursor = slot; }
      } else {
        if (!cur) { if (slot) { const half = Math.ceil(slot.n / 2); this.cursor = { id: slot.id, n: half }; slot.n -= half; if (slot.n <= 0) this.set(ref, null); this.touch(); } }
        else if (!slot) { this.set(ref, { id: cur.id, n: 1 }); cur.n--; if (cur.n <= 0) this.cursor = null; }
        else if (slot.id === cur.id && slot.n < this.maxStack(slot.id)) { slot.n++; cur.n--; if (cur.n <= 0) this.cursor = null; this.touch(); }
      }
    }
    // sposta rapidamente (shift+click)
    quickMove(ref) {
      const s = this.get(ref); if (!s) return;
      const it = ITEMS[s.id];
      const toInv = (from, lo, hi) => { // sposta verso un intervallo dell'inventario
        let n = s.n; const m = this.maxStack(s.id);
        for (let pass = 0; pass < 2 && n > 0; pass++) for (let i = lo; i < hi && n > 0; i++) {
          const d = this.slots[i];
          if (pass === 0 && d && d.id === s.id && d.n < m) { const a = Math.min(n, m - d.n); d.n += a; n -= a; }
          else if (pass === 1 && !d) { const a = Math.min(n, m); this.slots[i] = { id: s.id, n: a }; n -= a; }
        }
        return n;
      };
      let left = s.n;
      if (ref.t === 'eq') left = toInv(ref, 0, SIZE);
      else if (this.chest && ref.t === 'inv') { // inventario -> scrigno
        const cs = this.chest.slots, m = this.maxStack(s.id); let n = s.n;
        for (let pass = 0; pass < 2 && n > 0; pass++) for (let i = 0; i < cs.length && n > 0; i++) {
          const d = cs[i];
          if (pass === 0 && d && d.id === s.id && d.n < m) { const a = Math.min(n, m - d.n); d.n += a; n -= a; }
          else if (pass === 1 && !d) { const a = Math.min(n, m); cs[i] = { id: s.id, n: a }; n -= a; }
        }
        left = n;
      } else if (ref.t === 'chest') left = toInv(ref, 0, SIZE);
      else if (['head', 'body', 'legs'].includes(it.type) && !this.eq[it.type]) { this.eq[it.type] = s; this.set(ref, null); this.touch(); return; }
      else if (it.type === 'acc') { const k = ['acc0', 'acc1', 'acc2'].find((k) => !this.eq[k]); if (k) { this.eq[k] = s; this.set(ref, null); this.touch(); return; } left = s.n; }
      else left = ref.i < HOT ? toInv(ref, HOT, SIZE) : toInv(ref, 0, HOT);
      if (left <= 0) this.set(ref, null); else s.n = left;
      this.touch();
    }
    sort() {
      const rest = this.slots.slice(HOT).filter(Boolean);
      const merged = [];
      for (const s of rest) { const m = merged.find((d) => d.id === s.id && d.n < this.maxStack(s.id)); if (m) { const a = Math.min(s.n, this.maxStack(s.id) - m.n); m.n += a; if (s.n - a > 0) merged.push({ id: s.id, n: s.n - a }); } else merged.push({ id: s.id, n: s.n }); }
      const order = ['pick', 'axe', 'hammer', 'tool', 'hook', 'sword', 'bow', 'staff', 'thrown', 'ammo', 'head', 'body', 'legs', 'acc', 'potion', 'food', 'perm', 'summon', 'block', 'wall', 'mat'];
      merged.sort((a, b) => order.indexOf(ITEMS[a.id].type) - order.indexOf(ITEMS[b.id].type) || ITEMS[a.id].name.localeCompare(ITEMS[b.id].name));
      for (let i = HOT; i < SIZE; i++) this.slots[i] = merged[i - HOT] || null;
      this.touch();
    }
    toJSON() { return { slots: this.slots, eq: this.eq, sel: this.sel }; }
    fromJSON(o) { this.slots = o.slots.map((s) => (s && ITEMS[s.id] ? s : null)); while (this.slots.length < SIZE) this.slots.push(null); for (const k of EQ_KEYS) this.eq[k] = o.eq[k] && ITEMS[o.eq[k].id] ? o.eq[k] : null; this.sel = o.sel || 0; this.touch(); }
  }
  TF.Inventory = Inventory; TF.INV_SIZE = SIZE; TF.HOTBAR = HOT; TF.EQ_KEYS = EQ_KEYS;
})(window.TF);
