// Step 8 — Scout Deployment (GDD Section IV Step 8)
// Conditional: shown only when Scout count > 0.
// Outcomes: 60% success (intel revealed), 30% fail, 10% captured.
// Captured scouts join the fallen ceremony NEXT year via gs.capturedScouts.
// On success, player can return to Step 6 (personnel) to revise assignments,
// then passes through Step 7 (deployment preview) again before returning here.

import { ENEMY_COMPOSITIONS } from '../../data/compositions.js';

const DELAY_MS       = 3000;
const P_SUCCESS      = 0.60;
const P_FAIL         = 0.90;   // 0.60–0.89 = fail, 0.90+ = captured

function classLabel(cls) {
  return cls.charAt(0).toUpperCase() + cls.slice(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function livingScouts(gs) {
  return gs.roster.filter(u => u.class === 'scout' && !u.dead);
}

function pickComposition(gs) {
  const yearComps = ENEMY_COMPOSITIONS[gs.year];
  if (!yearComps) return null;
  const idx = Math.floor(Math.random() * yearComps.length);
  return { index: idx, data: yearComps[idx] };
}

const ELITE_TYPES = new Set(['ogre', 'general', 'catapult']);

function totalsByType(comp) {
  if (!comp) return [];
  const totals = {};
  const addUnits = arr => {
    for (const u of arr ?? []) {
      totals[u.type] = (totals[u.type] ?? 0) + u.count;
    }
  };
  addUnits(comp.left);
  addUnits(comp.center);
  addUnits(comp.right);
  for (const r of comp.reserves ?? []) addUnits(r.units);
  return Object.entries(totals).sort((a, b) => b[1] - a[1]);
}

// ── Render states ─────────────────────────────────────────────────────────────

function renderInitial(gs, wizardState, contentEl, wizard) {
  const scouts = livingScouts(gs);

  wizard.setNextLabel('Skip →');
  wizard.setNextEnabled(true);
  wizard.setPrevEnabled(true);

  const p = document.createElement('p');
  p.style.cssText = 'color:#8a7a5a;margin-bottom:20px;line-height:1.65;';
  p.textContent =
    `You have ${scouts.length} Scout${scouts.length !== 1 ? 's' : ''} available. ` +
    'Sending them out may reveal the enemy composition — but carries risk.';
  contentEl.appendChild(p);

  // Outcome odds table
  const odds = document.createElement('table');
  odds.style.cssText = 'font-size:13px;border-collapse:collapse;margin-bottom:24px;';
  [
    ['60%', 'Success', 'Enemy composition revealed. Opportunity to revise deployment.', '#5a8a3a'],
    ['30%', 'No intel', 'Scouts returned with nothing useful.',                          '#7a6a3a'],
    ['10%', 'Captured', 'Scout is permanently lost. Their name joins next year\'s roll call.', '#8a3a2a'],
  ].forEach(([pct, label, desc, col]) => {
    odds.innerHTML += `
      <tr>
        <td style="padding:5px 14px 5px 0;color:${col};font-size:14px;font-weight:bold;">${pct}</td>
        <td style="padding:5px 14px 5px 0;color:#c8bfa0;">${label}</td>
        <td style="padding:5px 0;color:#6a5a3a;font-size:12px;">${desc}</td>
      </tr>`;
  });
  contentEl.appendChild(odds);

  const sendBtn = document.createElement('button');
  sendBtn.className = 'os-btn os-btn-primary';
  sendBtn.textContent = 'Send Scouts Out';
  sendBtn.onclick = () => {
    wizardState.scoutResult = 'pending';
    contentEl.innerHTML = '';
    renderPending(gs, wizardState, contentEl, wizard);
  };
  contentEl.appendChild(sendBtn);

  const skipNote = document.createElement('p');
  skipNote.style.cssText = 'margin-top:14px;font-size:12px;color:#4a3a2a;';
  skipNote.textContent = 'Or use Next → to skip scouting this year.';
  contentEl.appendChild(skipNote);
}

function renderPending(gs, wizardState, contentEl, wizard) {
  wizard.setNextEnabled(false);
  wizard.setPrevEnabled(false);

  const msg = document.createElement('p');
  msg.style.cssText = 'color:#8a7a5a;font-style:italic;margin-bottom:20px;';
  msg.textContent = 'Scouts are out. Awaiting their return…';
  contentEl.appendChild(msg);

  setTimeout(() => {
    resolve(gs, wizardState, contentEl, wizard);
  }, DELAY_MS);
}

function resolve(gs, wizardState, contentEl, wizard) {
  const roll = Math.random();

  if (roll < P_SUCCESS) {
    // Success — pre-select composition so it's locked in for this year's battle
    const picked = pickComposition(gs);
    wizardState.scoutResult            = 'success';
    wizardState.scoutedCompositionIndex = picked?.index ?? 0;
    wizardState.scoutedComposition      = picked?.data  ?? null;
    if (picked) gs.enemyCompositionIndex = picked.index;
  } else if (roll < P_FAIL) {
    wizardState.scoutResult = 'fail';
  } else {
    wizardState.scoutResult = 'captured';
    // Remove one scout permanently; they join the fallen ceremony next year
    const scout = livingScouts(gs)[0];
    if (scout) {
      scout.dead = true;
      delete wizardState.assignments[scout.id];
      gs.capturedScouts = gs.capturedScouts ?? [];
      gs.capturedScouts.push(scout);
    }
  }

  wizard.setNextEnabled(true);
  wizard.setPrevEnabled(true);
  contentEl.innerHTML = '';
  renderResult(gs, wizardState, contentEl, wizard);
}

function renderResult(gs, wizardState, contentEl, wizard) {
  const result = wizardState.scoutResult;

  if (result === 'success') {
    wizard.setNextLabel('Continue →');

    const badge = document.createElement('div');
    badge.style.cssText =
      'color:#5a8a3a;font-size:16px;margin-bottom:16px;';
    badge.textContent = '✓ Intel received.';
    contentEl.appendChild(badge);

    const comp = wizardState.scoutedComposition;
    if (comp?.scoutingReport) {
      const report = document.createElement('div');
      report.style.cssText =
        'background:#101a08;border:1px solid #2a4010;padding:14px 16px;' +
        'font-style:italic;color:#9ab88a;font-size:14px;line-height:1.65;margin-bottom:16px;';
      report.textContent = `"${comp.scoutingReport}"`;
      contentEl.appendChild(report);
    }

    if (comp) {
      const totals = totalsByType(comp);
      if (totals.length) {
        const list = document.createElement('ul');
        list.style.cssText =
          'list-style:none;padding:12px 16px;margin:0 0 20px;' +
          'background:#0a100a;border:1px solid #1a2810;' +
          'font-family:Georgia,serif;font-size:14px;color:#9ab88a;line-height:2;';
        for (const [type, count] of totals) {
          const li = document.createElement('li');
          const isElite = ELITE_TYPES.has(type);
          li.innerHTML =
            `<span style="min-width:90px;display:inline-block;color:#c8bfa0;">${classLabel(type)}</span>` +
            `<span style="color:#6a9a5a;">×${count}</span>` +
            (isElite ? `<span style="color:#c87040;font-size:12px;margin-left:10px;">elite</span>` : '');
          list.appendChild(li);
        }
        contentEl.appendChild(list);
      }
    }

    const reviseBtn = document.createElement('button');
    reviseBtn.className = 'os-btn';
    reviseBtn.textContent = '← Revise Deployment';
    reviseBtn.style.marginRight = '12px';
    reviseBtn.onclick = () => wizard.jumpTo('personnel');
    contentEl.appendChild(reviseBtn);

    const note = document.createElement('p');
    note.style.cssText = 'margin-top:12px;font-size:12px;color:#4a3a2a;';
    note.textContent = 'Or use Continue → to proceed to the battle.';
    contentEl.appendChild(note);

  } else if (result === 'fail') {
    wizard.setNextLabel('Continue →');

    const badge = document.createElement('div');
    badge.style.cssText = 'color:#8a6a2a;font-size:16px;margin-bottom:12px;';
    badge.textContent = '✗ Scouts returned with nothing.';
    contentEl.appendChild(badge);

    const msg = document.createElement('p');
    msg.style.cssText = 'color:#6a5a3a;font-size:14px;';
    msg.textContent = 'No intel gained this season. Proceed to the battle without reconnaissance.';
    contentEl.appendChild(msg);

  } else if (result === 'captured') {
    wizard.setNextLabel('Continue →');

    const badge = document.createElement('div');
    badge.style.cssText = 'color:#8a3a2a;font-size:16px;margin-bottom:12px;';
    badge.textContent = '⚠ Scout captured.';
    contentEl.appendChild(badge);

    const capturedScout = gs.capturedScouts?.[gs.capturedScouts.length - 1];
    const msg = document.createElement('p');
    msg.style.cssText = 'color:#6a4a3a;font-size:14px;line-height:1.65;';
    if (capturedScout) {
      msg.innerHTML =
        `<strong style="color:#c8bfa0;">${capturedScout.name}</strong> will not return. ` +
        `Their name will be read at next year's roll call of the fallen.`;
    } else {
      msg.textContent = 'A scout has been permanently lost.';
    }
    contentEl.appendChild(msg);
  }
}

// ── Public entry point ────────────────────────────────────────────────────────

export function render(gs, wizardState, contentEl, wizard) {
  if (wizardState.scoutResult === 'pending') {
    renderPending(gs, wizardState, contentEl, wizard);
  } else if (wizardState.scoutResult) {
    renderResult(gs, wizardState, contentEl, wizard);
  } else {
    renderInitial(gs, wizardState, contentEl, wizard);
  }
}
