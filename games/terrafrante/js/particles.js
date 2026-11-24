'use strict';
// Terrafrante - particelle ed effetti ambientali
(function (TF) {
  const MAX = 700;
  class Particles {
    constructor() { this.list = []; }
    clear() { this.list.length = 0; }
    add(p) { if (!TF.settings.particles) return; if (this.list.length >= MAX) this.list.shift(); this.list.push(p); }
    burst(x, y, col, n, sp) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, s = Math.random() * sp; this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.5, life: 20 + Math.random() * 18, max: 38, col, size: 1 + (Math.random() * 2 | 0), grav: 0.08 }); } }
    spark(x, y, col) { this.add({ x, y, vx: (Math.random() - 0.5) * 0.6, vy: -0.3 - Math.random() * 0.5, life: 16 + Math.random() * 10, max: 26, col, size: 1, grav: -0.01 }); }
    chip(x, y, col) { for (let i = 0; i < 3; i++) this.add({ x: x + (Math.random() - 0.5) * 8, y: y + (Math.random() - 0.5) * 8, vx: (Math.random() - 0.5) * 2.2, vy: -1 - Math.random() * 1.6, life: 24 + Math.random() * 10, max: 34, col, size: 2, grav: 0.2 }); }
    explosion(x, y, r) { for (let i = 0; i < 20 + r; i++) { const a = Math.random() * 6.283, s = Math.random() * r * 0.18 + 0.5; this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 16 + Math.random() * 14, max: 30, col: ['#ffd070', '#ff9a3c', '#ff5a1e', '#5a5a5a'][i & 3], size: 2 + (Math.random() * 3 | 0), grav: -0.02 }); } }
    update() { const l = this.list; for (let i = l.length - 1; i >= 0; i--) { const p = l[i]; p.x += p.vx; p.y += p.vy; p.vy += p.grav; p.vx *= p.drag || 0.98; if (p.sway) p.x += Math.sin(p.life * 0.15 + p.sway) * 0.3; if (--p.life <= 0) l.splice(i, 1); } }
    // effetti ambientali per bioma, nell'area visibile
    ambient(G) {
      if (!TF.settings.particles || this.list.length > MAX - 80) return;
      const cam = G.camera, w = G.world, tx = Math.floor((cam.x + cam.viewW / 2) / TF.TS), ty = Math.floor((cam.y + cam.viewH / 2) / TF.TS);
      const bz = w.biomeAt(tx, ty), under = bz.under || bz.id >= 8, night = G.clock.night;
      const rx = cam.x + Math.random() * cam.viewW, ry = cam.y + Math.random() * cam.viewH;
      if (!under) {
        if (bz.key === 'snow' && Math.random() < 0.5) this.add({ x: rx, y: cam.y - 2, vx: -0.3, vy: 0.5 + Math.random() * 0.5, life: 400, max: 400, col: '#ffffff', size: 1, grav: 0, sway: Math.random() * 6 });
        else if (bz.key === 'desert' && Math.random() < 0.15) this.add({ x: cam.x - 2, y: ry, vx: 1.6 + Math.random(), vy: 0.05, life: 300, max: 300, col: '#e8d08a', size: 1, grav: 0, drag: 1 });
        else if (bz.key === 'forest' && !night && Math.random() < 0.05) this.add({ x: rx, y: cam.y - 2, vx: -0.4, vy: 0.4, life: 300, max: 300, col: '#78d257', size: 2, grav: 0, sway: Math.random() * 6 });
        else if (night && (bz.key === 'forest' || bz.key === 'jungle' || bz.key === 'swamp') && Math.random() < 0.08) this.add({ x: rx, y: ry, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, life: 120, max: 120, col: '#e8ff7a', size: 1, grav: 0, sway: Math.random() * 6, glow: true });
        else if (bz.key === 'jungle' && Math.random() < 0.08) this.add({ x: rx, y: ry, vx: 0, vy: -0.2, life: 150, max: 150, col: '#b6f060', size: 1, grav: 0, sway: Math.random() * 6 });
        else if (bz.key === 'swamp' && Math.random() < 0.08) this.add({ x: rx, y: ry, vx: 0, vy: -0.15, life: 160, max: 160, col: '#9bb35a', size: 1, grav: 0, sway: Math.random() * 6 });
        else if (bz.key === 'corrupt' && Math.random() < 0.2) this.add({ x: rx, y: cam.y + cam.viewH + 2, vx: 0, vy: -0.6, life: 260, max: 260, col: '#b574d8', size: 1, grav: 0, sway: Math.random() * 6 });
      } else {
        if (bz.id === 9 && Math.random() < 0.3) this.add({ x: rx, y: ry, vx: 0, vy: -0.3, life: 120, max: 120, col: '#ff7a3c', size: 1, grav: 0, sway: Math.random() * 6 });
        else if (Math.random() < 0.05) this.add({ x: rx, y: ry, vx: 0, vy: -0.05, life: 160, max: 160, col: '#b8b8d0', size: 1, grav: 0, sway: Math.random() * 6 });
      }
    }
    draw(g, ox, oy) {
      for (const p of this.list) {
        const a = Math.min(1, p.life / (p.max * 0.5)); g.globalAlpha = a; g.fillStyle = p.col;
        g.fillRect(Math.round(p.x - ox), Math.round(p.y - oy), p.size, p.size);
      }
      g.globalAlpha = 1;
    }
  }
  TF.Particles = Particles;
})(window.TF);
