// Step 4 — Wall & Building Investment (GDD Section IV Step 4)
// Spending choices are written to wizardState.spending in real time.
// Gold remaining is recomputed on every change and reflected immediately.

import { BUILDING_DEFS } from '../../data/buildings.js';
import {
  WALL_HP_BY_LEVEL, WALL_UPGRADE_COST_BY_LEVEL,
  MASON_REPAIR_PER_SEASON,
} from '../../data/constants.js';

// Ordered display list — only keys present in gs.buildings are shown.
const BUILDING_GROUPS = [
  { label: 'Military',       keys: ['barracks', 'archeryRange', 'sparringGround', 'officerAcademy', 'monument', 'scoutAcademy'] },
  { label: 'Arcane',         keys: ['library', 'mageWorkshop', 'hospital'] },
  { label: 'Infrastructure', keys: ['artisanWorkshop', 'armory', 'weaponsmith', 'siegeWorkshop'] },
];

const BUILDING_LABELS = {
  barracks: 'Barracks', archeryRange: 'Archery Range', sparringGround: 'Sparring Ground',
  officerAcademy: 'Officer Academy', monument: 'Monument', scoutAcademy: 'Scout Academy',
  library: 'Library', mageWorkshop: 'Mage Workshop', hospital: 'Hospital',
  artisanWorkshop: 'Artisan Workshop', armory: 'Armory', weaponsmith: 'Weaponsmith',
  siegeWorkshop: 'Siege Workshop',
};

function computeGoldSpent(gs, spending) {
  let spent = 0;
  for (const seg of gs.wallSegments) {
    const levels = spending.wallUpgrades[seg.section] || 0;
    for (let i = 0; i < levels; i++) {
      spent += WALL_UPGRADE_COST_BY_LEVEL[seg.level + i] || 0;
    }
  }
  for (const [key, levels] of Object.entries(spending.buildings)) {
    const def = BUILDING_DEFS[key];
    if (def) spent += levels * (def.baseCost ?? 200);
  }
  return spent;
}

// Prereqs checked against current gs.buildings PLUS committed purchases this season.
function prereqsMet(key, gs, spending) {
  const requires = BUILDING_DEFS[key]?.requires ?? [];
  return requires.every(req =>
    (gs.buildings[req] || 0) + (spending.buildings[req] || 0) > 0
  );
}

export function render(gs, wizardState, contentEl) {
  const { spending } = wizardState;

  // Mason count for repair capacity
  const masonCount = gs.roster.filter(u => u.class === 'mason' && !u.dead).length;
  const totalRepairCap = masonCount * MASON_REPAIR_PER_SEASON;

  // ── Gold bar (sticky) ──────────────────────────────────────────────────
  const goldBar = document.createElement('div');
  goldBar.className = 'os-gold-bar';

  function updateGoldBar() {
    const spent     = computeGoldSpent(gs, spending);
    const remaining = wizardState.goldAvailable - spent;
    const usedRepair = Object.values(spending.wallRepairs).reduce((s, v) => s + v, 0);
    goldBar.innerHTML = `
      <span class="os-gold-item">Available: <strong>${wizardState.goldAvailable}</strong></span>
      <span class="os-gold-item">Spent: <strong>${spent}</strong></span>
      <span class="os-gold-item os-gold-remaining">Remaining: <strong>${remaining}</strong></span>
      <span class="os-gold-item" style="margin-left:auto;">
        Masons: <strong>${masonCount}</strong>
        &nbsp;·&nbsp; Repair capacity: <strong>${usedRepair}/${totalRepairCap} HP</strong>
      </span>`;
    // Update all buy/repair button states
    refreshButtons();
  }

  // ── Wall section ───────────────────────────────────────────────────────
  const wallTitle = document.createElement('div');
  wallTitle.className = 'os-section-title';
  wallTitle.textContent = 'Wall';

  const wallGrid = document.createElement('div');
  wallGrid.className = 'os-wall-grid';

  const wallButtons = {}; // { section: { repairBtn, undoRepairBtn, upgradeBtn, undoUpgradeBtn } }

  for (const seg of gs.wallSegments) {
    const sec   = seg.section;
    const label = sec.charAt(0).toUpperCase() + sec.slice(1);

    const card = document.createElement('div');
    card.className = 'os-wall-card';
    card.innerHTML = `<h4>${label} Wall</h4>`;

    // HP bar
    const barWrap = document.createElement('div');
    barWrap.className = 'os-hp-bar-wrap';
    const fill = document.createElement('div');
    fill.className = 'os-hp-bar-fill';
    barWrap.appendChild(fill);
    card.appendChild(barWrap);

    const hpLabel = document.createElement('div');
    hpLabel.className = 'os-hp-label';
    card.appendChild(hpLabel);

    // Repair button (free, uses Mason capacity)
    const repairBtn = document.createElement('button');
    repairBtn.className = 'os-btn-sm';
    repairBtn.textContent = 'Repair +50 HP';

    const undoRepairBtn = document.createElement('button');
    undoRepairBtn.className = 'os-btn-sm';
    undoRepairBtn.textContent = 'Undo Repair';

    repairBtn.onclick = () => {
      const usedCap  = Object.values(spending.wallRepairs).reduce((s, v) => s + v, 0);
      const freeCap  = totalRepairCap - usedCap;
      const damage   = seg.maxHp - seg.hp;
      const alreadyR = spending.wallRepairs[sec] || 0;
      const canRepair = Math.min(MASON_REPAIR_PER_SEASON, damage - alreadyR, freeCap);
      if (canRepair <= 0) return;
      spending.wallRepairs[sec] = (spending.wallRepairs[sec] || 0) + canRepair;
      updateGoldBar();
      updateWallCard(seg, fill, hpLabel, repairBtn, undoRepairBtn, upgradeBtn, undoUpgradeBtn);
    };

    undoRepairBtn.onclick = () => {
      const alreadyR = spending.wallRepairs[sec] || 0;
      if (alreadyR <= 0) return;
      spending.wallRepairs[sec] = Math.max(0, alreadyR - MASON_REPAIR_PER_SEASON);
      updateGoldBar();
      updateWallCard(seg, fill, hpLabel, repairBtn, undoRepairBtn, upgradeBtn, undoUpgradeBtn);
    };

    // Upgrade button
    const upgradeBtn     = document.createElement('button');
    upgradeBtn.className = 'os-btn-sm';
    const undoUpgradeBtn     = document.createElement('button');
    undoUpgradeBtn.className = 'os-btn-sm';

    upgradeBtn.onclick = () => {
      const committed = spending.wallUpgrades[sec] || 0;
      const currentLv = seg.level + committed;
      if (currentLv >= 5) return;
      const cost = WALL_UPGRADE_COST_BY_LEVEL[currentLv];
      const spent = computeGoldSpent(gs, spending);
      if (wizardState.goldAvailable - spent < cost) return;
      spending.wallUpgrades[sec] = committed + 1;
      updateGoldBar();
      updateWallCard(seg, fill, hpLabel, repairBtn, undoRepairBtn, upgradeBtn, undoUpgradeBtn);
    };

    undoUpgradeBtn.onclick = () => {
      const committed = spending.wallUpgrades[sec] || 0;
      if (committed <= 0) return;
      spending.wallUpgrades[sec] = committed - 1;
      updateGoldBar();
      updateWallCard(seg, fill, hpLabel, repairBtn, undoRepairBtn, upgradeBtn, undoUpgradeBtn);
    };

    card.appendChild(repairBtn);
    card.appendChild(undoRepairBtn);
    card.appendChild(document.createElement('br'));
    card.appendChild(upgradeBtn);
    card.appendChild(undoUpgradeBtn);

    wallButtons[sec] = { repairBtn, undoRepairBtn, upgradeBtn, undoUpgradeBtn };
    wallGrid.appendChild(card);

    // Initial render of this card
    updateWallCard(seg, fill, hpLabel, repairBtn, undoRepairBtn, upgradeBtn, undoUpgradeBtn);
  }

  function updateWallCard(seg, fill, hpLabel, repairBtn, undoRepairBtn, upgradeBtn, undoUpgradeBtn) {
    const sec       = seg.section;
    const repair    = spending.wallRepairs[sec] || 0;
    const upgrades  = spending.wallUpgrades[sec] || 0;
    const effLevel  = seg.level + upgrades;
    const effMaxHp  = WALL_HP_BY_LEVEL[effLevel] || seg.maxHp;
    const effHp     = Math.min(seg.hp + repair, effMaxHp);
    const damage    = seg.maxHp - seg.hp;

    fill.style.width = `${(effHp / effMaxHp) * 100}%`;
    fill.style.background = effHp < effMaxHp * 0.25 ? '#aa3322'
      : effHp < effMaxHp * 0.5 ? '#cc8822' : '#5a8a3a';

    let hpText = `${effHp} / ${effMaxHp} HP · Level ${effLevel}`;
    if (repair > 0) hpText += ` <span style="color:#5a8a3a">(+${repair} repaired)</span>`;
    hpLabel.innerHTML = hpText;

    const usedCap  = Object.values(spending.wallRepairs).reduce((s, v) => s + v, 0);
    const freeCap  = totalRepairCap - usedCap;
    const canRepairMore = damage - repair > 0 && freeCap > 0;
    repairBtn.disabled    = !canRepairMore || damage === 0;
    repairBtn.title       = damage === 0 ? 'No damage' : freeCap === 0 ? 'No Mason capacity remaining' : '';
    undoRepairBtn.disabled = repair <= 0;

    const nextLevel = effLevel + 1;
    if (nextLevel > 5) {
      upgradeBtn.textContent     = 'Max level';
      upgradeBtn.disabled        = true;
      undoUpgradeBtn.textContent = 'Undo Upgrade';
      undoUpgradeBtn.disabled    = true;
    } else {
      const cost  = WALL_UPGRADE_COST_BY_LEVEL[effLevel];
      const spent = computeGoldSpent(gs, spending);
      const canAfford = wizardState.goldAvailable - spent >= cost;
      upgradeBtn.textContent  = `Upgrade → Lv${nextLevel} (${cost}g)`;
      upgradeBtn.disabled     = !canAfford || upgrades > 0; // one upgrade per segment per season
      upgradeBtn.className    = `os-btn-sm${upgrades > 0 ? ' committed' : ''}`;
      undoUpgradeBtn.textContent = upgrades > 0 ? `Undo Upgrade (refund ${WALL_UPGRADE_COST_BY_LEVEL[seg.level]}g)` : 'Undo Upgrade';
      undoUpgradeBtn.disabled = upgrades <= 0;
    }
  }

  // ── Building section ───────────────────────────────────────────────────
  const buildTitle = document.createElement('div');
  buildTitle.className = 'os-section-title';
  buildTitle.textContent = 'Buildings';

  const table = document.createElement('table');
  table.className = 'os-building-table';
  table.innerHTML = `<thead><tr>
    <th>Building</th><th>Level</th><th>Effect</th><th style="text-align:right;">Action</th>
  </tr></thead>`;
  const tbody = document.createElement('tbody');

  const buyButtons = {}; // { key: buttonEl }

  for (const group of BUILDING_GROUPS) {
    // Category header row
    const catRow = document.createElement('tr');
    catRow.className = 'os-cat-row';
    catRow.innerHTML = `<td colspan="4">${group.label}</td>`;
    tbody.appendChild(catRow);

    for (const key of group.keys) {
      if (!(key in gs.buildings)) continue; // skip if not in GameState (e.g. removed buildings)
      const def = BUILDING_DEFS[key];
      if (!def) continue;

      const currentLevel  = gs.buildings[key] ?? 0;
      const committed     = () => spending.buildings[key] || 0;
      const effectiveLevel = () => currentLevel + committed();
      const maxLevel      = def.maxLevel ?? 5;
      const cost          = def.baseCost ?? 200;

      const tr = document.createElement('tr');

      const tdName = document.createElement('td');
      tdName.style.color = '#c8bfa0';

      const tdLevel = document.createElement('td');
      tdLevel.style.color = '#8a7a5a';

      const tdEffect = document.createElement('td');
      tdEffect.style.color = '#6a5a3a';
      tdEffect.style.fontSize = '12px';
      tdEffect.textContent = def.description ?? '';

      const tdAction = document.createElement('td');
      tdAction.style.textAlign = 'right';

      const buyBtn = document.createElement('button');
      buyBtn.className = 'os-btn-sm';
      const undoBtn = document.createElement('button');
      undoBtn.className = 'os-btn-sm';
      undoBtn.textContent = 'Undo';

      buyBtn.onclick = () => {
        if (effectiveLevel() >= maxLevel) return;
        if (!prereqsMet(key, gs, spending)) return;
        const spent = computeGoldSpent(gs, spending);
        if (wizardState.goldAvailable - spent < cost) return;
        spending.buildings[key] = committed() + 1;
        updateGoldBar();
        updateBuildingRow();
      };

      undoBtn.onclick = () => {
        if (committed() <= 0) return;
        spending.buildings[key] = committed() - 1;
        updateGoldBar();
        updateBuildingRow();
      };

      function updateBuildingRow() {
        const effLv     = effectiveLevel();
        const isMaxed   = effLv >= maxLevel;
        const hasPrereq = prereqsMet(key, gs, spending);
        const spent     = computeGoldSpent(gs, spending);
        const canAfford = wizardState.goldAvailable - spent >= cost;
        const isLocked  = !hasPrereq;

        tdName.innerHTML  = BUILDING_LABELS[key] || key;
        tdLevel.textContent = isMaxed ? `${effLv} / ${maxLevel} (max)` : `${effLv} / ${maxLevel}`;

        if (isLocked) {
          tr.className = 'locked';
          const reqs = (def.requires || []).map(r => BUILDING_LABELS[r] || r).join(', ');
          tdName.innerHTML += `<br><span class="os-prereq-note">Requires: ${reqs}</span>`;
          buyBtn.disabled  = true;
          buyBtn.textContent = currentLevel === 0 ? `Build (${cost}g)` : `Upgrade (${cost}g)`;
          undoBtn.disabled = true;
        } else if (isMaxed) {
          tr.className = 'maxed';
          buyBtn.textContent = 'Max level';
          buyBtn.disabled    = true;
          undoBtn.disabled   = committed() <= 0;
        } else {
          tr.className = '';
          buyBtn.textContent = currentLevel === 0 ? `Build (${cost}g)` : `Upgrade (${cost}g)`;
          buyBtn.disabled    = !canAfford;
          buyBtn.className   = `os-btn-sm${committed() > 0 ? ' committed' : ''}`;
          if (committed() > 0) buyBtn.textContent += ` ×${committed()}`;
          undoBtn.disabled   = committed() <= 0;
        }
      }

      tdAction.appendChild(buyBtn);
      tdAction.appendChild(undoBtn);
      tr.appendChild(tdName);
      tr.appendChild(tdLevel);
      tr.appendChild(tdEffect);
      tr.appendChild(tdAction);
      tbody.appendChild(tr);
      buyButtons[key] = { updateBuildingRow };
      updateBuildingRow();
    }
  }

  function refreshButtons() {
    for (const { updateBuildingRow } of Object.values(buyButtons)) {
      updateBuildingRow();
    }
    for (const seg of gs.wallSegments) {
      const { repairBtn, undoRepairBtn, upgradeBtn, undoUpgradeBtn } = wallButtons[seg.section];
      updateWallCard(seg,
        wallGrid.querySelector(`.os-wall-card:nth-child(${gs.wallSegments.indexOf(seg) + 1}) .os-hp-bar-fill`),
        wallGrid.querySelector(`.os-wall-card:nth-child(${gs.wallSegments.indexOf(seg) + 1}) .os-hp-label`),
        repairBtn, undoRepairBtn, upgradeBtn, undoUpgradeBtn
      );
    }
  }

  table.appendChild(tbody);

  contentEl.appendChild(goldBar);
  contentEl.appendChild(wallTitle);
  contentEl.appendChild(wallGrid);
  contentEl.appendChild(buildTitle);
  contentEl.appendChild(table);

  updateGoldBar();
}
