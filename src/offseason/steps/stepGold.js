// Step 3 — Gold Summary (GDD Section IV Step 3)
// Read-only informational screen. Displays the gold breakdown for this off-season.

export function render(gs, wizardState, contentEl) {
  const bd      = gs.goldBreakdown;
  const total   = wizardState.goldAvailable;

  function row(label, value, highlight) {
    return `
      <tr>
        <td style="color:#8a7a5a;padding:10px 14px;">${label}</td>
        <td style="text-align:right;padding:10px 14px;color:${highlight ? '#c9a84c' : '#c8bfa0'};
                   font-size:${highlight ? '16px' : '14px'};">${value}</td>
      </tr>`;
  }

  const wallFunds = bd.wallDamage + bd.destroyedSegments;

  // Use breakdown values (pre-repair) so artisan auto-repairs don't zero out the display
  const missingHp = bd.wallDamage;           // wallDamage = missingHp × 1g
  const destroyed = bd.destroyedSegments / 200;

  let wallDetail = '';
  const parts = [];
  if (missingHp > 0)  parts.push(`${missingHp} missing HP × 1g`);
  if (destroyed > 0)  parts.push(`${destroyed} destroyed segment${destroyed > 1 ? 's' : ''} × 200g`);
  if (parts.length)   wallDetail = `<span style="color:#5a4a2a;font-size:12px;"> (${parts.join(', ')})</span>`;

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
    <p style="margin-top:24px;font-size:13px;color:#5a4a2a;font-style:italic;">
      Proceed to the next step to allocate these funds to wall repairs, upgrades, and buildings.
    </p>`;
}
