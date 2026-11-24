'use strict';
// Terrafrante - interfaccia (DOM in stile pixel art): HUD, inventario, crafting, menu
(function (TF) {
  const ITEMS = TF.ITEMS, S = () => TF.Sprites;
  const $ = (s, r) => (r || document).querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
  const RAR = ['#ffffff', '#6ab8ff', '#6af08a', '#ffb84a', '#d98aff'];
  const TYPE_NAME = { block: 'Blocco', wall: 'Parete', pick: 'Piccone', axe: 'Ascia', hammer: 'Martello', sword: 'Arma da mischia', bow: 'Arma a distanza', staff: 'Arma magica', ammo: 'Munizioni', head: 'Elmo', body: 'Corazza', legs: 'Schinieri', acc: 'Accessorio', potion: 'Consumabile', perm: 'Potenziamento permanente', summon: 'Evocazione boss', mat: 'Materiale' , thrown: 'Arma da lancio', food: 'Cibo', tool: 'Strumento', hook: 'Rampino'};
  const BUFF_NAME = new Proxy({}, { get: (o, k) => (TF.BUFFS[k] ? TF.BUFFS[k].name : k) });

  class UI {
    constructor() { this.invOpen = false; this.chest = null; this.menu = 'main'; this.overlay = null; this.sel = null; this.lastVer = -1; this.craftKey = ''; this.cat = 'Tutto'; this.onlyOk = false; this.pick = {}; this.labelT = 0; this.dragFrom = null; this.recipeSel = null; this.holdCraft = 0; this.deathT = 0; }
    get blocking() { return this.invOpen || !!this.overlay || this.G.state !== 'play'; }

    init(G) {
      this.G = G;
      const root = $('#ui');
      root.innerHTML = `
      <div id="hud" class="hidden">
        <div id="vitals"><div class="bar hp"><div class="fill"></div><span></span></div><div class="bar mp"><div class="fill"></div><span></span></div><div class="bar air hidden"><div class="fill"></div><span>RESPIRO</span></div><div id="buffs"></div></div>
        <div id="info"><div id="clock"></div><div id="biome"></div><div id="depth"></div><div id="fps"></div></div>
        <div id="bossbar" class="hidden"><div class="bname"></div><div class="bar boss"><div class="fill"></div><span></span></div></div>
        <div id="hotbar"></div><div id="itemlabel"></div><div id="toasts"></div><div id="pickups"></div>
      </div>
      <div id="invpanel" class="panel hidden"></div>
      <div id="tooltip" class="hidden"></div><div id="cursoritem" class="hidden"></div>
      <div id="overlay" class="screen hidden"></div>`;
      this.hud = $('#hud'); this.hotbar = $('#hotbar'); this.panel = $('#invpanel'); this.tip = $('#tooltip'); this.curEl = $('#cursoritem'); this.ov = $('#overlay');
      document.addEventListener('mousemove', (e) => this.onMove(e));
      document.addEventListener('mouseup', (e) => this.onUp(e));
      document.addEventListener('mousedown', (e) => { if (this.invOpen && G.inv.cursor && !e.target.closest('.panel') && e.target.id === 'game') this.dropCursor(); });
      this.buildHotbar();
    }
    // ----------- slot helpers -----------
    slotEl(ref, cls) {
      const d = el('div', 'slot ' + (cls || '')); d.dataset.t = ref.t; if (ref.i !== undefined) d.dataset.i = ref.i; if (ref.k) d.dataset.k = ref.k;
      d.ref = ref; this.fillSlot(d, this.G.inv.get(ref)); return d;
    }
    fillSlot(d, s) {
      d.innerHTML = ''; d.classList.toggle('empty', !s);
      if (d.dataset.k && !s) { const lab = { head: 'ELMO', body: 'CORAZZA', legs: 'GAMBE', acc0: 'ACC', acc1: 'ACC', acc2: 'ACC' }[d.dataset.k]; d.appendChild(el('span', 'ph', lab)); }
      if (!s) return; const img = el('img'); img.src = S().iconURL(s.id); d.appendChild(img);
      if (s.n > 1) d.appendChild(el('span', 'cnt', s.n));
    }
    buildHotbar() {
      const inv = this.G.inv; this.hotbar.innerHTML = '';
      for (let i = 0; i < 10; i++) {
        const d = this.slotEl({ t: 'inv', i }, 'hot'); d.appendChild(el('span', 'key', (i + 1) % 10)); if (i === inv.sel) d.classList.add('sel');
        d.addEventListener('mousedown', (ev) => { if (!this.invOpen) { ev.stopPropagation(); this.G.selectSlot(i); } });
        d.addEventListener('mouseenter', () => this.showTip(d)); d.addEventListener('mouseleave', () => this.hideTip());
        this.hotbar.appendChild(d);
      }
    }
    // ----------- HUD per frame -----------
    update() {
      const G = this.G, p = G.player, inv = G.inv;
      if (inv.ver !== this.lastVer) { this.lastVer = inv.ver; this.buildHotbar(); if (this.invOpen) this.renderPanel(); this.updateCursor(); }
      if (this.labelT > 0) { this.labelT--; if (this.labelT === 0) $('#itemlabel').style.opacity = 0; }
      if (!G.world) return;
      const hp = $('.bar.hp'), mp = $('.bar.mp');
      hp.firstChild.style.width = (100 * Math.max(0, p.hp) / p.maxhp) + '%'; hp.lastChild.textContent = 'VITA ' + Math.ceil(Math.max(0, p.hp)) + '/' + p.maxhp;
      mp.firstChild.style.width = (100 * p.mana / p.maxmana) + '%'; mp.lastChild.textContent = 'MANA ' + Math.floor(p.mana) + '/' + p.maxmana;
      const air = $('.bar.air'); air.classList.toggle('hidden', p.breath >= 600); air.firstChild.style.width = (p.breath / 6) + '%';
      const bf = []; for (const k in p.buffs) if (p.buffs[k] > 0) bf.push(`<span class="buff ${k}" title="${TF.BUFFS[k] && TF.BUFFS[k].desc || ''}">${BUFF_NAME[k]} ${Math.ceil(p.buffs[k] / 60)}s</span>`);
      for (const k in p.auras) if (TF.AURAS[k]) bf.push(`<span class="buff aura" title="${TF.AURAS[k].desc}">${TF.AURAS[k].name}</span>`);
      { const fi = []; if (p.fx.compass) fi.push('X ' + Math.floor(p.cx / TF.TS)); if (p.fx.radar) fi.push('Nemici vicini ' + G.enemies.filter((e) => !e.dead && Math.hypot(e.x - p.x, e.y - p.y) < 30 * TF.TS).length); if (p.fx.tally) fi.push('Uccisioni ' + p.stats.kills); if (fi.length) bf.push(`<span class="buff info">${fi.join(' · ')}</span>`); }
      const bh = bf.join(''); if (bh !== this.buffHtml) { this.buffHtml = bh; $('#buffs').innerHTML = bh; }
      const c = G.clock; $('#clock').textContent = (c.night ? '☾ ' : '☀ ') + 'Giorno ' + c.day + ' · ' + TF.fmtTime(c.h);
      const bz = G.world.biomeAt(p.cx / TF.TS | 0, p.cy / TF.TS | 0); $('#biome').textContent = bz.name;
      const ty = Math.floor(p.cy / TF.TS), d = ty - 200; $('#depth').textContent = d < 0 ? 'Quota ' + (-d) + ' m' : 'Profondità ' + d + ' m';
      const f = $('#fps'); f.style.display = TF.settings.fps ? 'block' : 'none'; if (TF.settings.fps) f.textContent = G.fps + ' FPS';
      const boss = G.enemies.find((e) => e.boss && !e.dead);
      const bb = $('#bossbar'); bb.classList.toggle('hidden', !boss); if (boss) { $('.bname', bb).textContent = boss.name; $('.bar.boss .fill', bb).style.width = (100 * boss.hp / boss.maxhp) + '%'; $('.bar.boss span', bb).textContent = Math.ceil(boss.hp) + '/' + boss.maxhp; }
      if (this.invOpen && this.recipeSel && this.holdCraft > 0) { if (++this.holdCraft > 25 && this.holdCraft % 5 === 0) this.doCraft(); }
      if (this.invOpen && G.tick % 20 === 0) this.refreshCraft();
      if (this.overlay === 'death') { this.deathT++; const b = $('#respawnBtn'); if (b) { const left = Math.max(0, 4 - Math.floor(this.deathT / 60)); b.disabled = left > 0; b.textContent = left > 0 ? 'Rinascita tra ' + left + '…' : 'Rinasci'; } }
    }
    toast(msg, kind) {
      const t = $('#toasts'), d = el('div', 'toast ' + (kind || ''), msg); t.appendChild(d);
      while (t.children.length > 4) t.removeChild(t.firstChild);
      setTimeout(() => d.classList.add('fade'), kind === 'boss' ? 4500 : 2200); setTimeout(() => d.remove(), kind === 'boss' ? 5200 : 2900);
    }
    pickup(id, n) {
      const box = $('#pickups'); let p = this.pick[id];
      if (p && p.el.isConnected) { p.n += n; p.el.lastChild.textContent = '+' + p.n + ' ' + ITEMS[id].name; clearTimeout(p.to); }
      else { const d = el('div', 'pk'); d.innerHTML = `<img src="${S().iconURL(id)}"><span>+${n} ${ITEMS[id].name}</span>`; box.appendChild(d); p = this.pick[id] = { n, el: d }; while (box.children.length > 6) box.removeChild(box.firstChild); }
      p.to = setTimeout(() => { p.el.remove(); delete this.pick[id]; }, 2200);
    }
    itemLabel(s) { const l = $('#itemlabel'); if (!s) { l.style.opacity = 0; return; } const it = ITEMS[s.id]; l.textContent = it.name; l.style.color = RAR[it.rar || 0]; l.style.opacity = 1; this.labelT = 120; }

    // ----------- tooltip -----------
    itemInfo(s) {
      const it = ITEMS[s.id], L = [];
      L.push(`<b style="color:${RAR[it.rar || 0]}">${it.name}</b>`, `<i>${TYPE_NAME[it.type] || ''}</i>`);
      if (it.dmg && it.type !== 'ammo' && !['pick', 'axe', 'hammer'].includes(it.type)) L.push(`Danno ${it.dmg}`);
      if (it.spd && ['sword', 'bow', 'staff', 'thrown'].includes(it.type)) L.push(`Velocità ${(60 / it.spd).toFixed(1)}/s`);
      if (it.mana && it.type === 'staff') L.push(`Mana ${it.mana}`);
      if (it.power) L.push(`Potenza ${it.power}`);
      if (it.def) L.push(`Difesa ${it.def}`);
      if (it.type === 'ammo') L.push(`Danno +${it.dmg}`);
      if (it.type === 'ammo' && it.af) L.push(`Per: ${TF.AMMO_NAME[it.af]}`);
      if (it.type === 'bow') L.push(`Usa: ${TF.AMMO_NAME[it.af || 'arrow']}`);
      if (it.setBonus || it.setFx) L.push(`Set completo: ${it.setBonus ? '+' + it.setBonus + ' difesa' : ''}${it.setFx ? ' ' + TF.describeFx(it.setFx).join(', ') : ''}`);
      const fxl = it.fx ? TF.describeFx(it.fx) : [];
      for (const l of fxl) L.push(`<span style="color:#9be8ff">${l}</span>`);
      if (it.buff || it.buffs) for (const [k, sec] of (it.buffs || [it.buff])) L.push(`<span style="color:#9be8ff">${TF.BUFFS[k].name} ${sec >= 60 ? Math.round(sec / 60) + ' min' : sec + ' s'}: ${TF.BUFFS[k].desc}</span>`);
      if (it.heal) L.push(`Vita +${it.heal}`);
      if (it.mana && it.type !== 'staff') L.push(`Mana +${it.mana}`);
      if (it.desc) {
        const dl = it.desc.toLowerCase(), dup = (it.type === 'bow' && /^usa /.test(dl)) || (fxl.length && /\d+\s*%/.test(dl)) || fxl.some((l) => { const x = l.toLowerCase(); return x.includes(dl) || dl.includes(x); });
        if (!dup) L.push(`<span class="d">${it.desc}</span>`);
      }
      if (it.type === 'block' && TF.TILES[it.tile].min) L.push(`Richiede potenza ${TF.TILES[it.tile].min}`);
      return L.join('<br>');
    }
    showTip(d) { const s = this.G.inv.get(d.ref); if (!s || this.G.inv.cursor) { this.hideTip(); return; } this.tip.innerHTML = this.itemInfo(s); this.tip.classList.remove('hidden'); this.moveTip(this.lastMouse); }
    hideTip() { this.tip.classList.add('hidden'); }
    moveTip(e) { if (!e) return; const w = this.tip.offsetWidth, h = this.tip.offsetHeight; let x = e.clientX + 16, y = e.clientY + 16; if (x + w > innerWidth - 4) x = e.clientX - w - 12; if (y + h > innerHeight - 4) y = innerHeight - h - 4; this.tip.style.left = x + 'px'; this.tip.style.top = y + 'px'; }
    onMove(e) { this.lastMouse = e; if (!this.tip.classList.contains('hidden')) this.moveTip(e); if (!this.curEl.classList.contains('hidden')) { this.curEl.style.left = e.clientX - 16 + 'px'; this.curEl.style.top = e.clientY - 16 + 'px'; } }
    updateCursor() { const c = this.G.inv.cursor; if (!c) { this.curEl.classList.add('hidden'); return; } this.curEl.innerHTML = `<img src="${S().iconURL(c.id)}">` + (c.n > 1 ? `<span class="cnt">${c.n}</span>` : ''); this.curEl.classList.remove('hidden'); if (this.lastMouse) this.onMove(this.lastMouse); }
    dropCursor() { const G = this.G, c = G.inv.cursor; if (!c) return; const p = G.player; TF.Combat.drop(G, c.id, c.n, p.cx + p.facing * 14, p.y + 4, p.facing * 3, -2); const d = TF.Combat.drops[TF.Combat.drops.length - 1]; if (d) d.delay = 70; G.inv.cursor = null; G.inv.touch(); }

    // ----------- pannello inventario / crafting / scrigno -----------
    openInventory() { if (this.G.state !== 'play' || this.overlay) return; this.invOpen = true; this.hotbar.classList.add('hidden'); this.renderPanel(); this.panel.classList.remove('hidden'); this.G.audio.play('ui'); }
    openChest(ch) { this.chest = ch; this.G.inv.chest = ch; this.openInventory(); }
    closeInventory() {
      const G = this.G; if (!this.invOpen) return;
      if (G.inv.cursor) { const c = G.inv.cursor, left = G.inv.add(c.id, c.n); G.inv.cursor = null; if (left > 0) { G.inv.cursor = { id: c.id, n: left }; this.dropCursor(); } }
      this.invOpen = false; this.chest = null; G.inv.chest = null; this.panel.classList.add('hidden'); this.hotbar.classList.remove('hidden'); this.hideTip(); this.updateCursor(); G.audio.play('ui');
    }
    renderPanel() {
      const G = this.G, inv = G.inv, p = this.panel; p.innerHTML = '';
      const left = el('div', 'col'), right = el('div', 'col craft');
      if (this.chest) {
        const cb = el('div', 'box'); cb.appendChild(el('h3', '', 'Scrigno'));
        const grid = el('div', 'grid c5'); for (let i = 0; i < 20; i++) grid.appendChild(this.bindSlot(this.slotEl({ t: 'chest', i })));
        cb.appendChild(grid); const tb = el('button', 'btn small', 'Prendi tutto'); tb.onclick = () => { for (let i = 0; i < 20; i++) inv.quickMove({ t: 'chest', i }); G.audio.play('pick'); }; cb.appendChild(tb); left.appendChild(cb);
      }
      const ib = el('div', 'box'); ib.appendChild(el('h3', '', 'Inventario'));
      const grid = el('div', 'grid c10'); for (let i = 0; i < 40; i++) grid.appendChild(this.bindSlot(this.slotEl({ t: 'inv', i }, i < 10 ? 'hot' : '')));
      ib.appendChild(grid);
      const row = el('div', 'row'); const sb = el('button', 'btn small', 'Ordina'); sb.onclick = () => { inv.sort(); G.audio.play('ui'); }; row.appendChild(sb);
      const trash = el('div', 'slot trash', '<span class="ph">CESTINO</span>'); trash.ref = { t: 'trash' }; trash.addEventListener('mousedown', (e) => { e.preventDefault(); if (inv.cursor) { inv.cursor = null; inv.touch(); G.audio.play('break'); } }); row.appendChild(trash); ib.appendChild(row);
      left.appendChild(ib);
      const eb = el('div', 'box eq'); eb.appendChild(el('h3', '', 'Equipaggiamento'));
      const eg = el('div', 'grid c6'); for (const k of TF.EQ_KEYS) eg.appendChild(this.bindSlot(this.slotEl({ t: 'eq', k })));
      eb.appendChild(eg); eb.appendChild(el('div', 'stats', `Difesa <b>${p2(this.G.player.totalDef())}</b> · Vita <b>${this.G.player.maxhp}</b> · Mana <b>${this.G.player.maxmana}</b>`)); left.appendChild(eb);
      p.appendChild(left);
      // crafting
      right.appendChild(el('h3', '', 'Crafting'));
      const tabs = el('div', 'tabs'); for (const c of TF.RECIPE_CATS) { const t = el('button', 'tab' + (c === this.cat ? ' on' : ''), c); t.onclick = () => { this.cat = c; this.renderPanel(); }; tabs.appendChild(t); }
      right.appendChild(tabs);
      const chk = el('label', 'chk', `<input type="checkbox" ${this.onlyOk ? 'checked' : ''}> Solo creabili`); chk.firstChild.onchange = (e) => { this.onlyOk = e.target.checked; this.renderPanel(); }; right.appendChild(chk);
      const sq = el('input', 'rsearch'); sq.type = 'text'; sq.placeholder = 'Cerca un oggetto…'; sq.value = this.q || ''; sq.maxLength = 30; sq.autocomplete = 'off';
      sq.oninput = () => { this.q = sq.value; this.craftKey = ''; this.refreshCraft(true); };
      sq.onkeydown = (e) => { if (e.key === 'Escape') { sq.blur(); this.closeInventory(); } e.stopPropagation(); };
      right.appendChild(sq);
      this.listEl = el('div', 'rlist'); this.detEl = el('div', 'rdetail'); right.appendChild(this.listEl); right.appendChild(this.detEl);
      p.appendChild(right); this.craftKey = ''; this.refreshCraft(true);
    }
    bindSlot(d) {
      const G = this.G, inv = G.inv;
      d.addEventListener('mouseenter', () => this.showTip(d)); d.addEventListener('mouseleave', () => this.hideTip());
      d.addEventListener('mousedown', (e) => {
        e.preventDefault(); this.hideTip();
        if (e.shiftKey && e.button === 0) { inv.quickMove(d.ref); G.audio.play('ui'); return; }
        const had = !!inv.cursor; inv.click(d.ref, e.button === 2 ? 2 : 0); G.audio.play('ui');
        this.dragFrom = (!had && inv.cursor && e.button === 0) ? { ref: d.ref, t: performance.now() } : null; this.updateCursor();
      });
      d.addEventListener('contextmenu', (e) => e.preventDefault());
      return d;
    }
    onUp(e) {
      if (!this.invOpen || !this.dragFrom) return; const inv = this.G.inv, d = e.target.closest && e.target.closest('.slot');
      if (d && d.ref && inv.cursor && (d.ref.t !== this.dragFrom.ref.t || d.ref.i !== this.dragFrom.ref.i || d.ref.k !== this.dragFrom.ref.k) && d.ref.t !== 'trash') { inv.click(d.ref, 0); this.updateCursor(); }
      this.dragFrom = null;
    }
    // ----------- crafting -----------
    refreshCraft(force) {
      const G = this.G, st = TF.Crafting.stations(G.world, G.player.cx, G.player.cy), key = G.inv.ver + '|' + this.cat + '|' + this.onlyOk + '|' + (this.q || '') + '|' + Object.keys(st).map((k) => (st[k] ? 1 : 0)).join('');
      if (!force && key === this.craftKey) return; this.craftKey = key; this.st = st;
      const qn = (this.q || '').trim().toLowerCase(), list = TF.Crafting.list(G.inv, st, qn ? 'Tutto' : this.cat).filter((r) => (!this.onlyOk || r.ok) && (!qn || ITEMS[r.r.out].name.toLowerCase().includes(qn)));
      this.listEl.innerHTML = '';
      for (const { r, ok, station } of list) {
        const d = el('div', 'recipe' + (ok ? ' ok' : '') + (!station ? ' nost' : '') + (this.recipeSel === r ? ' sel' : ''));
        d.innerHTML = `<img src="${S().iconURL(r.out)}"><span>${ITEMS[r.out].name}${r.n > 1 ? ' ×' + r.n : ''}</span>`;
        d.onclick = () => { this.recipeSel = r; this.craftKey = ''; this.refreshCraft(true); };
        d.onmouseenter = () => { this.tip.innerHTML = this.itemInfo({ id: r.out }); this.tip.classList.remove('hidden'); this.moveTip(this.lastMouse); }; d.onmouseleave = () => this.hideTip();
        this.listEl.appendChild(d);
      }
      if (!list.length) this.listEl.appendChild(el('div', 'empty', 'Nessuna ricetta disponibile'));
      this.renderDetail(st);
    }
    renderDetail(st) {
      const r = this.recipeSel, inv = this.G.inv, d = this.detEl; d.innerHTML = ''; if (!r) { d.innerHTML = '<div class="empty">Seleziona una ricetta</div>'; return; }
      d.appendChild(el('div', 'rt', `<img src="${S().iconURL(r.out)}"> <b>${ITEMS[r.out].name}</b> ×${r.n}`));
      for (const k in r.ing) { const have = inv.count(k); d.appendChild(el('div', 'ing' + (have >= r.ing[k] ? ' has' : ' no'), `<img src="${S().iconURL(k)}"> ${ITEMS[k].name} <b>${have}/${r.ing[k]}</b>`)); }
      if (r.st) d.appendChild(el('div', 'ing' + (st[r.st] ? ' has' : ' no'), `Stazione: ${TF.Crafting.stationName[r.st]} ${st[r.st] ? '✓' : '(avvicinati)'}`));
      const ok = TF.Crafting.canCraft(inv, r, st), b = el('button', 'btn', 'Crea'); b.disabled = !ok;
      b.onmousedown = (e) => { if (e.button === 0 && ok) { this.doCraft(); this.holdCraft = 1; } }; b.onmouseup = b.onmouseleave = () => { this.holdCraft = 0; };
      d.appendChild(b);
    }
    doCraft() {
      const G = this.G, r = this.recipeSel; if (!r) return; const res = TF.Crafting.craft(G.inv, r, TF.Crafting.stations(G.world, G.player.cx, G.player.cy));
      if (res === false) { this.holdCraft = 0; return; }
      if (res !== true) TF.Combat.drop(G, r.out, res, G.player.cx, G.player.y);
      G.audio.play('place'); this.craftKey = ''; this.refreshCraft(true); this.G.particles.burst(G.player.cx, G.player.cy, '#ffd84a', 6, 1.2);
    }

    // ----------- schermate -----------
    show(name, html, bind) {
      this.overlay = name; this.ov.className = 'screen' + (name === 'main' ? ' main' : ''); this.ov.innerHTML = html; this.hud.classList.add('hidden'); this.hotbar.classList.add('hidden');
      if (bind) bind(this.ov); this.G.audio.play('ui');
    }
    hideOverlay() { this.overlay = null; this.ov.className = 'screen hidden'; this.ov.innerHTML = ''; if (this.G.state === 'play') { this.hud.classList.remove('hidden'); if (!this.invOpen) this.hotbar.classList.remove('hidden'); } }
    mainMenu() {
      const G = this.G; this.invOpen = false; this.panel.classList.add('hidden');
      TF.Save.info().then((info) => {
        this.show('main', `<div class="logo">TERRAFRANTE</div><div class="sub">Scava. Costruisci. Sopravvivi.</div><div class="menu">
          <button class="btn big" id="bCont" ${info ? '' : 'disabled'}>Continua${info ? '<small>' + info.name + ' · ' + Math.floor(info.playtime / 60) + ' min · Giorno ' + info.day + '</small>' : ''}</button>
          <button class="btn big" id="bNew">Nuova partita</button><button class="btn big" id="bSet">Impostazioni</button><button class="btn big" id="bHelp">Comandi</button>${info ? '<button class="btn small danger" id="bDel">Elimina salvataggio</button>' : ''}</div><div class="foot">Versione 1.0 · Tutti i grafici sono generati dal codice</div>`, (o) => {
          $('#bNew', o).onclick = () => this.newGameMenu(); $('#bSet', o).onclick = () => this.settings(() => this.mainMenu()); $('#bHelp', o).onclick = () => this.help(() => this.mainMenu());
          if (info) { $('#bCont', o).onclick = () => G.loadGame(); $('#bDel', o).onclick = () => { if (confirm('Eliminare definitivamente il salvataggio?')) TF.Save.remove().then(() => this.mainMenu()); }; }
        });
      });
    }
    newGameMenu() {
      this.show('new', `<div class="panel dlg"><h2>Nuova partita</h2><label>Nome del mondo<input id="wName" maxlength="24" value="Mondo di Terrafrante"></label><label>Seme (vuoto = casuale)<input id="wSeed" maxlength="20" placeholder="es. 12345 o una parola"></label>
        <label>Dimensione<select id="wSize"><option value="s">Piccolo (1800×640)</option><option value="m" selected>Medio (2400×760)</option><option value="l">Grande (3200×900)</option></select></label>
        <div class="row"><button class="btn" id="bGo">Genera il mondo</button><button class="btn" id="bBack">Indietro</button></div></div>`, (o) => {
        $('#bBack', o).onclick = () => this.mainMenu();
        $('#bGo', o).onclick = () => { const seed = $('#wSeed', o).value.trim(); this.G.newGame({ name: $('#wName', o).value.trim() || 'Mondo', seed: seed ? TF.seedFrom(seed) : (Math.random() * 4294967295) >>> 0, size: $('#wSize', o).value }); };
      });
    }
    loading(p, msg) { if (this.overlay !== 'loading') this.show('loading', `<div class="logo small">TERRAFRANTE</div><div class="menu"><div class="lmsg" id="lmsg"></div><div class="bar load"><div class="fill" id="lfill"></div></div></div>`); $('#lmsg').textContent = msg; $('#lfill').style.width = Math.round(p * 100) + '%'; }
    pause() {
      const G = this.G; this.show('pause', `<div class="panel dlg"><h2>Pausa</h2><div class="menu"><button class="btn big" id="pRes">Riprendi</button><button class="btn big" id="pSave">Salva partita</button><button class="btn big" id="pSet">Impostazioni</button><button class="btn big" id="pHelp">Comandi</button><button class="btn big" id="pMenu">Salva ed esci al menu</button></div></div>`, (o) => {
        $('#pRes', o).onclick = () => G.resume(); $('#pSave', o).onclick = () => { G.save().then((ok) => this.toast(ok ? 'Partita salvata' : 'Salvataggio non riuscito: il browser blocca la memoria locale')); };
        $('#pSet', o).onclick = () => this.settings(() => this.pause()); $('#pHelp', o).onclick = () => this.help(() => this.pause()); $('#pMenu', o).onclick = () => G.toMenu();
      });
    }
    settings(back) {
      const s = TF.settings, G = this.G;
      this.show('settings', `<div class="panel dlg"><h2>Impostazioni</h2>
        <label>Effetti sonori <input type="range" id="sSfx" min="0" max="100" value="${Math.round(s.sfx * 100)}"></label>
        <label>Musica <input type="range" id="sMus" min="0" max="100" value="${Math.round(s.music * 100)}"></label>
        <label>Zoom <select id="sZoom"><option value="0">Automatico</option><option value="2">2×</option><option value="3">3×</option><option value="4">4×</option></select></label>
        <label>Illuminazione <select id="sLight"><option value="1">Dinamica (consigliata)</option><option value="0">Semplice (più veloce)</option></select></label>
        <label class="chk"><input type="checkbox" id="sPart"> Particelle ed effetti ambientali</label>
        <label class="chk"><input type="checkbox" id="sShake"> Scossa della telecamera</label>
        <label class="chk"><input type="checkbox" id="sFps"> Mostra FPS</label>
        <div class="row"><button class="btn" id="sBack">Indietro</button></div></div>`, (o) => {
        $('#sZoom', o).value = s.zoom; $('#sLight', o).value = s.light; $('#sPart', o).checked = s.particles; $('#sShake', o).checked = s.shake; $('#sFps', o).checked = s.fps;
        const apply = () => { s.sfx = $('#sSfx', o).value / 100; s.music = $('#sMus', o).value / 100; s.zoom = +$('#sZoom', o).value; s.light = +$('#sLight', o).value; s.particles = $('#sPart', o).checked; s.shake = $('#sShake', o).checked; s.fps = $('#sFps', o).checked; TF.saveSettings(); G.audio.applyVol(); G.resize(); };
        for (const id of ['sSfx', 'sMus', 'sZoom', 'sLight', 'sPart', 'sShake', 'sFps']) $('#' + id, o).oninput = $('#' + id, o).onchange = apply;
        $('#sBack', o).onclick = back;
      });
    }
    help(back) {
      this.show('help', `<div class="panel dlg wide"><h2>Comandi</h2><div class="keys">
        <div><b>A / D</b> o <b>← →</b></div><div>Muoviti</div><div><b>SPAZIO</b> / <b>W</b></div><div>Salta · nuota · sali sulle corde</div><div><b>S</b> o <b>↓</b></div><div>Scendi dalle piattaforme / corde</div>
        <div><b>Mouse sinistro</b></div><div>Attacca con l'arma · scava con strumenti · usa consumabili</div><div><b>Mouse destro</b></div><div>Piazza blocchi · apri porte e scrigni · usa letto</div>
        <div><b>1–9, 0</b> / rotella</div><div>Seleziona la barra rapida</div><div><b>E</b></div><div>Inventario e crafting</div><div><b>ESC</b></div><div>Pausa / chiudi inventario</div>
        <div><b>Shift + click</b></div><div>Sposta velocemente un oggetto</div><div><b>F5</b></div><div>Salvataggio rapido</div><div><b>Gancio</b> (sinistro)</div><div>Lancialo su un blocco: ti tira su · SPAZIO per staccarti</div><div><b>Specchi</b> (sinistro)</div><div>Ti riportano al letto o al punto di partenza (si interrompono se vieni colpito)</div><div><b>Secchi</b> (sinistro)</div><div>Raccolgono e versano acqua/lava · lava + acqua = ossidiana</div><div><b>Salvadanaio / Cassaforte</b></div><div>Deposito portatile da 20 slot: si apre con il sinistro</div><div><b>Ricerca</b> nel crafting</div><div>Scrivi il nome di un oggetto per trovare la ricetta</div></div>
        <p class="tip">Suggerimenti: abbatti alberi per il legno, crea un Banco da Lavoro, poi Fornace e Incudine. Scava per trovare minerali e Cristalli Vitali. Di notte i nemici sono più forti: costruisci un rifugio con pareti e una porta. Evoca i boss con gli oggetti dedicati. Armi, archi, bastoni e bombe hanno effetti reali (fuoco, gelo, veleno, rimbalzo, esplosioni); armature e accessori si sommano; le pozioni durano a lungo; alcuni arredi (focolare, candelabri, lampade…) danno bonus se stai vicino.</p>
        <div class="row"><button class="btn" id="hBack">Indietro</button></div></div>`, (o) => { $('#hBack', o).onclick = back; });
    }
    showDeath(on) {
      if (!on) { if (this.overlay === 'death') this.hideOverlay(); return; }
      this.deathT = 0; this.closeInventory();
      this.show('death', `<div class="death">SEI MORTO</div><div class="menu"><button class="btn big" id="respawnBtn" disabled>Rinascita tra 4…</button></div>`, (o) => { $('#respawnBtn', o).onclick = () => { this.G.player.respawn(this.G); }; });
      this.overlay = 'death'; this.hud.classList.remove('hidden');
    }
  }
  const p2 = (n) => Math.round(n);
  TF.UI = UI;
})(window.TF);
