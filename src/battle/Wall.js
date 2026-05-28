import {
  TILE, MAP_W, MAP_H, WALL_ROW, WALL_SECTION_W,
  WALL_DR, WALL_HP_BAR_H, WALL_HP_BAR_Y, WALL_LABEL_SIZE,
  COLOR_WALL_FILL, ALPHA_WALL_BREACH,
  COLOR_WALL_HP_BAR_BG, COLOR_WALL_HP_HIGH, COLOR_WALL_HP_MED, COLOR_WALL_HP_LOW,
  HP_THRESH_MED, HP_THRESH_LOW,
} from '../data/constants.js';

export { TILE, MAP_W, MAP_H, WALL_ROW };   // re-export for legacy imports in main.js

export class WallSegment {
  constructor(section, startTile, level, hp, scene) {
    this.isWall    = true;
    this.section   = section;
    this.startTile = startTile;
    this.level     = level;
    this.maxHp     = hp;
    this.hp        = hp;
    this.isBreached = false;

    // Tile-space center (used by targeting distance checks)
    this.x = startTile + WALL_SECTION_W / 2;
    this.y = WALL_ROW + 0.5;

    const px = startTile * TILE;
    const py = WALL_ROW * TILE;
    const w  = WALL_SECTION_W * TILE;
    const h  = TILE;

    this.rect = scene.add.rectangle(px + w / 2, py + h / 2, w, h, COLOR_WALL_FILL)
      .setDepth(1);

    this.hpBarBg = scene.add.rectangle(px + w / 2, py + WALL_HP_BAR_Y, w, WALL_HP_BAR_H, COLOR_WALL_HP_BAR_BG)
      .setOrigin(0.5, 0.5).setDepth(2);
    this.hpBarFg = scene.add.rectangle(px, py + WALL_HP_BAR_Y, w, WALL_HP_BAR_H, COLOR_WALL_HP_HIGH)
      .setOrigin(0, 0.5).setDepth(2);

    scene.add.text(px + w / 2, py + h / 2, section[0].toUpperCase(), {
      fontSize: WALL_LABEL_SIZE, color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setDepth(3);
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.updateHpBar();
    if (this.hp <= 0 && !this.isBreached) {
      this.isBreached = true;
      this.rect.setFillStyle(COLOR_WALL_FILL, ALPHA_WALL_BREACH);
      return true;
    }
    return false;
  }

  updateHpBar() {
    const pct   = this.hp / this.maxHp;
    const fullW = WALL_SECTION_W * TILE;
    this.hpBarFg.setDisplaySize(Math.max(0, Math.floor(pct * fullW)), WALL_HP_BAR_H);
    const color = pct > HP_THRESH_MED ? COLOR_WALL_HP_HIGH
                : pct > HP_THRESH_LOW ? COLOR_WALL_HP_MED
                : COLOR_WALL_HP_LOW;
    this.hpBarFg.setFillStyle(color);
  }

  getDamageReduction() {
    return WALL_DR[this.level] ?? WALL_DR[1];
  }

  containsX(tileX) {
    return tileX >= this.startTile && tileX < this.startTile + WALL_SECTION_W;
  }
}
