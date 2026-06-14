// Off-season wizard controller.
// Manages step sequencing, navigation, and per-session wizard state.
// HTML structure expected in the host page — see #offseason-ui in index.html.

import {
  HERO_RETENTION_CHANCE,
  GOLD_TAX_OPTIONS, GOLD_PER_MISSING_WALL_HP, GOLD_PER_DESTROYED_SEGMENT,
  ARTISAN_FREE_REPAIR_PER_LEVEL,
  MAX_LEVEL, XP_THRESHOLDS,
  TACTIC_MAX_STOCKPILE,
} from '../data/constants.js';
import { TACTIC_KEYS } from '../data/tactics.js';
import { fadeOutMusic } from '../audio/MusicManager.js';
import { render as renderFallen }   from './steps/stepFallen.js';
import { render as renderHeroes }   from './steps/stepHeroes.js';
import { render as renderTraining } from './steps/stepTraining.js';
import { render as renderGold }       from './steps/stepGold.js';
import { render as renderInvest }     from './steps/stepInvest.js';
import { render as renderConfirm }    from './steps/stepConfirm.js';
import { render as renderPersonnel }  from './steps/stepPersonnel.js';
import { render as renderDeployment } from './steps/stepDeployment.js';
import { render as renderScouts }     from './steps/stepScouts.js';
import { createTutorialRenderer }     from './steps/stepTutorial.js';

// ── Step definitions ──────────────────────────────────────────────────────────
// conditional: function(gs) → bool; null means always shown.

const STEP_DEFS = [
  // ── Tutorial interstitials (Year 1 only, skippable) ────────────────────────
  {
    id: 'tutorial_arrival',
    label: 'A Word Before We Begin',
    isTutorial: true,
    conditional: (gs, ws) => gs.year === 1 && ws?.tutorialEnabled,
    render: createTutorialRenderer({
      label: 'The Wall — Year 1',
      paragraphs: [
        '{commanderName}. Word came you were on your way. I\'m {name} — one of four still standing from last year. The center section breached for nearly two hours. We held it with nine soldiers and a prayer while the previous commander bought us time at the gap. Didn\'t survive to see morning. I watched it happen, and I know exactly what it means if that wall comes down — not for us, but for every town, every farm, every family between here and the capital. They know what this wall is. What they don\'t know is how close it got.',
        'You know what it takes to survive here. What I need you to understand is this: we rebuild wisely, or the next attack may be the last. Every choice you make before they arrive again has to count.',
      ],
    }),
  },
  {
    id: 'fallen',
    label: 'Roll Call of the Fallen',
    conditional: gs => gs.fallenThisBattle.length > 0,
    banner: 'assets/images/fallen banner.png',
    render: renderFallen,
  },
  {
    id: 'heroes',
    label: 'The Hero Departures',
    conditional: gs => gs.newHeroesThisBattle.length > 0,
    banner: 'assets/images/heroes banner.png',
    render: renderHeroes,
  },
  {
    id: 'tutorial_resources',
    label: 'The King\'s Gold',
    isTutorial: true,
    conditional: (gs, ws) => gs.year === 1 && ws?.tutorialEnabled,
    render: createTutorialRenderer({
      label: 'Between Battles — Resources',
      paragraphs: [
        'King Aldric sends funds each year. Base taxes, plus extra for any needed wall repairs. The next screen shows you that breakdown.',
        'Know what you have before you spend anything. Gold you don\'t use carries over to the following year.',
      ],
    }),
  },
  {
    id: 'gold',
    label: 'Gold Summary',
    conditional: null,
    banner: 'assets/images/gold banner.png',
    render: renderGold,
  },
  {
    id: 'tutorial_invest',
    label: 'The Wall & Our Buildings',
    isTutorial: true,
    conditional: (gs, ws) => gs.year === 1 && ws?.tutorialEnabled,
    render: createTutorialRenderer({
      label: 'Between Battles — Investment',
      paragraphs: [
        'You can spend gold to repair wall damage or upgrade sections. Repairs require an Artisan Workshop first. Upgrades add HP and give defenders better cover.',
        'The bigger decision is buildings. The barracks we already have brings in warriors and archers — upgrading it makes room for more of both. A library brings mages and healers. Some buildings unlock other unit types entirely — captains require an Officer Academy, engineers a Siege Workshop. Others improve what you already have: faster attacks, heavier armor. What you build now determines who arrives.',
      ],
    }),
  },
  {
    id: 'invest',
    label: 'Wall & Building Investment',
    conditional: null,
    banner: 'assets/images/building banner.png',
    render: renderInvest,
  },
  {
    id: 'confirm',
    label: 'Confirm Spending',
    conditional: null,
    banner: 'assets/images/confirm banner.png',
    render: renderConfirm,
  },
  {
    id: 'training',
    label: 'Training & Specialization',
    // Shown when units leveled up in battle, veteran XP caused level-ups,
    // or any surviving unit has a pending L3 specialization choice.
    conditional: (gs, ws) =>
      (gs.leveledUpThisBattle?.length > 0) ||
      (ws.veteranLevelUpIds?.length > 0) ||
      gs.roster.some(u => !u.dead && u.level >= 3 && !u.specialization),
    banner: 'assets/images/training banner.png',
    render: renderTraining,
  },
  {
    id: 'tutorial_deployment',
    label: 'Your Soldiers',
    isTutorial: true,
    conditional: (gs, ws) => gs.year === 1 && ws?.tutorialEnabled,
    render: createTutorialRenderer({
      label: 'Between Battles — Deployment',
      paragraphs: [
        'While the buildings are being completed, new recruits arrive. The next screen shows every soldier — assign each one a position: a wall section or one of your three reserve slots.',
        'Only ranged units and healers can stand on the walls. All unit types can go into reserve, for making real-time decisions during the battle. If you have engineers, they\'ll assemble their trebuchets just behind the wall.',
      ],
    }),
  },
  {
    id: 'personnel',
    label: 'Units & Deployment',
    conditional: null,
    banner: 'assets/images/deployment banner.png',
    render: renderPersonnel,
  },
  {
    id: 'deployment',
    label: 'Deployment Preview',
    conditional: null,
    banner: 'assets/images/deployment preview banner.png',
    render: renderDeployment,
  },
  {
    id: 'scouts',
    label: 'Scout Deployment',
    conditional: gs => gs.roster.filter(u => u.class === 'scout' && !u.dead).length > 0,
    banner: 'assets/images/scout banner.png',
    render: renderScouts,
  },
  {
    id: 'tutorial_battle',
    label: 'Into Battle',
    isTutorial: true,
    conditional: (gs, ws) => gs.year === 1 && ws?.tutorialEnabled,
    render: createTutorialRenderer({
      label: 'The Battle',
      paragraphs: [
        'Your three reserve sections hold units ready to deploy on your command. You can Sortie — push them forward through the wall into open ground to attack — or Reinforce a wall section, where ranged units mount the wall and melee units hold position behind it, ready to counterattack if there\'s a breach. Use your reserves when the wall is under heavy pressure, or when you spot an elite that needs to be dealt with.',
        'Below the battle you\'ll find targeting controls. Each unit group — melee, ranged, siege — can be directed to focus on a specific enemy type. By default they follow their own judgment. Override when you need precision.',
        'Starting next year, King Aldric will occasionally send a trained general to teach your soldiers a surprise tactic — a one-time ability you can trigger mid-battle. You\'ll see them as buttons below the targeting controls when you have them. This year, you have none. In time, you will.',
        'Things move fast out there. If you need more time to make decisions — when to deploy reserves, when to use a tactic — there\'s a Slow Mo toggle in the controls below the battle. Use it freely. The wall doesn\'t care how long it takes, as long as it holds.',
        'Every person in this kingdom knows what this wall means. What they don\'t know — what they can never know — is how close last year came to ending all of it. That weight is ours to carry. I\'ll be right there in the fight with you, {commanderName}. Let\'s not waste what the previous commander bought us.',
      ],
    }),
  },
];

// ── Module-level state ────────────────────────────────────────────────────────

let gs            = null;
let activeSteps   = [];
let stepIndex     = 0;
let wizardState   = {};
let onDone        = null;

// Wizard API object passed to every step renderer.
// Steps call these to control navigation from within their own logic.
const wizard = {
  setNextEnabled(enabled) {
    document.getElementById('os-btn-next').disabled = !enabled;
  },
  setNextLabel(label) {
    document.getElementById('os-btn-next').textContent = label;
  },
  setPrevEnabled(enabled) {
    document.getElementById('os-btn-prev').disabled = !enabled;
  },
  proceed() { advance(1); },
  jumpTo(stepId) {
    const idx = activeSteps.findIndex(s => s.id === stepId);
    if (idx >= 0) { stepIndex = idx; renderStep(); }
  },
  skipTutorial() {
    wizardState.tutorialEnabled = false;
    // Find the next non-tutorial step after the current position, then remove
    // all tutorial steps and jump to it.
    const nextReal = activeSteps.slice(stepIndex + 1).find(s => !s.isTutorial);
    activeSteps = activeSteps.filter(s => !s.isTutorial);
    if (nextReal) {
      stepIndex = activeSteps.indexOf(nextReal);
    } else {
      stepIndex = Math.min(stepIndex, activeSteps.length - 1);
    }
    renderStep();
  },
};

// ── Public API ────────────────────────────────────────────────────────────────

// Launch the off-season wizard.
// gameState: the shared GameState object.
// onComplete: called with the final wizardState when the wizard finishes.
export function startOffSeason(gameState, onComplete) {
  gs   = gameState;
  onDone = onComplete;

  gameState.goldBreakdown = computeGoldBreakdown(gameState); // must run before artisan repairs
  applyArtisanFreeRepairs(gameState);

  // Starter veterans carry a one-time survivor greeting for Year 1 only.
  // Clear it once they've served past their first year so normal greetings apply.
  for (const unit of gameState.roster) {
    if (unit.greeting && (unit.yearOfService ?? 0) > 1) unit.greeting = null;
  }

  // Scouts captured in a prior off-season appear in this year's fallen ceremony
  if (gameState.capturedScouts?.length > 0) {
    gameState.fallenThisBattle = [...gameState.fallenThisBattle, ...gameState.capturedScouts];
    gameState.capturedScouts = [];
  }

  wizardState = buildFreshWizardState(gameState);
  wizardState.tacticAwarded = awardTactic(gameState);
  resolveHeroRetention(gameState);
  applyVeteranXp(gameState, wizardState);
  activeSteps = STEP_DEFS.filter(s => !s.conditional || s.conditional(gameState, wizardState));
  stepIndex   = 0;

  showUI();
  renderStep();
}

// ── Internal ──────────────────────────────────────────────────────────────────

function computeGoldBreakdown(gs) {
  const missingHp = gs.wallSegments.reduce(
    (sum, seg) => sum + Math.max(0, seg.maxHp - seg.hp), 0
  );
  const destroyed = gs.wallSegments.filter(seg => seg.hp <= 0).length;
  const base = GOLD_TAX_OPTIONS[Math.floor(Math.random() * GOLD_TAX_OPTIONS.length)];
  return {
    base,
    wallDamage:        missingHp * GOLD_PER_MISSING_WALL_HP,
    destroyedSegments: destroyed * GOLD_PER_DESTROYED_SEGMENT,
  };
}

function applyArtisanFreeRepairs(gs) {
  const artisanLevel = gs.buildings.artisanWorkshop ?? 0;
  if (artisanLevel === 0) { gs.artisanAutoRepair = 0; return; }
  const freePerSeg = artisanLevel * ARTISAN_FREE_REPAIR_PER_LEVEL;
  let total = 0;
  for (const seg of gs.wallSegments) {
    const repaired = Math.min(freePerSeg, Math.max(0, seg.maxHp - seg.hp));
    seg.hp  = Math.min(seg.hp + repaired, seg.maxHp);
    total  += repaired;
  }
  gs.artisanAutoRepair = total;
}

function buildFreshWizardState(gameState) {
  const bd = gameState.goldBreakdown;
  const newGold = bd.base + bd.wallDamage + bd.destroyedSegments;

  // Assignments: seed from existing roster; updated in step 6.
  const assignments = {};
  for (const unit of gameState.roster) {
    if (!unit.dead) assignments[unit.id] = unit.assignment ?? null;
  }

  return {
    goldAvailable:      gameState.gold + newGold,  // carryover + this season's income
    tutorialEnabled:    gameState.year === 1,
    spendingConfirmed:  false,
    spending: {
      wallRepairs:  { left: 0, center: 0, right: 0 },
      wallUpgrades: { left: 0, center: 0, right: 0 },
      buildings:    {},
    },
    assignments,
    stayingHeroes:      [],
    scoutResult:        null,
    scoutedComposition: null,
    veteranXpCount:     0,    // set by applyVeteranXp
    veteranLevelUpIds:  [],   // roster IDs that leveled up from veteran XP
    veteranDetails:     [],   // per-veteran { name, class, specialization, yearOfService }
  };
}

// Award one random Surprise Tactic (Year 2+ only; stockpile capped at TACTIC_MAX_STOCKPILE).
// Returns the awarded tactic key, or null if Year 1 or stockpile is full.
function awardTactic(gameState) {
  if (gameState.year <= 1) return null;
  if (!gameState.tactics) gameState.tactics = [];
  if (gameState.tactics.length >= TACTIC_MAX_STOCKPILE) return null;
  const key = TACTIC_KEYS[Math.floor(Math.random() * TACTIC_KEYS.length)];
  gameState.tactics.push(key);
  return key;
}

// Retention is resolved before the hero ceremony renders (GDD Section V).
function resolveHeroRetention(gameState) {
  for (const hero of gameState.newHeroesThisBattle) {
    if (hero.staying === undefined) {
      hero.staying = Math.random() < HERO_RETENTION_CHANCE;
    }
  }
}

// Apply veteran XP bonus at wizard initialization (before steps render).
// Each staying veteran on the active roster gives 1 XP to all surviving units.
// Newly graduating heroes who are staying this season count too.
function applyVeteranXp(gameState, wizardState) {
  const priorVeterans  = gameState.roster.filter(u => !u.dead && u.isVeteran);
  const newlyStaying   = gameState.newHeroesThisBattle.filter(h => h.staying);
  const veteranCount   = priorVeterans.length + newlyStaying.length;
  wizardState.veteranXpCount = veteranCount;

  // Store per-veteran details for the Training step listing
  wizardState.veteranDetails = [
    ...priorVeterans.map(u => ({
      name: u.name, class: u.class, specialization: u.specialization,
      yearOfService: u.yearOfService,
    })),
    ...newlyStaying.map(u => ({
      name: u.name, class: u.class, specialization: u.specialization,
      yearOfService: u.yearOfService,
    })),
  ];

  if (veteranCount === 0) return;

  for (const ru of gameState.roster) {
    if (ru.dead) continue;
    const oldLevel = ru.level;
    ru.xp = (ru.xp ?? 0) + veteranCount;
    while (ru.level < MAX_LEVEL && ru.xp >= XP_THRESHOLDS[ru.level]) {
      ru.level++;
    }
    if (ru.level > oldLevel) wizardState.veteranLevelUpIds.push(ru.id);
  }
}

function renderStep() {
  const step = activeSteps[stepIndex];

  document.getElementById('os-year-label').textContent     = `Year ${gs.year} · Between Battles`;
  document.getElementById('os-step-label').textContent     = step.label;
  document.getElementById('os-step-indicator').textContent =
    `Step ${stepIndex + 1} of ${activeSteps.length}`;

  const contentEl = document.getElementById('os-content');
  contentEl.innerHTML = '';
  const inner = document.createElement('div');
  inner.className = 'os-inner';
  contentEl.appendChild(inner);

  // Reset nav to defaults before step renders (steps may override via wizard API)
  document.getElementById('os-btn-prev').disabled   = stepIndex === 0;
  document.getElementById('os-btn-next').disabled   = false;
  document.getElementById('os-btn-next').textContent =
    stepIndex === activeSteps.length - 1 ? 'Begin Battle →' : 'Next →';

  if (step.banner) {
    const banner = document.createElement('img');
    banner.src = step.banner;
    banner.style.cssText =
      'display:block;width:calc(100% + 56px);margin:-28px -28px 24px -28px;' +
      'height:160px;object-fit:cover;object-position:center;';
    inner.appendChild(banner);
  }

  // Give each step a sub-div so banner is never wiped by contentEl.innerHTML = ...
  const stepContent = document.createElement('div');
  inner.appendChild(stepContent);

  step.render(gs, wizardState, stepContent, wizard);
}

function advance(direction) {
  const target = stepIndex + direction;
  if (target < 0 || target >= activeSteps.length) return;
  stepIndex = target;
  renderStep();
}

function finish() {
  fadeOutMusic(800);
  hideUI();
  if (onDone) onDone(wizardState);
}

function showUI() {
  document.getElementById('battle-ui').style.display    = 'none';
  document.getElementById('offseason-ui').style.display = 'flex';
}

function hideUI() {
  document.getElementById('offseason-ui').style.display = 'none';
  document.getElementById('battle-ui').style.display    = '';
}

// ── Navigation button wiring ──────────────────────────────────────────────────
// Called once at page load (from the host HTML module script).

export function initNavButtons() {
  document.getElementById('os-btn-prev').onclick = () => advance(-1);
  document.getElementById('os-btn-next').onclick = () => {
    if (stepIndex === activeSteps.length - 1) {
      finish();
    } else {
      advance(1);
    }
  };
}
