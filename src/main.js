import { BattleScene } from './battle/BattleScene.js';
import { TILE, MAP_W, MAP_H } from './data/constants.js';

const config = {
  type: Phaser.WEBGL,
  width: MAP_W * TILE,
  height: MAP_H * TILE,
  parent: 'game-container',
  backgroundColor: '#1a1a1a',
  scene: [BattleScene],
  fps: { target: 60, forceSetTimeOut: false },
};

window.game = new Phaser.Game(config);
