// Step 6 — Personnel & Deployment Assignment (GDD Section IV Step 6)
// Top half: visual deployment grid with drag-and-drop dot placement.
// Bottom half: sortable/filterable table with assignment dropdowns.
// Both halves stay in sync via a shared onAssign callback.

import { PORTRAIT_BY_ID }               from '../../data/portraits.js';
import { pickGreeting }                  from '../../data/greetings.js';
import { WALL_SECTION_CAPACITY, RESERVE_SECTION_CAPACITY } from '../../data/constants.js';
import { computeEffectiveDef }           from '../../battle/buildingBonuses.js';
import { makePortraitElement }           from '../portraitHelper.js';
import { SPECIALIZATION_DEFS, UNIT_DEFS } from '../../data/units.js';
import { drawAllWalls }                  from './stepInvest.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const ASSIGNMENT_OPTIONS = [
  { value: 'wallLeft',       label: 'Wall Left',       wallOnly: true,  engineerOnly: false },
  { value: 'wallCenter',     label: 'Wall Center',     wallOnly: true,  engineerOnly: false },
  { value: 'wallRight',      label: 'Wall Right',      wallOnly: true,  engineerOnly: false },
  { value: 'reserveLeft',    label: 'Reserve Left',    wallOnly: false, engineerOnly: false },
  { value: 'reserveCenter',  label: 'Reserve Center',  wallOnly: false, engineerOnly: false },
  { value: 'reserveRight',   label: 'Reserve Right',   wallOnly: false, engineerOnly: false },
  { value: 'engineerLeft',   label: 'Engineer Left',   wallOnly: false, engineerOnly: true  },
  { value: 'engineerCenter', label: 'Engineer Center', wallOnly: false, engineerOnly: true  },
  { value: 'engineerRight',  label: 'Engineer Right',  wallOnly: false, engineerOnly: true  },
];

const ASSIGNMENT_SORT_ORDER = {
  wallLeft: 0, wallCenter: 1, wallRight: 2,
  engineerLeft: 3, engineerCenter: 4, engineerRight: 5,
  reserveLeft: 6, reserveCenter: 7, reserveRight: 8,
};

const RESERVE_ONLY_CLASSES  = new Set(['warrior', 'captain']);
const ENGINEER_ONLY_CLASSES = new Set(['engineer']);
const NON_COMBATANT_CLASSES = new Set(['mason', 'scout']);

const CLASS_COLORS = Object.fromEntries(
  Object.entries(UNIT_DEFS).map(([cls, def]) => [
    cls, '#' + (def.color >>> 0).toString(16).padStart(6, '0'),
  ])
);

function classLabel(cls) {
  return cls.charAt(0).toUpperCase() + cls.slice(1);
}

function unitColor(u) {
  if (u.specialization) {
    const spec = SPECIALIZATION_DEFS[u.class]?.paths.find(p => p.id === u.specialization);
    if (spec) return '#' + spec.color.toString(16).padStart(6, '0');
  }
  return CLASS_COLORS[u.class] ?? '#888';
}

function variantLabel(u) {
  if (u.specialization) {
    const spec = SPECIALIZATION_DEFS[u.class]?.paths.find(p => p.id === u.specialization);
    if (spec) return `${spec.label} ${classLabel(u.class)}`;
  }
  return classLabel(u.class);
}

// ── Capacity helpers ──────────────────────────────────────────────────────────

function countsByAssignment(assignments) {
  const counts = {};
  for (const val of Object.values(assignments)) {
    if (val) counts[val] = (counts[val] || 0) + 1;
  }
  return counts;
}

function capacityWarnings(assignments) {
  const counts    = countsByAssignment(assignments);
  const warnings  = [];
  const wallKeys    = ['wallLeft', 'wallCenter', 'wallRight'];
  const reserveKeys = ['reserveLeft', 'reserveCenter', 'reserveRight'];
  const LABELS = {
    wallLeft: 'Wall Left', wallCenter: 'Wall Center', wallRight: 'Wall Right',
    reserveLeft: 'Reserve Left', reserveCenter: 'Reserve Center', reserveRight: 'Reserve Right',
  };
  for (const key of wallKeys) {
    if ((counts[key] || 0) > WALL_SECTION_CAPACITY)
      warnings.push(`${LABELS[key]}: ${counts[key]} units (warning: over ${WALL_SECTION_CAPACITY})`);
  }
  for (const key of reserveKeys) {
    if ((counts[key] || 0) > RESERVE_SECTION_CAPACITY)
      warnings.push(`${LABELS[key]}: ${counts[key]} units (warning: over ${RESERVE_SECTION_CAPACITY})`);
  }
  return warnings;
}

function dotTextColor(hexStr) {
  const hex = hexStr.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55
    ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)';
}

function canDropOnZone(unit, zoneKey) {
  if (!zoneKey) return true;
  const isEng         = ENGINEER_ONLY_CLASSES.has(unit.class);
  const isReserveOnly = RESERVE_ONLY_CLASSES.has(unit.class);
  const isEngZone     = zoneKey.startsWith('engineer');
  const isWallZone    = zoneKey.startsWith('wall');
  if (isEng)         return isEngZone;
  if (isReserveOnly) return !isWallZone && !isEngZone;
  return !isEngZone;
}

// ── Detail modal ──────────────────────────────────────────────────────────────

function showDetailModal(unit, gs) {
  document.getElementById('os-detail-modal')?.remove();

  const portrait = unit.portraitId ? PORTRAIT_BY_ID[unit.portraitId] : null;
  const greeting = unit.greeting ?? pickGreeting(unit.class, unit.yearOfService);

  const backdrop = document.createElement('div');
  backdrop.id = 'os-detail-modal';
  backdrop.style.cssText =
    'position:fixed;inset:0;background:rgba(0,0,0,0.72);z-index:200;' +
    'display:flex;align-items:center;justify-content:center;padding:20px;';
  backdrop.onclick = e => { if (e.target === backdrop) backdrop.remove(); };

  const box = document.createElement('div');
  box.style.cssText =
    'background:#1a1610;border:1px solid #5a4020;padding:28px;' +
    'max-width:560px;width:100%;max-height:82vh;overflow-y:auto;' +
    'font-family:Georgia,serif;color:#e0d4b0;position:relative;';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText =
    'position:absolute;top:14px;right:16px;background:none;border:none;' +
    'color:#6a5a3a;font-size:18px;cursor:pointer;';
  closeBtn.onclick = () => backdrop.remove();
  box.appendChild(closeBtn);

  const header = document.createElement('div');
  header.style.cssText = 'display:flex;gap:20px;align-items:flex-start;margin-bottom:20px;';
  header.appendChild(makePortraitElement(portrait, unit, 100));

  const eff = computeEffectiveDef(unit, gs);
  const nameBlock = document.createElement('div');
  nameBlock.style.paddingTop = '4px';
  nameBlock.innerHTML = `
    <div style="font-size:20px;color:#f0e0a0;margin-bottom:6px;">${unit.name ?? '—'}</div>
    <div style="font-size:13px;color:#8a7a5a;margin-bottom:4px;">
      ${classLabel(unit.class ?? 'unknown')}
      &nbsp;·&nbsp; Year ${(unit.yearOfService ?? 0) + 1} of service
      &nbsp;·&nbsp; Level ${unit.level ?? 1}
    </div>
    <div style="font-size:12px;color:#6a5a3a;display:flex;gap:18px;margin-top:4px;">
      <span>HP: <strong style="color:#8a9a6a">${Math.round(eff.hp)}</strong></span>
      <span>Dmg: <strong style="color:#9a7a5a">${Math.round(eff.dmg)}</strong></span>
      <span>XP: ${unit.xp ?? 0}</span>
    </div>`;
  header.appendChild(nameBlock);
  box.appendChild(header);

  const greetDiv = document.createElement('div');
  greetDiv.style.cssText =
    'font-style:italic;color:#9a8a6a;font-size:14px;line-height:1.6;' +
    'border-left:2px solid #3a2a10;padding-left:14px;margin-bottom:20px;';
  const addr = (gs.commanderName && gs.commanderName !== 'Commander')
    ? `Commander ${gs.commanderName}` : 'Commander';
  greetDiv.textContent = `"${addr}, ${greeting}"`;
  box.appendChild(greetDiv);

  const hr = document.createElement('hr');
  hr.style.cssText = 'border:none;border-top:1px solid #2a1e08;margin-bottom:16px;';
  box.appendChild(hr);

  const bioDiv = document.createElement('div');
  bioDiv.style.cssText = 'font-size:14px;color:#8a7a5a;line-height:1.7;margin-bottom:20px;';
  bioDiv.textContent = unit.bio || 'No record available.';
  box.appendChild(bioDiv);

  const statsHr = document.createElement('hr');
  statsHr.style.cssText = 'border:none;border-top:1px solid #2a1e08;margin-bottom:14px;';
  box.appendChild(statsHr);

  const statsGrid = document.createElement('div');
  statsGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;';

  function statCell(label, value) {
    const cell = document.createElement('div');
    cell.style.cssText = 'display:flex;justify-content:space-between;font-size:13px;padding:4px 0;border-bottom:1px solid #1e1408;';
    cell.innerHTML =
      `<span style="color:#6a5a3a;">${label}</span>` +
      `<strong style="color:#c9a84c;">${value ?? 0}</strong>`;
    return cell;
  }

  statsGrid.appendChild(statCell('Kills', unit.statKills ?? 0));
  statsGrid.appendChild(statCell('Assists', unit.statAssists ?? 0));
  statsGrid.appendChild(statCell('Survived Attacks', unit.statSurvivedAttacks ?? 0));
  if (unit.class === 'healer') {
    statsGrid.appendChild(statCell('Damage Healed', unit.statDamageHealed ?? 0));
  }
  if ((unit.statOgresKilled ?? 0) > 0) {
    statsGrid.appendChild(statCell('Ogres Slain', unit.statOgresKilled));
  }
  if ((unit.statGeneralsKilled ?? 0) > 0) {
    statsGrid.appendChild(statCell('Generals Slain', unit.statGeneralsKilled));
  }
  box.appendChild(statsGrid);

  backdrop.appendChild(box);
  document.body.appendChild(backdrop);
}

// ── Visual deployment grid ────────────────────────────────────────────────────

function buildVisualGrid(allCombatants, wizardState, gs, onAssign, draggingUnitRef) {
  const groups = {
    wallLeft: [], wallCenter: [], wallRight: [],
    engineerLeft: [], engineerCenter: [], engineerRight: [],
    reserveLeft: [], reserveCenter: [], reserveRight: [],
  };
  const unassigned = [];
  for (const u of allCombatants) {
    const key = wizardState.assignments[u.id];
    if (key && key in groups) groups[key].push(u);
    else unassigned.push(u);
  }

  const container = document.createElement('div');
  container.style.cssText = 'border:1px solid #2a2010;overflow:hidden;margin-bottom:12px;user-select:none;';

  // ── Enemy approach ──────────────────────────────────────────────────────────
  const enemyStrip = document.createElement('div');
  enemyStrip.style.cssText =
    'background:#170a0a;border-bottom:1px solid #3a1010;' +
    'padding:5px 12px;text-align:center;font-size:11px;' +
    'letter-spacing:0.18em;text-transform:uppercase;color:#5a2020;';
  enemyStrip.textContent = '← Enemy Approach →';
  container.appendChild(enemyStrip);

  // ── Dot factory ──────────────────────────────────────────────────────────────
  function makeDot(u, isUnassigned) {
    const dot = document.createElement('div');
    dot.style.cssText =
      `width:24px;height:24px;border-radius:50%;flex-shrink:0;cursor:grab;` +
      `background:${unitColor(u)};` +
      `border:${isUnassigned ? '2px solid #c9a84c' : '1px solid rgba(255,255,255,0.22)'};` +
      `transition:transform 0.1s,box-shadow 0.1s;` +
      `display:flex;align-items:center;justify-content:center;` +
      `font-size:11px;font-weight:bold;color:${dotTextColor(unitColor(u))};line-height:1;`;
    dot.textContent = String(u.level ?? 1);
    dot.title = `${u.name ?? '?'} · ${variantLabel(u)} · Lv ${u.level ?? 1}` +
                (isUnassigned ? ' — unassigned' : '');
    dot.draggable = true;

    dot.addEventListener('dragstart', e => {
      draggingUnitRef.unit = u;
      e.dataTransfer.setData('text/plain', String(u.id));
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => { dot.style.opacity = '0.35'; }, 0);
    });
    dot.addEventListener('dragend', () => {
      draggingUnitRef.unit = null;
      dot.style.opacity = '1';
    });
    dot.addEventListener('dblclick', () => showDetailModal(u, gs));
    dot.addEventListener('mouseover', () => {
      dot.style.transform = 'scale(1.4)';
      dot.style.boxShadow = `0 0 7px ${unitColor(u)}99`;
      dot.style.zIndex = '2';
    });
    dot.addEventListener('mouseout', () => {
      dot.style.transform = '';
      dot.style.boxShadow = '';
      dot.style.zIndex = '';
    });
    return dot;
  }

  // ── Zone cell factory ─────────────────────────────────────────────────────────
  function makeZoneCell(zoneKey, units, bgCss, borderRight, labelText, labelColor, minH, alignEnd) {
    const cell = document.createElement('div');
    cell.style.cssText =
      bgCss +
      (borderRight ? 'border-right:1px solid #2a2010;' : '') +
      'box-sizing:border-box;position:relative;';

    if (labelText) {
      const lbl = document.createElement('div');
      lbl.style.cssText =
        `padding:3px 10px 0;font-size:9px;letter-spacing:0.1em;` +
        `text-transform:uppercase;color:${labelColor};`;
      lbl.textContent = labelText;
      cell.appendChild(lbl);
    }

    const cluster = document.createElement('div');
    cluster.style.cssText =
      `display:flex;flex-wrap:wrap;gap:4px;padding:5px 10px 7px;` +
      (alignEnd ? 'align-content:flex-end;' : 'align-content:flex-start;') +
      `min-height:${minH ?? 76}px;`;
    for (const u of units) cluster.appendChild(makeDot(u, false));
    if (units.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText =
        'font-size:11px;color:#2e2416;font-style:italic;width:100%;text-align:center;padding-top:8px;';
      empty.textContent = 'Empty';
      cluster.appendChild(empty);
    }
    cell.appendChild(cluster);

    // Drop target events
    cell.addEventListener('dragover', e => {
      e.preventDefault();
      const du = draggingUnitRef.unit;
      const valid = !du || canDropOnZone(du, zoneKey);
      cell.style.outline = valid ? '2px solid #c9a84c' : '2px solid #7a2020';
      cell.style.outlineOffset = '-2px';
    });
    cell.addEventListener('dragleave', e => {
      if (!cell.contains(e.relatedTarget)) cell.style.outline = '';
    });
    cell.addEventListener('drop', e => {
      e.preventDefault();
      cell.style.outline = '';
      const unitId = e.dataTransfer.getData('text/plain');
      const unit = allCombatants.find(u => String(u.id) === unitId);
      if (!unit || !canDropOnZone(unit, zoneKey)) return;
      onAssign(unit.id, zoneKey);
    });

    return cell;
  }

  // ── Wall: canvas with interactive drop zone overlay ────────────────────────
  // Units drop directly onto the wall canvas sections — no separate zone above.
  const wallKeys   = ['wallLeft', 'wallCenter', 'wallRight'];
  const wallLabels = ['Wall Left', 'Wall Center', 'Wall Right'];

  const wallContainer = document.createElement('div');
  wallContainer.style.cssText = 'position:relative;width:100%;min-height:70px;';

  const canvasWrap = document.createElement('div');
  canvasWrap.style.cssText = 'width:100%;';
  const wallCanvas = document.createElement('canvas');
  wallCanvas.style.cssText = 'display:block;width:100%;';
  canvasWrap.appendChild(wallCanvas);
  wallContainer.appendChild(canvasWrap);

  // Three transparent sections overlaid on the canvas — each is a drop target
  const wallOverlay = document.createElement('div');
  wallOverlay.style.cssText =
    'position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr 1fr;pointer-events:none;';

  for (let i = 0; i < 3; i++) {
    const zoneKey = wallKeys[i];
    const section = document.createElement('div');
    section.style.cssText =
      'pointer-events:auto;display:flex;flex-wrap:wrap;gap:3px;' +
      'align-content:flex-start;padding:4px 6px;' +
      (i < 2 ? 'border-right:1px solid rgba(255,255,255,0.06);' : '');

    for (const u of groups[zoneKey]) section.appendChild(makeDot(u, false));

    section.addEventListener('dragover', e => {
      e.preventDefault();
      const du = draggingUnitRef.unit;
      const valid = !du || canDropOnZone(du, zoneKey);
      section.style.backgroundColor = valid ? 'rgba(201,168,76,0.14)' : 'rgba(122,32,32,0.22)';
      section.style.outline = valid ? '2px solid #c9a84c' : '2px solid #7a2020';
      section.style.outlineOffset = '-2px';
    });
    section.addEventListener('dragleave', e => {
      if (!section.contains(e.relatedTarget)) {
        section.style.backgroundColor = '';
        section.style.outline = '';
      }
    });
    section.addEventListener('drop', e => {
      e.preventDefault();
      section.style.backgroundColor = '';
      section.style.outline = '';
      const unitId = e.dataTransfer.getData('text/plain');
      const unit = allCombatants.find(u => String(u.id) === unitId);
      if (!unit || !canDropOnZone(unit, zoneKey)) return;
      onAssign(unit.id, zoneKey);
    });

    wallOverlay.appendChild(section);
  }
  wallContainer.appendChild(wallOverlay);
  container.appendChild(wallContainer);

  // ── Row 3: Engineer field ───────────────────────────────────────────────────
  const engGrid = document.createElement('div');
  engGrid.style.cssText =
    'display:grid;grid-template-columns:1fr 1fr 1fr;' +
    'border-top:1px solid #1a2a18;border-bottom:1px solid #1a2a18;';

  const engKeys = ['engineerLeft', 'engineerCenter', 'engineerRight'];
  for (let i = 0; i < 3; i++) {
    engGrid.appendChild(makeZoneCell(
      engKeys[i], groups[engKeys[i]],
      'background:#101510;', i < 2, 'Engineer Field', '#2a4a2a', 44, false,
    ));
  }
  container.appendChild(engGrid);

  // ── Row 4: Reserve zones ────────────────────────────────────────────────────
  const resGrid = document.createElement('div');
  resGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;';

  const resKeys   = ['reserveLeft', 'reserveCenter', 'reserveRight'];
  const resLabels = ['Reserve Left', 'Reserve Center', 'Reserve Right'];
  for (let i = 0; i < 3; i++) {
    resGrid.appendChild(makeZoneCell(
      resKeys[i], groups[resKeys[i]],
      'background:#0e1016;', i < 2, resLabels[i], '#2a3a5a', 76, false,
    ));
  }
  container.appendChild(resGrid);

  // ── Unassigned strip ────────────────────────────────────────────────────────
  const unassignedZone = document.createElement('div');
  unassignedZone.style.cssText =
    'background:#111008;border-top:1px solid #2a2010;padding:5px 10px 8px;min-height:40px;';

  const unassignedLbl = document.createElement('div');
  unassignedLbl.style.cssText =
    'font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:#5a4010;margin-bottom:5px;';
  unassignedLbl.textContent = unassigned.length > 0
    ? `Unassigned (${unassigned.length}) — drag to a zone above`
    : 'Unassigned — none';
  unassignedZone.appendChild(unassignedLbl);

  const unassignedCluster = document.createElement('div');
  unassignedCluster.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;';
  for (const u of unassigned) unassignedCluster.appendChild(makeDot(u, true));
  unassignedZone.appendChild(unassignedCluster);

  unassignedZone.addEventListener('dragover', e => {
    e.preventDefault();
    unassignedZone.style.outline = '2px solid #c9a84c';
    unassignedZone.style.outlineOffset = '-2px';
  });
  unassignedZone.addEventListener('dragleave', e => {
    if (!unassignedZone.contains(e.relatedTarget)) unassignedZone.style.outline = '';
  });
  unassignedZone.addEventListener('drop', e => {
    e.preventDefault();
    unassignedZone.style.outline = '';
    const unitId = e.dataTransfer.getData('text/plain');
    const unit = allCombatants.find(u => String(u.id) === unitId);
    if (!unit) return;
    onAssign(unit.id, null);
  });
  container.appendChild(unassignedZone);

  // ── Class legend ────────────────────────────────────────────────────────────
  const legend = document.createElement('div');
  legend.style.cssText =
    'display:flex;flex-wrap:wrap;gap:14px;padding:7px 10px;' +
    'border-top:1px solid #1e1a10;background:#111008;';
  const variantsPresent = new Map();
  for (const u of allCombatants) {
    const key = u.class + ':' + (u.specialization ?? '');
    if (!variantsPresent.has(key))
      variantsPresent.set(key, { color: unitColor(u), label: variantLabel(u) });
  }
  for (const [, { color, label }] of [...variantsPresent].sort(([a], [b]) => a.localeCompare(b))) {
    const item = document.createElement('div');
    item.style.cssText = 'display:flex;align-items:center;gap:5px;font-size:12px;color:#6a5a3a;';
    item.innerHTML =
      `<span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block;` +
      `flex-shrink:0;border:1px solid rgba(255,255,255,0.12);"></span>` + label;
    legend.appendChild(item);
  }
  container.appendChild(legend);

  return { el: container, canvas: wallCanvas, canvasWrap };
}

// ── Main render ───────────────────────────────────────────────────────────────

export function render(gs, wizardState, contentEl, wizard) {
  if (!wizardState.personnelState) {
    wizardState.personnelState = { sortCol: 'class', sortDir: 'asc', filter: '' };
  }
  const pState = wizardState.personnelState;

  const allCombatants = gs.roster.filter(u => !u.dead && !NON_COMBATANT_CLASSES.has(u.class));

  for (const u of allCombatants) {
    if (!(u.id in wizardState.assignments)) {
      wizardState.assignments[u.id] = u.assignment ?? null;
    }
  }


  function allAssigned() {
    return allCombatants.every(u => !!wizardState.assignments[u.id]);
  }
  function refreshNextButton() { wizard.setNextEnabled(allAssigned()); }

  // Persists across grid rebuilds so dragover can read the in-flight unit
  const draggingUnitRef = { unit: null };
  // Tracks the ResizeObserver so we can disconnect before each rebuild
  let wallObserver = null;
  // Blank spending so the canvas shows current wall state (no pending upgrades)
  const fakeSpending = { wallUpgrades: {}, wallRepairs: {} };

  // ── Top: visual grid wrapper ────────────────────────────────────────────────
  const gridWrapper = document.createElement('div');
  contentEl.appendChild(gridWrapper);

  function refreshGrid() {
    draggingUnitRef.unit = null;
    if (wallObserver) { wallObserver.disconnect(); wallObserver = null; }
    gridWrapper.innerHTML = '';
    const { el, canvas, canvasWrap } = buildVisualGrid(
      allCombatants, wizardState, gs, onAssign, draggingUnitRef,
    );
    gridWrapper.appendChild(el);
    requestAnimationFrame(() => drawAllWalls(canvas, gs, fakeSpending));
    wallObserver = new ResizeObserver(() => drawAllWalls(canvas, gs, fakeSpending));
    wallObserver.observe(canvasWrap);
  }

  // ── Capacity warnings ───────────────────────────────────────────────────────
  const warnDiv = document.createElement('div');
  warnDiv.style.cssText =
    'background:#201408;border:1px solid #5a3010;padding:10px 14px;' +
    'font-size:13px;color:#c08040;margin-bottom:10px;display:none;';
  contentEl.appendChild(warnDiv);

  function updateWarnings() {
    const w = capacityWarnings(wizardState.assignments);
    if (w.length > 0) {
      warnDiv.style.display = 'block';
      warnDiv.innerHTML = '⚠ Capacity warning: ' + w.join(' &nbsp;·&nbsp; ');
    } else {
      warnDiv.style.display = 'none';
    }
  }

  // ── Filter + assign-btn controls ────────────────────────────────────────────
  const controls = document.createElement('div');
  controls.style.cssText = 'display:flex;gap:12px;align-items:center;margin-bottom:14px;';

  const filterInput = document.createElement('input');
  filterInput.type        = 'text';
  filterInput.placeholder = 'Filter by name or class…';
  filterInput.value       = pState.filter;
  filterInput.style.cssText =
    'background:#0f0d08;border:1px solid #3a2a10;color:#e0d4b0;' +
    'font-family:Georgia,serif;font-size:13px;padding:6px 10px;' +
    'border-radius:3px;flex:1;max-width:280px;';

  const countLabel = document.createElement('span');
  countLabel.style.cssText = 'font-size:12px;color:#6a5a3a;margin-left:auto;';

  const assignBtnSlot = document.createElement('span');
  controls.appendChild(filterInput);
  controls.appendChild(assignBtnSlot);
  controls.appendChild(countLabel);
  contentEl.appendChild(controls);

  // ── Bottom: scrollable table ─────────────────────────────────────────────────
  const tableWrapper = document.createElement('div');
  tableWrapper.style.cssText = 'max-height:320px;overflow-y:auto;';

  const table = document.createElement('table');
  table.style.cssText = 'width:100%;border-collapse:collapse;font-size:14px;';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.style.cssText = 'border-bottom:1px solid #3a2a10;';

  const COLUMNS = [
    { key: 'name',   label: 'Name',       width: '20%', sortable: true  },
    { key: 'class',  label: 'Class',      width: '10%', sortable: true  },
    { key: 'year',   label: 'Yr',         width: '5%',  sortable: true  },
    { key: 'level',  label: 'Lv',         width: '5%',  sortable: true  },
    { key: 'hp',     label: 'HP',         width: '6%',  sortable: true  },
    { key: 'dmg',    label: 'Dmg',        width: '6%',  sortable: true  },
    { key: 'assign', label: 'Assignment', width: '1%',  sortable: true  },
    { key: 'detail', label: '',           width: '8%',  sortable: false },
  ];

  for (const col of COLUMNS) {
    const th = document.createElement('th');
    th.style.cssText =
      `text-align:left;padding:7px 10px;font-size:11px;letter-spacing:0.08em;` +
      `text-transform:uppercase;color:${col.sortable ? '#6a5a3a' : '#3a2a10'};` +
      `width:${col.width};` +
      (col.sortable ? 'cursor:pointer;user-select:none;' : '');
    th.textContent = col.label;
    if (col.sortable) {
      th.onclick = () => {
        if (pState.sortCol === col.key) {
          pState.sortDir = pState.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          pState.sortCol = col.key;
          pState.sortDir = 'asc';
        }
        renderRows();
      };
    }
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  table.appendChild(tbody);
  tableWrapper.appendChild(table);
  contentEl.appendChild(tableWrapper);

  // ── Shared assignment callback (grid ↔ table sync) ──────────────────────────
  function onAssign(unitId, zoneKey) {
    wizardState.assignments[unitId] = zoneKey || null;
    refreshGrid();
    renderRows();
    updateWarnings();
    refreshNextButton();
  }

  // ── Table row rendering ──────────────────────────────────────────────────────
  function getSortValue(u, col) {
    switch (col) {
      case 'name':   return (u.name ?? '').toLowerCase();
      case 'class':  return u.class ?? '';
      case 'year':   return u.yearOfService ?? 0;
      case 'level':  return u.level ?? 1;
      case 'hp':     return computeEffectiveDef(u, gs).hp;
      case 'dmg':    return computeEffectiveDef(u, gs).dmg;
      case 'assign': return ASSIGNMENT_SORT_ORDER[wizardState.assignments[u.id]] ?? 99;
      default:       return '';
    }
  }

  function renderRows() {
    const filter = pState.filter.toLowerCase().trim();
    let units = [...allCombatants].filter(u =>
      !filter ||
      (u.name ?? '').toLowerCase().includes(filter) ||
      (u.class ?? '').toLowerCase().includes(filter)
    );
    units.sort((a, b) => {
      const av = getSortValue(a, pState.sortCol);
      const bv = getSortValue(b, pState.sortCol);
      const cmp = typeof av === 'number' ? av - bv : av.localeCompare(bv);
      return pState.sortDir === 'asc' ? cmp : -cmp;
    });

    for (const th of headerRow.children) {
      const col = COLUMNS.find(c =>
        c.label === th.textContent.replace(/[▲▼]/g, '').trim() ||
        (th.textContent === '' && c.key === 'detail')
      );
      if (col && col.sortable) {
        th.textContent = col.label + (pState.sortCol === col.key
          ? (pState.sortDir === 'asc' ? ' ▲' : ' ▼') : '');
        th.style.color = pState.sortCol === col.key ? '#c9a84c' : '#6a5a3a';
      }
    }

    countLabel.textContent = `${units.length} of ${allCombatants.length} soldiers`;
    tbody.innerHTML = '';

    for (const u of units) {
      const isNew          = !!u.isNewRecruit;
      const reserveOnly    = RESERVE_ONLY_CLASSES.has(u.class);
      const isEngineerUnit = ENGINEER_ONLY_CLASSES.has(u.class);

      const tr = document.createElement('tr');
      tr.style.cssText = 'border-bottom:1px solid #1e1408;' + (isNew ? 'background:#1e1a08;' : '');

      const tdName = document.createElement('td');
      tdName.style.cssText = 'padding:8px 10px;color:#c8bfa0;';
      tdName.innerHTML = isNew
        ? `${u.name ?? '—'} <span style="font-size:11px;color:#8a7a30;letter-spacing:0.05em;">NEW</span>`
        : (u.name ?? '—');

      const tdClass = document.createElement('td');
      tdClass.style.cssText = 'padding:8px 10px;';
      if (u.specialization) {
        const specPaths = SPECIALIZATION_DEFS[u.class]?.paths ?? [];
        const specPath  = specPaths.find(p => p.id === u.specialization);
        const specLbl   = specPath?.label ?? u.specialization;
        const specColor = specPath ? '#' + specPath.color.toString(16).padStart(6, '0') : '#aaaaaa';
        tdClass.innerHTML =
          `<div style="font-weight:600;color:${specColor};line-height:1.2;">${specLbl}</div>` +
          `<div style="font-size:11px;color:#5a4a2a;margin-top:1px;">${classLabel(u.class ?? '')}</div>`;
      } else {
        tdClass.style.color = '#8a7a5a';
        tdClass.textContent = classLabel(u.class ?? '');
      }

      const tdYear = document.createElement('td');
      tdYear.style.cssText = 'padding:8px 10px;color:#6a5a3a;text-align:center;';
      tdYear.textContent = (u.yearOfService ?? 0) + 1;

      const tdLevel = document.createElement('td');
      tdLevel.style.cssText = 'padding:8px 10px;color:#6a5a3a;text-align:center;';
      tdLevel.textContent = u.level ?? 1;

      const effStats = computeEffectiveDef(u, gs);
      const tdHp = document.createElement('td');
      tdHp.style.cssText = 'padding:8px 6px;color:#8a9a6a;text-align:center;font-size:13px;';
      tdHp.textContent = Math.round(effStats.hp);
      const tdDmg = document.createElement('td');
      tdDmg.style.cssText = 'padding:8px 6px;color:#9a7a5a;text-align:center;font-size:13px;';
      tdDmg.textContent = Math.round(effStats.dmg);

      const tdAssign = document.createElement('td');
      tdAssign.style.cssText = 'padding:6px 6px;white-space:nowrap;';
      const sel = document.createElement('select');
      sel.style.cssText =
        'background:#0f0d08;border:1px solid #3a2a10;color:#c8bfa0;' +
        'font-family:Georgia,serif;font-size:13px;padding:4px 6px;width:155px;' +
        'border-radius:3px;cursor:pointer;';

      const blankOpt = document.createElement('option');
      blankOpt.value       = '';
      blankOpt.textContent = '— Assign —';
      blankOpt.style.color = '#5a4a2a';
      sel.appendChild(blankOpt);

      for (const opt of ASSIGNMENT_OPTIONS) {
        if (isEngineerUnit && !opt.engineerOnly) continue;
        if (!isEngineerUnit && opt.engineerOnly) continue;
        if (opt.wallOnly && reserveOnly) continue;
        const o = document.createElement('option');
        o.value       = opt.value;
        o.textContent = opt.label;
        sel.appendChild(o);
      }

      sel.value    = wizardState.assignments[u.id] ?? '';
      sel.onchange = () => onAssign(u.id, sel.value);
      tdAssign.appendChild(sel);

      const tdDetail = document.createElement('td');
      tdDetail.style.cssText = 'padding:6px 10px;text-align:right;';
      const detailBtn = document.createElement('button');
      detailBtn.textContent = 'Detail';
      detailBtn.style.cssText =
        'background:#2a2010;border:1px solid #4a3818;color:#8a7a5a;' +
        'font-family:Georgia,serif;font-size:12px;padding:4px 10px;' +
        'cursor:pointer;border-radius:3px;';
      detailBtn.onmouseover = () => { detailBtn.style.color = '#c9a84c'; };
      detailBtn.onmouseout  = () => { detailBtn.style.color = '#8a7a5a'; };
      detailBtn.onclick     = () => showDetailModal(u, gs);
      tdDetail.appendChild(detailBtn);

      tr.appendChild(tdName);  tr.appendChild(tdClass);
      tr.appendChild(tdYear);  tr.appendChild(tdLevel);
      tr.appendChild(tdHp);    tr.appendChild(tdDmg);
      tr.appendChild(tdAssign); tr.appendChild(tdDetail);
      tbody.appendChild(tr);
    }

    if (units.length === 0) {
      const emptyRow = document.createElement('tr');
      const emptyTd  = document.createElement('td');
      emptyTd.colSpan = 8;
      emptyTd.style.cssText = 'padding:20px 10px;color:#4a3a2a;font-style:italic;text-align:center;';
      emptyTd.textContent = filter ? 'No soldiers match this filter.' : 'No combatants to deploy.';
      emptyRow.appendChild(emptyTd);
      tbody.appendChild(emptyRow);
    }
  }

  filterInput.oninput = () => { pState.filter = filterInput.value; renderRows(); };

  // ── "Fill evenly" button ─────────────────────────────────────────────────────
  const assignBtn = document.createElement('button');
  assignBtn.className = 'os-btn';
  assignBtn.textContent = 'Fill evenly';
  assignBtn.style.cssText = 'white-space:nowrap;padding:5px 10px;font-size:12px;';
  assignBtnSlot.replaceWith(assignBtn);
  assignBtn.onclick = () => {
    const wallOpts    = ['wallLeft', 'wallCenter', 'wallRight'];
    const reserveOpts = ['reserveLeft', 'reserveCenter', 'reserveRight'];
    const engineerOpts = ['engineerLeft', 'engineerCenter', 'engineerRight'];
    const wallClasses = new Set(['archer', 'mage', 'healer']);
    const counts = countsByAssignment(wizardState.assignments);
    for (const u of allCombatants) {
      if (wizardState.assignments[u.id]) continue;
      const opts = ENGINEER_ONLY_CLASSES.has(u.class) ? engineerOpts :
                   RESERVE_ONLY_CLASSES.has(u.class)  ? reserveOpts  :
                   wallClasses.has(u.class)            ? wallOpts     : reserveOpts;
      const best = opts.reduce((a, b) => (counts[a] || 0) <= (counts[b] || 0) ? a : b);
      wizardState.assignments[u.id] = best;
      counts[best] = (counts[best] || 0) + 1;
    }
    refreshGrid();
    renderRows();
    updateWarnings();
    refreshNextButton();
  };

  // ── Initial render ───────────────────────────────────────────────────────────
  refreshGrid();
  renderRows();
  updateWarnings();
  refreshNextButton();
}
