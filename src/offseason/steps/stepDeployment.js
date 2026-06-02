// Step 7 — Deployment Preview (GDD Section IV Step 7)
// Read-only schematic: enemy approach at top, wall sections across middle,
// reserve zones below — mirroring the battle map layout.
// Back returns to Step 6 with all assignments intact.

import { UNIT_DEFS } from '../../data/units.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const CLASS_COLORS = Object.fromEntries(
  Object.entries(UNIT_DEFS).map(([cls, def]) => [
    cls, '#' + (def.color >>> 0).toString(16).padStart(6, '0'),
  ])
);

function classLabel(cls) {
  return cls.charAt(0).toUpperCase() + cls.slice(1);
}

function wallSectionKey(assignKey) {
  // 'wallLeft' → 'left'
  return assignKey.replace('wall', '').toLowerCase();
}

// ── Chip renderer ─────────────────────────────────────────────────────────────

function makeChip(unit) {
  const chip = document.createElement('div');
  chip.style.cssText =
    'display:flex;align-items:center;gap:6px;padding:3px 0;';

  const dot = document.createElement('span');
  dot.style.cssText =
    `width:8px;height:8px;border-radius:50%;flex-shrink:0;` +
    `background:${CLASS_COLORS[unit.class] ?? '#888'};`;

  const name = document.createElement('span');
  name.style.cssText = 'font-size:12px;color:#b0a888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
  name.title = `${unit.name} — ${classLabel(unit.class)}`;
  name.textContent = unit.name ?? '—';

  chip.appendChild(dot);
  chip.appendChild(name);
  return chip;
}

// ── Section card ──────────────────────────────────────────────────────────────

function makeCard(title, units, opts = {}) {
  const card = document.createElement('div');
  card.style.cssText =
    `background:${opts.bg ?? '#181410'};` +
    `border:1px solid ${opts.border ?? '#2a2010'};` +
    `padding:10px 12px;min-height:${opts.minH ?? 120}px;`;

  const titleEl = document.createElement('div');
  titleEl.style.cssText =
    `font-size:11px;letter-spacing:0.1em;text-transform:uppercase;` +
    `color:${opts.titleColor ?? '#6a5a3a'};margin-bottom:8px;padding-bottom:6px;` +
    `border-bottom:1px solid ${opts.border ?? '#2a2010'};`;
  titleEl.textContent = title;
  card.appendChild(titleEl);

  if (units.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'font-size:12px;color:#3a2e1a;font-style:italic;';
    empty.textContent = 'Empty';
    card.appendChild(empty);
  } else {
    const list = document.createElement('div');
    list.style.cssText = 'max-height:160px;overflow-y:auto;';
    for (const u of units) list.appendChild(makeChip(u));
    card.appendChild(list);

    const count = document.createElement('div');
    count.style.cssText = 'font-size:11px;color:#4a3a22;margin-top:6px;';
    count.textContent = `${units.length} unit${units.length !== 1 ? 's' : ''}`;
    card.appendChild(count);
  }

  return card;
}

// ── Main render ───────────────────────────────────────────────────────────────

export function render(gs, wizardState, contentEl) {
  // Group units by assignment
  const groups = {
    wallLeft: [], wallCenter: [], wallRight: [],
    reserveLeft: [], reserveCenter: [], reserveRight: [],
  };
  const unassigned = [];

  const combatants = gs.roster.filter(u => !u.dead && u.class !== 'mason' && u.class !== 'scout');
  for (const u of combatants) {
    const key = wizardState.assignments[u.id];
    if (key && key in groups) {
      groups[key].push(u);
    } else {
      unassigned.push(u);
    }
  }

  // ── Enemy approach strip ───────────────────────────────────────────────────
  const enemyStrip = document.createElement('div');
  enemyStrip.style.cssText =
    'background:#150808;border:1px solid #3a1010;padding:8px 12px;' +
    'text-align:center;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;' +
    'color:#4a2020;margin-bottom:3px;';
  enemyStrip.textContent = '← Enemy Approach →';
  contentEl.appendChild(enemyStrip);

  // ── Wall section grid ──────────────────────────────────────────────────────
  const wallGrid = document.createElement('div');
  wallGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;margin-bottom:4px;';

  for (const key of ['wallLeft', 'wallCenter', 'wallRight']) {
    const secName = wallSectionKey(key);
    const seg     = gs.wallSegments.find(s => s.section === secName);
    const hpPct   = seg ? seg.hp / seg.maxHp : 1;
    const hpColor = hpPct > 0.5 ? '#4a7a2a' : hpPct > 0.25 ? '#9a6010' : '#8a2020';
    const label   = { wallLeft: 'Wall Left', wallCenter: 'Wall Center', wallRight: 'Wall Right' }[key];

    const card = makeCard(label, groups[key], {
      bg: '#1a1a10', border: '#4a4020', titleColor: '#c9a84c',
    });

    // HP bar
    if (seg) {
      const barWrap = document.createElement('div');
      barWrap.style.cssText = 'height:4px;background:#0f0d08;border-radius:2px;margin-bottom:6px;overflow:hidden;';
      const fill = document.createElement('div');
      fill.style.cssText = `height:100%;width:${Math.max(0, hpPct * 100)}%;background:${hpColor};border-radius:2px;`;
      barWrap.appendChild(fill);
      card.insertBefore(barWrap, card.children[1]); // after title

      const hpLabel = document.createElement('div');
      hpLabel.style.cssText = 'font-size:11px;color:#5a4a2a;margin-bottom:8px;';
      hpLabel.textContent = `Lv ${seg.level} · ${seg.hp}/${seg.maxHp} HP`;
      card.insertBefore(hpLabel, card.children[2]);
    }

    wallGrid.appendChild(card);
  }
  contentEl.appendChild(wallGrid);

  // ── Wall bar ───────────────────────────────────────────────────────────────
  const wallBar = document.createElement('div');
  wallBar.style.cssText =
    'background:#4a4a4a;padding:6px 12px;text-align:center;' +
    'font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#c8bfa0;' +
    'margin-bottom:4px;';
  wallBar.textContent = '— THE WALL —';
  contentEl.appendChild(wallBar);

  // ── Reserve section grid ───────────────────────────────────────────────────
  const reserveGrid = document.createElement('div');
  reserveGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;margin-bottom:20px;';

  for (const key of ['reserveLeft', 'reserveCenter', 'reserveRight']) {
    const label = { reserveLeft: 'Reserve Left', reserveCenter: 'Reserve Center', reserveRight: 'Reserve Right' }[key];
    reserveGrid.appendChild(
      makeCard(label, groups[key], { bg: '#10141a', border: '#1a2a3a', titleColor: '#4a6a8a', minH: 100 })
    );
  }
  contentEl.appendChild(reserveGrid);

  // ── Summary row ────────────────────────────────────────────────────────────
  const totalWall    = groups.wallLeft.length + groups.wallCenter.length + groups.wallRight.length;
  const totalReserve = groups.reserveLeft.length + groups.reserveCenter.length + groups.reserveRight.length;

  const summary = document.createElement('div');
  summary.style.cssText =
    'display:flex;gap:24px;font-size:13px;color:#6a5a3a;padding:12px 0;' +
    'border-top:1px solid #2a1e08;';

  const items = [
    `Wall: <strong style="color:#c9a84c">${totalWall}</strong> units`,
    `Reserve: <strong style="color:#4a7aaa">${totalReserve}</strong> units`,
    `Total: <strong style="color:#c8bfa0">${totalWall + totalReserve}</strong> combatants`,
  ];
  if (unassigned.length > 0) {
    items.push(`<span style="color:#aa4a2a">⚠ ${unassigned.length} unassigned</span>`);
  }

  summary.innerHTML = items.join('<span style="color:#2a1e08"> &nbsp;·&nbsp; </span>');
  contentEl.appendChild(summary);

  // ── Class legend ───────────────────────────────────────────────────────────
  const legend = document.createElement('div');
  legend.style.cssText = 'display:flex;flex-wrap:wrap;gap:14px;margin-top:8px;';

  const classesPresent = [...new Set(combatants.map(u => u.class))].sort();
  for (const cls of classesPresent) {
    const item = document.createElement('div');
    item.style.cssText = 'display:flex;align-items:center;gap:5px;font-size:12px;color:#6a5a3a;';
    item.innerHTML =
      `<span style="width:8px;height:8px;border-radius:50%;background:${CLASS_COLORS[cls] ?? '#888'};display:inline-block;flex-shrink:0;"></span>` +
      classLabel(cls);
    legend.appendChild(item);
  }
  contentEl.appendChild(legend);
}
