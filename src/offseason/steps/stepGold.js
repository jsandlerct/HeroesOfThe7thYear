// Step 3 — Gold Summary (GDD Section IV Step 3)
// Read-only informational screen. Displays the gold breakdown for this off-season.

export function render(gs, wizardState, contentEl) {
  const bd      = gs.goldBreakdown;
  const newGold = bd.base + bd.wallDamage + bd.destroyedSegments;
  const total   = wizardState.goldAvailable;

  function row(label, value, highlight) {
    return `
      <tr>
        <td style="color:#8a7a5a;padding:10px 14px;">${label}</td>
        <td style="text-align:right;padding:10px 14px;color:${highlight ? '#c9a84c' : '#c8bfa0'};
                   font-size:${highlight ? '16px' : '14px'};">${value}</td>
      </tr>`;
  }

  const missingHp = gs.wallSegments.reduce(
    (sum, seg) => sum + Math.max(0, seg.maxHp - seg.hp), 0
  );
  const destroyed = gs.wallSegments.filter(seg => seg.hp <= 0).length;

  const wallDamageLabel = missingHp > 0
    ? `Wall damage bonus <span style="color:#5a4a2a;font-size:12px;">(${missingHp} missing HP × 1 gold)</span>`
    : 'Wall damage bonus';

  const destroyedLabel = destroyed > 0
    ? `Destroyed segment bonus <span style="color:#5a4a2a;font-size:12px;">(${destroyed} segment${destroyed > 1 ? 's' : ''} × 200 gold)</span>`
    : 'Destroyed segment bonus';

  contentEl.innerHTML = `
    <table style="width:100%;border-collapse:collapse;max-width:480px;">
      <colgroup><col style="width:70%"><col style="width:30%"></colgroup>
      ${row('Base income (every year)', `+${bd.base} gold`)}
      ${row(wallDamageLabel, bd.wallDamage > 0 ? `+${bd.wallDamage} gold` : '—')}
      ${row(destroyedLabel,  bd.destroyedSegments > 0 ? `+${bd.destroyedSegments} gold` : '—')}
      <tr><td colspan="2" style="padding:4px;border-top:1px solid #2a1e08;"></td></tr>
      ${row('Carryover from prior seasons', `${gs.gold} gold`)}
      ${row('<strong style="color:#e0d4b0;">Total available this season</strong>', `<strong>${total} gold</strong>`, true)}
    </table>
    <p style="margin-top:24px;font-size:13px;color:#5a4a2a;font-style:italic;">
      Proceed to the next step to allocate these funds to wall repairs, upgrades, and buildings.
    </p>`;
}
