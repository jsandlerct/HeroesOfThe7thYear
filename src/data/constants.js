// ── Map layout ─────────────────────────────────────────────────────────────
export const TILE           = 46;   // pixels per tile
export const MAP_W          = 12;   // tiles wide
export const MAP_H          = 16;   // tiles tall
export const WALL_ROW       = 11;   // tile row the wall sits on (0-indexed)
export const WALL_SECTION_W = 4;    // tiles per wall section (3 sections × 4 = MAP_W)

// ── Wall ───────────────────────────────────────────────────────────────────
export const WALL_DR           = [0, 0.10, 0.20, 0.20, 0.30, 0.30]; // damage reduction by level
export const WALL_HP_BAR_H     = 5;     // pixels tall
export const WALL_HP_BAR_Y     = -6;    // pixels above wall rect top
export const WALL_LABEL_SIZE   = '13px';
export const COLOR_WALL_FILL   = 0x888888;
export const ALPHA_WALL_BREACH = 0.4;

// ── Reserve zones ──────────────────────────────────────────────────────────
export const RESERVE_ZONE_ROWS    = 2;           // rows each reserve zone occupies
export const ENEMY_RESERVE_ROW    = 0;           // topmost row of enemy reserve zone
export const PLAYER_RESERVE_ROW   = MAP_H - 2;   // = 14, topmost row of player reserve zone
export const ENEMY_RESERVE_DEPLOY_S = 20;        // seconds until timed enemy reserves release
export const RESERVE_ALARM_ROW    = 8;           // player crossing north of this triggers alarm

// ── Combat ─────────────────────────────────────────────────────────────────
export const ATK_RANGE_BUFFER  = 0.15;  // attacker fires when within range + buffer
export const MAX_DR            = 0.90;  // damage reduction hard cap
export const ROUT_THRESHOLD    = 0.50;  // enemies rout when < this fraction of start remain alive
export const WALL_BLOCK_Y      = 0.4;   // enemies stop this far north of WALL_ROW
export const WALL_BREACH_DROP  = 0.8;   // tiles units fall on breach
export const SLOMOER_SCALE     = 0.25;  // time multiplier in slow-mo mode
export const NUDGE_STOP_DIST   = 0.2;   // waypoint considered reached within this tile distance

// ── Enemy spawn ─────────────────────────────────────────────────────────────
export const ENEMY_SPAWN_ROW     = 2.5;  // first row main-battle enemies appear on
export const ENEMY_SPAWN_SPACING = 0.8;  // row gap in spawn grid
export const ENEMY_MOVE_DELAY    = 2.0;  // seconds before non-ogres start moving

// ── Units ──────────────────────────────────────────────────────────────────
export const UNIT_W  = 16;   // sprite width in pixels
export const UNIT_H  = 16;   // sprite height in pixels
export const UNIT_R  = 8;    // player unit circle radius in pixels
export const MAX_LEVEL       = 5;
export const XP_THRESHOLDS   = [0, 5, 10, 20, 30];  // XP needed to reach each level (index = current level)
export const HEALER_HEAL_S       = 10;   // seconds between heals
export const HEALER_HEAL_RANGE   = 2;    // tiles
export const HEALER_XP_PER_HP    = 50;  // HP healed per 1 XP awarded to healer
export const HP_BAR_H        = 3;    // unit HP bar height in pixels
export const HP_BAR_Y_GAP    = 4;    // pixels between sprite top and HP bar

// ── Projectiles ────────────────────────────────────────────────────────────
export const PROJ_HIT_DIST = 0.2;   // tile distance that counts as a hit

export const PROJECTILE_STYLES = {
  archer:   { color: 0x111111, speed: 15, w:  9, h:  2, trebuchet: false },
  goblin:   { color: 0x8B4513, speed: 10, w: 15, h:  2, trebuchet: false },
  mage:     { color: 0xFF8C00, speed: 10, w: 15, h:  3, trebuchet: false },
  catapult: { color: 0xCCCCCC, speed:  6, w: 15, h: 15, trebuchet: false },
  engineer: { color: 0x555555, speed:  5, w: 15, h: 15, trebuchet: true  },
};
export const PROJ_DEFAULT_STYLE = { color: 0xffffff, speed: 10, w: 10, h: 2, trebuchet: false };

// ── Announcements ──────────────────────────────────────────────────────────
export const ANNOUNCE_MS        = 2500;
export const COUNTDOWN_STEP_MS  = 1000;  // ms per countdown number (3, 2, 1)
export const COUNTDOWN_FIGHT_MS = 700;   // ms "FIGHT!" is shown before game starts

// ── Visual: effects ───────────────────────────────────────────────────────
export const HEAL_GLOW_MS    = 500;    // duration of blue glow on healed unit
export const HEAL_GLOW_COLOR = 0x4488ff;
export const HEAL_GLOW_OUTER = 6;     // postFX glow outer strength in pixels

export const AURA_GLOW_COLOR = 0xccaa00;  // dim gold border on aura-buffed units
export const AURA_GLOW_OUTER = 3;

// ── Visual: map ────────────────────────────────────────────────────────────
export const COLOR_ENEMY_TERRITORY  = 0x2d4a1e;
export const COLOR_PLAYER_TERRITORY = 0x1e3a2a;
export const ALPHA_GRID             = 0.15;

// ── Visual: reserve zones ─────────────────────────────────────────────────
export const COLOR_ENEMY_RESERVE_ZONE  = 0xcc3322;
export const ALPHA_ENEMY_RESERVE_ZONE  = 0.22;
export const COLOR_PLAYER_RESERVE_ZONE = 0x2255cc;
export const ALPHA_PLAYER_RESERVE_ZONE = 0.22;

// ── Visual: HP bars ───────────────────────────────────────────────────────
export const COLOR_HP_BAR_BG      = 0x222222;  // unit HP bar background
export const COLOR_HP_HIGH        = 0x00cc00;
export const COLOR_HP_MED         = 0xffaa00;
export const COLOR_HP_LOW         = 0xdd2200;
export const HP_THRESH_MED        = 0.50;
export const HP_THRESH_LOW        = 0.25;

export const COLOR_WALL_HP_BAR_BG = 0x333333;  // wall HP bar background
export const COLOR_WALL_HP_HIGH   = 0x00cc00;
export const COLOR_WALL_HP_MED    = 0xffaa00;
export const COLOR_WALL_HP_LOW    = 0xdd0000;
