'use strict';
// Terrafrante - utilità condivise: namespace, RNG, rumore, funzioni matematiche
window.TF = window.TF || {};
(function (TF) {
  TF.TS = 16; // dimensione tile in pixel
  TF.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  TF.lerp = (a, b, t) => a + (b - a) * t;
  TF.rnd = (a, b) => a + Math.random() * (b - a);
  TF.rndi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  TF.pick = (arr) => arr[(Math.random() * arr.length) | 0];
  TF.dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  TF.smooth = (t) => t * t * (3 - 2 * t);

  TF.mulberry = function (seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  TF.hash = (x, y, s) => {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  TF.seedFrom = (str) => {
    if (/^-?\d+$/.test(str)) return parseInt(str, 10) >>> 0;
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };

  const GR = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
  class Noise {
    constructor(seed) {
      const rng = TF.mulberry(seed);
      const p = new Uint8Array(256);
      for (let i = 0; i < 256; i++) p[i] = i;
      for (let i = 255; i > 0; i--) { const j = (rng() * (i + 1)) | 0; const t = p[i]; p[i] = p[j]; p[j] = t; }
      this.p = new Uint8Array(512);
      for (let i = 0; i < 512; i++) this.p[i] = p[i & 255];
    }
    n2(x, y) {
      const xi = Math.floor(x), yi = Math.floor(y);
      const xf = x - xi, yf = y - yi;
      const p = this.p, X = xi & 255, Y = yi & 255;
      const g00 = GR[p[p[X] + Y] & 7], g10 = GR[p[p[X + 1] + Y] & 7];
      const g01 = GR[p[p[X] + Y + 1] & 7], g11 = GR[p[p[X + 1] + Y + 1] & 7];
      const d00 = g00[0] * xf + g00[1] * yf, d10 = g10[0] * (xf - 1) + g10[1] * yf;
      const d01 = g01[0] * xf + g01[1] * (yf - 1), d11 = g11[0] * (xf - 1) + g11[1] * (yf - 1);
      const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10), v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
      return (d00 + u * (d10 - d00)) + v * ((d01 + u * (d11 - d01)) - (d00 + u * (d10 - d00)));
    }
    n1(x) { return this.n2(x, 0.37); }
    fbm(x, y, oct, lac, gain) {
      let a = 1, f = 1, s = 0, n = 0;
      for (let i = 0; i < oct; i++) { s += this.n2(x * f, y * f) * a; n += a; a *= gain || 0.5; f *= lac || 2; }
      return s / n;
    }
  }
  TF.Noise = Noise;

  // Orario: 0..24 ore
  TF.fmtTime = (h) => {
    const hh = Math.floor(h) % 24, mm = Math.floor((h - Math.floor(h)) * 60);
    return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  };
  TF.rectsOverlap = (ax, ay, aw, ah, bx, by, bw, bh) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
})(window.TF);
