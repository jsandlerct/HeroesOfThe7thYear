// Step 4 — Wall & Building Investment (GDD Section IV Step 4)
// Spending choices are written to wizardState.spending in real time.
// Gold remaining is recomputed on every change and reflected immediately.

import { BUILDING_DEFS } from '../../data/buildings.js';
import {
  WALL_HP_BY_LEVEL, WALL_UPGRADE_COST_BY_LEVEL,
  MASON_REPAIR_PER_SEASON, WALL_REPAIR_COST_PER_HP, WALL_DR,
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
    const repairHp = spending.wallRepairs[seg.section] || 0;
    spent += repairHp * WALL_REPAIR_COST_PER_HP;
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

  // ── Artisan auto-repair notice ─────────────────────────────────────────
  if (gs.artisanAutoRepair > 0) {
    const notice = document.createElement('div');
    notice.style.cssText =
      'background:#0e1a0a;border:1px solid #2a4a1a;color:#5a8a3a;' +
      'font-size:13px;padding:10px 14px;margin-bottom:14px;';
    notice.textContent =
      `Artisan Workshop: ${gs.artisanAutoRepair} HP of wall damage repaired automatically.`;
    contentEl.appendChild(notice);
  }

  // ── Gold bar (sticky) ──────────────────────────────────────────────────
  const goldBar = document.createElement('div');
  goldBar.className = 'os-gold-bar';

  function updateGoldBar() {
    const spent     = computeGoldSpent(gs, spending);
    const remaining = wizardState.goldAvailable - spent;
    goldBar.innerHTML = `
      <span class="os-gold-item">Available: <strong>${wizardState.goldAvailable}</strong></span>
      <span class="os-gold-item">Spent: <strong>${spent}</strong></span>
      <span class="os-gold-item os-gold-remaining">Remaining: <strong>${remaining}</strong></span>`;
    // Update all buy/repair button states
    refreshButtons();
  }

  // ── Wall section ───────────────────────────────────────────────────────
  const wallTitle = document.createElement('div');
  wallTitle.className = 'os-section-title';
  wallTitle.textContent = 'Wall';

  const wallGrid = document.createElement('div');
  wallGrid.className = 'os-wall-grid';

  // Each card exposes a refresh() closure — no fragile DOM queries needed.
  const wallRefreshFns = [];

  for (const seg of gs.wallSegments) {
    const sec   = seg.section;
    const label = sec.charAt(0).toUpperCase() + sec.slice(1);

    const card = document.createElement('div');
    card.className = 'os-wall-card';

    // ── Card header ──────────────────────────────────────────────────────
    const cardHeader = document.createElement('div');
    cardHeader.style.cssText =
      'display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;';
    const cardTitle = document.createElement('h4');
    cardTitle.textContent = `${label} Wall`;
    const levelBadge = document.createElement('span');
    levelBadge.style.cssText = 'font-size:11px;color:#8a7a5a;letter-spacing:0.05em;';
    cardHeader.appendChild(cardTitle);
    cardHeader.appendChild(levelBadge);
    card.appendChild(cardHeader);

    // ── Tile damage display ──────────────────────────────────────────────
    // 4 tiles = 4 tile widths of the wall section; each tile represents 25% of max HP.
    // Color: intact (stone grey) / damaged (worn brown) / rubble (dark red).
    const tilesRow = document.createElement('div');
    tilesRow.style.cssText = 'display:flex;gap:3px;margin-bottom:10px;';
    const tileEls = [];
    for (let i = 0; i < 4; i++) {
      const tile = document.createElement('div');
      tile.style.cssText =
        'flex:1;height:52px;border-radius:2px;position:relative;overflow:hidden;' +
        'border:1px solid #333;transition:background .25s;';
      // Crack line drawn inside each tile as an absolutely-positioned child
      const crack = document.createElement('div');
      crack.style.cssText =
        'position:absolute;top:0;left:38%;width:1px;height:100%;' +
        'background:rgba(0,0,0,0.55);transform:skewX(8deg);display:none;';
      const crack2 = document.createElement('div');
      crack2.style.cssText =
        'position:absolute;top:0;left:62%;width:1px;height:85%;' +
        'background:rgba(0,0,0,0.40);transform:skewX(-6deg);display:none;';
      tile.appendChild(crack);
      tile.appendChild(crack2);
      tilesRow.appendChild(tile);
      tileEls.push({ tile, crack, crack2 });
    }
    card.appendChild(tilesRow);

    // ── Stats line ───────────────────────────────────────────────────────
    const statsLine = document.createElement('div');
    statsLine.style.cssText = 'font-size:12px;color:#8a7a5a;margin-bottom:12px;line-height:1.6;';
    card.appendChild(statsLine);

    // ── Repair controls ──────────────────────────────────────────────────
    const repairRow = document.createElement('div');
    repairRow.style.cssText = 'margin-bottom:10px;';
    const repairBtn = document.createElement('button');
    repairBtn.className = 'os-btn-sm';
    repairBtn.textContent = `Repair +50 HP (${MASON_REPAIR_PER_SEASON * WALL_REPAIR_COST_PER_HP}g)`;
    const undoRepairBtn = document.createElement('button');
    undoRepairBtn.className = 'os-btn-sm';
    undoRepairBtn.textContent = 'Undo';
    repairRow.appendChild(repairBtn);
    repairRow.appendChild(undoRepairBtn);
    card.appendChild(repairRow);

    // ── Upgrade panel ────────────────────────────────────────────────────
    const upgradePanel = document.createElement('div');
    upgradePanel.style.cssText =
      'background:#181208;border:1px solid #2a1e08;padding:10px 12px;border-radius:2px;';
    const upgradeInfo = document.createElement('div');
    upgradeInfo.style.cssText = 'font-size:12px;color:#7a6a4a;margin-bottom:8px;line-height:1.6;';
    const upgradeRow = document.createElement('div');
    const upgradeBtn = document.createElement('button');
    upgradeBtn.className = 'os-btn-sm';
    const undoUpgradeBtn = document.createElement('button');
    undoUpgradeBtn.className = 'os-btn-sm';
    undoUpgradeBtn.textContent = 'Undo';
    upgradeRow.appendChild(upgradeBtn);
    upgradeRow.appendChild(undoUpgradeBtn);
    upgradePanel.appendChild(upgradeInfo);
    upgradePanel.appendChild(upgradeRow);
    card.appendChild(upgradePanel);

    // ── Button handlers ──────────────────────────────────────────────────
    repairBtn.onclick = () => {
      const damage   = seg.maxHp - seg.hp;
      const alreadyR = spending.wallRepairs[sec] || 0;
      const blockHp  = Math.min(MASON_REPAIR_PER_SEASON, damage - alreadyR);
      const cost     = blockHp * WALL_REPAIR_COST_PER_HP;
      if (blockHp <= 0 || wizardState.goldAvailable - computeGoldSpent(gs, spending) < cost) return;
      spending.wallRepairs[sec] = alreadyR + blockHp;
      updateGoldBar();
    };

    undoRepairBtn.onclick = () => {
      const alreadyR = spending.wallRepairs[sec] || 0;
      if (alreadyR <= 0) return;
      spending.wallRepairs[sec] = Math.max(0, alreadyR - MASON_REPAIR_PER_SEASON);
      updateGoldBar();
    };

    upgradeBtn.onclick = () => {
      const committed = spending.wallUpgrades[sec] || 0;
      const currentLv = seg.level + committed;
      if (currentLv >= 5) return;
      const cost = WALL_UPGRADE_COST_BY_LEVEL[currentLv];
      if (wizardState.goldAvailable - computeGoldSpent(gs, spending) < cost) return;
      spending.wallUpgrades[sec] = committed + 1;
      updateGoldBar();
    };

    undoUpgradeBtn.onclick = () => {
      const committed = spending.wallUpgrades[sec] || 0;
      if (committed <= 0) return;
      spending.wallUpgrades[sec] = committed - 1;
      updateGoldBar();
    };

    // ── Refresh function (called by updateGoldBar → refreshButtons) ──────
    function makeRefresh(seg, tileEls, levelBadge, statsLine,
                         repairBtn, undoRepairBtn, upgradePanel,
                         upgradeInfo, upgradeBtn, undoUpgradeBtn) {
      return function refresh() {
        const sec      = seg.section;
        const repair   = spending.wallRepairs[sec] || 0;
        const upgrades = spending.wallUpgrades[sec] || 0;
        const effLevel = seg.level + upgrades;
        const effMaxHp = WALL_HP_BY_LEVEL[effLevel] || seg.maxHp;
        const effHp    = Math.min(seg.hp + repair, effMaxHp);
        const damage   = seg.maxHp - seg.hp;
        const dr       = WALL_DR[effLevel] ?? 0;

        // Level badge
        levelBadge.textContent = `Level ${effLevel}`;

        // Tile coloring
        for (let i = 0; i < 4; i++) {
          const { tile, crack, crack2 } = tileEls[i];
          const tileLow  = (i / 4) * effMaxHp;
          const tileHigh = ((i + 1) / 4) * effMaxHp;
          if (effHp >= tileHigh) {
            // Intact
            tile.style.background = 'linear-gradient(180deg,#7e7e7e 0%,#525252 100%)';
            tile.style.borderColor = '#444';
            crack.style.display = 'none';
            crack2.style.display = 'none';
          } else if (effHp > tileLow) {
            // Partially damaged — the "active damage" tile
            tile.style.background = 'linear-gradient(180deg,#7a6550 0%,#4a3020 100%)';
            tile.style.borderColor = '#4a3010';
            crack.style.display = 'block';
            crack2.style.display = 'block';
          } else {
            // Rubble
            tile.style.background = 'linear-gradient(180deg,#4a2010 0%,#1e0800 100%)';
            tile.style.borderColor = '#2a0a00';
            crack.style.display = 'none';
            crack2.style.display = 'none';
          }
        }

        // Stats line
        let hpText = `<strong style="color:#c8bfa0">${effHp}</strong> / ${effMaxHp} HP`;
        if (repair > 0)
          hpText += ` <span style="color:#5a8a3a">(+${repair} repaired)</span>`;
        const drPct = Math.round(dr * 100);
        hpText += `<br>Defenders on this wall receive <strong style="color:#c9a84c">+${drPct}%</strong> damage reduction.`;
        statsLine.innerHTML = hpText;

        // Repair buttons
        const hasArtisan    = (gs.buildings.artisanWorkshop || 0) + (spending.buildings.artisanWorkshop || 0) > 0;
        const remaining     = damage - repair;
        const blockHp       = Math.min(MASON_REPAIR_PER_SEASON, remaining);
        const repairCost    = blockHp * WALL_REPAIR_COST_PER_HP;
        const canAffordRep  = wizardState.goldAvailable - computeGoldSpent(gs, spending) >= repairCost;
        repairBtn.disabled  = !hasArtisan || remaining <= 0 || !canAffordRep;
        repairBtn.title     = !hasArtisan ? 'Requires Artisan Workshop'
                            : remaining <= 0 ? 'No damage remaining'
                            : !canAffordRep ? 'Not enough gold' : '';
        undoRepairBtn.disabled = repair <= 0;

        // Upgrade panel
        const nextLevel = effLevel + 1;
        if (nextLevel > 5) {
          upgradeInfo.textContent = 'Maximum level reached.';
          upgradeBtn.textContent  = 'Max level';
          upgradeBtn.disabled     = true;
          undoUpgradeBtn.disabled = true;
          upgradePanel.style.borderColor = '#1a1a0a';
        } else {
          const upgCost   = WALL_UPGRADE_COST_BY_LEVEL[effLevel];
          const nextHp    = WALL_HP_BY_LEVEL[nextLevel];
          const nextDr    = WALL_DR[nextLevel] ?? 0;
          const nextDrPct = Math.round(nextDr * 100);
          const drChange  = nextDrPct !== drPct
            ? `DR: <strong style="color:#c9a84c">+${drPct}% → +${nextDrPct}%</strong>`
            : `DR: +${drPct}% <span style="color:#4a3a2a">(no change)</span>`;
          upgradeInfo.innerHTML =
            `<strong style="color:#c8bfa0">Upgrade to Level ${nextLevel}</strong> — ${upgCost}g<br>` +
            `HP: <strong style="color:#c8bfa0">${effMaxHp} → ${nextHp}</strong> (+${nextHp - effMaxHp}) &nbsp;·&nbsp; ${drChange}`;

          const canAffordUpg  = wizardState.goldAvailable - computeGoldSpent(gs, spending) >= upgCost;
          const alreadyBought = upgrades > 0;
          // Upgrade requires the wall to be fully repaired (pending repairs count)
          const isFullyRepaired = (seg.hp + repair) >= seg.maxHp;
          upgradeBtn.textContent  = alreadyBought ? `Upgrade committed (Lv ${seg.level} → ${nextLevel})` : `Upgrade → Lv ${nextLevel}`;
          upgradeBtn.disabled     = !canAffordUpg || alreadyBought || !isFullyRepaired;
          upgradeBtn.className    = `os-btn-sm${alreadyBought ? ' committed' : ''}`;
          upgradeBtn.title        = !isFullyRepaired ? 'Wall must be fully repaired before upgrading' : '';
          undoUpgradeBtn.disabled = !alreadyBought;
          undoUpgradeBtn.textContent = alreadyBought
            ? `Undo (refund ${WALL_UPGRADE_COST_BY_LEVEL[seg.level]}g)` : 'Undo';
          upgradePanel.style.borderColor = alreadyBought ? '#4a3808' : '#2a1e08';
          if (!isFullyRepaired) {
            upgradeInfo.innerHTML += `<br><span style="color:#7a4a2a;font-size:11px;">Wall must be fully repaired before upgrading.</span>`;
          }
        }
      };
    }

    const refresh = makeRefresh(seg, tileEls, levelBadge, statsLine,
                                repairBtn, undoRepairBtn, upgradePanel,
                                upgradeInfo, upgradeBtn, undoUpgradeBtn);
    wallRefreshFns.push(refresh);
    wallGrid.appendChild(card);
    refresh();
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
    for (const { updateBuildingRow } of Object.values(buyButtons)) updateBuildingRow();
    for (const refresh of wallRefreshFns) refresh();
  }

  table.appendChild(tbody);

  contentEl.appendChild(goldBar);
  contentEl.appendChild(wallTitle);
  contentEl.appendChild(wallGrid);
  contentEl.appendChild(buildTitle);
  contentEl.appendChild(table);

  updateGoldBar();
}
