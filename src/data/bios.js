// Bio pools: four sub-pools of 64 bios each (GDD Section VI).
// Sub-pools keyed by gender × age: youngMale, youngFemale, oldMale, oldFemale.
// TODO (content): expand each pool to 64 entries before content review.

export const BIOS = {
  youngMale: [
    "He comes from a farming family north of the City, where the smell of turned earth is still on his hands. He's never been to the wall, but he's dreamed about it since he was old enough to hear the stories. He's stronger than he looks, and he's never once complained.",
    "He grew up watching his older brother march off as a recruit seven years ago. His brother came back a hero with a land deed and a scar across his jaw. He's been waiting ever since for his turn.",
    "He failed the qualifying tests twice before passing on his third attempt. He doesn't talk about the first two times. He trains harder than anyone in his cohort and asks for nothing except a chance to prove himself.",
    "He's the son of a blacksmith, and the calluses on his hands show it. He enlisted the day he turned old enough, without telling his father first. He sent a letter afterward. He's still waiting for a reply.",
    "He's the quiet sort — doesn't volunteer much, but when asked a question he answers it directly and completely. He watches everything. His instructors noted he remembered the positions of every unit in his first mock drill without being asked.",
    "He told his mother he was joining the merchant guild. She'd have tried to stop him if she knew the truth. He has no regrets about the lie. He intends to send her part of his land grant when this is done.",
    "He grew up in the City, one of seven brothers, in a house with thin walls and not enough bread. He enlisted because it was the only path that offered more than what he was born into. He's made peace with what that means.",
    "He served as a runner for the wall supply trains for two years before being selected as a recruit. He knows the supply roads better than anyone in his unit. He's cheerful by nature, and the others follow his mood.",
    "He won a district wrestling competition the year before he enlisted. The prize was a small bronze coin he still carries. He's not sure if that makes him lucky or superstitious. Both, maybe.",
    "He asked every veteran he could find the same question before he arrived: what's the one thing you wish you'd known? He has a list of their answers in his kit. He hasn't told anyone about the list.",
  ],

  youngFemale: [
    "She qualified third in her cohort, behind two men twice her size. She keeps that fact to herself. It's not a chip on her shoulder so much as a reference point — proof of what she's capable of, for when she needs reminding.",
    "She grew up in a fishing village south of the City, where the winters are long and nobody talks much. She's comfortable with silence. She's also comfortable with hard work, which is what matters here.",
    "She was working as a healer's apprentice in the City when she changed her mind and enlisted. Her mentor told her she was throwing her future away. She told him she was choosing a different one.",
    "She comes from a family of soldiers going back three generations. Her grandmother served at the wall. Her mother did not. She is the one who does again.",
    "She's small and quick and has a habit of solving problems before anyone else has finished describing them. Her unit finds this either reassuring or slightly annoying depending on who you ask.",
    "She grew up hearing her father's stories about the battle of the Sixteenth Year, where the center wall held by a margin of four defenders. He died before she was old enough to enlist. She's here for reasons she doesn't fully explain.",
    "She spent two years as a runner before qualifying as a recruit. In that time she memorized the layout of the entire wall complex and every access point. She says she did it out of curiosity. Her commanders are glad she did.",
    "She didn't know anyone at the wall when she arrived. She knows everyone now — their habits, what they're afraid of, what makes them laugh. She collects this the way other people collect coins.",
    "She enlisted the year her younger sister was born, calculating that by the time she returns with a land grant and a hero's deed, her sister will be old enough to understand what it cost and what it means.",
    "She's been told she's reckless. She prefers to think of it as accurate. The difference, she'll tell you, is whether it works. So far, it's been working.",
  ],

  oldMale: [
    "He spent twenty years as a tradesman before the wall finally called him. He says it wasn't an impulse — he's been preparing for two decades. He knows exactly what he's getting into, which is either reassuring or sobering depending on how you look at it.",
    "He served a full tour at the wall when he was young, left as a hero, and used his land grant to build a mill. The mill burned down in the third year. He remarried. His second wife died in the fifth. He's back because the wall is the only place he's ever felt certain of anything.",
    "He's a carpenter by trade. He can build anything from timber and a few nails and has the patience to do it correctly the first time. He applies the same method to everything. He is very slow to anger and very thorough when angry.",
    "He enlisted at forty-three, which made the examining officer raise an eyebrow. He passed every physical requirement anyway. He said nothing, because he'd learned that results answer better than arguments.",
    "He's a former schoolteacher from the outer villages, where he spent fifteen years teaching children arithmetic and letters and the names of the kings. He can recite the names of every commanding officer at the wall since the First Year. He brings this up sometimes.",
    "He's been at the wall three times in various support roles — cook, mason's laborer, supply clerk. This is the first time he'll hold a weapon. He's been thinking about it for twenty-two years and he's decided it's finally time.",
    "He left a small farm and an adult son behind when he enlisted. His son thinks he's lost his mind. He thinks his son doesn't yet understand that some things are worth going to the wall for, and some aren't, and it takes most of a lifetime to learn which is which.",
    "He's been a healer in a small village for thirty years. He knows how men die, and more importantly, how to make sure fewer of them do. He has opinions about field medicine that he shares freely and that are almost always correct.",
    "He's a former soldier from another branch of the king's service, mustered out after an injury that healed well enough for wall duty but not well enough for what he used to do. He doesn't talk about what that was. He still moves like someone who learned to be careful the hard way.",
    "He's the oldest recruit in his cohort by more than a decade. He is also, by most accounts, the calmest. He's seen enough bad situations to know which ones are actually bad and which ones only feel that way. The distinction matters.",
  ],

  oldFemale: [
    "She raised four children alone after her husband died, ran a market stall for fifteen years, and saved enough to finally settle her debts. Then she enlisted. When asked why, she said she'd been paying what she owed for long enough and wanted to do something for its own sake.",
    "She's a midwife who has brought more than two hundred children into the world. She knows how fragile life is and how much work it takes to preserve it. She came to the wall because she got tired of standing on the wrong side of that work.",
    "She spent thirty years as a merchant traveling the kingdom's roads. She knows every settlement, every shortcut, every place where bandits shelter in spring. She has a map in her head that no one else has. She says it always felt like preparation for something, and now she knows what.",
    "She was a commander's assistant for twelve years — not a soldier, but close enough to understand how decisions get made and what they cost. She's come to participate in those decisions rather than record them.",
    "She's the widow of a hero. He served his seven years, took his land, and died of a fever seven years after returning. She watched him become a legend and then watched the legend bury her. She enlisted the week after the funeral. She has nothing to explain to anyone.",
    "She was a smith's apprentice at fourteen, a journeyman at twenty, a master at thirty-five. She's made weapons for thirty years and wants to know what it's like to use one.",
    "She has seven grandchildren who all think she's at a trade fair in the City. This is not accurate. She'll write them when she arrives. She has thought carefully about what the letter will say.",
    "She spent twenty years as a miller's wife, grinding grain and keeping books and raising two children who grew up well. Then both children moved to the City, and the mill was too quiet, and the king's recruiters came through the village. She said yes before they finished explaining.",
    "She's been refused before — once at thirty, once at forty. The standards changed slightly in the intervening years, or she got better at the tests, or both. She doesn't ask why. She got in. That's enough.",
    "She came from a long line of women who worked hard, said little, and lasted. She expects to do the same. She will probably outlast your expectations.",
  ],
};

// Build fresh bio decks for a new playthrough — deck-draw ensures no duplicate bios
// within a generation batch. When a sub-pool is exhausted it resets from spent.
export function buildBioDecks() {
  const decks = {};
  for (const key of Object.keys(BIOS)) {
    decks[key] = { available: [...BIOS[key]], spent: [] };
  }
  return decks;
}

// Draw one bio without repetition. Mutates bioDecks. Resets pool when exhausted.
export function drawBio(bioDecks, gender, age) {
  const key  = `${age}${gender.charAt(0).toUpperCase() + gender.slice(1)}`;
  const deck = bioDecks[key] ?? bioDecks.youngMale;
  if (deck.available.length === 0) {
    deck.available = [...deck.spent];
    deck.spent     = [];
  }
  const idx = Math.floor(Math.random() * deck.available.length);
  const bio = deck.available.splice(idx, 1)[0];
  deck.spent.push(bio);
  return bio;
}
