// Step 3 — Gold Summary (GDD Section IV Step 3)
// Read-only informational screen. Displays the gold breakdown for this off-season
// and the Surprise Tactic awarded by the king (Year 2+).

import { TACTICS } from '../../data/tactics.js';

const TACTIC_FLAVOR_VICTORY = [
  'Word of your victory reached the capital. King Aldric smiles — and sends one of his generals to teach your wall units a new tactic.',
  'The king heard of your defenders\' courage. In recognition, he dispatches a royal instructor to train your forces in a surprise maneuver.',
  'Your success has bought goodwill at court. King Aldric sends a seasoned general to drill your soldiers before the next assault.',
];

const TACTIC_FLAVOR_DEFEAT = [
  'News of the battle reached King Aldric. He understands the wall held by a thread — and sends a general to prepare your forces for what comes next.',
  'The king is troubled by the reports. He dispatches one of his best generals to reinforce your tactical options before the enemy returns.',
  'King Aldric has not forgotten your sacrifice. A royal instructor arrives to train your soldiers in a maneuver that may yet turn the tide.',
];

const TACTIC_FLAVOR_DEFAULT = [
  'King Aldric sends one of his generals to train your forces in a surprise tactic for the battles ahead.',
];

export function render(gs, wizardState, contentEl) {
  const bd    = gs.goldBreakdown;
  const total = wizardState.goldAvailable;

  function row(label, value, highlight) {
    return `
      <tr>
        <td style="color:#8a7a5a;padding:10px 14px;">${label}</td>
        <td style="text-align:right;padding:10px 14px;color:${highlight ? '#c9a84c' : '#c8bfa0'};
                   font-size:${highlight ? '16px' : '14px'};">${value}</td>
      </tr>`;
  }

  const wallFunds = bd.wallDamage + bd.destroyedSegments;

  const missingHp = bd.wallDamage;
  const destroyed = bd.destroyedSegments / 200;

  let wallDetail = '';
  const parts = [];
  if (missingHp > 0)  parts.push(`${missingHp} missing HP × 1g`);
  if (destroyed > 0)  parts.push(`${destroyed} destroyed segment${destroyed > 1 ? 's' : ''} × 200g`);
  if (parts.length)   wallDetail = `<span style="color:#5a4a2a;font-size:12px;"> (${parts.join(', ')})</span>`;

  // ── Surprise Tactic award block ────────────────────────────────────────────
  let tacticHtml = '';
  const tacticKey = wizardState.tacticAwarded;
  if (tacticKey && TACTICS[tacticKey]) {
    const tac = TACTICS[tacticKey];
    let flavorPool;
    if (gs.battleResult === 'victory')      flavorPool = TACTIC_FLAVOR_VICTORY;
    else if (gs.battleResult === 'defeat')  flavorPool = TACTIC_FLAVOR_DEFEAT;
    else                                    flavorPool = TACTIC_FLAVOR_DEFAULT;
    const flavor = flavorPool[Math.floor(Math.random() * flavorPool.length)];

    const stockpileCount = gs.tactics?.length ?? 0;
    tacticHtml = `
      <div style="margin-top:28px;background:#1e1508;border:1px solid #5a3a10;padding:18px 20px;max-width:480px;">
        <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;
                    color:#7a5a2a;margin-bottom:10px;">King's Gift — Surprise Tactic</div>
        <p style="font-size:13px;color:#a08050;font-style:italic;margin-bottom:14px;line-height:1.6;">
          ${flavor}
        </p>
        <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;
                    background:#261808;border:1px solid #6a4820;border-radius:3px;">
          <span style="font-size:20px;">${tac.icon}</span>
          <div>
            <div style="font-size:14px;color:#f0c040;font-weight:bold;">${tac.name}</div>
            <div style="font-size:12px;color:#8a7a5a;margin-top:3px;">${tac.description}</div>
          </div>
        </div>
        <div style="margin-top:10px;font-size:12px;color:#5a4a2a;">
          Stockpile: <strong style="color:#c9a84c;">${stockpileCount} / 3</strong> tactic${stockpileCount !== 1 ? 's' : ''} available
        </div>
      </div>`;
  } else if (gs.year <= 1) {
    tacticHtml = '';  // Year 1: no tactic, no message
  } else {
    // Stockpile was already full — no new tactic awarded
    const stockpileCount = gs.tactics?.length ?? 0;
    if (stockpileCount >= 3) {
      tacticHtml = `
        <div style="margin-top:28px;max-width:480px;font-size:13px;color:#5a4a2a;font-style:italic;">
          King Aldric's general arrives — but your soldiers already know three tactics.
          The general departs to wait until the stockpile has room.
          Stockpile: <strong style="color:#c9a84c;">${stockpileCount} / 3</strong>
        </div>`;
    }
  }

  contentEl.innerHTML = `
    <p style="font-size:15px;color:#c9a84c;font-style:italic;margin-bottom:24px;">
      King Aldric has sent gold to help defend the wall.
    </p>
    <table style="width:100%;border-collapse:collapse;max-width:480px;">
      <colgroup><col style="width:70%"><col style="width:30%"></colgroup>
      ${row('Gold raised from taxes', `+${bd.base} gold`)}
      ${row('Funds for wall repairs' + wallDetail, wallFunds > 0 ? `+${wallFunds} gold` : '—')}
      <tr><td colspan="2" style="padding:4px;border-top:1px solid #2a1e08;"></td></tr>
      ${gs.year === 1 && gs.gold > 0
          ? row('Emergency rebuilding fund', `${gs.gold} gold`)
          : gs.gold > 0
            ? row('Carryover from prior seasons', `${gs.gold} gold`)
            : ''}
      ${row('<strong style="color:#e0d4b0;">Total available this season</strong>', `<strong>${total} gold</strong>`, true)}
    </table>
    ${tacticHtml}
    <p style="margin-top:24px;font-size:13px;color:#5a4a2a;font-style:italic;">
      Proceed to the next step to allocate these funds to wall repairs, upgrades, and buildings.
    </p>`;
}
