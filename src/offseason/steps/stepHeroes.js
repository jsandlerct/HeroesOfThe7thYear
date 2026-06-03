// Step 2 — The Hero Departures (GDD Section V, Part Two)
// Conditional: shown only when gs.newHeroesThisBattle.length > 0.
// hero.staying resolved before render (in OffSeasonUI.resolveHeroRetention).
// Staying heroes are granted 1 XP per off-season to the full roster — tracked here
// by pushing them to wizardState.stayingHeroes for the onComplete handler to apply.

import { PORTRAIT_BY_ID }      from '../../data/portraits.js';
import { makePortraitElement } from '../portraitHelper.js';

function classLabel(cls) {
  return cls.charAt(0).toUpperCase() + cls.slice(1);
}

export function render(gs, wizardState, contentEl) {
  const heroes = gs.newHeroesThisBattle;

  // Record staying heroes so the onComplete handler can apply their XP bonus
  wizardState.stayingHeroes = heroes.filter(h => h.staying);

  const list = document.createElement('div');
  list.style.cssText = 'display:flex;flex-direction:column;gap:0;';

  for (const hero of heroes) {
    const portrait = hero.portraitId ? PORTRAIT_BY_ID[hero.portraitId] : null;
    const staying  = !!hero.staying;

    const card = document.createElement('div');
    card.style.cssText =
      'display:flex;align-items:flex-start;gap:16px;padding:14px 0;' +
      `border-bottom:1px solid ${staying ? '#3a2808' : '#251a08'};`;

    card.appendChild(makePortraitElement(portrait, hero, 72));

    const info = document.createElement('div');

    const nameEl = document.createElement('div');
    nameEl.style.cssText =
      `font-size:16px;margin-bottom:4px;color:${staying ? '#f0e0a0' : '#c8bfa0'};`;
    nameEl.textContent = hero.name ?? '—';

    const clsEl = document.createElement('div');
    clsEl.style.cssText = 'font-size:12px;color:#6a5a3a;letter-spacing:0.03em;margin-bottom:10px;';
    clsEl.textContent   = classLabel(hero.class ?? 'unknown');

    const taglineEl = document.createElement('div');
    taglineEl.style.cssText =
      `font-size:14px;font-style:italic;line-height:1.55;` +
      `color:${staying ? '#c9a84c' : '#8a7a5a'};`;
    taglineEl.textContent = staying
      ? `${hero.name}. ${classLabel(hero.class)}. Seven years of service. A hero of the realm — and they are staying.`
      : `${hero.name}. ${classLabel(hero.class)}. Seven years of service. A hero of the realm.`;

    info.appendChild(nameEl);
    info.appendChild(clsEl);
    info.appendChild(taglineEl);
    card.appendChild(info);
    list.appendChild(card);
  }

  contentEl.appendChild(list);
}
