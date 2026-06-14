// Step 1 — Roll Call of the Fallen (GDD Section V, Part One)
// Conditional: shown only when gs.fallenThisBattle.length > 0.
// Sorted by yearOfService descending; alphabetical tiebreak.

import { PORTRAIT_BY_ID }      from '../../data/portraits.js';
import { makePortraitElement } from '../portraitHelper.js';
import { computeEffectiveDef } from '../../battle/buildingBonuses.js';

function yearsLabel(n) {
  if (n === 1) return '1 year of service';
  return `${n} years of service`;
}

function classLabel(cls) {
  return cls.charAt(0).toUpperCase() + cls.slice(1);
}

function showFallenDetailModal(unit, gs) {
  document.getElementById('os-detail-modal')?.remove();

  const portrait = unit.portraitId ? PORTRAIT_BY_ID[unit.portraitId] : null;
  const eff      = computeEffectiveDef(unit, gs);

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

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText =
    'position:absolute;top:14px;right:16px;background:none;border:none;' +
    'color:#6a5a3a;font-size:18px;cursor:pointer;';
  closeBtn.onclick = () => backdrop.remove();
  box.appendChild(closeBtn);

  const header = document.createElement('div');
  header.style.cssText = 'display:flex;gap:20px;align-items:flex-start;margin-bottom:20px;';
  header.appendChild(makePortraitElement(portrait, unit, 100));

  const nameBlock = document.createElement('div');
  nameBlock.style.paddingTop = '4px';
  nameBlock.innerHTML = `
    <div style="font-size:20px;color:#f0e0a0;margin-bottom:6px;">${unit.name ?? '—'}</div>
    <div style="font-size:13px;color:#8a7a5a;margin-bottom:4px;">
      ${classLabel(unit.class ?? 'unknown')}
      &nbsp;·&nbsp; ${yearsLabel((unit.yearOfService ?? 0) + 1)}
      &nbsp;·&nbsp; Level ${unit.level ?? 1}
    </div>
    <div style="font-size:12px;color:#6a5a3a;display:flex;gap:18px;margin-top:4px;">
      <span>HP: <strong style="color:#8a9a6a">${Math.round(eff.hp)}</strong></span>
      <span>Dmg: <strong style="color:#9a7a5a">${Math.round(eff.dmg)}</strong></span>
      <span>XP: ${unit.xp ?? 0}</span>
    </div>`;
  header.appendChild(nameBlock);
  box.appendChild(header);

  const greetDiv = document.createElement('div');
  greetDiv.style.cssText =
    'font-style:italic;color:#9a8a6a;font-size:14px;line-height:1.6;' +
    'border-left:2px solid #3a2a10;padding-left:14px;margin-bottom:20px;';
  greetDiv.textContent = `"You remember ${unit.name ?? 'them'}."`;
  box.appendChild(greetDiv);

  const hr = document.createElement('hr');
  hr.style.cssText = 'border:none;border-top:1px solid #2a1e08;margin-bottom:16px;';
  box.appendChild(hr);

  const bioDiv = document.createElement('div');
  bioDiv.style.cssText = 'font-size:14px;color:#8a7a5a;line-height:1.7;';
  bioDiv.textContent = unit.bio || 'No record available.';
  box.appendChild(bioDiv);

  backdrop.appendChild(box);
  document.body.appendChild(backdrop);
}

export function render(gs, wizardState, contentEl) {
  const fallen = [...gs.fallenThisBattle].sort((a, b) => {
    if (b.yearOfService !== a.yearOfService) return b.yearOfService - a.yearOfService;
    return (a.name ?? '').localeCompare(b.name ?? '');
  });

  // List
  const list = document.createElement('div');
  list.style.cssText = 'display:flex;flex-direction:column;gap:0;';

  for (const unit of fallen) {
    const portrait = unit.portraitId ? PORTRAIT_BY_ID[unit.portraitId] : null;

    const card = document.createElement('div');
    card.style.cssText =
      'display:flex;align-items:center;gap:16px;padding:12px 0;' +
      'border-bottom:1px solid #251a08;cursor:pointer;';
    card.title = `View ${unit.name ?? 'soldier'}`;
    card.onclick = () => showFallenDetailModal(unit, gs);

    const portraitEl = makePortraitElement(portrait, unit, 72);
    card.appendChild(portraitEl);

    const info = document.createElement('div');

    const nameEl = document.createElement('div');
    nameEl.style.cssText =
      'font-size:16px;color:#c8bfa0;margin-bottom:5px;' +
      'text-decoration:underline;text-decoration-color:#3a2a10;';
    nameEl.textContent = unit.name ?? '—';

    const detailEl = document.createElement('div');
    detailEl.style.cssText = 'font-size:12px;color:#6a5a3a;letter-spacing:0.03em;';
    detailEl.textContent   = `${classLabel(unit.class ?? 'unknown')}  ·  ${yearsLabel((unit.yearOfService ?? 0) + 1)}`;

    info.appendChild(nameEl);
    info.appendChild(detailEl);
    card.appendChild(info);
    list.appendChild(card);
  }

  // Commander's closing line
  const closing = document.createElement('p');
  closing.style.cssText =
    'margin-top:24px;font-style:italic;color:#6a5a3a;font-size:14px;line-height:1.6;';
  closing.textContent =
    '"Let us all take a moment of silence to remember their sacrifice for the kingdom."';

  contentEl.appendChild(list);
  contentEl.appendChild(closing);
}
