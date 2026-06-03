// Step 6 — Personnel & Deployment Assignment (GDD Section IV Step 6)
// Sortable, filterable table of all combatants. Assignment dropdown per row.
// Next is blocked until every combatant has an assignment.
// Character detail modal opens on each row's Detail button.

import { PORTRAIT_BY_ID }               from '../../data/portraits.js';
import { pickGreeting }                  from '../../data/greetings.js';
import { WALL_SECTION_CAPACITY, RESERVE_SECTION_CAPACITY } from '../../data/constants.js';
import { computeEffectiveDef }           from '../../battle/buildingBonuses.js';
import { makePortraitElement }           from '../portraitHelper.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const ASSIGNMENT_OPTIONS = [
  { value: 'wallLeft',       label: 'Wall Left',     wallOnly: true,  engineerOnly: false },
  { value: 'wallCenter',     label: 'Wall Center',   wallOnly: true,  engineerOnly: false },
  { value: 'wallRight',      label: 'Wall Right',    wallOnly: true,  engineerOnly: false },
  { value: 'reserveLeft',    label: 'Reserve Left',  wallOnly: false, engineerOnly: false },
  { value: 'reserveCenter',  label: 'Reserve Center',wallOnly: false, engineerOnly: false },
  { value: 'reserveRight',   label: 'Reserve Right', wallOnly: false, engineerOnly: false },
  { value: 'engineerLeft',   label: 'Left',          wallOnly: false, engineerOnly: true  },
  { value: 'engineerCenter', label: 'Center',        wallOnly: false, engineerOnly: true  },
  { value: 'engineerRight',  label: 'Right',         wallOnly: false, engineerOnly: true  },
];

// Sort order for assignment values — wall sections first, engineer field, reserves, unassigned last
const ASSIGNMENT_SORT_ORDER = {
  wallLeft: 0, wallCenter: 1, wallRight: 2,
  engineerLeft: 3, engineerCenter: 4, engineerRight: 5,
  reserveLeft: 6, reserveCenter: 7, reserveRight: 8,
};

// Warriors and Captains cannot be placed on the wall
const RESERVE_ONLY_CLASSES = new Set(['warrior', 'captain']);
// Engineers deploy to their own midfield zone, not wall or reserve
const ENGINEER_ONLY_CLASSES = new Set(['engineer']);
// Masons and Scouts are not combat-deployed — excluded from this table
const NON_COMBATANT_CLASSES = new Set(['mason', 'scout']);

function classLabel(cls) {
  return cls.charAt(0).toUpperCase() + cls.slice(1);
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
  const counts  = countsByAssignment(assignments);
  const warnings = [];
  const wallOptions    = ['wallLeft', 'wallCenter', 'wallRight'];
  const reserveOptions = ['reserveLeft', 'reserveCenter', 'reserveRight'];
  const LABELS = { wallLeft:'Wall Left', wallCenter:'Wall Center', wallRight:'Wall Right',
                   reserveLeft:'Reserve Left', reserveCenter:'Reserve Center', reserveRight:'Reserve Right' };
  for (const key of wallOptions) {
    if ((counts[key] || 0) > WALL_SECTION_CAPACITY)
      warnings.push(`${LABELS[key]}: ${counts[key]} units (warning: over ${WALL_SECTION_CAPACITY})`);
  }
  for (const key of reserveOptions) {
    if ((counts[key] || 0) > RESERVE_SECTION_CAPACITY)
      warnings.push(`${LABELS[key]}: ${counts[key]} units (warning: over ${RESERVE_SECTION_CAPACITY})`);
  }
  return warnings;
}

// ── Modal ─────────────────────────────────────────────────────────────────────

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

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText =
    'position:absolute;top:14px;right:16px;background:none;border:none;' +
    'color:#6a5a3a;font-size:18px;cursor:pointer;';
  closeBtn.onclick = () => backdrop.remove();
  box.appendChild(closeBtn);

  // Portrait + name header
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

  // Greeting
  const greetDiv = document.createElement('div');
  greetDiv.style.cssText =
    'font-style:italic;color:#9a8a6a;font-size:14px;line-height:1.6;' +
    'border-left:2px solid #3a2a10;padding-left:14px;margin-bottom:20px;';
  greetDiv.textContent = `"${gs.commanderName ?? 'Commander'}, ${greeting}"`;
  box.appendChild(greetDiv);

  // Divider
  const hr = document.createElement('hr');
  hr.style.cssText = 'border:none;border-top:1px solid #2a1e08;margin-bottom:16px;';
  box.appendChild(hr);

  // Bio
  const bioDiv = document.createElement('div');
  bioDiv.style.cssText = 'font-size:14px;color:#8a7a5a;line-height:1.7;';
  bioDiv.textContent = unit.bio || 'No record available.';
  box.appendChild(bioDiv);

  backdrop.appendChild(box);
  document.body.appendChild(backdrop);
}

// ── Main render ───────────────────────────────────────────────────────────────

export function render(gs, wizardState, contentEl, wizard) {
  // Initialize sort/filter state (persists within this off-season session)
  if (!wizardState.personnelState) {
    wizardState.personnelState = { sortCol: 'name', sortDir: 'asc', filter: '' };
  }
  const pState = wizardState.personnelState;

  // All combatants (including new recruits generated in Step 5)
  const allCombatants = gs.roster.filter(u => !u.dead && !NON_COMBATANT_CLASSES.has(u.class));

  // Seed any units that arrived after wizard start (new recruits)
  for (const u of allCombatants) {
    if (!(u.id in wizardState.assignments)) {
      wizardState.assignments[u.id] = u.assignment ?? null;
    }
  }

  // Year 1 only: randomly assign all unassigned units so the player has a
  // reasonable starting deployment without needing to assign everyone manually.
  if (gs.year === 1 && !wizardState.autoAssignedYear1) {
    wizardState.autoAssignedYear1 = true;
    const wallOpts     = ['wallLeft', 'wallCenter', 'wallRight'];
    const reserveOpts  = ['reserveLeft', 'reserveCenter', 'reserveRight'];
    const engineerOpts = ['engineerLeft', 'engineerCenter', 'engineerRight'];
    const allOpts      = [...wallOpts, ...reserveOpts];
    for (const u of allCombatants) {
      if (!wizardState.assignments[u.id]) {
        const opts = ENGINEER_ONLY_CLASSES.has(u.class) ? engineerOpts :
                     RESERVE_ONLY_CLASSES.has(u.class)  ? reserveOpts  : allOpts;
        wizardState.assignments[u.id] = opts[Math.floor(Math.random() * opts.length)];
      }
    }
  }

  function allAssigned() {
    return allCombatants.every(u => !!wizardState.assignments[u.id]);
  }

  function refreshNextButton() {
    wizard.setNextEnabled(allAssigned());
  }

  // ── Filter + sort controls ─────────────────────────────────────────────────

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

  controls.appendChild(filterInput);
  controls.appendChild(countLabel);
  contentEl.appendChild(controls);

  // ── Capacity warning ───────────────────────────────────────────────────────

  const warnDiv = document.createElement('div');
  warnDiv.style.cssText =
    'background:#201408;border:1px solid #5a3010;padding:10px 14px;' +
    'font-size:13px;color:#c08040;margin-bottom:14px;display:none;';
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

  // ── Table ──────────────────────────────────────────────────────────────────

  const table = document.createElement('table');
  table.style.cssText = 'width:100%;border-collapse:collapse;font-size:14px;';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.style.cssText = 'border-bottom:1px solid #3a2a10;';

  const COLUMNS = [
    { key: 'name',    label: 'Name',       width: '20%', sortable: true  },
    { key: 'class',   label: 'Class',      width: '10%', sortable: true  },
    { key: 'year',    label: 'Yr',         width: '5%',  sortable: true  },
    { key: 'level',   label: 'Lv',         width: '5%',  sortable: true  },
    { key: 'hp',      label: 'HP',         width: '6%',  sortable: true  },
    { key: 'dmg',     label: 'Dmg',        width: '6%',  sortable: true  },
    { key: 'assign',  label: 'Assignment', width: '1%',  sortable: true  },
    { key: 'detail',  label: '',           width: '8%',  sortable: false },
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
  contentEl.appendChild(table);

  // ── Row rendering ──────────────────────────────────────────────────────────

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

    let units = [...allCombatants].filter(u => {
      if (!filter) return true;
      return (u.name ?? '').toLowerCase().includes(filter) ||
             (u.class ?? '').toLowerCase().includes(filter);
    });

    units.sort((a, b) => {
      const av = getSortValue(a, pState.sortCol);
      const bv = getSortValue(b, pState.sortCol);
      const cmp = typeof av === 'number' ? av - bv : av.localeCompare(bv);
      return pState.sortDir === 'asc' ? cmp : -cmp;
    });

    // Update sort indicators in header
    for (const th of headerRow.children) {
      const col = COLUMNS.find(c => c.label === th.textContent.replace(/[▲▼]/g, '').trim() ||
                                    (th.textContent === '' && c.key === 'detail'));
      if (col && col.sortable) {
        const base = col.label;
        if (pState.sortCol === col.key) {
          th.textContent = base + (pState.sortDir === 'asc' ? ' ▲' : ' ▼');
          th.style.color = '#c9a84c';
        } else {
          th.textContent = base;
          th.style.color = '#6a5a3a';
        }
      }
    }

    countLabel.textContent = `${units.length} of ${allCombatants.length} soldiers`;

    tbody.innerHTML = '';
    for (const u of units) {
      const isNew          = !!u.isNewRecruit;
      const reserveOnly    = RESERVE_ONLY_CLASSES.has(u.class);
      const isEngineerUnit = ENGINEER_ONLY_CLASSES.has(u.class);

      const tr = document.createElement('tr');
      tr.style.cssText =
        `border-bottom:1px solid #1e1408;` +
        (isNew ? 'background:#1e1a08;' : '');

      // Name
      const tdName = document.createElement('td');
      tdName.style.cssText = 'padding:8px 10px;color:#c8bfa0;';
      tdName.innerHTML = isNew
        ? `${u.name ?? '—'} <span style="font-size:11px;color:#8a7a30;letter-spacing:0.05em;">NEW</span>`
        : (u.name ?? '—');

      // Class
      const tdClass = document.createElement('td');
      tdClass.style.cssText = 'padding:8px 10px;color:#8a7a5a;';
      tdClass.textContent = classLabel(u.class ?? '');

      // Year of service
      const tdYear = document.createElement('td');
      tdYear.style.cssText = 'padding:8px 10px;color:#6a5a3a;text-align:center;';
      tdYear.textContent = (u.yearOfService ?? 0) + 1;

      // Level
      const tdLevel = document.createElement('td');
      tdLevel.style.cssText = 'padding:8px 10px;color:#6a5a3a;text-align:center;';
      tdLevel.textContent = u.level ?? 1;

      // HP / Dmg
      const effStats = computeEffectiveDef(u, gs);
      const tdHp = document.createElement('td');
      tdHp.style.cssText = 'padding:8px 6px;color:#8a9a6a;text-align:center;font-size:13px;';
      tdHp.textContent = Math.round(effStats.hp);
      const tdDmg = document.createElement('td');
      tdDmg.style.cssText = 'padding:8px 6px;color:#9a7a5a;text-align:center;font-size:13px;';
      tdDmg.textContent = Math.round(effStats.dmg);

      // Assignment dropdown
      const tdAssign = document.createElement('td');
      tdAssign.style.cssText = 'padding:6px 6px;white-space:nowrap;';

      const sel = document.createElement('select');
      sel.style.cssText =
        'background:#0f0d08;border:1px solid #3a2a10;color:#c8bfa0;' +
        'font-family:Georgia,serif;font-size:13px;padding:4px 6px;width:155px;' +
        'border-radius:3px;cursor:pointer;';

      const blankOpt = document.createElement('option');
      blankOpt.value   = '';
      blankOpt.textContent = '— Assign —';
      blankOpt.style.color = '#5a4a2a';
      sel.appendChild(blankOpt);

      for (const opt of ASSIGNMENT_OPTIONS) {
        // Engineers only see engineer slots; non-engineers never see engineer slots
        if (isEngineerUnit && !opt.engineerOnly) continue;
        if (!isEngineerUnit && opt.engineerOnly) continue;
        const o = document.createElement('option');
        o.value   = opt.value;
        o.textContent = opt.label;
        if (opt.wallOnly && reserveOnly) {
          o.disabled = true;
          o.style.color = '#3a2a10';
        }
        sel.appendChild(o);
      }

      sel.value = wizardState.assignments[u.id] ?? '';
      sel.onchange = () => {
        wizardState.assignments[u.id] = sel.value || null;
        refreshNextButton();
        updateWarnings();
      };
      tdAssign.appendChild(sel);

      // Detail button
      const tdDetail = document.createElement('td');
      tdDetail.style.cssText = 'padding:6px 10px;text-align:right;';

      const detailBtn = document.createElement('button');
      detailBtn.textContent = 'Detail';
      detailBtn.style.cssText =
        'background:#2a2010;border:1px solid #4a3818;color:#8a7a5a;' +
        'font-family:Georgia,serif;font-size:12px;padding:4px 10px;' +
        'cursor:pointer;border-radius:3px;';
      detailBtn.onmouseover = () => detailBtn.style.color = '#c9a84c';
      detailBtn.onmouseout  = () => detailBtn.style.color = '#8a7a5a';
      detailBtn.onclick     = () => showDetailModal(u, gs);
      tdDetail.appendChild(detailBtn);

      tr.appendChild(tdName);
      tr.appendChild(tdClass);
      tr.appendChild(tdYear);
      tr.appendChild(tdLevel);
      tr.appendChild(tdHp);
      tr.appendChild(tdDmg);
      tr.appendChild(tdAssign);
      tr.appendChild(tdDetail);
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

  // Wire filter input
  filterInput.oninput = () => {
    pState.filter = filterInput.value;
    renderRows();
  };

  // ── "Assign unassigned units" button ──────────────────────────────────────
  const assignBtn = document.createElement('button');
  assignBtn.className = 'os-btn';
  assignBtn.textContent = 'Assign unassigned units';
  assignBtn.style.cssText = 'margin-top:18px;';
  assignBtn.onclick = () => {
    const wallOpts     = ['wallLeft', 'wallCenter', 'wallRight'];
    const reserveOpts  = ['reserveLeft', 'reserveCenter', 'reserveRight'];
    const engineerOpts = ['engineerLeft', 'engineerCenter', 'engineerRight'];
    const wallClasses  = new Set(['archer', 'mage', 'healer']);
    for (const u of allCombatants) {
      if (wizardState.assignments[u.id]) continue;  // already assigned
      const opts = ENGINEER_ONLY_CLASSES.has(u.class) ? engineerOpts :
                   RESERVE_ONLY_CLASSES.has(u.class)  ? reserveOpts  :
                   wallClasses.has(u.class)            ? wallOpts     : reserveOpts;
      wizardState.assignments[u.id] = opts[Math.floor(Math.random() * opts.length)];
    }
    renderRows();
    updateWarnings();
    refreshNextButton();
  };
  contentEl.appendChild(assignBtn);

  // Initial render
  renderRows();
  updateWarnings();
  refreshNextButton();
}
