// Tutorial interstitial step — shown before specific wizard steps in Year 1.
// Renders the starter warrior's portrait and dialogue, with a Skip Tutorial option.
// content: { label: string, paragraphs: string[] }
// {name} and {commanderName} are substituted at render time.

import { PORTRAIT_BY_ID } from '../../data/portraits.js';
import { makePortraitElement } from '../portraitHelper.js';

export function createTutorialRenderer(content) {
  return function render(gs, wizardState, contentEl, wizard) {
    const warrior  = gs.roster.find(u => u.class === 'warrior' && !u.dead);
    const portrait = warrior?.portraitId ? PORTRAIT_BY_ID[warrior.portraitId] : null;

    const commanderAddress =
      (!gs.commanderName || gs.commanderName === 'Commander')
        ? 'Commander'
        : `Commander ${gs.commanderName}`;

    function sub(text) {
      return text
        .replace(/\{name\}/g, warrior?.name ?? 'Soldier')
        .replace(/\{commanderName\}/g, commanderAddress);
    }

    // ── Layout: portrait left, text right ──────────────────────────────────────
    const wrap = document.createElement('div');
    wrap.style.cssText =
      'display:flex;gap:36px;align-items:flex-start;';

    // Portrait column
    if (warrior) {
      const col = document.createElement('div');
      col.style.cssText =
        'display:flex;flex-direction:column;align-items:center;gap:10px;flex-shrink:0;width:160px;';

      const portraitEl = makePortraitElement(portrait, warrior, 150);
      col.appendChild(portraitEl);

      const nameEl = document.createElement('div');
      nameEl.style.cssText = 'font-size:14px;color:#c9a84c;font-style:italic;text-align:center;';
      nameEl.textContent = warrior.name ?? '';
      col.appendChild(nameEl);

      const clsEl = document.createElement('div');
      clsEl.style.cssText = 'font-size:11px;color:#5a4a2a;letter-spacing:0.06em;text-align:center;';
      const spec = warrior.specialization
        ? warrior.specialization.charAt(0).toUpperCase() + warrior.specialization.slice(1) + ' '
        : '';
      clsEl.textContent = `${spec}Warrior`;
      col.appendChild(clsEl);

      const yearEl = document.createElement('div');
      yearEl.style.cssText = 'font-size:10px;color:#3a2a10;letter-spacing:0.07em;text-transform:uppercase;text-align:center;';
      yearEl.textContent = `Year ${(warrior.yearOfService ?? 1) + 1} of service`;
      col.appendChild(yearEl);

      wrap.appendChild(col);
    }

    // Text column
    const textCol = document.createElement('div');
    textCol.style.cssText = 'flex:1;display:flex;flex-direction:column;gap:0;';

    const labelEl = document.createElement('div');
    labelEl.style.cssText =
      'font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#4a3a1a;' +
      'margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #1e1508;';
    labelEl.textContent = content.label;
    textCol.appendChild(labelEl);

    for (const text of content.paragraphs) {
      const p = document.createElement('p');
      p.style.cssText = 'color:#ccc0a0;font-size:15px;line-height:1.85;margin-bottom:14px;';
      p.innerHTML = sub(text);
      textCol.appendChild(p);
    }

    // Skip tutorial link
    const skipRow = document.createElement('div');
    skipRow.style.cssText = 'margin-top:10px;';
    const skipBtn = document.createElement('button');
    skipBtn.style.cssText =
      'background:transparent;border:none;color:#3a2a10;font-family:Georgia,serif;' +
      'font-size:12px;letter-spacing:0.06em;cursor:pointer;padding:0;' +
      'text-decoration:underline;transition:color 0.2s;';
    skipBtn.textContent = 'Skip tutorial';
    skipBtn.onmouseover = () => { skipBtn.style.color = '#6a5a3a'; };
    skipBtn.onmouseout  = () => { skipBtn.style.color = '#3a2a10'; };
    skipBtn.onclick = () => wizard.skipTutorial();
    skipRow.appendChild(skipBtn);
    textCol.appendChild(skipRow);

    wrap.appendChild(textCol);
    contentEl.appendChild(wrap);
  };
}
