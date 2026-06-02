import { BattleScene } from './battle/BattleScene.js';
import { TILE, MAP_W, MAP_H } from './data/constants.js';

// Blank first scene so Phaser initialises the canvas without auto-starting
// BattleScene. index.html and testversion.html call game.scene.start('BattleScene')
// explicitly when they're ready.
class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }
}

const config = {
  type: Phaser.WEBGL,
  width: MAP_W * TILE,
  height: MAP_H * TILE,
  parent: 'game-container',
  backgroundColor: '#1a1a1a',
  scene: [BootScene, BattleScene],
  fps: { target: 60, forceSetTimeOut: false },
};

window.game = new Phaser.Game(config);
