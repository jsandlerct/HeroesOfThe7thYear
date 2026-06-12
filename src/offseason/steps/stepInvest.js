// Step 4 — Wall & Building Investment (GDD Section IV Step 4)
// Spending choices are written to wizardState.spending in real time.
// Gold remaining is recomputed on every change and reflected immediately.

import { BUILDING_DEFS } from '../../data/buildings.js';
import {
  WALL_HP_BY_LEVEL, WALL_UPGRADE_COST_BY_LEVEL,
  MASON_REPAIR_PER_SEASON, WALL_REPAIR_COST_PER_HP, WALL_DR,
  COLOR_WALL_FILL, COLOR_WALL_DAMAGED, COLOR_WALL_CRITICAL,
  ALPHA_WALL_BREACH,
  COLOR_WALL_HP_HIGH, COLOR_WALL_HP_MED, COLOR_WALL_HP_LOW,
  HP_THRESH_MED, HP_THRESH_LOW,
} from '../../data/constants.js';

const BUILDING_GROUPS = [
  { label: 'Military',                 keys: ['barracks', 'archeryRange', 'sparringGround', 'officerAcademy', 'siegeWorkshop'] },
  { label: 'Arcane',                   keys: ['library', 'mageWorkshop', 'hospital'] },
  { label: 'Infrastructure & Support', keys: ['artisanWorkshop', 'armory', 'weaponsmith', 'scoutAcademy', 'monument'] },
];

const BUILDING_LABELS = {
  barracks: 'Barracks', archeryRange: 'Archery Range', sparringGround: 'Sparring Ground',
  officerAcademy: 'Officer Academy', monument: 'Monument', scoutAcademy: 'Scout Academy',
  library: 'Library', mageWorkshop: 'Mage Workshop', hospital: 'Hospital',
  artisanWorkshop: 'Artisan Workshop', armory: 'Armory', weaponsmith: 'Weaponsmith',
  siegeWorkshop: 'Siege Workshop',
};

// ── Wall canvas — mirrors Wall.js geometry exactly ────────────────────────────
const CRACK_DATA = [
  { light: [[0.15,0.05,0.28,0.70],[0.28,0.70,0.45,0.95]], heavy: [[0.28,0.40,0.58,0.15],[0.60,0.30,0.80,0.90]] },
  { light: [[0.48,0.05,0.36,0.65],[0.36,0.65,0.55,0.92]], heavy: [[0.36,0.65,0.18,0.88],[0.62,0.20,0.74,0.80]] },
  { light: [[0.72,0.08,0.55,0.68],[0.55,0.68,0.38,0.92]], heavy: [[0.55,0.68,0.68,0.95],[0.28,0.18,0.48,0.55]] },
];
const MERLON_COUNT = 9;
const MERLON_H     = 14;
const BAR_SEGS     = 10;
const BAR_H        = 5;
const BAR_SEG_GAP  = 2;
const BAR_MARGIN   = 6;
const BAR_FROM_BTM = 9;

function hexToCss(hex) {
  return '#' + hex.toString(16).padStart(6, '0');
}
function darkenHex(hex, amt) {
  const r = Math.max(0, ((hex >> 16) & 0xff) - amt);
  const g = Math.max(0, ((hex >>  8) & 0xff) - amt);
  const b = Math.max(0,  (hex        & 0xff) - amt);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

export function drawAllWalls(canvas, gs, spending) {
  const cssW = canvas.parentElement?.clientWidth ?? 600;
  if (cssW <= 0) return;
  const tileW = cssW / 12;
  const segs  = gs.wallSegments;
  const secW  = tileW * 4;

  // Max wall height across all segments (for consistent baseline)
  let maxExtra = 0;
  for (const seg of segs) {
    const effLv = Math.min(seg.level + (spending.wallUpgrades[seg.section] || 0), 5);
    maxExtra = Math.max(maxExtra, effLv >= 5 ? 2 : effLv >= 3 ? 1 : 0);
  }
  const totalH = MERLON_H + tileW * (1 + maxExtra);

  const dpr = window.devicePixelRatio || 1;
  canvas.style.height = totalH + 'px';
  canvas.width  = Math.round(cssW * dpr);
  canvas.height = Math.round(totalH * dpr);

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(dpr, dpr);

  ctx.fillStyle = '#1a1208';
  ctx.fillRect(0, 0, cssW, totalH);

  segs.forEach((seg, idx) => {
    const sec    = seg.section;
    const ups    = spending.wallUpgrades[sec] || 0;
    const repair = spending.wallRepairs[sec]   || 0;
    const effLv  = Math.min(seg.level + ups, 5);
    const effMax = WALL_HP_BY_LEVEL[effLv] || seg.maxHp;
    const effHp  = ups > 0 ? effMax : Math.min(seg.hp + repair, seg.maxHp);
    const pct    = effMax > 0 ? effHp / effMax : 0;
    const extra  = effLv >= 5 ? 2 : effLv >= 3 ? 1 : 0;
    const wallH  = tileW * (1 + extra);
    const wallTop = totalH - wallH;
    const ox     = idx * secW;

    const fillHex = pct > HP_THRESH_MED ? COLOR_WALL_FILL
                  : pct > HP_THRESH_LOW  ? COLOR_WALL_DAMAGED
                  : COLOR_WALL_CRITICAL;
    const breached = effHp <= 0;

    ctx.save();
    ctx.globalAlpha = breached ? ALPHA_WALL_BREACH : 1;

    // Body
    ctx.fillStyle = hexToCss(fillHex);
    ctx.fillRect(ox, wallTop, secW, wallH);

    // Mortar courses
    ctx.globalAlpha = breached ? 0.22 : 0.55;
    ctx.fillStyle = darkenHex(fillHex, 22);
    const sp = Math.round(tileW * 0.36);
    let y = wallTop + sp;
    while (y < wallTop + wallH - 4) { ctx.fillRect(ox + 2, y, secW - 4, 2); y += sp; }

    // Merlons
    ctx.globalAlpha = breached ? ALPHA_WALL_BREACH : 1;
    const step = secW / MERLON_COUNT;
    const mw   = Math.round(step * 0.54);
    const mOff = (step - mw) / 2;
    ctx.fillStyle = hexToCss(fillHex);
    for (let i = 0; i < MERLON_COUNT; i++) ctx.fillRect(ox + i * step + mOff, wallTop - MERLON_H, mw, MERLON_H);
    ctx.fillStyle = 'rgba(170,170,170,0.5)';
    for (let i = 0; i < MERLON_COUNT; i++) ctx.fillRect(ox + i * step + mOff, wallTop - MERLON_H, mw, 2);

    // Section divider
    if (idx > 0) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(ox, wallTop - MERLON_H, 1, wallH + MERLON_H); }

    // Cracks
    ctx.globalAlpha = 1;
    const cd = CRACK_DATA[idx] ?? CRACK_DATA[0];
    const ds = breached ? 3 : pct <= HP_THRESH_LOW ? 2 : pct <= HP_THRESH_MED ? 1 : 0;
    if (ds >= 1) {
      ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1; ctx.beginPath();
      for (const [x1,y1,x2,y2] of cd.light) { ctx.moveTo(ox+x1*secW, wallTop+y1*wallH); ctx.lineTo(ox+x2*secW, wallTop+y2*wallH); }
      ctx.stroke();
    }
    if (ds >= 2) {
      ctx.strokeStyle = 'rgba(17,17,17,0.65)'; ctx.lineWidth = 2; ctx.beginPath();
      for (const [x1,y1,x2,y2] of cd.heavy) { ctx.moveTo(ox+x1*secW, wallTop+y1*wallH); ctx.lineTo(ox+x2*secW, wallTop+y2*wallH); }
      ctx.stroke();
    }

    // HP bar
    const bx     = ox + BAR_MARGIN;
    const bcy    = wallTop + wallH - BAR_FROM_BTM;
    const bw     = secW - 2 * BAR_MARGIN;
    const sw     = (bw - (BAR_SEGS - 1) * BAR_SEG_GAP) / BAR_SEGS;
    const filled = Math.ceil(pct * BAR_SEGS);
    const bc = pct > HP_THRESH_MED ? hexToCss(COLOR_WALL_HP_HIGH)
             : pct > HP_THRESH_LOW  ? hexToCss(COLOR_WALL_HP_MED)
             : hexToCss(COLOR_WALL_HP_LOW);
    ctx.fillStyle = 'rgba(17,17,17,0.65)';
    ctx.fillRect(bx - 1, bcy - BAR_H / 2 - 1, bw + 2, BAR_H + 2);
    for (let i = 0; i < BAR_SEGS; i++) {
      ctx.fillStyle = i < filled ? bc : '#222222';
      ctx.fillRect(bx + i * (sw + BAR_SEG_GAP), bcy - BAR_H / 2, sw, BAR_H);
    }

    ctx.restore();
  });
}

// ── Gold ─────────────────────────────────────────────────────────────────────

function computeGoldSpent(gs, spending) {
  let spent = 0;
  for (const seg of gs.wallSegments) {
    spent += (spending.wallRepairs[seg.section] || 0) * WALL_REPAIR_COST_PER_HP;
    const ups = spending.wallUpgrades[seg.section] || 0;
    for (let i = 0; i < ups; i++) spent += WALL_UPGRADE_COST_BY_LEVEL[seg.level + i] || 0;
  }
  for (const [key, levels] of Object.entries(spending.buildings)) {
    const def = BUILDING_DEFS[key];
    if (def) spent += levels * (def.baseCost ?? 200);
  }
  return spent;
}

function prereqsMet(key, gs, spending) {
  return (BUILDING_DEFS[key]?.requires ?? []).every(req =>
    (gs.buildings[req] || 0) + (spending.buildings[req] || 0) > 0
  );
}

// ── Render ────────────────────────────────────────────────────────────────────

export function render(gs, wizardState, contentEl) {
  const { spending } = wizardState;
  const allRefreshFns = [];

  // ── Artisan auto-repair notice ─────────────────────────────────────────────
  if (gs.artisanAutoRepair > 0) {
    const notice = document.createElement('div');
    notice.style.cssText =
      'background:#0e1a0a;border:1px solid #2a4a1a;color:#5a8a3a;' +
      'font-size:13px;padding:10px 14px;margin-bottom:14px;';
    notice.textContent =
      `Artisan Workshop: ${gs.artisanAutoRepair} HP of wall damage repaired automatically.`;
    contentEl.appendChild(notice);
  }

  // ── Gold bar ───────────────────────────────────────────────────────────────
  const goldBar = document.createElement('div');
  goldBar.className = 'os-gold-bar';

  function updateGoldBar() {
    const spent     = computeGoldSpent(gs, spending);
    const remaining = wizardState.goldAvailable - spent;
    const remColor  = remaining < 0 ? '#cc3333' : remaining < wizardState.goldAvailable * 0.25 ? '#d08030' : '#f0e0a0';
    goldBar.innerHTML =
      `<span class="os-gold-item">Available: <strong>${wizardState.goldAvailable}g</strong></span>` +
      `<span class="os-gold-item">Spent: <strong>${spent}g</strong></span>` +
      `<span class="os-gold-item os-gold-remaining">Remaining: <strong style="color:${remColor}">${remaining}g</strong></span>`;
    allRefreshFns.forEach(fn => fn());
  }

  // ── Wall section ───────────────────────────────────────────────────────────
  const wallTitle = document.createElement('div');
  wallTitle.className = 'os-section-title';
  wallTitle.style.marginTop = '0';
  wallTitle.textContent = 'Wall';

  // Full-width canvas (mirrors actual battle wall rendering)
  const canvasWrap = document.createElement('div');
  canvasWrap.className = 'os-wall-canvas-wrap';
  const wallCanvas = document.createElement('canvas');
  wallCanvas.className = 'os-wall-canvas';
  canvasWrap.appendChild(wallCanvas);
  allRefreshFns.push(() => drawAllWalls(wallCanvas, gs, spending));

  // Wall control cards (repair + upgrade per section)
  const wallGrid = document.createElement('div');
  wallGrid.className = 'os-wall-grid';

  for (const seg of gs.wallSegments) {
    const sec   = seg.section;
    const label = sec.charAt(0).toUpperCase() + sec.slice(1);

    const card = document.createElement('div');
    card.className = 'os-wall-card';

    const hdr = document.createElement('div');
    hdr.style.cssText = 'display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;';
    const cardTitle  = document.createElement('h4');
    cardTitle.textContent = `${label} Wall`;
    const levelBadge = document.createElement('span');
    levelBadge.style.cssText = 'font-size:11px;color:#8a7a5a;letter-spacing:0.05em;';
    hdr.appendChild(cardTitle);
    hdr.appendChild(levelBadge);
    card.appendChild(hdr);

    const statsLine = document.createElement('div');
    statsLine.style.cssText = 'font-size:12px;color:#8a7a5a;margin-bottom:12px;line-height:1.6;';
    card.appendChild(statsLine);

    const repairRow = document.createElement('div');
    repairRow.style.cssText = 'margin-bottom:8px;';
    const repairBtn    = document.createElement('button');
    repairBtn.className = 'os-btn-sm';
    repairBtn.textContent = `Repair +${MASON_REPAIR_PER_SEASON} HP (${MASON_REPAIR_PER_SEASON * WALL_REPAIR_COST_PER_HP}g)`;
    const undoRepairBtn = document.createElement('button');
    undoRepairBtn.className = 'os-btn-sm';
    undoRepairBtn.textContent = 'Undo';
    repairRow.appendChild(repairBtn);
    repairRow.appendChild(undoRepairBtn);
    card.appendChild(repairRow);

    const artisanNote = document.createElement('div');
    artisanNote.style.cssText = 'font-size:11px;color:#6a4a2a;font-style:italic;margin-bottom:8px;display:none;';
    artisanNote.textContent = 'Requires Artisan Workshop to repair.';
    card.appendChild(artisanNote);

    const upgradePanel = document.createElement('div');
    upgradePanel.style.cssText = 'background:#181208;border:1px solid #2a1e08;padding:10px 12px;border-radius:2px;';
    const upgradeInfo = document.createElement('div');
    upgradeInfo.style.cssText = 'font-size:12px;color:#7a6a4a;margin-bottom:8px;line-height:1.6;';
    const upgradeRow   = document.createElement('div');
    const upgradeBtn   = document.createElement('button');
    upgradeBtn.className = 'os-btn-sm';
    const undoUpgradeBtn = document.createElement('button');
    undoUpgradeBtn.className = 'os-btn-sm';
    undoUpgradeBtn.textContent = 'Undo';
    upgradeRow.appendChild(upgradeBtn);
    upgradeRow.appendChild(undoUpgradeBtn);
    upgradePanel.appendChild(upgradeInfo);
    upgradePanel.appendChild(upgradeRow);
    card.appendChild(upgradePanel);

    repairBtn.onclick = () => {
      const damage  = seg.maxHp - seg.hp;
      const already = spending.wallRepairs[sec] || 0;
      const block   = Math.min(MASON_REPAIR_PER_SEASON, damage - already);
      const cost    = block * WALL_REPAIR_COST_PER_HP;
      if (block <= 0 || wizardState.goldAvailable - computeGoldSpent(gs, spending) < cost) return;
      spending.wallRepairs[sec] = already + block;
      updateGoldBar();
    };
    undoRepairBtn.onclick = () => {
      const already = spending.wallRepairs[sec] || 0;
      if (already <= 0) return;
      spending.wallRepairs[sec] = Math.max(0, already - MASON_REPAIR_PER_SEASON);
      updateGoldBar();
    };
    upgradeBtn.onclick = () => {
      const committed = spending.wallUpgrades[sec] || 0;
      const curLv     = seg.level + committed;
      if (curLv >= 5 || committed > 0) return;
      const cost = WALL_UPGRADE_COST_BY_LEVEL[curLv];
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

    function makeWallRefresh(seg, levelBadge, statsLine, repairBtn, undoRepairBtn,
                             artisanNote, upgradePanel, upgradeInfo, upgradeBtn, undoUpgradeBtn) {
      return function () {
        const sec      = seg.section;
        const repair   = spending.wallRepairs[sec] || 0;
        const ups      = spending.wallUpgrades[sec] || 0;
        const effLevel = seg.level + ups;
        const effMaxHp = WALL_HP_BY_LEVEL[effLevel] || seg.maxHp;
        const effHp    = ups > 0 ? effMaxHp : Math.min(seg.hp + repair, seg.maxHp);
        const damage   = seg.maxHp - seg.hp;
        const drPct    = Math.round((WALL_DR[effLevel] ?? 0) * 100);

        levelBadge.textContent = `Level ${effLevel}`;

        let hpText = `<strong style="color:#c8bfa0">${effHp}</strong> / ${effMaxHp} HP`;
        if (repair > 0) hpText += ` <span style="color:#5a8a3a">(+${repair} repaired)</span>`;
        hpText += `<br>Defenders receive <strong style="color:#c9a84c">+${drPct}%</strong> damage reduction.`;
        statsLine.innerHTML = hpText;

        const hasArtisan = (gs.buildings.artisanWorkshop || 0) + (spending.buildings.artisanWorkshop || 0) > 0;
        const remaining  = damage - repair;
        const block      = Math.min(MASON_REPAIR_PER_SEASON, remaining);
        const repCost    = block * WALL_REPAIR_COST_PER_HP;
        const canAffordR = wizardState.goldAvailable - computeGoldSpent(gs, spending) >= repCost;
        repairBtn.disabled      = !hasArtisan || remaining <= 0 || !canAffordR;
        undoRepairBtn.disabled  = repair <= 0;
        artisanNote.style.display = (!hasArtisan && damage > 0) ? 'block' : 'none';

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
          const nextDrPct = Math.round((WALL_DR[nextLevel] ?? 0) * 100);
          const drChange  = nextDrPct !== drPct
            ? `DR: <strong style="color:#c9a84c">+${drPct}% → +${nextDrPct}%</strong>`
            : `DR: +${drPct}% <span style="color:#4a3a2a">(no change)</span>`;
          upgradeInfo.innerHTML =
            `<strong style="color:#c8bfa0">Upgrade to Level ${nextLevel}</strong> — ${upgCost}g<br>` +
            `HP: <strong style="color:#c8bfa0">${effMaxHp} → ${nextHp}</strong> &nbsp;·&nbsp; ${drChange}`;

          const isFullyRepaired = (seg.hp + repair) >= seg.maxHp;
          if (!isFullyRepaired && damage > 0) {
            upgradeInfo.innerHTML += `<br><span style="color:#7a4a2a;font-size:11px;">Wall must be fully repaired before upgrading.</span>`;
          }
          const canAffordU = wizardState.goldAvailable - computeGoldSpent(gs, spending) >= upgCost;
          const committed  = ups > 0;
          upgradeBtn.textContent  = committed
            ? `Upgrade committed (Lv ${seg.level} → ${effLevel})`
            : `Upgrade → Lv ${nextLevel} (${upgCost}g)`;
          upgradeBtn.disabled     = !canAffordU || committed || (!isFullyRepaired && damage > 0);
          upgradeBtn.className    = `os-btn-sm${committed ? ' committed' : ''}`;
          undoUpgradeBtn.disabled = !committed;
          undoUpgradeBtn.textContent = committed
            ? `Undo (refund ${WALL_UPGRADE_COST_BY_LEVEL[seg.level]}g)` : 'Undo';
          upgradePanel.style.borderColor = committed ? '#4a3808' : '#2a1e08';
        }
      };
    }

    allRefreshFns.push(makeWallRefresh(
      seg, levelBadge, statsLine, repairBtn, undoRepairBtn,
      artisanNote, upgradePanel, upgradeInfo, upgradeBtn, undoUpgradeBtn,
    ));
    wallGrid.appendChild(card);
  }

  // ── Building section ───────────────────────────────────────────────────────
  const buildTitle = document.createElement('div');
  buildTitle.className = 'os-section-title';
  buildTitle.textContent = 'Buildings';

  const buildingContainer = document.createElement('div');

  for (const group of BUILDING_GROUPS) {
    const groupWrap = document.createElement('div');
    groupWrap.style.cssText = 'margin-bottom:24px;';

    const groupHeader = document.createElement('div');
    groupHeader.style.cssText =
      'font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#5a4a2a;' +
      'padding:8px 0 4px;border-bottom:1px solid #2a1e08;margin-bottom:10px;';
    groupHeader.textContent = group.label;
    groupWrap.appendChild(groupHeader);

    const cardGrid = document.createElement('div');
    cardGrid.className = 'os-bcard-grid';

    for (const key of group.keys) {
      if (!(key in gs.buildings)) continue;
      const def      = BUILDING_DEFS[key];
      if (!def) continue;
      const baseLevel = gs.buildings[key] ?? 0;
      const maxLevel  = def.maxLevel ?? 5;
      const cost      = def.baseCost ?? 200;

      const card = document.createElement('div');
      card.className = 'os-bcard';

      const nameRow   = document.createElement('div');
      nameRow.className = 'os-bcard-name';
      const nameSpan  = document.createElement('span');
      const levelChip = document.createElement('span');
      levelChip.className = 'os-bcard-level';
      nameRow.appendChild(nameSpan);
      nameRow.appendChild(levelChip);
      card.appendChild(nameRow);

      const pipRow = document.createElement('div');
      pipRow.className = 'os-bcard-pips';
      const pips = [];
      for (let i = 0; i < maxLevel; i++) {
        const pip = document.createElement('div');
        pip.className = 'os-bcard-pip empty';
        pipRow.appendChild(pip);
        pips.push(pip);
      }
      card.appendChild(pipRow);

      const descEl = document.createElement('div');
      descEl.className = 'os-bcard-desc';
      descEl.textContent = def.description ?? '';
      card.appendChild(descEl);

      const prereqEl = document.createElement('div');
      prereqEl.className = 'os-prereq-note';
      prereqEl.style.display = 'none';
      card.appendChild(prereqEl);

      const actionRow = document.createElement('div');
      actionRow.className = 'os-bcard-action';
      const buyBtn  = document.createElement('button');
      buyBtn.className = 'os-btn-sm';
      const undoBtn = document.createElement('button');
      undoBtn.className = 'os-btn-sm';
      undoBtn.textContent = '← Undo';
      undoBtn.style.display = 'none';
      actionRow.appendChild(buyBtn);
      actionRow.appendChild(undoBtn);
      card.appendChild(actionRow);

      buyBtn.onclick = () => {
        const effLv = baseLevel + (spending.buildings[key] || 0);
        if (effLv >= maxLevel || !prereqsMet(key, gs, spending)) return;
        if (wizardState.goldAvailable - computeGoldSpent(gs, spending) < cost) return;
        spending.buildings[key] = (spending.buildings[key] || 0) + 1;
        updateGoldBar();
      };
      undoBtn.onclick = () => {
        const c = spending.buildings[key] || 0;
        if (c <= 0) return;
        spending.buildings[key] = c - 1;
        updateGoldBar();
      };

      function makeCardRefresh(key, card, nameSpan, levelChip, pips, descEl, prereqEl, buyBtn, undoBtn, baseLevel, maxLevel, cost) {
        return function () {
          const c       = spending.buildings[key] || 0;
          const effLv   = baseLevel + c;
          const isBuilt  = effLv > 0;
          const isMaxed  = effLv >= maxLevel;
          const isLocked = !prereqsMet(key, gs, spending);
          const canAfford = wizardState.goldAvailable - computeGoldSpent(gs, spending) >= cost;

          const classes = ['os-bcard'];
          if (isLocked) classes.push('locked');
          else if (isMaxed) classes.push('maxed');
          else if (isBuilt) classes.push('built');
          card.className = classes.join(' ');

          nameSpan.textContent = BUILDING_LABELS[key] || key;
          nameSpan.style.color = isMaxed ? '#c9a84c' : isBuilt ? '#d0e8d0' : '#c8bfa0';

          levelChip.textContent  = isBuilt ? (isMaxed ? `Lv ${effLv} · Max` : `Lv ${effLv} / ${maxLevel}`) : '';
          levelChip.style.display = isBuilt ? 'inline' : 'none';

          for (let i = 0; i < pips.length; i++) {
            pips[i].className = 'os-bcard-pip ' + (i < effLv ? (isMaxed ? 'maxed' : 'filled') : 'empty');
          }

          descEl.className = 'os-bcard-desc' + (isBuilt && !isLocked ? ' built' : '');

          if (isLocked) {
            prereqEl.textContent = 'Requires: ' + (def.requires ?? []).map(r => BUILDING_LABELS[r] || r).join(', ');
            prereqEl.style.display = 'block';
          } else {
            prereqEl.style.display = 'none';
          }

          if (isMaxed) {
            buyBtn.textContent = '✓ Max level';
            buyBtn.disabled    = true;
            buyBtn.className   = 'os-btn-sm committed';
            undoBtn.style.display = 'none';
          } else if (isLocked) {
            buyBtn.textContent = baseLevel === 0 ? `Build (${cost}g)` : `Upgrade (${cost}g)`;
            buyBtn.disabled    = true;
            buyBtn.className   = 'os-btn-sm';
            undoBtn.style.display = 'none';
          } else {
            const lbl = baseLevel === 0 ? `Build (${cost}g)` : `Upgrade (${cost}g)`;
            buyBtn.textContent = c > 0 ? `✓ ${lbl}` : lbl;
            buyBtn.disabled    = !canAfford && c === 0;
            buyBtn.className   = `os-btn-sm${c > 0 ? ' committed' : ''}`;
            undoBtn.style.display = c > 0 ? 'inline-block' : 'none';
          }
        };
      }

      allRefreshFns.push(makeCardRefresh(key, card, nameSpan, levelChip, pips, descEl, prereqEl, buyBtn, undoBtn, baseLevel, maxLevel, cost));
      cardGrid.appendChild(card);
    }

    groupWrap.appendChild(cardGrid);
    buildingContainer.appendChild(groupWrap);
  }

  // ── Assemble ───────────────────────────────────────────────────────────────
  contentEl.appendChild(goldBar);
  contentEl.appendChild(wallTitle);
  contentEl.appendChild(canvasWrap);
  contentEl.appendChild(wallGrid);
  contentEl.appendChild(buildTitle);
  contentEl.appendChild(buildingContainer);

  updateGoldBar();

  requestAnimationFrame(() => drawAllWalls(wallCanvas, gs, spending));
  const ro = new ResizeObserver(() => drawAllWalls(wallCanvas, gs, spending));
  ro.observe(canvasWrap);
}
