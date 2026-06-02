// First-name pools: 50 male, 50 female. Anglo-Saxon / Northern European tradition.
// Source: GDD Section VI — Recruit Generation Rules.

export const MALE_NAMES = [
  'Aldric', 'Bjorn', 'Calder', 'Dagmar', 'Edrik', 'Falko', 'Gunnar', 'Halvard',
  'Ingvar', 'Jorvik', 'Knut', 'Leif', 'Magnus', 'Njord', 'Oskar', 'Ragnar',
  'Sigurd', 'Torsten', 'Ulfric', 'Valdis', 'Wulfgar', 'Yorick', 'Alaric', 'Bertram',
  'Cormac', 'Draven', 'Einar', 'Finn', 'Godwin', 'Harald', 'Ivar', 'Jokull',
  'Kettil', 'Lothar', 'Morven', 'Norbert', 'Olaf', 'Peder', 'Quindar', 'Rodrik',
  'Sven', 'Thane', 'Ulrik', 'Vidar', 'Wulfric', 'Xander', 'Yngvar', 'Zoran',
  'Asmund', 'Brandr',
];

export const FEMALE_NAMES = [
  'Astrid', 'Brynhild', 'Dagny', 'Eira', 'Freya', 'Gudrun', 'Helga', 'Ingrid',
  'Jorunn', 'Kari', 'Lofn', 'Maren', 'Nora', 'Oddny', 'Petra', 'Ragnhild',
  'Sigrid', 'Thyra', 'Ulfhild', 'Ragnvor', 'Wulfwyn', 'Ylva', 'Alva', 'Bodil',
  'Cerwen', 'Drifa', 'Embla', 'Frida', 'Gunnhild', 'Hilda', 'Idunn', 'Jora',
  'Katla', 'Liv', 'Marta', 'Nanna', 'Olrun', 'Runa', 'Signe', 'Thora',
  'Unn', 'Vigdis', 'Wulfrun', 'Yrsa', 'Solveig', 'Bergljot', 'Catriona', 'Dalla',
  'Estrid', 'Finna',
];

// Surname pools: 25 per class. Theme reflects class identity.
export const SURNAMES = {
  warrior: [
    'Ironhelm', 'Grimwall', 'Stonefist', 'Hammerfall', 'Ravenbrow',
    'Ironguard', 'Steelborn', 'Grimshield', 'Wardbrow', 'Battleaxe',
    'Ironmantle', 'Strongarm', 'Deepstrike', 'Rampart', 'Bloodstone',
    'Steelwall', 'Grimbattle', 'Ironstrike', 'Battleborn', 'Wardhelm',
    'Grimborn', 'Ironfang', 'Wardbane', 'Swordhand', 'Bonebreak',
  ],
  archer: [
    'Trueshot', 'Eagleeye', 'Swiftflight', 'Hawkgaze', 'Longdraw',
    'Farreach', 'Swiftmark', 'Steadyhand', 'Clearshot', 'Falconwing',
    'Windshot', 'Ironbow', 'Sharpeye', 'Fleetarrow', 'Quickmark',
    'Stoneeye', 'Sureshot', 'Swifteye', 'Farmark', 'Windmark',
    'Coldshot', 'Quietmark', 'Brightshot', 'Silentdraw', 'Greeneye',
  ],
  mage: [
    'Runeborn', 'Ashenveil', 'Frostmantle', 'Grimrune', 'Shadowtongue',
    'Coldweave', 'Duskmantle', 'Starweave', 'Ironrune', 'Voidspeaker',
    'Emberveil', 'Stoneweave', 'Ashmantle', 'Frostweave', 'Darkrune',
    'Silverweave', 'Coldmantle', 'Emberspeaker', 'Greymantle', 'Stormweave',
    'Shadowrune', 'Darkweave', 'Frostborn', 'Ashspeaker', 'Runestone',
  ],
  healer: [
    'Gentlehand', 'Brightbalm', 'Mosswick', 'Dawntouch', 'Willowmend',
    'Softhand', 'Clearspring', 'Greenmend', 'Sunbalm', 'Brookside',
    'Quietmend', 'Brightmend', 'Rosewood', 'Dewhand', 'Warmtouch',
    'Lightmend', 'Calmhand', 'Fieldmend', 'Greenbalm', 'Gentlemend',
    'Springwater', 'Softmend', 'Clearhand', 'Brighttouch', 'Leafmend',
  ],
  captain: [
    'Goldmantle', 'Crownward', 'Bannerborn', 'Ironward', 'Valorhelm',
    'Shieldborn', 'Crownhelm', 'Bannerward', 'Honorborn', 'Goldward',
    'Ironmantle', 'Brightmantle', 'Valorborn', 'Crownborn', 'Shieldward',
    'Goldborn', 'Bannerhelm', 'Honorward', 'Ironborn', 'Brightward',
    'Valormantle', 'Shieldmantle', 'Goldhelm', 'Crownmantle', 'Wardborn',
  ],
  engineer: [
    'Stonethrower', 'Ironwright', 'Cogsworth', 'Forgewise', 'Timberfall',
    'Hammerbuild', 'Stonebuild', 'Ironforge', 'Cogsmith', 'Gearwright',
    'Bouldercast', 'Ironcast', 'Stonesmith', 'Timberwright', 'Forgeborn',
    'Gearsmith', 'Ironbrace', 'Timbercast', 'Stonework', 'Forgewright',
    'Cogborn', 'Hammerwright', 'Ironwork', 'Timberborn', 'Ballistborn',
  ],
  mason: [
    'Stonewright', 'Mortarborn', 'Wallward', 'Hammerstone', 'Keystoneborn',
    'Greystone', 'Cornerborn', 'Cobbleborn', 'Flintkind', 'Quarryborn',
    'Stonelayer', 'Wallborn', 'Mortarward', 'Buildwright', 'Cementborn',
    'Roughstone', 'Bedrock', 'Cobblestone', 'Flintstrike', 'Gravelborn',
    'Slateborn', 'Graniteborn', 'Archstone', 'Keystoneward', 'Mortarstone',
  ],
  scout: [
    'Shadowstep', 'Farwalker', 'Quietfoot', 'Windreader', 'Mistwalker',
    'Dawnseeker', 'Silentpath', 'Swifttrack', 'Darkpath', 'Greytrail',
    'Coldtrack', 'Farseeker', 'Swiftfoot', 'Silentmark', 'Windtrack',
    'Dawnpath', 'Shadowtrack', 'Farpath', 'Quietstep', 'Misttrack',
    'Coldstep', 'Greypath', 'Silentfoot', 'Swiftstep', 'Windpath',
  ],
};
