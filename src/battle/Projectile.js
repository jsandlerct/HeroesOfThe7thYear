import { TILE, PROJECTILE_STYLES, PROJ_DEFAULT_STYLE, PROJ_HIT_DIST } from '../data/constants.js';

const PARTICLE_COUNT_NORMAL = 4;
const PARTICLE_COUNT_AOE    = 7;

export class Projectile {
  constructor(attacker, target, finalDmg, scene, battleScene) {
    this.attacker    = attacker;
    this.target      = target;
    this.finalDmg    = finalDmg;
    this.battleScene = battleScene;
    this.scene       = scene;
    this.done        = false;

    const styleKey = attacker.specialization ?? attacker.type;
    const style    = PROJECTILE_STYLES[styleKey] ?? PROJECTILE_STYLES[attacker.type] ?? PROJ_DEFAULT_STYLE;
    this.speed     = style.speed;
    this.baseW     = style.w;
    this.baseH     = style.h;
    this.trebuchet = style.trebuchet;

    const dx = target.x - attacker.x;
    const dy = target.y - attacker.y;
    this.totalDist    = Math.sqrt(dx * dx + dy * dy) || 1;
    this.distTraveled = 0;

    this.isCrit = false;  // set by caller for critical hits

    this.vx = dx / this.totalDist;
    this.vy = dy / this.totalDist;
    this.x  = attacker.x;
    this.y  = attacker.y;

    this.rect = scene.add.rectangle(
      attacker.x * TILE, attacker.y * TILE,
      style.w, style.h, style.color
    ).setDepth(6).setRotation(Math.atan2(dy, dx));

    this._trailColor = style.trailColor ?? 0xcccccc;
    this._trailStyle = style.trailStyle ?? 'line';
    this._trail = scene.add.graphics().setDepth(5);
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

    // Trail — short fading line or ember scatter behind the projectile
    const trailTiles = Math.min(this.distTraveled, 0.35);
    this._trail.clear();
    if (trailTiles > 0.05) {
      if (this._trailStyle === 'flame') {
        // Scattered orange ember dots along the trail
        for (let i = 0; i < 5; i++) {
          const t  = (i + 1) / 5;
          const px = (this.x - this.vx * trailTiles * t) * TILE + (Math.random() - 0.5) * 5;
          const py = (this.y - this.vy * trailTiles * t) * TILE + (Math.random() - 0.5) * 5;
          this._trail.fillStyle(this._trailColor, 0.8 - t * 0.5);
          this._trail.fillCircle(px, py, 1.5 + Math.random() * 1.5);
        }
      } else {
        this._trail.lineStyle(2, this._trailColor, 0.5);
        this._trail.beginPath();
        this._trail.moveTo((this.x - this.vx * trailTiles) * TILE, (this.y - this.vy * trailTiles) * TILE);
        this._trail.lineTo(this.x * TILE, this.y * TILE);
        this._trail.strokePath();
      }
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
    } else {
      if (!this.target.isDead) {
        this.battleScene._applyDamage(this.attacker, this.target, this.finalDmg, this.isCrit);
      }
      if (this.attacker.isAoe) {
        // AoE splash always fires — trebuchet/catapult explosions hit nearby enemies
        // even if the primary target died before the slow projectile landed.
        this.battleScene._applyAoeSplash(this.attacker, this.target, this.finalDmg);
      }
    }

    if (!this.target.isWall) {
      const count = this.attacker.isAoe ? PARTICLE_COUNT_AOE : PARTICLE_COUNT_NORMAL;
      this.battleScene._spawnBloodBurst(this.x * TILE, this.y * TILE, count);
    }

    if (this.attacker.isAoe) {
      // Enemy catapult: harder shake. Player engineer (trebuchet): lighter.
      const intensity = this.trebuchet ? 0.004 : 0.007;
      const duration  = this.trebuchet ? 100   : 180;
      this.battleScene.cameras.main.shake(duration, intensity);
    }

    this._trail.destroy();
    this.rect.destroy();
    this.done = true;
  }

  destroy() {
    this._trail.destroy();
    this.rect.destroy();
    this.done = true;
  }
}
