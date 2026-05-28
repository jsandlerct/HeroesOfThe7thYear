import { TILE, PROJECTILE_STYLES, PROJ_DEFAULT_STYLE, PROJ_HIT_DIST } from '../data/constants.js';

export class Projectile {
  constructor(attacker, target, finalDmg, scene, battleScene) {
    this.attacker    = attacker;
    this.target      = target;
    this.finalDmg    = finalDmg;
    this.battleScene = battleScene;
    this.done        = false;

    const style    = PROJECTILE_STYLES[attacker.type] ?? PROJ_DEFAULT_STYLE;
    this.speed     = style.speed;
    this.baseW     = style.w;
    this.baseH     = style.h;
    this.trebuchet = style.trebuchet;

    const dx = target.x - attacker.x;
    const dy = target.y - attacker.y;
    this.totalDist    = Math.sqrt(dx * dx + dy * dy) || 1;
    this.distTraveled = 0;

    this.vx = dx / this.totalDist;
    this.vy = dy / this.totalDist;
    this.x  = attacker.x;
    this.y  = attacker.y;

    this.rect = scene.add.rectangle(
      attacker.x * TILE, attacker.y * TILE,
      style.w, style.h, style.color
    ).setDepth(6).setRotation(Math.atan2(dy, dx));
  }

  update(dt) {
    const step = this.speed * dt;
    this.x += this.vx * step;
    this.y += this.vy * step;
    this.distTraveled += step;
    this.rect.setPosition(this.x * TILE, this.y * TILE);

    if (this.trebuchet) {
      const t     = Math.min(this.distTraveled / this.totalDist, 1);
      const scale = 1 + Math.sin(t * Math.PI);
      this.rect.setDisplaySize(this.baseW * scale, this.baseH * scale);
    }

    const dx  = this.target.x - this.x;
    const dy  = this.target.y - this.y;
    const dot = dx * this.vx + dy * this.vy;
    if (dx * dx + dy * dy < PROJ_HIT_DIST * PROJ_HIT_DIST || dot < 0) this._hit();
  }

  _hit() {
    if (this.target.isWall) {
      const justBreached = this.target.takeDamage(this.finalDmg);
      if (justBreached) this.battleScene._handleWallBreach(this.target);
      if (this.attacker.isAoe) {
        this.battleScene._applyAoeSplash(this.attacker, this.target, this.finalDmg);
      }
    } else if (!this.target.isDead) {
      this.battleScene._applyDamage(this.attacker, this.target, this.finalDmg);
      if (this.attacker.isAoe) {
        this.battleScene._applyAoeSplash(this.attacker, this.target, this.finalDmg);
      }
    }
    this.rect.destroy();
    this.done = true;
  }

  destroy() {
    this.rect.destroy();
    this.done = true;
  }
}
