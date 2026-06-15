// Step 3 — Training & Specialization
//
// Shown when: units leveled up in battle, veteran XP caused level-ups, or a
// surviving unit has reached L3 and has no specialization choice yet.
//
// Applies no XP itself — veteran XP was already applied in OffSeasonUI.applyVeteranXp
// before steps render. This step only displays results and collects spec choices.

import { SPECIALIZATION_DEFS } from '../../data/units.js';
import { MONUMENT_ATK_SPEED_PER_HERO, MONUMENT_HERO_CAP_PER_LEVEL } from '../../data/constants.js';
import { PORTRAIT_BY_ID }      from '../../data/portraits.js';
import { makePortraitElement } from '../portraitHelper.js';

function classLabel(cls) {
  return cls.charAt(0).toUpperCase() + cls.slice(1);
}

function specClassLabel(ru) {
  if (!ru.specialization) return classLabel(ru.class);
  const def = SPECIALIZATION_DEFS[ru.class];
  if (!def) return classLabel(ru.class);
  const path = def.paths.find(p => p.id === ru.specialization);
  return path ? `${path.label} ${classLabel(ru.class)}` : classLabel(ru.class);
}

// Same for a plain { class, specialization } object (veteran details, not full roster unit)
function specClassLabelFromDetail(detail) {
  if (!detail.specialization) return classLabel(detail.class);
  const def = SPECIALIZATION_DEFS[detail.class];
  if (!def) return classLabel(detail.class);
  const path = def.paths.find(p => p.id === detail.specialization);
  return path ? `${path.label} ${classLabel(detail.class)}` : classLabel(detail.class);
}

function levelTag(level) {
  const colors = ['', '#88aaff', '#aaddff', '#ffdd44', '#ff8822', '#ff4444'];
  const c = colors[level] ?? '#ffffff';
  return `<span style="font-size:12px;color:${c};font-weight:bold;">L${level}</span>`;
}

function pendingSpecUnits(gs) {
  return gs.roster.filter(u => !u.dead && u.level >= 3 && !u.specialization && !!SPECIALIZATION_DEFS[u.class]);
}

export function render(gs, wizardState, contentEl, wizard) {
  if (!wizardState._battleLevelUpSnapshot) {
    wizardState._battleLevelUpSnapshot = [...(gs.leveledUpThisBattle ?? [])];
    gs.leveledUpThisBattle = [];
  }

  const battleIds        = wizardState._battleLevelUpSnapshot;
  const veteranLevelUpIds = wizardState.veteranLevelUpIds ?? [];
  const veteranXpCount   = wizardState.veteranXpCount ?? 0;
  const veteranDetails   = wizardState.veteranDetails ?? [];

  contentEl.innerHTML = '';

  // ── Battle level-ups section ──────────────────────────────────────────────
  if (battleIds.length > 0) {
    const header = document.createElement('h3');
    header.style.cssText = 'color:#c9a84c;font-size:14px;margin:0 0 12px;letter-spacing:0.05em;text-transform:uppercase;';
    header.textContent   = 'Battle Promotions';
    contentEl.appendChild(header);

    const list = document.createElement('div');
    list.style.cssText = 'display:flex;flex-direction:column;gap:6px;margin-bottom:24px;';

    for (const id of battleIds) {
      const ru = gs.roster.find(r => r.id === id);
      if (!ru) continue;
      const row = document.createElement('div');
      row.style.cssText = 'font-size:14px;color:#c8bfa0;';
      row.innerHTML =
        `<span style="color:#e0d4b0;">${ru.name ?? classLabel(ru.class)}</span>` +
        ` — ${specClassLabel(ru)} — reached ${levelTag(ru.level)}`;
      list.appendChild(row);
    }
    contentEl.appendChild(list);
  }

  // ── Veteran Inspiration section ───────────────────────────────────────────
  if (veteranXpCount > 0) {
    const vetHeader = document.createElement('h3');
    vetHeader.style.cssText = 'color:#c9a84c;font-size:14px;margin:0 0 12px;letter-spacing:0.05em;text-transform:uppercase;';
    vetHeader.textContent   = 'Veteran Inspiration';
    contentEl.appendChild(vetHeader);

    const aliveCount = gs.roster.filter(u => !u.dead).length;

    // One row per veteran
    const vetList = document.createElement('div');
    vetList.style.cssText = 'display:flex;flex-direction:column;gap:8px;margin-bottom:12px;';

    for (const v of veteranDetails) {
      const row = document.createElement('div');
      row.style.cssText =
        'background:#12100a;border-left:2px solid #5a4a1a;' +
        'padding:8px 12px;border-radius:0 3px 3px 0;';

      const nameSpan = document.createElement('div');
      nameSpan.style.cssText = 'font-size:13px;color:#d0b870;margin-bottom:3px;';
      nameSpan.innerHTML =
        `<strong>${v.name ?? classLabel(v.class)}</strong>` +
        ` <span style="color:#6a5a3a;font-size:11px;">` +
          `${specClassLabelFromDetail(v)} · Year ${(v.yearOfService ?? 0) + 1} veteran` +
        `</span>`;

      const xpSpan = document.createElement('div');
      xpSpan.style.cssText = 'font-size:12px;color:#7a6a3a;font-style:italic;';
      xpSpan.innerHTML =
        `Their hard-won experience passes to all soldiers` +
        ` — <strong style="color:#c9a84c;">+1 XP</strong> to all ${aliveCount} units.`;

      row.appendChild(nameSpan);
      row.appendChild(xpSpan);
      vetList.appendChild(row);
    }
    contentEl.appendChild(vetList);

    // Summary + veteran-caused level-ups
    if (veteranLevelUpIds.length > 0) {
      const levelUpHeader = document.createElement('div');
      levelUpHeader.style.cssText = 'font-size:12px;color:#6a5a3a;text-transform:uppercase;letter-spacing:0.05em;margin:10px 0 6px;';
      levelUpHeader.textContent   = 'Level-ups from veteran inspiration';
      contentEl.appendChild(levelUpHeader);

      const luList = document.createElement('div');
      luList.style.cssText = 'display:flex;flex-direction:column;gap:6px;margin-bottom:24px;';
      for (const id of veteranLevelUpIds) {
        const ru = gs.roster.find(r => r.id === id);
        if (!ru) continue;
        const row = document.createElement('div');
        row.style.cssText = 'font-size:13px;color:#a09080;';
        row.innerHTML =
          `<span style="color:#c8bfa0;">${ru.name ?? classLabel(ru.class)}</span>` +
          ` (${specClassLabel(ru)}) leveled up to ${levelTag(ru.level)}`;
        luList.appendChild(row);
      }
      contentEl.appendChild(luList);
    } else {
      const noLevels = document.createElement('p');
      noLevels.style.cssText = 'font-size:13px;color:#5a4a2a;margin:0 0 24px;';
      noLevels.textContent   = 'No level-ups from veteran inspiration this season.';
      contentEl.appendChild(noLevels);
    }
  }

  // ── Specialization choice cards ───────────────────────────────────────────
  const pending = pendingSpecUnits(gs);
  if (pending.length > 0) {
    const specHeader = document.createElement('h3');
    specHeader.style.cssText =
      'color:#ffdd44;font-size:15px;margin:0 0 6px;letter-spacing:0.05em;text-transform:uppercase;';
    specHeader.textContent = 'Choose Specialization';

    const specSubtitle = document.createElement('p');
    specSubtitle.style.cssText = 'font-size:13px;color:#8a7a5a;margin:0 0 20px;';
    specSubtitle.textContent =
      'These veterans have reached a crossroads. Each must choose a path — this choice is permanent.';

    contentEl.appendChild(specHeader);
    contentEl.appendChild(specSubtitle);

    for (const ru of pending) {
      contentEl.appendChild(buildSpecCard(gs, wizardState, ru, wizard));
    }
  }

  // ── Monument block ────────────────────────────────────────────────────────
  const graduated = gs.graduatedHeroes ?? [];
  const departed  = gs.departedHeroes  ?? [];
  const newHeroes = gs.newHeroesThisBattle ?? [];
  if (graduated.length > 0 || departed.length > 0 || newHeroes.length > 0 || (gs.buildings.monument ?? 0) > 0) {
    contentEl.appendChild(buildMonumentBlock(gs));
  }

  updateNextButton(gs, wizardState, wizard);
}

function buildMonumentBlock(gs) {
  const graduated   = gs.graduatedHeroes ?? [];
  const departed    = gs.departedHeroes  ?? [];
  // Also include this year's heroes (not yet moved into graduated/departed arrays until wizard ends)
  const thisYear    = (gs.newHeroesThisBattle ?? []).map(h => ({
    id: h.id, name: h.name, class: h.class,
    specialization: h.specialization ?? null,
    portraitId: h.portraitId ?? null,
    yearGraduated: gs.year - 1,
    stayed: h.staying === true,
  }));
  const allHeroes   = [
    ...graduated.map(h => ({ ...h, stayed: true  })),
    ...departed.map( h => ({ ...h, stayed: false })),
    ...thisYear,
  ].sort((a, b) => (a.yearGraduated ?? 0) - (b.yearGraduated ?? 0));

  const monLevel    = gs.buildings.monument ?? 0;
  const hasMonument = monLevel > 0;
  const heroCap     = monLevel * MONUMENT_HERO_CAP_PER_LEVEL;
  const heroCount   = Math.min(graduated.length, heroCap);
  const speedBonus  = (heroCount * MONUMENT_ATK_SPEED_PER_HERO).toFixed(1);

  const wrap = document.createElement('div');
  wrap.style.cssText =
    'margin-top:32px;border-top:1px solid #2a2010;padding-top:24px;';

  // Stone tablet
  const tablet = document.createElement('div');
  tablet.style.cssText =
    'background:#111008;border:1px solid #3a2e18;border-radius:4px;' +
    'padding:20px 24px;max-width:520px;margin:0 auto;' +
    'box-shadow:inset 0 1px 4px rgba(0,0,0,0.6);';

  // Tablet header
  const tabletHeader = document.createElement('div');
  tabletHeader.style.cssText =
    'text-align:center;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;' +
    'color:#7a6030;margin-bottom:16px;border-bottom:1px solid #2a2010;padding-bottom:12px;';
  tabletHeader.textContent = '⸻  In Honor of the Seven  ⸻';
  tablet.appendChild(tabletHeader);

  if (allHeroes.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'font-size:13px;color:#4a3a18;font-style:italic;text-align:center;padding:8px 0 4px;';
    empty.textContent   = 'No heroes have completed their seven years yet.';
    tablet.appendChild(empty);
  } else {
    const namesList = document.createElement('div');
    namesList.style.cssText = 'display:flex;flex-direction:column;gap:6px;margin-bottom:16px;';

    for (const hero of allHeroes) {
      // Look up portrait: stayers still on roster; departers have portraitId on entry
      const portraitId = hero.portraitId
        ?? gs.roster.find(r => r.id === hero.id)?.portraitId
        ?? null;
      const portrait   = portraitId ? PORTRAIT_BY_ID[portraitId] : null;

      const heroRow = document.createElement('div');
      heroRow.style.cssText =
        'display:flex;align-items:center;gap:10px;' +
        'border-bottom:1px solid #1e1808;padding-bottom:6px;';

      heroRow.appendChild(makePortraitElement(portrait, hero, 36));

      const textBlock = document.createElement('div');
      textBlock.style.cssText = 'flex:1;min-width:0;';

      const heroName = document.createElement('div');
      heroName.style.cssText = 'font-size:14px;color:#d0b060;font-style:italic;';
      heroName.textContent   = hero.name ?? '—';

      const heroDetail = document.createElement('div');
      heroDetail.style.cssText = 'font-size:11px;color:#5a4820;letter-spacing:0.03em;';
      const cls = hero.specialization
        ? `${hero.specialization.charAt(0).toUpperCase() + hero.specialization.slice(1)} ${classLabel(hero.class)}`
        : classLabel(hero.class ?? 'unknown');
      const badge = hero.stayed
        ? '<span style="color:#4070b0;"> · Sworn to the Wall</span>'
        : '<span style="color:#6a5030;"> · Homeward Bound</span>';
      heroDetail.innerHTML = `${cls} · Year ${hero.yearGraduated ?? '?'}${badge}`;

      textBlock.appendChild(heroName);
      textBlock.appendChild(heroDetail);
      heroRow.appendChild(textBlock);
      namesList.appendChild(heroRow);
    }
    tablet.appendChild(namesList);
  }

  // Monument status footer
  const footer = document.createElement('div');
  footer.style.cssText =
    'border-top:1px solid #2a2010;padding-top:10px;margin-top:4px;' +
    'display:flex;justify-content:space-between;align-items:center;';

  if (hasMonument) {
    const leftSide = document.createElement('span');
    leftSide.style.cssText = 'font-size:11px;color:#5a4820;';
    leftSide.textContent   = `Monument Lv ${monLevel} · ${heroCount} of ${heroCap} staying heroes inscribed`;

    const rightSide = document.createElement('span');
    rightSide.style.cssText = 'font-size:12px;color:#c9a84c;';
    rightSide.innerHTML =
      heroCount > 0
        ? `All units attack <strong>${speedBonus}s faster</strong>`
        : allHeroes.some(h => h.stayed)
          ? 'Staying heroes not yet inscribed'
          : 'No heroes stayed — no speed bonus';

    footer.appendChild(leftSide);
    footer.appendChild(rightSide);
  } else {
    const noMonument = document.createElement('span');
    noMonument.style.cssText = 'font-size:12px;color:#4a3818;font-style:italic;width:100%;text-align:center;';
    noMonument.textContent   = 'Build the Monument to honor the 7 year heroes — and inspire the troops.';
    footer.appendChild(noMonument);
  }

  tablet.appendChild(footer);
  wrap.appendChild(tablet);
  return wrap;
}

function buildSpecCard(gs, wizardState, ru, wizard) {
  const specDef = SPECIALIZATION_DEFS[ru.class];
  if (!specDef) return document.createElement('div');

  const card = document.createElement('div');
  card.id = `spec-card-${ru.id}`;
  card.style.cssText =
    'border:1px solid #3a2808;border-radius:4px;padding:16px;margin-bottom:16px;background:#1a1208;';

  const nameRow = document.createElement('div');
  nameRow.style.cssText = 'display:flex;align-items:baseline;gap:10px;margin-bottom:14px;';

  const nameEl = document.createElement('span');
  nameEl.style.cssText = 'font-size:15px;color:#f0e0a0;';
  nameEl.textContent   = ru.name ?? classLabel(ru.class);

  const clsEl = document.createElement('span');
  clsEl.style.cssText = 'font-size:12px;color:#6a5a3a;';
  clsEl.textContent   = `${classLabel(ru.class)} · L${ru.level}`;

  nameRow.appendChild(nameEl);
  nameRow.appendChild(clsEl);
  card.appendChild(nameRow);

  const pathRow = document.createElement('div');
  pathRow.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;';

  for (const path of specDef.paths) {
    const btn = document.createElement('button');
    btn.style.cssText =
      'background:#241808;border:1px solid #5a4a2a;color:#c8bfa0;' +
      'font-family:Georgia,serif;font-size:13px;padding:12px 10px;cursor:pointer;' +
      'border-radius:3px;text-align:left;line-height:1.5;transition:border-color 0.15s;';

    const colorHex = '#' + path.color.toString(16).padStart(6, '0');
    btn.innerHTML =
      `<span style="display:block;font-size:14px;font-weight:bold;color:${colorHex};margin-bottom:4px;">` +
        `${classLabel(ru.class)} — ${path.label}` +
      `</span>` +
      `<span style="font-size:12px;color:#8a7a5a;">${path.desc}</span>`;

    btn.addEventListener('mouseenter', () => {
      btn.style.borderColor = colorHex;
      btn.style.background  = '#2e1e0a';
    });
    btn.addEventListener('mouseleave', () => {
      if (ru.specialization !== path.id) {
        btn.style.borderColor = '#5a4a2a';
        btn.style.background  = '#241808';
      }
    });
    btn.addEventListener('click', () => {
      ru.specialization = path.id;
      replaceCardWithConfirmation(card, ru, path);
      updateNextButton(gs, wizardState, wizard);
    });

    pathRow.appendChild(btn);
  }
  card.appendChild(pathRow);
  return card;
}

function replaceCardWithConfirmation(card, ru, chosenPath) {
  const colorHex = '#' + chosenPath.color.toString(16).padStart(6, '0');
  card.innerHTML =
    `<div style="display:flex;align-items:center;gap:12px;">` +
      `<span style="font-size:18px;color:#44ff88;">✓</span>` +
      `<div>` +
        `<span style="font-size:14px;color:#f0e0a0;">${ru.name ?? classLabel(ru.class)}</span>` +
        `<span style="font-size:12px;color:#6a5a3a;margin:0 8px;">→</span>` +
        `<span style="font-size:14px;font-weight:bold;color:${colorHex};">` +
          `${classLabel(ru.class)} — ${chosenPath.label}` +
        `</span>` +
        `<span style="display:block;font-size:12px;color:#8a7a5a;margin-top:2px;">${chosenPath.desc}</span>` +
      `</div>` +
    `</div>`;
}

function updateNextButton(gs, wizardState, wizard) {
  const allResolved = pendingSpecUnits(gs).length === 0;
  wizard.setNextEnabled(allResolved);
  if (!allResolved) {
    wizard.setNextLabel('Choose all specializations to continue');
  } else {
    wizard.setNextLabel('Next →');
  }
}
