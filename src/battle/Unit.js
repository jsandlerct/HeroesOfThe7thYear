import {
  TILE, UNIT_W, UNIT_H, UNIT_R,
  MAX_LEVEL, XP_THRESHOLDS,
  HP_BAR_H, HP_BAR_Y_GAP,
  COLOR_HP_BAR_BG, COLOR_HP_HIGH, COLOR_HP_MED, COLOR_HP_LOW,
  HP_THRESH_MED, HP_THRESH_LOW,
  HEAL_GLOW_MS, HEAL_GLOW_COLOR, HEAL_GLOW_OUTER,
  AURA_GLOW_COLOR, AURA_GLOW_OUTER,
  CRIT_GLOW_COLOR, CRIT_GLOW_OUTER, CRIT_GLOW_MS,
  HEALER_HEAL_S,
} from '../data/constants.js';

let _nextId = 0;

const PLAYER_ICON_PREFIX = {
  warrior:  'sword',
  archer:   'bow',
  mage:     'comet',
  healer:   'cross',
  captain:  'star',
  engineer: 'trebuchet',
};

export class Unit {
  constructor(type, def, team, x, y, scene) {
    this.id    = _nextId++;
    this.type  = type;
    this.team  = team;
    this.x     = x;
    this.y     = y;

    this.maxHp     = def.hp;
    this.hp        = def.hp;
    this.dmg       = def.dmg;
    this.atkSpeed  = def.atkSpeed;
    this.atkTimer  = Math.random() * def.atkSpeed;
    this.range     = def.range;
    this.armor     = def.armor ?? 0;
    this.moveSpeed = def.moveSpeed ?? 0;

    // Per-level stat deltas — used when the unit gains a level during battle
    this.lvlHp     = def.lvlHp  ?? 0;
    this.lvlDmg    = def.lvlDmg ?? 0;

    // Healer heal interval (may be reduced by Hospital building)
    this.healInterval = def.healInterval ?? HEALER_HEAL_S;

    this.color            = def.color ?? 0xffffff;
    this.ignoresArmor     = def.ignoresArmor     ?? false;
    this.cannotDamageWall = def.cannotDamageWall ?? false;
    this.isElite          = def.isElite          ?? false;
    this.isAoe            = def.isAoe            ?? false;
    this.aoeRadius        = def.aoeRadius        ?? 0;
    this.isHealer         = def.isHealer         ?? false;
    this.healTimer        = 0;

    this.hasCaptainAura = def.hasCaptainAura ?? false;
    this.hasGeneralAura = def.hasGeneralAura ?? false;
    this.auraRadius     = def.auraRadius     ?? 0;
    this.auraDmgBonus   = def.auraDmgBonus   ?? 0;

    this._auraGlowFX       = null;
    this._suppressAuraGlow = false;

    this.isInReserve = false;
    this.reserveSlot = null;
    this.waypoint    = null;

    this.moveDelay    = 0;
    this.isStationary = false;
    this.isOnWall     = false;
    this.wallSection  = null;
    this.isRouting    = false;
    this.isDead       = false;

    this.target       = null;
    this.lastAttacker = null;
    this.damageTaken  = 0;
    this.damageBy     = {};
    this.xp           = 0;
    this.level        = 1;
    this.bonusHp      = 0;   // accumulated random HP bonuses from level-ups
    this.bonusDmg     = 0;   // accumulated random DMG bonuses from level-ups

    const px    = x * TILE;
    const py    = y * TILE;
    const scale = def.spriteScale ?? 1;
    const sw    = UNIT_W * scale;
    const sh    = UNIT_H * scale;
    const spriteR = UNIT_R * scale;
    this._spriteHalfH = team === 'player' ? spriteR : sh / 2;
    this._barW        = sw;
    this.collisionRadius = (sw / 2) / TILE;

    if (team === 'player') {
      this.sprite = scene.add.circle(px, py, spriteR, def.color).setDepth(4);
      const prefix = PLAYER_ICON_PREFIX[type];
      if (prefix) {
        this.icon = scene.add.image(px, py, `${prefix}_${this.level}`)
          .setDisplaySize(sw, sh).setDepth(4)
          .setBlendMode(Phaser.BlendModes.MULTIPLY);
      }
    } else {
      this.sprite = scene.add.rectangle(px, py, sw, sh, def.color).setDepth(4);
      this.icon = scene.add.image(px, py, `enemy_${type}`)
        .setDisplaySize(sw, sh).setDepth(4)
        .setBlendMode(Phaser.BlendModes.MULTIPLY);
    }
    this._displayedLevel = this.level;

    const barY = py - this._spriteHalfH - HP_BAR_Y_GAP;
    this.hpBarBg = scene.add.rectangle(px - sw / 2, barY, sw, HP_BAR_H, COLOR_HP_BAR_BG)
      .setOrigin(0, 0.5).setDepth(5);
    this.hpBarFg = scene.add.rectangle(px - sw / 2, barY, sw, HP_BAR_H, COLOR_HP_HIGH)
      .setOrigin(0, 0.5).setDepth(5);

    // Shot / heal timer bar below the icon — archers, mages, healers only
    this.shotBarBg = null;
    this.shotBarFg = null;
    if (team === 'player' && (type === 'archer' || type === 'mage' || type === 'healer' || type === 'engineer')) {
      const shotY = py + this._spriteHalfH + HP_BAR_Y_GAP;
      this.shotBarBg = scene.add.rectangle(px - sw / 2, shotY, sw, HP_BAR_H, COLOR_HP_BAR_BG)
        .setOrigin(0, 0.5).setDepth(5);
      this.shotBarFg = scene.add.rectangle(px - sw / 2, shotY, sw, HP_BAR_H, 0xffffff)
        .setOrigin(0, 0.5).setDepth(5);
    }
  }

  syncSprite() {
    const px = this.x * TILE;
    const py = this.y * TILE;
    this.sprite.setPosition(px, py);

    if (this.icon) {
      this.icon.setPosition(px, py);
      if (this.team === 'player' && this.level !== this._displayedLevel) {
        const prefix = PLAYER_ICON_PREFIX[this.type];
        this.icon.setTexture(`${prefix}_${this.level}`);
        this._displayedLevel = this.level;
      }
    }

    const barY = py - this._spriteHalfH - HP_BAR_Y_GAP;
    this.hpBarBg.setPosition(px - this._barW / 2, barY);
    this.hpBarFg.setPosition(px - this._barW / 2, barY);
    const pct   = this.hp / this.maxHp;
    this.hpBarFg.setDisplaySize(Math.max(0, Math.floor(pct * this._barW)), HP_BAR_H);
    const color = pct > HP_THRESH_MED ? COLOR_HP_HIGH
                : pct > HP_THRESH_LOW ? COLOR_HP_MED
                : COLOR_HP_LOW;
    this.hpBarFg.setFillStyle(color);

    if (this.shotBarBg) {
      const shotY = py + this._spriteHalfH + HP_BAR_Y_GAP;
      this.shotBarBg.setPosition(px - this._barW / 2, shotY);
      this.shotBarFg.setPosition(px - this._barW / 2, shotY);
      // Healers show heal-cycle progress; others show attack-cycle progress
      const elapsed = this.isHealer
        ? this.healInterval - Math.max(0, this.healTimer)
        : this.atkSpeed    - Math.max(0, this.atkTimer);
      const total   = this.isHealer ? this.healInterval : this.atkSpeed;
      const shotPct = Math.min(1, Math.max(0, elapsed / total));
      this.shotBarFg.setDisplaySize(Math.floor(shotPct * this._barW), HP_BAR_H);
    }
  }

  destroySprites() {
    if (this._spritesDestroyed) return;
    this._spritesDestroyed = true;
    this.sprite.destroy();
    if (this.icon) this.icon.destroy();
    this.hpBarBg.destroy();
    this.hpBarFg.destroy();
    if (this.shotBarBg) this.shotBarBg.destroy();
    if (this.shotBarFg) this.shotBarFg.destroy();
  }

  setAuraGlow(active) {
    if (active && !this._suppressAuraGlow && !this._auraGlowFX) {
      this._auraGlowFX = this.sprite.postFX.addGlow(AURA_GLOW_COLOR, AURA_GLOW_OUTER, 0);
    } else if (!active && this._auraGlowFX) {
      this.sprite.postFX.remove(this._auraGlowFX);
      this._auraGlowFX = null;
    }
  }

  triggerCritGlow(scene) {
    if (!this.sprite?.postFX) return;
    const glow = this.sprite.postFX.addGlow(CRIT_GLOW_COLOR, CRIT_GLOW_OUTER, 0);
    scene.time.delayedCall(CRIT_GLOW_MS, () => {
      if (!this.isDead && this.sprite) this.sprite.postFX.remove(glow);
    });
  }

  triggerHealGlow(scene) {
    if (scene._sfx) scene._sfx('sfx_heal');
    // Suppress gold aura glow for the duration of the blue heal glow
    if (this._auraGlowFX) {
      this.sprite.postFX.remove(this._auraGlowFX);
      this._auraGlowFX = null;
    }
    this._suppressAuraGlow = true;
    const glow = this.sprite.postFX.addGlow(HEAL_GLOW_COLOR, HEAL_GLOW_OUTER, 0);
    scene.time.delayedCall(HEAL_GLOW_MS, () => {
      if (!this.isDead) this.sprite.postFX.remove(glow);
      this._suppressAuraGlow = false;
    });
  }

  awardXp(amount) {
    this.xp += amount;
    // Level-ups are resolved during off-season, not mid-battle.
  }

  _applyLevelUps() {
    while (this.level < MAX_LEVEL && this.xp >= XP_THRESHOLDS[this.level]) {
      this.level++;
      this.maxHp += this.lvlHp;
      this.hp    += this.lvlHp;
      this.dmg   += this.lvlDmg;
      // Random bonus: +1–3 HP or +1–3 DMG
      const roll = Math.floor(Math.random() * 3) + 1;
      if (Math.random() < 0.5) {
        this.maxHp   += roll;
        this.hp      += roll;
        this.bonusHp += roll;
      } else {
        this.dmg      += roll;
        this.bonusDmg += roll;
      }
    }
  }
}
