// Off-season wizard controller.
// Manages step sequencing, navigation, and per-session wizard state.
// HTML structure expected in the host page — see #offseason-ui in index.html.

import {
  HERO_RETENTION_CHANCE,
  GOLD_TAX_OPTIONS, GOLD_PER_MISSING_WALL_HP, GOLD_PER_DESTROYED_SEGMENT,
  ARTISAN_FREE_REPAIR_PER_LEVEL,
} from '../data/constants.js';
import { render as renderFallen }     from './steps/stepFallen.js';
import { render as renderHeroes }     from './steps/stepHeroes.js';
import { render as renderGold }       from './steps/stepGold.js';
import { render as renderInvest }     from './steps/stepInvest.js';
import { render as renderConfirm }    from './steps/stepConfirm.js';
import { render as renderPersonnel }  from './steps/stepPersonnel.js';
import { render as renderDeployment } from './steps/stepDeployment.js';
import { render as renderScouts }     from './steps/stepScouts.js';

// ── Step definitions ──────────────────────────────────────────────────────────
// conditional: function(gs) → bool; null means always shown.

const STEP_DEFS = [
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
    id: 'gold',
    label: 'Gold Summary',
    conditional: null,
    banner: 'assets/images/gold banner.png',
    render: renderGold,
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
    id: 'personnel',
    label: 'Personnel & Deployment',
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
  resolveHeroRetention(gameState);
  activeSteps = STEP_DEFS.filter(s => !s.conditional || s.conditional(gameState));
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
  };
}

// Retention is resolved before the hero ceremony renders (GDD Section V).
function resolveHeroRetention(gameState) {
  for (const hero of gameState.newHeroesThisBattle) {
    if (hero.staying === undefined) {
      hero.staying = Math.random() < HERO_RETENTION_CHANCE;
    }
  }
}

function renderStep() {
  const step = activeSteps[stepIndex];

  document.getElementById('os-year-label').textContent     = `Off Season · Year ${gs.year}`;
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
