// Step 2 — The Hero Departures (GDD Section V, Part Two)
// Conditional: shown only when gs.newHeroesThisBattle.length > 0.
// hero.staying resolved before render (in OffSeasonUI.resolveHeroRetention).
// Veteran XP bonus is applied at wizard start in OffSeasonUI.applyVeteranXp (Sprint 5).
// This step is scoped to year-7 ceremony and retention outcomes only.

import { PORTRAIT_BY_ID }      from '../../data/portraits.js';
import { makePortraitElement } from '../portraitHelper.js';
import { MONUMENT_ATK_SPEED_PER_HERO, MONUMENT_HERO_CAP_PER_LEVEL } from '../../data/constants.js';
import { SPECIALIZATION_DEFS } from '../../data/units.js';

function classLabel(cls) {
  return cls.charAt(0).toUpperCase() + cls.slice(1);
}

function specLabel(hero) {
  const base = classLabel(hero.class ?? 'unknown');
  if (!hero.specialization) return base;
  const def  = SPECIALIZATION_DEFS[hero.class];
  const path = def?.paths.find(p => p.id === hero.specialization);
  return path ? `${path.label} ${base}` : base;
}

function buildDepartingCard(hero, gs) {
  const portrait = hero.portraitId ? PORTRAIT_BY_ID[hero.portraitId] : null;
  const monLevel    = gs.buildings.monument ?? 0;
  const hasMonument = monLevel > 0;
  const heroCap     = monLevel * MONUMENT_HERO_CAP_PER_LEVEL;
  const heroCount   = (gs.graduatedHeroes ?? []).length; // existing count before this year's are added
  const futureCount = Math.min(heroCount + 1, heroCap);  // what it'll be after this hero departs

  const card = document.createElement('div');
  card.style.cssText =
    'border:1px solid #a07828;border-radius:4px;background:#1a1000;' +
    'padding:18px 20px;margin-bottom:16px;';

  // Banner label
  const banner = document.createElement('div');
  banner.style.cssText =
    'font-size:10px;letter-spacing:0.18em;text-transform:uppercase;' +
    'color:#c9a84c;font-style:italic;margin-bottom:12px;opacity:0.75;';
  banner.textContent = '⟡ Homeward Bound ⟡';
  card.appendChild(banner);

  // Portrait + info row
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;align-items:flex-start;gap:18px;';
  row.appendChild(makePortraitElement(portrait, hero, 72));

  const info = document.createElement('div');
  info.style.cssText = 'flex:1;';

  const nameEl = document.createElement('div');
  nameEl.style.cssText = 'font-size:18px;color:#f0d070;margin-bottom:2px;';
  nameEl.textContent   = hero.name ?? '—';
  info.appendChild(nameEl);

  const clsEl = document.createElement('div');
  clsEl.style.cssText = 'font-size:12px;color:#8a7040;letter-spacing:0.05em;margin-bottom:10px;';
  clsEl.textContent   = `${specLabel(hero)} · Seven years of service`;
  info.appendChild(clsEl);

  const tagline = document.createElement('div');
  tagline.style.cssText = 'font-size:14px;font-style:italic;color:#b09050;line-height:1.6;margin-bottom:12px;';
  tagline.textContent   =
    `${hero.name} has served their seven years. They ride home as a hero of the realm — ` +
    `their name spoken in taverns, their story told to the young.`;
  info.appendChild(tagline);

  // Monument note
  const monumentNote = document.createElement('div');
  if (hasMonument) {
    const bonus = (futureCount * MONUMENT_ATK_SPEED_PER_HERO).toFixed(1);
    monumentNote.style.cssText =
      'font-size:13px;color:#c9a84c;background:#251800;' +
      'border-left:2px solid #c9a84c;padding:6px 10px;border-radius:0 2px 2px 0;';
    monumentNote.innerHTML =
      `<strong>Their name will be carved into the Monument.</strong>` +
      `<span style="color:#8a7040;"> ${futureCount} ${futureCount === 1 ? 'hero' : 'heroes'} inscribed` +
      ` — all wall units attack <strong style="color:#f0d070;">${bonus}s faster</strong>.</span>`;
  } else {
    monumentNote.style.cssText =
      'font-size:12px;color:#6a5030;font-style:italic;' +
      'border-left:2px solid #4a3010;padding:5px 10px;';
    monumentNote.textContent =
      'Build the Monument to honor the fallen heroes — and receive their blessing.';
  }
  info.appendChild(monumentNote);

  row.appendChild(info);
  card.appendChild(row);
  return card;
}

function buildStayingCard(hero, veteranCount) {
  const portrait = hero.portraitId ? PORTRAIT_BY_ID[hero.portraitId] : null;

  const card = document.createElement('div');
  card.style.cssText =
    'border:1px solid #2a4a8a;border-radius:4px;background:#06101e;' +
    'padding:18px 20px;margin-bottom:16px;';

  // Banner label
  const banner = document.createElement('div');
  banner.style.cssText =
    'font-size:10px;letter-spacing:0.18em;text-transform:uppercase;' +
    'color:#6090d0;font-style:italic;margin-bottom:12px;opacity:0.8;';
  banner.textContent = '⟡ Sworn to the Wall ⟡';
  card.appendChild(banner);

  // Portrait + info row
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;align-items:flex-start;gap:18px;';
  row.appendChild(makePortraitElement(portrait, hero, 72));

  const info = document.createElement('div');
  info.style.cssText = 'flex:1;';

  const nameEl = document.createElement('div');
  nameEl.style.cssText = 'font-size:18px;color:#d0e8ff;margin-bottom:2px;';
  nameEl.textContent   = hero.name ?? '—';
  info.appendChild(nameEl);

  const clsEl = document.createElement('div');
  clsEl.style.cssText = 'font-size:12px;color:#3a6090;letter-spacing:0.05em;margin-bottom:10px;';
  clsEl.textContent   = `${specLabel(hero)} · Seven years of service`;
  info.appendChild(clsEl);

  const tagline = document.createElement('div');
  tagline.style.cssText = 'font-size:14px;font-style:italic;color:#7090c0;line-height:1.6;margin-bottom:12px;';
  tagline.textContent   =
    `${hero.name} has chosen to stay. They swear another oath to the wall — and to you. ` +
    `There is no greater gesture of loyalty.`;
  info.appendChild(tagline);

  // XP bonus note
  const xpNote = document.createElement('div');
  xpNote.style.cssText =
    'font-size:13px;color:#90c0ff;background:#0a1828;' +
    'border-left:2px solid #4070b0;padding:6px 10px;border-radius:0 2px 2px 0;';
  xpNote.innerHTML =
    `<strong>Their experience trains your soldiers.</strong>` +
    `<span style="color:#5080a0;"> Each off-season, all surviving units receive ` +
    `<strong style="color:#d0e8ff;">+1 XP</strong> from ${veteranCount === 1 ? 'this veteran' : `each of your ${veteranCount} veterans`}.</span>`;
  info.appendChild(xpNote);

  row.appendChild(info);
  card.appendChild(row);
  return card;
}

export function render(gs, wizardState, contentEl) {
  const heroes = gs.newHeroesThisBattle;

  // Record staying heroes so the onComplete handler can apply their XP bonus
  wizardState.stayingHeroes = heroes.filter(h => h.staying);

  // Count veterans (prior + newly staying) for the XP note
  const priorVeteranCount = gs.roster.filter(u => !u.dead && u.isVeteran).length;
  const newlyStayingCount = wizardState.stayingHeroes.length;
  const totalVeteranCount = priorVeteranCount + newlyStayingCount;

  // Separators
  const departing = heroes.filter(h => !h.staying);
  const staying   = heroes.filter(h => h.staying);

  if (staying.length > 0) {
    for (const hero of staying) {
      contentEl.appendChild(buildStayingCard(hero, totalVeteranCount));
    }
  }

  if (departing.length > 0) {
    for (const hero of departing) {
      contentEl.appendChild(buildDepartingCard(hero, gs));
    }
  }
}
