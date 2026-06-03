// Step 7 — Deployment Preview (GDD Section IV Step 7)
// Visual schematic: enemy approach at top, wall sections as stone bands,
// units shown as colored dots on/behind the wall. Read-only.

import { UNIT_DEFS } from '../../data/units.js';

const CLASS_COLORS = Object.fromEntries(
  Object.entries(UNIT_DEFS).map(([cls, def]) => [
    cls, '#' + (def.color >>> 0).toString(16).padStart(6, '0'),
  ])
);

function classLabel(cls) {
  return cls.charAt(0).toUpperCase() + cls.slice(1);
}

// Renders a cluster of colored dots for a unit list
function makeDotCluster(units, opts = {}) {
  const el = document.createElement('div');
  el.style.cssText =
    'display:flex;flex-wrap:wrap;gap:4px;padding:10px 10px;' +
    (opts.alignEnd ? 'align-content:flex-end;' : 'align-content:flex-start;') +
    'min-height:' + (opts.minH ?? 110) + 'px;';

  for (const u of units) {
    const dot = document.createElement('div');
    dot.style.cssText =
      `width:13px;height:13px;border-radius:50%;flex-shrink:0;` +
      `background:${CLASS_COLORS[u.class] ?? '#888'};` +
      `border:1px solid rgba(255,255,255,0.12);cursor:default;`;
    dot.title = `${u.name ?? '?'} · ${classLabel(u.class)} · Lv ${u.level ?? 1}`;
    el.appendChild(dot);
  }

  if (units.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'font-size:11px;color:#2e2416;font-style:italic;width:100%;text-align:center;padding-top:12px;';
    empty.textContent = 'Empty';
    el.appendChild(empty);
  }

  return el;
}

// Stone wall segment band
function makeWallBand(seg, label, borderRight) {
  const band = document.createElement('div');
  band.style.cssText =
    'background:linear-gradient(180deg,#505050 0%,#333 100%);' +
    'padding:6px 10px;box-sizing:border-box;' +
    (borderRight ? 'border-right:1px solid #1a1a1a;' : '') +
    'border-top:2px solid #666;border-bottom:2px solid #222;';

  const row1 = document.createElement('div');
  row1.style.cssText = 'display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;';

  const lbl = document.createElement('span');
  lbl.style.cssText = 'font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#aaa;font-weight:bold;';
  lbl.textContent = label;

  const lvl = document.createElement('span');
  lvl.style.cssText = 'font-size:10px;color:#888;';
  lvl.textContent = seg ? `Lv ${seg.level}` : 'Lv 1';

  row1.appendChild(lbl);
  row1.appendChild(lvl);
  band.appendChild(row1);

  if (seg) {
    const hpPct = Math.max(0, seg.hp / seg.maxHp);
    const hpColor = hpPct > 0.5 ? '#4a7a2a' : hpPct > 0.25 ? '#9a6010' : '#8a2020';

    const barWrap = document.createElement('div');
    barWrap.style.cssText = 'height:5px;background:#111;border-radius:2px;overflow:hidden;';
    const fill = document.createElement('div');
    fill.style.cssText = `height:100%;width:${hpPct * 100}%;background:${hpColor};`;
    barWrap.appendChild(fill);
    band.appendChild(barWrap);

    const hpTxt = document.createElement('div');
    hpTxt.style.cssText = 'font-size:10px;color:#666;margin-top:3px;text-align:right;';
    hpTxt.textContent = `${seg.hp} / ${seg.maxHp} HP`;
    band.appendChild(hpTxt);
  }

  return band;
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

  const sections     = ['Left', 'Center', 'Right'];
  const wallKeys     = ['wallLeft', 'wallCenter', 'wallRight'];
  const engineerKeys = ['engineerLeft', 'engineerCenter', 'engineerRight'];
  const reserveKeys  = ['reserveLeft', 'reserveCenter', 'reserveRight'];

  // ── Enemy approach strip ─────────────────────────────────────────────────
  const enemyStrip = document.createElement('div');
  enemyStrip.style.cssText =
    'background:#170a0a;border:1px solid #3a1010;border-bottom:none;' +
    'padding:6px 12px;text-align:center;font-size:11px;' +
    'letter-spacing:0.18em;text-transform:uppercase;color:#5a2020;';
  enemyStrip.textContent = '← Enemy Approach →';
  contentEl.appendChild(enemyStrip);

  // ── Schematic container ──────────────────────────────────────────────────
  // 3 columns × 4 rows: [wall units] / [wall] / [engineer field] / [reserve]
  const grid = document.createElement('div');
  grid.style.cssText =
    'display:grid;grid-template-columns:1fr 1fr 1fr;' +
    'border:1px solid #2a2010;border-top:none;overflow:hidden;margin-bottom:16px;';

  // Row 1 — units on the wall (dots flow upward from wall)
  for (let i = 0; i < 3; i++) {
    const cell = document.createElement('div');
    cell.style.cssText =
      'background:#141208;border-bottom:1px solid #1e1a10;' +
      (i < 2 ? 'border-right:1px solid #2a2010;' : '');
    cell.appendChild(makeDotCluster(groups[wallKeys[i]], { alignEnd: true, minH: 110 }));
    grid.appendChild(cell);
  }

  // Row 2 — wall segments (stone band)
  for (let i = 0; i < 3; i++) {
    const secName = sections[i].toLowerCase();
    const seg = gs.wallSegments?.find(s => s.section === secName) ?? null;
    grid.appendChild(makeWallBand(seg, sections[i], i < 2));
  }

  // Row 3 — engineer field positions (midway between wall and reserves)
  for (let i = 0; i < 3; i++) {
    const cell = document.createElement('div');
    cell.style.cssText =
      'background:#101510;border-top:1px solid #1a2a18;border-bottom:1px solid #1a2a18;' +
      (i < 2 ? 'border-right:1px solid #2a2010;' : '');
    const inner = document.createElement('div');
    inner.style.cssText = 'padding:4px 10px 2px;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:#2a4a2a;';
    inner.textContent = 'Engineer Field';
    cell.appendChild(inner);
    cell.appendChild(makeDotCluster(groups[engineerKeys[i]], { alignEnd: false, minH: 50 }));
    grid.appendChild(cell);
  }

  // Row 4 — reserves (dots flow downward from wall)
  for (let i = 0; i < 3; i++) {
    const cell = document.createElement('div');
    cell.style.cssText =
      'background:#0e1016;border-top:1px solid #1a2030;' +
      (i < 2 ? 'border-right:1px solid #2a2010;' : '');
    cell.appendChild(makeDotCluster(groups[reserveKeys[i]], { alignEnd: false, minH: 100 }));
    grid.appendChild(cell);
  }

  contentEl.appendChild(grid);

  // ── Summary row ───────────────────────────────────────────────────────────
  const totalWall     = wallKeys.reduce((s, k) => s + groups[k].length, 0);
  const totalEngineer = engineerKeys.reduce((s, k) => s + groups[k].length, 0);
  const totalReserve  = reserveKeys.reduce((s, k) => s + groups[k].length, 0);

  const summary = document.createElement('div');
  summary.style.cssText =
    'display:flex;gap:24px;font-size:13px;color:#6a5a3a;padding:10px 0;' +
    'border-top:1px solid #2a1e08;';

  const items = [
    `Wall: <strong style="color:#c9a84c">${totalWall}</strong> units`,
    ...(totalEngineer > 0 ? [`Engineer: <strong style="color:#6a9a6a">${totalEngineer}</strong> units`] : []),
    `Reserve: <strong style="color:#4a7aaa">${totalReserve}</strong> units`,
    `Total: <strong style="color:#c8bfa0">${totalWall + totalEngineer + totalReserve}</strong> combatants`,
  ];
  if (unassigned.length > 0) {
    items.push(`<span style="color:#aa4a2a">⚠ ${unassigned.length} unassigned</span>`);
  }
  summary.innerHTML = items.join('<span style="color:#2a1e08"> &nbsp;·&nbsp; </span>');
  contentEl.appendChild(summary);

  // ── Class legend ──────────────────────────────────────────────────────────
  const legend = document.createElement('div');
  legend.style.cssText = 'display:flex;flex-wrap:wrap;gap:14px;margin-top:6px;';

  const classesPresent = [...new Set(combatants.map(u => u.class))].sort();
  for (const cls of classesPresent) {
    const item = document.createElement('div');
    item.style.cssText = 'display:flex;align-items:center;gap:5px;font-size:12px;color:#6a5a3a;';
    item.innerHTML =
      `<span style="width:10px;height:10px;border-radius:50%;background:${CLASS_COLORS[cls] ?? '#888'};display:inline-block;flex-shrink:0;border:1px solid rgba(255,255,255,0.12);"></span>` +
      classLabel(cls);
    legend.appendChild(item);
  }
  contentEl.appendChild(legend);
}
