'use strict';
// Terrafrante - telecamera fluida con scossa
(function (TF) {
  class Camera {
    constructor() { this.x = 0; this.y = 0; this.viewW = 640; this.viewH = 360; this.shakeV = 0; this.sx = 0; this.sy = 0; this.world = null; this.look = 0; }
    resize(w, h) { this.viewW = w; this.viewH = h; }
    clamp() {
      const W = this.world; if (!W) return;
      this.x = TF.clamp(this.x, 0, Math.max(0, W.w * TF.TS - this.viewW));
      this.y = TF.clamp(this.y, 0, Math.max(0, W.h * TF.TS - this.viewH));
    }
    snap(p) { this.look = 0; this.x = p.x + p.w / 2 - this.viewW / 2; this.y = p.y + p.h / 2 - this.viewH / 2; this.clamp(); }
    follow(p) {
      this.look += ((Math.abs(p.vx) > 0.8 ? Math.sign(p.vx) * 14 : 0) - this.look) * 0.04;
      const tx = p.x + p.w / 2 - this.viewW / 2 + this.look, ty = p.y + p.h / 2 - this.viewH / 2;
      this.x += (tx - this.x) * 0.12; this.y += (ty - this.y) * 0.12;
      this.clamp();
      if (this.shakeV > 0.05 && TF.settings.shake) { this.sx = (Math.random() - 0.5) * this.shakeV; this.sy = (Math.random() - 0.5) * this.shakeV; this.shakeV *= 0.88; } else { this.sx = this.sy = 0; this.shakeV = 0; }
    }
    shake(v) { this.shakeV = Math.max(this.shakeV, v); }
    get ox() { return Math.round(this.x + this.sx); }
    get oy() { return Math.round(this.y + this.sy); }
    toWorld(mx, my) { return [this.x + mx, this.y + my]; }
  }
  TF.Camera = Camera;
})(window.TF);
