// Step 5 — Confirm Spending (GDD Section IV Step 5)
// Summarises all choices from Step 4. On confirm: applies spending to GameState,
// triggers recruit generation, and advances the wizard.

import { BUILDING_DEFS }                               from '../../data/buildings.js';
import { WALL_UPGRADE_COST_BY_LEVEL, WALL_REPAIR_COST_PER_HP } from '../../data/constants.js';
import { generateRecruits }                            from '../recruitGenerator.js';

const BUILDING_LABELS = {
  barracks: 'Barracks', archeryRange: 'Archery Range', sparringGround: 'Sparring Ground',
  officerAcademy: 'Officer Academy', monument: 'Monument', scoutAcademy: 'Scout Academy',
  library: 'Library', mageWorkshop: 'Mage Workshop', hospital: 'Hospital',
  artisanWorkshop: 'Artisan Workshop', armory: 'Armory', weaponsmith: 'Weaponsmith',
  siegeWorkshop: 'Siege Workshop',
};

function computeTotalSpent(gs, spending) {
  let spent = 0;
  for (const seg of gs.wallSegments) {
    spent += (spending.wallRepairs[seg.section] || 0) * WALL_REPAIR_COST_PER_HP;
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

export function render(gs, wizardState, contentEl, wizard) {
  if (wizardState.spendingConfirmed) {
    contentEl.innerHTML = `
      <p style="color:#5a8a3a;margin-bottom:12px;">✓ Spending confirmed. Recruits have been generated.</p>
      <p style="color:#8a7a5a;font-size:13px;">Use Previous / Next to continue through the off season.</p>`;
    return;
  }

  // Block Next until the Confirm button is explicitly clicked — otherwise the
  // player can tap Next (always visible in sticky nav) and skip recruit generation.
  wizard.setNextEnabled(false);

  const { spending } = wizardState;
  const totalSpent  = computeTotalSpent(gs, spending);
  const goldLeft    = wizardState.goldAvailable - totalSpent;

  const hasAnySpending = totalSpent > 0 ||
    Object.values(spending.wallRepairs).some(v => v > 0);

  // Summary table
  const rows = [];

  for (const seg of gs.wallSegments) {
    const label = seg.section.charAt(0).toUpperCase() + seg.section.slice(1);
    const repair = spending.wallRepairs[seg.section] || 0;
    const upgrade = spending.wallUpgrades[seg.section] || 0;
    const cost = (() => {
      let c = 0;
      for (let i = 0; i < upgrade; i++) c += WALL_UPGRADE_COST_BY_LEVEL[seg.level + i] || 0;
      return c;
    })();
    if (repair > 0) rows.push(`<tr><td>${label} Wall — repair</td><td>+${repair} HP</td><td>${repair * WALL_REPAIR_COST_PER_HP}g</td></tr>`);
    if (upgrade > 0) rows.push(`<tr><td>${label} Wall — upgrade to level ${seg.level + upgrade}</td><td></td><td>${cost}g</td></tr>`);
  }

  for (const [key, levels] of Object.entries(spending.buildings)) {
    if (levels <= 0) continue;
    const def  = BUILDING_DEFS[key];
    const cost = levels * (def?.baseCost ?? 200);
    const currentLv = gs.buildings[key] ?? 0;
    const label = BUILDING_LABELS[key] || key;
    rows.push(`<tr><td>${label} — ${currentLv === 0 ? 'build' : `upgrade to level ${currentLv + levels}`}</td><td>×${levels}</td><td>${cost}g</td></tr>`);
  }

  const summaryHtml = rows.length > 0
    ? `<table class="os-confirm-table">
        <thead><tr style="color:#6a5a3a;font-size:12px;"><th style="padding:6px 12px;font-weight:normal;">Item</th><th style="padding:6px 12px;font-weight:normal;"></th><th style="padding:6px 12px;font-weight:normal;text-align:right;">Cost</th></tr></thead>
        <tbody>${rows.join('')}</tbody>
        <tfoot><tr style="border-top:1px solid #3a2a10;">
          <td colspan="2" style="padding:10px 12px;color:#8a7a5a;">Total spent</td>
          <td style="padding:10px 12px;color:#c9a84c;font-size:15px;">${totalSpent}g</td>
        </tr><tr>
          <td colspan="2" style="padding:4px 12px;color:#8a7a5a;">Gold remaining</td>
          <td style="padding:4px 12px;color:#f0e0a0;">${goldLeft}g</td>
        </tr></tfoot>
      </table>`
    : `<p style="color:#6a5a3a;font-style:italic;margin-bottom:20px;">No spending this season — all gold carries over.</p>`;

  // Confirm button rendered first so it's visible without scrolling on mobile
  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'os-btn os-btn-primary';
  confirmBtn.textContent = 'Confirm & Receive Recruits →';
  confirmBtn.style.cssText = 'width:100%;padding:14px;font-size:16px;margin-bottom:20px;';
  confirmBtn.onclick = () => {
    const { spending: sp } = wizardState;

    // Wall repairs
    for (const seg of gs.wallSegments) {
      const repair = sp.wallRepairs[seg.section] || 0;
      seg.hp = Math.min(seg.hp + repair, seg.maxHp);
    }

    // Wall upgrades — grant the HP difference so upgrades feel meaningful
    const HP_BY_LV = [0, 200, 300, 400, 500, 600];
    for (const seg of gs.wallSegments) {
      const levels = sp.wallUpgrades[seg.section] || 0;
      if (levels > 0) {
        const oldMaxHp = seg.maxHp;
        seg.level  = Math.min(seg.level + levels, 5);
        seg.maxHp  = HP_BY_LV[seg.level] ?? seg.maxHp;
        seg.hp     = Math.min(seg.hp + (seg.maxHp - oldMaxHp), seg.maxHp);
      }
    }

    // Building purchases
    for (const [key, levels] of Object.entries(sp.buildings)) {
      if (levels > 0 && key in gs.buildings) {
        gs.buildings[key] = (gs.buildings[key] || 0) + levels;
      }
    }

    // Deduct gold
    gs.gold = wizardState.goldAvailable - totalSpent;

    // Generate recruits
    generateRecruits(gs);

    wizardState.spendingConfirmed = true;
    wizard.proceed();
  };

  contentEl.appendChild(confirmBtn);

  if (!hasAnySpending) {
    const skipNote = document.createElement('p');
    skipNote.style.cssText = 'margin-bottom:16px;font-size:12px;color:#5a4a2a;';
    skipNote.textContent = 'Nothing was spent. Confirm to proceed with current gold and receive any recruits from existing building capacity.';
    contentEl.appendChild(skipNote);
  }

  const summaryAndWarn = document.createElement('div');
  summaryAndWarn.innerHTML = summaryHtml + `<div class="os-warn">
    Your building decisions determine which recruit classes arrive this season.
    Buildings purchased now will add housing capacity; recruits will fill those slots immediately after you confirm.
    <strong style="color:#c9a84c;">You cannot revise spending after confirming.</strong>
  </div>`;
  contentEl.appendChild(summaryAndWarn);
}
