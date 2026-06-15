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

function showHeroDetailModal(hero) {
  document.getElementById('os-detail-modal')?.remove();
  const portrait = hero.portraitId ? PORTRAIT_BY_ID[hero.portraitId] : null;

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
  header.appendChild(makePortraitElement(portrait, hero, 100));

  const nameBlock = document.createElement('div');
  nameBlock.style.paddingTop = '4px';
  nameBlock.innerHTML = `
    <div style="font-size:20px;color:#f0e0a0;margin-bottom:6px;">${hero.name ?? '—'}</div>
    <div style="font-size:13px;color:#8a7a5a;margin-bottom:4px;">
      ${specLabel(hero)} &nbsp;·&nbsp; Seven years of service &nbsp;·&nbsp; Level ${hero.level ?? 1}
    </div>
    <div style="font-size:12px;color:#6a5a3a;display:flex;gap:18px;margin-top:4px;">
      <span>XP: ${hero.xp ?? 0}</span>
    </div>`;
  header.appendChild(nameBlock);
  box.appendChild(header);

  if (hero.bio) {
    const hr = document.createElement('hr');
    hr.style.cssText = 'border:none;border-top:1px solid #2a1e08;margin-bottom:16px;';
    box.appendChild(hr);
    const bioDiv = document.createElement('div');
    bioDiv.style.cssText = 'font-size:14px;color:#8a7a5a;line-height:1.7;margin-bottom:16px;';
    bioDiv.textContent = hero.bio;
    box.appendChild(bioDiv);
  }

  const statHr = document.createElement('hr');
  statHr.style.cssText = 'border:none;border-top:1px solid #2a1e08;margin-bottom:16px;';
  box.appendChild(statHr);

  const statsGrid = document.createElement('div');
  statsGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;';
  function statCell(label, value) {
    const cell = document.createElement('div');
    cell.style.cssText = 'display:flex;justify-content:space-between;font-size:13px;padding:4px 0;border-bottom:1px solid #1e1408;';
    cell.innerHTML =
      `<span style="color:#6a5a3a;">${label}</span>` +
      `<strong style="color:#c9a84c;">${value ?? 0}</strong>`;
    return cell;
  }
  statsGrid.appendChild(statCell('Kills', hero.statKills ?? 0));
  statsGrid.appendChild(statCell('Assists', hero.statAssists ?? 0));
  statsGrid.appendChild(statCell('Survived Attacks', hero.statSurvivedAttacks ?? 0));
  if (hero.class === 'healer') {
    statsGrid.appendChild(statCell('Damage Healed', hero.statDamageHealed ?? 0));
  }
  if ((hero.statOgresKilled ?? 0) > 0) {
    statsGrid.appendChild(statCell('Ogres Slain', hero.statOgresKilled));
  }
  if ((hero.statGeneralsKilled ?? 0) > 0) {
    statsGrid.appendChild(statCell('Generals Slain', hero.statGeneralsKilled));
  }
  box.appendChild(statsGrid);

  backdrop.appendChild(box);
  document.body.appendChild(backdrop);
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
    'padding:18px 20px;margin-bottom:16px;cursor:pointer;';
  card.onclick = () => showHeroDetailModal(hero);

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
      'Build the Monument to honor the 7 year heroes — and inspire the troops.';
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
    'padding:18px 20px;margin-bottom:16px;cursor:pointer;';
  card.onclick = () => showHeroDetailModal(hero);

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
