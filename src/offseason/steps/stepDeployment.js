// Step 7 — Deployment Preview (GDD Section IV Step 7)
// Read-only. Shows assigned units as numbered dots overlaid on the actual wall canvas,
// with engineer field and reserve zones below. Double-click any dot to view unit detail.

import { UNIT_DEFS, SPECIALIZATION_DEFS } from '../../data/units.js';
import { drawAllWalls }                    from './stepInvest.js';
import { PORTRAIT_BY_ID }                  from '../../data/portraits.js';
import { pickGreeting }                    from '../../data/greetings.js';
import { computeEffectiveDef }             from '../../battle/buildingBonuses.js';
import { makePortraitElement }             from '../portraitHelper.js';

const CLASS_COLORS = Object.fromEntries(
  Object.entries(UNIT_DEFS).map(([cls, def]) => [
    cls, '#' + (def.color >>> 0).toString(16).padStart(6, '0'),
  ])
);

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

function classLabel(cls) {
  return cls.charAt(0).toUpperCase() + cls.slice(1);
}

function dotTextColor(hexStr) {
  const hex = hexStr.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55
    ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)';
}

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
  bioDiv.style.cssText = 'font-size:14px;color:#8a7a5a;line-height:1.7;';
  bioDiv.textContent = unit.bio || 'No record available.';
  box.appendChild(bioDiv);

  backdrop.appendChild(box);
  document.body.appendChild(backdrop);
}

export function render(gs, wizardState, contentEl) {
  const groups = {
    wallLeft: [], wallCenter: [], wallRight: [],
    engineerLeft: [], engineerCenter: [], engineerRight: [],
    reserveLeft: [], reserveCenter: [], reserveRight: [],
  };
  const unassigned = [];

  const combatants = gs.roster.filter(u => !u.dead && u.class !== 'mason' && u.class !== 'scout');
  for (const u of combatants) {
    const key = wizardState.assignments[u.id];
    if (key && key in groups) groups[key].push(u);
    else unassigned.push(u);
  }

  function makeDot(u) {
    const el = document.createElement('div');
    el.style.cssText =
      `width:24px;height:24px;border-radius:50%;flex-shrink:0;cursor:default;` +
      `background:${unitColor(u)};border:1px solid rgba(255,255,255,0.22);` +
      `display:flex;align-items:center;justify-content:center;` +
      `font-size:11px;font-weight:bold;color:${dotTextColor(unitColor(u))};line-height:1;`;
    el.textContent = String(u.level ?? 1);
    el.title = `${u.name ?? '?'} · ${variantLabel(u)} · Lv ${u.level ?? 1} — double-click for detail`;
    el.addEventListener('dblclick', () => showDetailModal(u, gs));
    return el;
  }

  function makeDotCluster(units, opts = {}) {
    const el = document.createElement('div');
    el.style.cssText =
      'display:flex;flex-wrap:wrap;gap:4px;padding:8px 10px;' +
      (opts.alignEnd ? 'align-content:flex-end;' : 'align-content:flex-start;') +
      'min-height:' + (opts.minH ?? 90) + 'px;';
    for (const u of units) el.appendChild(makeDot(u));
    if (units.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText =
        'font-size:11px;color:#2e2416;font-style:italic;width:100%;text-align:center;padding-top:12px;';
      empty.textContent = 'Empty';
      el.appendChild(empty);
    }
    return el;
  }

  const wallKeys  = ['wallLeft',     'wallCenter',     'wallRight'];
  const engKeys   = ['engineerLeft', 'engineerCenter', 'engineerRight'];
  const resKeys   = ['reserveLeft',  'reserveCenter',  'reserveRight'];
  const resLabels = ['Reserve Left', 'Reserve Center', 'Reserve Right'];

  // ── Enemy approach strip ────────────────────────────────────────────────────
  const enemyStrip = document.createElement('div');
  enemyStrip.style.cssText =
    'background:#170a0a;border:1px solid #3a1010;border-bottom:none;' +
    'padding:6px 12px;text-align:center;font-size:11px;' +
    'letter-spacing:0.18em;text-transform:uppercase;color:#5a2020;';
  enemyStrip.textContent = '← Enemy Approach →';
  contentEl.appendChild(enemyStrip);

  // ── Outer frame ─────────────────────────────────────────────────────────────
  const frame = document.createElement('div');
  frame.style.cssText = 'border:1px solid #2a2010;border-top:none;overflow:hidden;margin-bottom:16px;';

  // ── Wall: canvas with unit dots overlaid ─────────────────────────────────────
  const wallContainer = document.createElement('div');
  wallContainer.style.cssText = 'position:relative;width:100%;min-height:70px;';

  const wallCanvas = document.createElement('canvas');
  wallCanvas.style.cssText = 'display:block;width:100%;';
  wallContainer.appendChild(wallCanvas);

  const wallOverlay = document.createElement('div');
  wallOverlay.style.cssText =
    'position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr 1fr;pointer-events:none;';

  for (let i = 0; i < 3; i++) {
    const section = document.createElement('div');
    section.style.cssText =
      'pointer-events:auto;display:flex;flex-wrap:wrap;gap:3px;' +
      'align-content:flex-start;padding:4px 6px;' +
      (i < 2 ? 'border-right:1px solid rgba(255,255,255,0.06);' : '');
    for (const u of groups[wallKeys[i]]) section.appendChild(makeDot(u));
    wallOverlay.appendChild(section);
  }
  wallContainer.appendChild(wallOverlay);
  frame.appendChild(wallContainer);

  // ── Engineer field ──────────────────────────────────────────────────────────
  const engGrid = document.createElement('div');
  engGrid.style.cssText =
    'display:grid;grid-template-columns:1fr 1fr 1fr;' +
    'border-top:1px solid #1a2a18;border-bottom:1px solid #1a2a18;';

  for (let i = 0; i < 3; i++) {
    const cell = document.createElement('div');
    cell.style.cssText = 'background:#101510;' + (i < 2 ? 'border-right:1px solid #2a2010;' : '');
    const lbl = document.createElement('div');
    lbl.style.cssText =
      'padding:4px 10px 2px;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:#2a4a2a;';
    lbl.textContent = 'Engineer Field';
    cell.appendChild(lbl);
    cell.appendChild(makeDotCluster(groups[engKeys[i]], { minH: 46 }));
    engGrid.appendChild(cell);
  }
  frame.appendChild(engGrid);

  // ── Reserve zones ───────────────────────────────────────────────────────────
  const resGrid = document.createElement('div');
  resGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;';

  for (let i = 0; i < 3; i++) {
    const cell = document.createElement('div');
    cell.style.cssText =
      'background:#0e1016;border-top:1px solid #1a2030;' + (i < 2 ? 'border-right:1px solid #2a2010;' : '');
    const lbl = document.createElement('div');
    lbl.style.cssText =
      'padding:4px 10px 2px;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:#2a3a5a;';
    lbl.textContent = resLabels[i];
    cell.appendChild(lbl);
    cell.appendChild(makeDotCluster(groups[resKeys[i]], { minH: 90 }));
    resGrid.appendChild(cell);
  }
  frame.appendChild(resGrid);

  contentEl.appendChild(frame);

  // Draw wall after DOM insertion; redraw on resize
  const fakeSpending = { wallUpgrades: {}, wallRepairs: {} };
  requestAnimationFrame(() => drawAllWalls(wallCanvas, gs, fakeSpending));
  const ro = new ResizeObserver(() => drawAllWalls(wallCanvas, gs, fakeSpending));
  ro.observe(wallContainer);

  // ── Summary row ─────────────────────────────────────────────────────────────
  const totalWall     = wallKeys.reduce((s, k) => s + groups[k].length, 0);
  const totalEngineer = engKeys.reduce((s, k)  => s + groups[k].length, 0);
  const totalReserve  = resKeys.reduce((s, k)  => s + groups[k].length, 0);

  const summary = document.createElement('div');
  summary.style.cssText =
    'display:flex;gap:24px;font-size:13px;color:#6a5a3a;padding:10px 0;' +
    'border-top:1px solid #2a1e08;';

  const items = [
    `Wall: <strong style="color:#c9a84c">${totalWall}</strong> units`,
    ...(totalEngineer > 0
      ? [`Engineer: <strong style="color:#6a9a6a">${totalEngineer}</strong> units`] : []),
    `Reserve: <strong style="color:#4a7aaa">${totalReserve}</strong> units`,
    `Total: <strong style="color:#c8bfa0">${totalWall + totalEngineer + totalReserve}</strong> combatants`,
  ];
  if (unassigned.length > 0)
    items.push(`<span style="color:#aa4a2a">⚠ ${unassigned.length} unassigned</span>`);

  summary.innerHTML = items.join('<span style="color:#2a1e08"> &nbsp;·&nbsp; </span>');
  contentEl.appendChild(summary);

  // ── Class legend ─────────────────────────────────────────────────────────────
  const legend = document.createElement('div');
  legend.style.cssText = 'display:flex;flex-wrap:wrap;gap:14px;margin-top:6px;';

  const variantsPresent = new Map();
  for (const u of combatants) {
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
  contentEl.appendChild(legend);
}
