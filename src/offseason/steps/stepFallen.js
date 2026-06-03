// Step 1 — Roll Call of the Fallen (GDD Section V, Part One)
// Conditional: shown only when gs.fallenThisBattle.length > 0.
// Sorted by yearOfService descending; alphabetical tiebreak.

import { PORTRAIT_BY_ID }      from '../../data/portraits.js';
import { makePortraitElement } from '../portraitHelper.js';

function yearsLabel(n) {
  if (n === 1) return '1 year of service';
  return `${n} years of service`;
}

function classLabel(cls) {
  return cls.charAt(0).toUpperCase() + cls.slice(1);
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
      'border-bottom:1px solid #251a08;';

    card.appendChild(makePortraitElement(portrait, unit, 72));

    const info = document.createElement('div');

    const nameEl = document.createElement('div');
    nameEl.style.cssText = 'font-size:16px;color:#c8bfa0;margin-bottom:5px;';
    nameEl.textContent   = unit.name ?? '—';

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
