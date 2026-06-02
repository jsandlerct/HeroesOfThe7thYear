// Greeting pools: keyed by class × year-of-service (years 1–7).
// Year is computed as yearOfService + 1 (yearOfService 0 = first year = key 1).
// 2 greetings per combination; pool grows as content is written.
// Format: text that follows "Commander [name], "

export const GREETINGS = {
  warrior: {
    1: [
      "I'm ready to serve. Tell me where to stand.",
      "I trained for this. I won't let you down.",
    ],
    2: [
      "Second year. Starting to feel like I know what I'm doing.",
      "I've got my footing now. Ask me anything.",
    ],
    3: [
      "Three years at the wall. It gets into you.",
      "Still here. Three down, four to go.",
    ],
    4: [
      "Four years. I've seen enough to know what matters.",
      "Half my service done. It goes faster than you'd think.",
    ],
    5: [
      "Five years. The new ones come to me with questions now. That's strange.",
      "I'm not the same person who showed up at the gate. I'm better.",
    ],
    6: [
      "One more year after this. I'm trying not to count.",
      "Six years, Commander. I've outlasted a lot of people I cared about.",
    ],
    7: [
      "Seven years. I never thought I'd see it.",
      "I'm done. And somehow I'm still standing. That's everything.",
    ],
  },

  archer: {
    1: [
      "I can hit what I aim at. That's all you need to know.",
      "I've been practicing since I could hold a bow. Ready.",
    ],
    2: [
      "Second year. My eye's gotten sharper. I can feel it.",
      "I know the distances now. I know where to stand.",
    ],
    3: [
      "Three years of watching the field. I see things before others do.",
      "Year three. I've learned when to hold and when to loose.",
    ],
    4: [
      "The catapults still make me nervous. Everything else I've made peace with.",
      "Four years. I've stopped thinking about missing.",
    ],
    5: [
      "Five years of watching the same ground. I could draw it with my eyes shut.",
      "I don't miss. That's all I ask of myself.",
    ],
    6: [
      "Six years. My fingers know this bow better than they know anything else.",
      "The wall changes every year. The angles don't. I know every inch of this field.",
    ],
    7: [
      "Seven years of holding the line from up here. I've earned this.",
      "If I never shoot another arrow it'll be too soon. But I probably will.",
    ],
  },

  mage: {
    1: [
      "I've studied everything I could find about the invaders. I'm ready to apply it.",
      "Theory and practice are different. I'm eager to learn the difference firsthand.",
    ],
    2: [
      "Year two. The things I thought I understood look different now.",
      "I've stopped being surprised by how much there is to learn.",
    ],
    3: [
      "Three years. I know what my spells actually do now, not just what they're supposed to.",
      "The Ogres. I've started reading their patterns. They repeat.",
    ],
    4: [
      "Four years. I work better with less sleep than I used to.",
      "I've gotten very precise about what I can and can't do. That precision has saved lives.",
    ],
    5: [
      "Five years of the same enemy. I've mapped everything I can map. Now I improvise.",
      "I've stopped trying to be brilliant. I just try to be useful.",
    ],
    6: [
      "Six years. I've outlasted colleagues I considered better than me. I think about that.",
      "What I know now I couldn't have imagined at year one. I say that without pride.",
    ],
    7: [
      "Seven years. A whole education I couldn't have gotten anywhere else.",
      "I came here to study the enemy. I stayed to protect people. I'm glad I stayed.",
    ],
  },

  healer: {
    1: [
      "I'm here to keep people alive. That's all. I'll do my part.",
      "My hands are steadier under pressure than most. I've always been that way.",
    ],
    2: [
      "Second year. I've learned what fear looks like in a patient and what to do about it.",
      "The work here is harder than I expected. I'm still glad I came.",
    ],
    3: [
      "Three years. I know which injuries I can fix and which ones I can't. That knowledge cost something.",
      "I stopped being gentle with myself in year two. You do what needs doing.",
    ],
    4: [
      "Four years. The soldiers trust me now. That matters more than I thought it would.",
      "I've started training others. Passing it on. That feels right.",
    ],
    5: [
      "Five years of this. My hands still know what to do even when my mind is somewhere else.",
      "I carry everyone I couldn't save. But I also carry everyone I did.",
    ],
    6: [
      "Six years. I know things about courage that most people will never learn.",
      "The soldiers look after me now too. I didn't expect that.",
    ],
    7: [
      "Seven years of holding people together. I'm proud of that.",
      "I've been changed by what I've seen here. All of it. I wouldn't give back a year of it.",
    ],
  },

  captain: {
    1: [
      "I'm ready to lead. I've been ready for a long time.",
      "I won't ask anything of my unit that I wouldn't do myself.",
    ],
    2: [
      "Second year. I've learned that leadership is mostly listening.",
      "I know my people now. I know what they need before they ask.",
    ],
    3: [
      "Three years. I've made decisions I wasn't sure about. Most of them were right.",
      "My job is to make sure everyone comes back. I take that seriously.",
    ],
    4: [
      "Four years. I've stopped needing to prove myself. That's made me better.",
      "The unit trusts me. I feel that every day. I don't take it for granted.",
    ],
    5: [
      "Five years. The new captains come to me now. That's a strange feeling.",
      "I've started thinking about what comes after. Not yet — but I'm thinking.",
    ],
    6: [
      "Six years of keeping people alive. A few I couldn't. I carry those.",
      "One more year. I intend to give it everything I have.",
    ],
    7: [
      "Seven years of command. I'm proud of my people. Every single one of them.",
      "I've given everything to this wall. And it gave back more than I expected.",
    ],
  },

  engineer: {
    1: [
      "Give me the angles and I'll tell you exactly where everything lands.",
      "I'm not here for the glory. I'm here because I'm good at this.",
    ],
    2: [
      "Second year. I've calibrated everything twice. I trust my equipment.",
      "I know the range on every catapult they've sent. I adapt.",
    ],
    3: [
      "Three years. I've improved my effective rate by fifteen percent. I track these things.",
      "The work is mechanical but the judgment isn't. That's what I bring.",
    ],
    4: [
      "Four years. I've made this position mine. No one knows this angle like I do.",
      "I've learned to compensate for wind, heat, and fear. Mostly I compensate for fear.",
    ],
    5: [
      "Five years. My trebuchet has an excellent record. I'm attached to it.",
      "I know the invaders' approach patterns better than they do. Probably.",
    ],
    6: [
      "Six years. I've gotten quieter. More precise. Less room for error at this point.",
      "I don't waste shots. Six years of data behind every one.",
    ],
    7: [
      "Seven years. I've thrown a lot of weight at a lot of enemies. The wall held.",
      "My trebuchet and I have an understanding. Seven years is a long relationship.",
    ],
  },

  mason: {
    1: [
      "I'll keep these walls standing. That's my job and I'm good at it.",
      "Stone and mortar. I know them better than most people know their own hands.",
    ],
    2: [
      "Second year. I know every weak point in this wall now. Working through them.",
      "The work is always there. I'm always there. That's how it goes.",
    ],
    3: [
      "Three years of repairs. The wall's in better shape than when I arrived.",
      "People fight. I make sure there's something worth fighting for.",
    ],
    4: [
      "Four years. I've repaired sections of this wall a dozen times each. Good stone endures.",
      "I don't get thanked much. The wall doesn't fall. That's my thank you.",
    ],
    5: [
      "Five years. I've put more into this wall than most people will ever know.",
      "When I repair something I do it right. That's all. It's enough.",
    ],
    6: [
      "Six years. This wall knows me. I know it.",
      "One more year of keeping things together. I've had worse jobs.",
    ],
    7: [
      "Seven years. This wall will stand long after I'm gone. That's what I wanted.",
      "I came here to build something that mattered. I did.",
    ],
  },

  scout: {
    1: [
      "I move quiet and I watch carefully. That's what you need from me.",
      "I won't get caught. I learn from everything I see.",
    ],
    2: [
      "Second year. I know the ground better now. Better routes.",
      "I've started reading the enemy before they move. It takes time to learn.",
    ],
    3: [
      "Three years. I've learned when to press and when to pull back.",
      "The information I bring back is reliable. I know how to verify what I see.",
    ],
    4: [
      "Four years of going out there. I've gotten good at coming back.",
      "I trust my instincts now. They've earned it.",
    ],
    5: [
      "Five years. I know the terrain as well as anyone alive.",
      "I don't take chances I don't have to. That's how I've lasted.",
    ],
    6: [
      "Six years of watching the enemy. I know their patterns better than I know most people.",
      "One more year. I intend to make it count.",
    ],
    7: [
      "Seven years of this. I've seen things most people couldn't imagine.",
      "I kept coming back. That's the whole job. I did the whole job.",
    ],
  },
};

// yearOfService 0 → key 1 (new recruit); yearOfService 6 → key 7 (final year)
export function pickGreeting(unitClass, yearOfService) {
  const yearKey = Math.min(Math.max((yearOfService ?? 0) + 1, 1), 7);
  const classPool = GREETINGS[unitClass] ?? GREETINGS.warrior;
  const pool = classPool[yearKey] ?? classPool[1];
  return pool[Math.floor(Math.random() * pool.length)];
}
