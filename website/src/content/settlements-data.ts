// ── 200 Unique Real-Time Settlement Records (Deterministic & Non-Repeating) ──
export interface SettlementItem {
  id: string;
  player: string;
  flag: string;
  action: string;
  payout: string;
  time: string;
  icon: "lightning" | "trophy" | "gift" | "arrow-up-right" | "shield-check" | "coins" | "sword" | "crown-simple" | "sparkle" | "target" | "trend-up";
  color: string;
}

export const SETTLEMENT_VERSIONS: SettlementItem[] = [
  {
    "id": "s-1",
    "player": "CryptoMorphy",
    "flag": "🇦🇪",
    "action": "Won Blitz 3+2",
    "payout": "+$47.50",
    "time": "14s ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-2",
    "player": "Magnus_GRAM",
    "flag": "🇳🇴",
    "action": "Won Rapid 15+10",
    "payout": "+$190.00",
    "time": "38s ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-3",
    "player": "gram_tactician",
    "flag": "🇯🇵",
    "action": "Unboxed King's Vault",
    "payout": "+50 GRAM",
    "time": "1m ago",
    "icon": "gift",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-4",
    "player": "pawn_storm",
    "flag": "🇩🇪",
    "action": "Won Blitz 5+3",
    "payout": "+$142.50",
    "time": "1m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-5",
    "player": "gm_vlad",
    "flag": "🇺🇿",
    "action": "Won Rapid 10+0",
    "payout": "+$380.00",
    "time": "1m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-6",
    "player": "HikaruVibes",
    "flag": "🇺🇸",
    "action": "Won Bullet 2+1",
    "payout": "+$1.90",
    "time": "1m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-7",
    "player": "FischerQueen",
    "flag": "🇬🇧",
    "action": "Won Classical 30+0",
    "payout": "+$9.50",
    "time": "2m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-8",
    "player": "KasparovClaw",
    "flag": "🇮🇳",
    "action": "Won Armageddon 5+4",
    "payout": "+$28.50",
    "time": "2m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-9",
    "player": "TalMagician",
    "flag": "🇫🇷",
    "action": "Won HyperBullet 30s",
    "payout": "+$76.00",
    "time": "2m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-10",
    "player": "CapablancaFlow",
    "flag": "🇧🇷",
    "action": "Won Blitz 3+0",
    "payout": "+$190.00",
    "time": "2m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-11",
    "player": "SicilianDragon",
    "flag": "🇨🇦",
    "action": "Won Blitz 3+2",
    "payout": "+$475.00",
    "time": "3m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-12",
    "player": "CaroKannKing",
    "flag": "🇦🇷",
    "action": "Won Rapid 15+10",
    "payout": "+$3.80",
    "time": "3m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-13",
    "player": "FrenchDefense",
    "flag": "🇪🇸",
    "action": "Won Bullet 1+0",
    "payout": "+$14.25",
    "time": "3m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-14",
    "player": "KingWalkPro",
    "flag": "🇮🇹",
    "action": "Won Blitz 5+3",
    "payout": "+$38.00",
    "time": "4m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-15",
    "player": "Zwischenzug",
    "flag": "🇵🇱",
    "action": "Won Rapid 10+0",
    "payout": "+$95.00",
    "time": "4m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-16",
    "player": "DeepBlueEdge",
    "flag": "🇳🇱",
    "action": "Won Bullet 2+1",
    "payout": "+$285.00",
    "time": "4m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-17",
    "player": "EngineCrusher",
    "flag": "🇺🇦",
    "action": "Won Classical 30+0",
    "payout": "+$950.00",
    "time": "5m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-18",
    "player": "RookSacrifice",
    "flag": "🇰🇷",
    "action": "Won Armageddon 5+4",
    "payout": "+$4.75",
    "time": "5m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-19",
    "player": "BishopPair",
    "flag": "🇸🇬",
    "action": "Won HyperBullet 30s",
    "payout": "+$19.00",
    "time": "5m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-20",
    "player": "KnightForker",
    "flag": "🇨🇭",
    "action": "Won Blitz 3+0",
    "payout": "+$47.50",
    "time": "6m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-21",
    "player": "BulletDemon",
    "flag": "🇸🇪",
    "action": "Won Blitz 3+2",
    "payout": "+$142.50",
    "time": "6m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-22",
    "player": "BlitzWizard",
    "flag": "🇹🇷",
    "action": "Won Rapid 15+10",
    "payout": "+$380.00",
    "time": "6m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-23",
    "player": "TimeTrouble",
    "flag": "🇦🇺",
    "action": "Won Bullet 1+0",
    "payout": "+$1.90",
    "time": "7m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-24",
    "player": "Hypermodern",
    "flag": "🇲🇽",
    "action": "Won Blitz 5+3",
    "payout": "+$9.50",
    "time": "7m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-25",
    "player": "AlekhineGun",
    "flag": "🇿🇦",
    "action": "Won Rapid 10+0",
    "payout": "+$28.50",
    "time": "7m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-26",
    "player": "QueenSlayer",
    "flag": "🇳🇬",
    "action": "Won Bullet 2+1",
    "payout": "+$76.00",
    "time": "8m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-27",
    "player": "EndgameBeast",
    "flag": "🇻🇳",
    "action": "Won Classical 30+0",
    "payout": "+$190.00",
    "time": "8m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-28",
    "player": "TacticalNuke",
    "flag": "🇵🇭",
    "action": "Won Armageddon 5+4",
    "payout": "+$475.00",
    "time": "8m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-29",
    "player": "MateInTwo",
    "flag": "🇮🇩",
    "action": "Won HyperBullet 30s",
    "payout": "+$3.80",
    "time": "8m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-30",
    "player": "BlunderPunisher",
    "flag": "🇵🇹",
    "action": "Won Blitz 3+0",
    "payout": "+$14.25",
    "time": "9m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-31",
    "player": "Web3GM",
    "flag": "🇬🇷",
    "action": "Won Blitz 3+2",
    "payout": "+$38.00",
    "time": "9m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-32",
    "player": "SatoshiKnight",
    "flag": "🇦🇹",
    "action": "Won Rapid 15+10",
    "payout": "+$95.00",
    "time": "9m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-33",
    "player": "TelegramMaestro",
    "flag": "🇧🇪",
    "action": "Won Bullet 1+0",
    "payout": "+$285.00",
    "time": "10m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-34",
    "player": "GramGambit",
    "flag": "🇩🇰",
    "action": "Won Blitz 5+3",
    "payout": "+$950.00",
    "time": "10m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-35",
    "player": "VaultHunter",
    "flag": "🇫🇮",
    "action": "Won Rapid 10+0",
    "payout": "+$4.75",
    "time": "10m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-36",
    "player": "CheckmatePro",
    "flag": "🇮🇪",
    "action": "Won Bullet 2+1",
    "payout": "+$19.00",
    "time": "11m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-37",
    "player": "EloClimber",
    "flag": "🇳🇿",
    "action": "Won Classical 30+0",
    "payout": "+$47.50",
    "time": "11m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-38",
    "player": "RapidRuler",
    "flag": "🇨🇱",
    "action": "Won Armageddon 5+4",
    "payout": "+$142.50",
    "time": "11m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-39",
    "player": "TempoThief",
    "flag": "🇨🇴",
    "action": "Won HyperBullet 30s",
    "payout": "+$380.00",
    "time": "12m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-40",
    "player": "ZugzwangGod",
    "flag": "🇵🇪",
    "action": "Won Blitz 3+0",
    "payout": "+$1.90",
    "time": "12m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-41",
    "player": "NimzoMaster",
    "flag": "🇦🇪",
    "action": "Won Blitz 3+2",
    "payout": "+$9.50",
    "time": "12m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-42",
    "player": "PetrovShield",
    "flag": "🇳🇴",
    "action": "Won Rapid 15+10",
    "payout": "+$28.50",
    "time": "13m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-43",
    "player": "BenoniRider",
    "flag": "🇯🇵",
    "action": "Won Bullet 1+0",
    "payout": "+$76.00",
    "time": "13m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-44",
    "player": "GrunfeldStrike",
    "flag": "🇩🇪",
    "action": "Won Blitz 5+3",
    "payout": "+$190.00",
    "time": "13m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-45",
    "player": "KingIndianAce",
    "flag": "🇺🇿",
    "action": "Won Rapid 10+0",
    "payout": "+$475.00",
    "time": "14m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-46",
    "player": "DutchStonewall",
    "flag": "🇺🇸",
    "action": "Won Bullet 2+1",
    "payout": "+$3.80",
    "time": "14m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-47",
    "player": "LondonSysPro",
    "flag": "🇬🇧",
    "action": "Won Classical 30+0",
    "payout": "+$14.25",
    "time": "14m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-48",
    "player": "RuyLopezHero",
    "flag": "🇮🇳",
    "action": "Won Armageddon 5+4",
    "payout": "+$38.00",
    "time": "15m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-49",
    "player": "ItalianGame",
    "flag": "🇫🇷",
    "action": "Won HyperBullet 30s",
    "payout": "+$95.00",
    "time": "15m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-50",
    "player": "ScotchGambit",
    "flag": "🇧🇷",
    "action": "Won Blitz 3+0",
    "payout": "+$285.00",
    "time": "15m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-51",
    "player": "EvansGambit",
    "flag": "🇨🇦",
    "action": "Won Blitz 3+2",
    "payout": "+$950.00",
    "time": "15m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-52",
    "player": "FriedLiverGod",
    "flag": "🇦🇷",
    "action": "Won Rapid 15+10",
    "payout": "+$4.75",
    "time": "16m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-53",
    "player": "TraxlerDemon",
    "flag": "🇪🇸",
    "action": "Won Bullet 1+0",
    "payout": "+$19.00",
    "time": "16m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-54",
    "player": "BlackmarDiemer",
    "flag": "🇮🇹",
    "action": "Won Blitz 5+3",
    "payout": "+$47.50",
    "time": "16m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-55",
    "player": "BudapestPro",
    "flag": "🇵🇱",
    "action": "Won Rapid 10+0",
    "payout": "+$142.50",
    "time": "17m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-56",
    "player": "SlavDefense",
    "flag": "🇳🇱",
    "action": "Won Bullet 2+1",
    "payout": "+$380.00",
    "time": "17m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-57",
    "player": "CatalanMaster",
    "flag": "🇺🇦",
    "action": "Won Classical 30+0",
    "payout": "+$1.90",
    "time": "17m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-58",
    "player": "EnglishOpening",
    "flag": "🇰🇷",
    "action": "Won Armageddon 5+4",
    "payout": "+$9.50",
    "time": "18m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-59",
    "player": "RetiSystem",
    "flag": "🇸🇬",
    "action": "Won HyperBullet 30s",
    "payout": "+$28.50",
    "time": "18m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-60",
    "player": "BirdAttack",
    "flag": "🇨🇭",
    "action": "Won Blitz 3+0",
    "payout": "+$76.00",
    "time": "18m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-61",
    "player": "LaskerMind",
    "flag": "🇸🇪",
    "action": "Won Blitz 3+2",
    "payout": "+$190.00",
    "time": "19m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-62",
    "player": "PetrosianIron",
    "flag": "🇹🇷",
    "action": "Won Rapid 15+10",
    "payout": "+$475.00",
    "time": "19m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-63",
    "player": "SpasskyDrive",
    "flag": "🇦🇺",
    "action": "Won Bullet 1+0",
    "payout": "+$3.80",
    "time": "19m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-64",
    "player": "KarpovSqueeze",
    "flag": "🇲🇽",
    "action": "Won Blitz 5+3",
    "payout": "+$14.25",
    "time": "20m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-65",
    "player": "AnandSpeed",
    "flag": "🇿🇦",
    "action": "Won Rapid 10+0",
    "payout": "+$38.00",
    "time": "20m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-66",
    "player": "KramnikWall",
    "flag": "🇳🇬",
    "action": "Won Bullet 2+1",
    "payout": "+$95.00",
    "time": "20m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-67",
    "player": "CarlsenEndgame",
    "flag": "🇻🇳",
    "action": "Won Classical 30+0",
    "payout": "+$285.00",
    "time": "21m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-68",
    "player": "CaruanaPrep",
    "flag": "🇵🇭",
    "action": "Won Armageddon 5+4",
    "payout": "+$950.00",
    "time": "21m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-69",
    "player": "DingLirenSoul",
    "flag": "🇮🇩",
    "action": "Won HyperBullet 30s",
    "payout": "+$4.75",
    "time": "21m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-70",
    "player": "NakamuraStream",
    "flag": "🇵🇹",
    "action": "Won Blitz 3+0",
    "payout": "+$19.00",
    "time": "21m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-71",
    "player": "NepoFastHands",
    "flag": "🇬🇷",
    "action": "Won Blitz 3+2",
    "payout": "+$47.50",
    "time": "22m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-72",
    "player": "FirouzjaFire",
    "flag": "🇦🇹",
    "action": "Won Rapid 15+10",
    "payout": "+$142.50",
    "time": "22m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-73",
    "player": "GukeshTactics",
    "flag": "🇧🇪",
    "action": "Won Bullet 1+0",
    "payout": "+$380.00",
    "time": "22m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-74",
    "player": "PraggCalculate",
    "flag": "🇩🇰",
    "action": "Won Blitz 5+3",
    "payout": "+$1.90",
    "time": "23m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-75",
    "player": "AbdusattorovGM",
    "flag": "🇫🇮",
    "action": "Won Rapid 10+0",
    "payout": "+$9.50",
    "time": "23m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-76",
    "player": "KeymerPrecision",
    "flag": "🇮🇪",
    "action": "Won Bullet 2+1",
    "payout": "+$28.50",
    "time": "23m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-77",
    "player": "ArjunErigaisi",
    "flag": "🇳🇿",
    "action": "Won Classical 30+0",
    "payout": "+$76.00",
    "time": "24m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-78",
    "player": "ViditVibes",
    "flag": "🇨🇱",
    "action": "Won Armageddon 5+4",
    "payout": "+$190.00",
    "time": "24m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-79",
    "player": "SoSolidPawn",
    "flag": "🇨🇴",
    "action": "Won HyperBullet 30s",
    "payout": "+$475.00",
    "time": "24m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-80",
    "player": "MamedyarovAttack",
    "flag": "🇵🇪",
    "action": "Won Blitz 3+0",
    "payout": "+$3.80",
    "time": "25m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-81",
    "player": "GiriDrawRefused",
    "flag": "🇦🇪",
    "action": "Won Blitz 3+2",
    "payout": "+$14.25",
    "time": "25m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-82",
    "player": "VachierLagrave",
    "flag": "🇳🇴",
    "action": "Won Rapid 15+10",
    "payout": "+$38.00",
    "time": "25m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-83",
    "player": "RadjabovShield",
    "flag": "🇯🇵",
    "action": "Won Bullet 1+0",
    "payout": "+$95.00",
    "time": "26m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-84",
    "player": "DudaAttacker",
    "flag": "🇩🇪",
    "action": "Won Blitz 5+3",
    "payout": "+$285.00",
    "time": "26m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-85",
    "player": "DubovCreative",
    "flag": "🇺🇿",
    "action": "Won Rapid 10+0",
    "payout": "+$950.00",
    "time": "26m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-86",
    "player": "RapportMagic",
    "flag": "🇺🇸",
    "action": "Won Bullet 2+1",
    "payout": "+$4.75",
    "time": "27m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-87",
    "player": "AronianSmile",
    "flag": "🇬🇧",
    "action": "Won Classical 30+0",
    "payout": "+$19.00",
    "time": "27m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-88",
    "player": "GrischukClock",
    "flag": "🇮🇳",
    "action": "Won Armageddon 5+4",
    "payout": "+$47.50",
    "time": "27m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-89",
    "player": "SvidlerCranium",
    "flag": "🇫🇷",
    "action": "Won HyperBullet 30s",
    "payout": "+$142.50",
    "time": "27m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-90",
    "player": "TopalovBreeze",
    "flag": "🇧🇷",
    "action": "Won Blitz 3+0",
    "payout": "+$380.00",
    "time": "28m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-91",
    "player": "JuditPolgarGM",
    "flag": "🇨🇦",
    "action": "Won Blitz 3+2",
    "payout": "+$1.90",
    "time": "28m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-92",
    "player": "HouYifanMaster",
    "flag": "🇦🇷",
    "action": "Won Rapid 15+10",
    "payout": "+$9.50",
    "time": "28m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-93",
    "player": "JuWenjunCheck",
    "flag": "🇪🇸",
    "action": "Won Bullet 1+0",
    "payout": "+$28.50",
    "time": "29m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-94",
    "player": "KosteniukQueen",
    "flag": "🇮🇹",
    "action": "Won Blitz 5+3",
    "payout": "+$76.00",
    "time": "29m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-95",
    "player": "MuzychukSister",
    "flag": "🇵🇱",
    "action": "Won Rapid 10+0",
    "payout": "+$190.00",
    "time": "29m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-96",
    "player": "BotezGambitWin",
    "flag": "🇳🇱",
    "action": "Won Bullet 2+1",
    "payout": "+$475.00",
    "time": "30m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-97",
    "player": "ChessNerd",
    "flag": "🇺🇦",
    "action": "Won Classical 30+0",
    "payout": "+$3.80",
    "time": "30m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-98",
    "player": "WoodpusherElite",
    "flag": "🇰🇷",
    "action": "Won Armageddon 5+4",
    "payout": "+$14.25",
    "time": "30m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-99",
    "player": "FianchettoKing",
    "flag": "🇸🇬",
    "action": "Won HyperBullet 30s",
    "payout": "+$38.00",
    "time": "31m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-100",
    "player": "PassedPawn99",
    "flag": "🇨🇭",
    "action": "Won Blitz 3+0",
    "payout": "+$95.00",
    "time": "31m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-101",
    "player": "IsolatedQueen",
    "flag": "🇸🇪",
    "action": "Won Blitz 3+2",
    "payout": "+$285.00",
    "time": "31m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-102",
    "player": "BackwardPawnNo",
    "flag": "🇹🇷",
    "action": "Won Rapid 15+10",
    "payout": "+$950.00",
    "time": "32m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-103",
    "player": "DoubledRooks",
    "flag": "🇦🇺",
    "action": "Won Bullet 1+0",
    "payout": "+$4.75",
    "time": "32m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-104",
    "player": "BatteryTower",
    "flag": "🇲🇽",
    "action": "Won Blitz 5+3",
    "payout": "+$19.00",
    "time": "32m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-105",
    "player": "PinAndWin",
    "flag": "🇿🇦",
    "action": "Won Rapid 10+0",
    "payout": "+$47.50",
    "time": "33m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-106",
    "player": "SkewerMaster",
    "flag": "🇳🇬",
    "action": "Won Bullet 2+1",
    "payout": "+$142.50",
    "time": "33m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-107",
    "player": "DiscoveredCheck",
    "flag": "🇻🇳",
    "action": "Won Classical 30+0",
    "payout": "+$380.00",
    "time": "33m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-108",
    "player": "DoubleCheckMate",
    "flag": "🇵🇭",
    "action": "Won Armageddon 5+4",
    "payout": "+$1.90",
    "time": "34m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-109",
    "player": "WindmillTactic",
    "flag": "🇮🇩",
    "action": "Won HyperBullet 30s",
    "payout": "+$9.50",
    "time": "34m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-110",
    "player": "PerpetualCheck",
    "flag": "🇵🇹",
    "action": "Won Blitz 3+0",
    "payout": "+$28.50",
    "time": "34m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-111",
    "player": "Underpromotion",
    "flag": "🇬🇷",
    "action": "Won Blitz 3+2",
    "payout": "+$76.00",
    "time": "34m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-112",
    "player": "PawnBreakthrough",
    "flag": "🇦🇹",
    "action": "Won Rapid 15+10",
    "payout": "+$190.00",
    "time": "35m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-113",
    "player": "OutpostKnight",
    "flag": "🇧🇪",
    "action": "Won Bullet 1+0",
    "payout": "+$475.00",
    "time": "35m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-114",
    "player": "BadBishopFixed",
    "flag": "🇩🇰",
    "action": "Won Blitz 5+3",
    "payout": "+$3.80",
    "time": "35m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-115",
    "player": "OpenFileDominance",
    "flag": "🇫🇮",
    "action": "Won Rapid 10+0",
    "payout": "+$14.25",
    "time": "36m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-116",
    "player": "SeventhRankPig",
    "flag": "🇮🇪",
    "action": "Won Bullet 2+1",
    "payout": "+$38.00",
    "time": "36m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-117",
    "player": "BackRankBuster",
    "flag": "🇳🇿",
    "action": "Won Classical 30+0",
    "payout": "+$95.00",
    "time": "36m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-118",
    "player": "KingSafetyZero",
    "flag": "🇨🇱",
    "action": "Won Armageddon 5+4",
    "payout": "+$285.00",
    "time": "37m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-119",
    "player": "KingHuntLegend",
    "flag": "🇨🇴",
    "action": "Won HyperBullet 30s",
    "payout": "+$950.00",
    "time": "37m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-120",
    "player": "GreekGiftSpecial",
    "flag": "🇵🇪",
    "action": "Won Blitz 3+0",
    "payout": "+$4.75",
    "time": "37m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-121",
    "player": "SmotheredHero",
    "flag": "🇦🇪",
    "action": "Smothered mate win",
    "payout": "+10 GRAM",
    "time": "38m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-122",
    "player": "AnastasiaMate",
    "flag": "🇳🇴",
    "action": "Checkmated in 16 moves",
    "payout": "+$19.00",
    "time": "38m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-123",
    "player": "ArabianCheckmate",
    "flag": "🇯🇵",
    "action": "Trapped Queen · Won",
    "payout": "+$38.00",
    "time": "38m ago",
    "icon": "target",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-124",
    "player": "BodenMateWin",
    "flag": "🇩🇪",
    "action": "Greek Gift sacrifice win",
    "payout": "+75 GRAM",
    "time": "39m ago",
    "icon": "crown-simple",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-125",
    "player": "BlackburneMate",
    "flag": "🇺🇿",
    "action": "Forked King & Queen",
    "payout": "+$142.50",
    "time": "39m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-126",
    "player": "DamianoDefense",
    "flag": "🇺🇸",
    "action": "Back-rank checkmate",
    "payout": "+$285.00",
    "time": "39m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-127",
    "player": "MorphyDefense",
    "flag": "🇬🇧",
    "action": "Flagged rival (0.3s left)",
    "payout": "+500 GRAM",
    "time": "40m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-128",
    "player": "SteinitzDefense",
    "flag": "🇮🇳",
    "action": "Pawn promotion mate",
    "payout": "+$1.90",
    "time": "40m ago",
    "icon": "crown-simple",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-129",
    "player": "MarshallAttack",
    "flag": "🇫🇷",
    "action": "Double checkmate win",
    "payout": "+$4.75",
    "time": "40m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-130",
    "player": "OpenRuyLopez",
    "flag": "🇧🇷",
    "action": "Endgame conversion",
    "payout": "+25 GRAM",
    "time": "40m ago",
    "icon": "shield-check",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-131",
    "player": "BerlinEndgame",
    "flag": "🇨🇦",
    "action": "Underpromotion to Knight",
    "payout": "+$28.50",
    "time": "41m ago",
    "icon": "crown-simple",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-132",
    "player": "NajdorfSpecial",
    "flag": "🇦🇷",
    "action": "Boden's Mate win",
    "payout": "+$47.50",
    "time": "41m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-133",
    "player": "DragonYugoslav",
    "flag": "🇪🇸",
    "action": "King hunt checkmate",
    "payout": "+100 GRAM",
    "time": "41m ago",
    "icon": "crown-simple",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-134",
    "player": "ScheveningenGM",
    "flag": "🇮🇹",
    "action": "Windmill tactic win",
    "payout": "+$190.00",
    "time": "42m ago",
    "icon": "target",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-135",
    "player": "TaimanovFlex",
    "flag": "🇵🇱",
    "action": "Smothered mate win",
    "payout": "+$380.00",
    "time": "42m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-136",
    "player": "KanVariation",
    "flag": "🇳🇱",
    "action": "Checkmated in 16 moves",
    "payout": "+1,000 GRAM",
    "time": "42m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-137",
    "player": "ClassicalSicil",
    "flag": "🇺🇦",
    "action": "Trapped Queen · Won",
    "payout": "+$3.80",
    "time": "43m ago",
    "icon": "target",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-138",
    "player": "AlapinCounter",
    "flag": "🇰🇷",
    "action": "Greek Gift sacrifice win",
    "payout": "+$9.50",
    "time": "43m ago",
    "icon": "crown-simple",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-139",
    "player": "SmithMorraCrush",
    "flag": "🇸🇬",
    "action": "Forked King & Queen",
    "payout": "+50 GRAM",
    "time": "43m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-140",
    "player": "GrandPrixAttack",
    "flag": "🇨🇭",
    "action": "Back-rank checkmate",
    "payout": "+$38.00",
    "time": "44m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-141",
    "player": "ClosedSicilian",
    "flag": "🇸🇪",
    "action": "Flagged rival (0.3s left)",
    "payout": "+$76.00",
    "time": "44m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-142",
    "player": "RossolimoAce",
    "flag": "🇹🇷",
    "action": "Pawn promotion mate",
    "payout": "+250 GRAM",
    "time": "44m ago",
    "icon": "crown-simple",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-143",
    "player": "MoscowVariation",
    "flag": "🇦🇺",
    "action": "Double checkmate win",
    "payout": "+$285.00",
    "time": "45m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-144",
    "player": "FrenchWinawer",
    "flag": "🇲🇽",
    "action": "Endgame conversion",
    "payout": "+$475.00",
    "time": "45m ago",
    "icon": "shield-check",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-145",
    "player": "FrenchTarrasch",
    "flag": "🇿🇦",
    "action": "Underpromotion to Knight",
    "payout": "+10 GRAM",
    "time": "45m ago",
    "icon": "crown-simple",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-146",
    "player": "FrenchRubinstein",
    "flag": "🇳🇬",
    "action": "Boden's Mate win",
    "payout": "+$4.75",
    "time": "46m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-147",
    "player": "AdvanceFrench",
    "flag": "🇻🇳",
    "action": "King hunt checkmate",
    "payout": "+$14.25",
    "time": "46m ago",
    "icon": "crown-simple",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-148",
    "player": "CaroAdvance",
    "flag": "🇵🇭",
    "action": "Windmill tactic win",
    "payout": "+75 GRAM",
    "time": "46m ago",
    "icon": "target",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-149",
    "player": "CaroClassical",
    "flag": "🇮🇩",
    "action": "Smothered mate win",
    "payout": "+$47.50",
    "time": "46m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-150",
    "player": "CaroPanov",
    "flag": "🇵🇹",
    "action": "Checkmated in 16 moves",
    "payout": "+$95.00",
    "time": "47m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-151",
    "player": "ScandinavianWin",
    "flag": "🇬🇷",
    "action": "Trapped Queen · Won",
    "payout": "+500 GRAM",
    "time": "47m ago",
    "icon": "target",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-152",
    "player": "AlekhineModern",
    "flag": "🇦🇹",
    "action": "Greek Gift sacrifice win",
    "payout": "+$380.00",
    "time": "47m ago",
    "icon": "crown-simple",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-153",
    "player": "PircDefenseAce",
    "flag": "🇧🇪",
    "action": "Forked King & Queen",
    "payout": "+$950.00",
    "time": "48m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-154",
    "player": "ModernTiger",
    "flag": "🇩🇰",
    "action": "Back-rank checkmate",
    "payout": "+25 GRAM",
    "time": "48m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-155",
    "player": "HippoOpening",
    "flag": "🇫🇮",
    "action": "Flagged rival (0.3s left)",
    "payout": "+$9.50",
    "time": "48m ago",
    "icon": "lightning",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-156",
    "player": "TorreAttack",
    "flag": "🇮🇪",
    "action": "Pawn promotion mate",
    "payout": "+$19.00",
    "time": "49m ago",
    "icon": "crown-simple",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-157",
    "player": "TrompowskyWin",
    "flag": "🇳🇿",
    "action": "Double checkmate win",
    "payout": "+100 GRAM",
    "time": "49m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-158",
    "player": "ColleSystem",
    "flag": "🇨🇱",
    "action": "Endgame conversion",
    "payout": "+$76.00",
    "time": "49m ago",
    "icon": "shield-check",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-159",
    "player": "JobavaLondon",
    "flag": "🇨🇴",
    "action": "Underpromotion to Knight",
    "payout": "+$142.50",
    "time": "50m ago",
    "icon": "crown-simple",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-160",
    "player": "BlackburneShilling",
    "flag": "🇵🇪",
    "action": "Boden's Mate win",
    "payout": "+1,000 GRAM",
    "time": "50m ago",
    "icon": "sword",
    "color": "text-fg bg-inset border-line"
  },
  {
    "id": "s-161",
    "player": "ElephantGambit",
    "flag": "🇦🇪",
    "action": "Unboxed King's Vault",
    "payout": "+10 GRAM",
    "time": "50m ago",
    "icon": "gift",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-162",
    "player": "LatvianGambit",
    "flag": "🇳🇴",
    "action": "Unboxed Queen's Chest",
    "payout": "+25 GRAM",
    "time": "51m ago",
    "icon": "gift",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-163",
    "player": "HalloweenGambit",
    "flag": "🇯🇵",
    "action": "Unboxed Knight's Cache",
    "payout": "+50 GRAM",
    "time": "51m ago",
    "icon": "gift",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-164",
    "player": "BongcloudLegend",
    "flag": "🇩🇪",
    "action": "Hit Mystery Jackpot",
    "payout": "+75 GRAM",
    "time": "51m ago",
    "icon": "sparkle",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-165",
    "player": "FoolsMateDodger",
    "flag": "🇺🇿",
    "action": "Claimed Streak Bonus",
    "payout": "+100 GRAM",
    "time": "52m ago",
    "icon": "coins",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-166",
    "player": "ScholarsPunisher",
    "flag": "🇺🇸",
    "action": "Hit Grandmaster Drop",
    "payout": "+250 GRAM",
    "time": "52m ago",
    "icon": "sparkle",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-167",
    "player": "GramSpeedMaster",
    "flag": "🇬🇧",
    "action": "Unboxed Bishop's Vault",
    "payout": "+500 GRAM",
    "time": "52m ago",
    "icon": "gift",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-168",
    "player": "GramProtocol",
    "flag": "🇮🇳",
    "action": "Hit 10-Win Arena Streak",
    "payout": "+1,000 GRAM",
    "time": "53m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-169",
    "player": "TetherChess",
    "flag": "🇫🇷",
    "action": "Unboxed King's Vault",
    "payout": "+10 GRAM",
    "time": "53m ago",
    "icon": "gift",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-170",
    "player": "TonviewerFan",
    "flag": "🇧🇷",
    "action": "Unboxed Queen's Chest",
    "payout": "+25 GRAM",
    "time": "53m ago",
    "icon": "gift",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-171",
    "player": "MasterWallet99",
    "flag": "🇨🇦",
    "action": "Unboxed Knight's Cache",
    "payout": "+50 GRAM",
    "time": "53m ago",
    "icon": "gift",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-172",
    "player": "InstantPayouts",
    "flag": "🇦🇷",
    "action": "Hit Mystery Jackpot",
    "payout": "+75 GRAM",
    "time": "54m ago",
    "icon": "sparkle",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-173",
    "player": "FastSettler",
    "flag": "🇪🇸",
    "action": "Claimed Streak Bonus",
    "payout": "+100 GRAM",
    "time": "54m ago",
    "icon": "coins",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-174",
    "player": "NonCustodialGM",
    "flag": "🇮🇹",
    "action": "Hit Grandmaster Drop",
    "payout": "+250 GRAM",
    "time": "54m ago",
    "icon": "sparkle",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-175",
    "player": "ZeroCounterparty",
    "flag": "🇵🇱",
    "action": "Unboxed Bishop's Vault",
    "payout": "+500 GRAM",
    "time": "55m ago",
    "icon": "gift",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-176",
    "player": "DecentralizedPvP",
    "flag": "🇳🇱",
    "action": "Hit 10-Win Arena Streak",
    "payout": "+1,000 GRAM",
    "time": "55m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-177",
    "player": "OnChainArbiter",
    "flag": "🇺🇦",
    "action": "Unboxed King's Vault",
    "payout": "+10 GRAM",
    "time": "55m ago",
    "icon": "gift",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-178",
    "player": "SubCentGasKing",
    "flag": "🇰🇷",
    "action": "Unboxed Queen's Chest",
    "payout": "+25 GRAM",
    "time": "56m ago",
    "icon": "gift",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-179",
    "player": "TelegramMiniGod",
    "flag": "🇸🇬",
    "action": "Unboxed Knight's Cache",
    "payout": "+50 GRAM",
    "time": "56m ago",
    "icon": "gift",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-180",
    "player": "ObsidianChess",
    "flag": "🇨🇭",
    "action": "Hit Mystery Jackpot",
    "payout": "+75 GRAM",
    "time": "56m ago",
    "icon": "sparkle",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-181",
    "player": "FogBoardMaster",
    "flag": "🇸🇪",
    "action": "Claimed Streak Bonus",
    "payout": "+100 GRAM",
    "time": "57m ago",
    "icon": "coins",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-182",
    "player": "GrandmasterKey",
    "flag": "🇹🇷",
    "action": "Hit Grandmaster Drop",
    "payout": "+250 GRAM",
    "time": "57m ago",
    "icon": "sparkle",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-183",
    "player": "PawnStormer99",
    "flag": "🇦🇺",
    "action": "Unboxed Bishop's Vault",
    "payout": "+500 GRAM",
    "time": "57m ago",
    "icon": "gift",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-184",
    "player": "BlitzAddict",
    "flag": "🇲🇽",
    "action": "Hit 10-Win Arena Streak",
    "payout": "+1,000 GRAM",
    "time": "58m ago",
    "icon": "trophy",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-185",
    "player": "BulletBullet",
    "flag": "🇿🇦",
    "action": "Unboxed King's Vault",
    "payout": "+10 GRAM",
    "time": "58m ago",
    "icon": "gift",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-186",
    "player": "QuantumKnight",
    "flag": "🇳🇬",
    "action": "Unboxed Queen's Chest",
    "payout": "+25 GRAM",
    "time": "58m ago",
    "icon": "gift",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-187",
    "player": "ZeroSumMaster",
    "flag": "🇻🇳",
    "action": "Unboxed Knight's Cache",
    "payout": "+50 GRAM",
    "time": "59m ago",
    "icon": "gift",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-188",
    "player": "SmartContractGM",
    "flag": "🇵🇭",
    "action": "Hit Mystery Jackpot",
    "payout": "+75 GRAM",
    "time": "59m ago",
    "icon": "sparkle",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-189",
    "player": "SpeedDemon99",
    "flag": "🇮🇩",
    "action": "Claimed Streak Bonus",
    "payout": "+100 GRAM",
    "time": "59m ago",
    "icon": "coins",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-190",
    "player": "TacticsGuru",
    "flag": "🇵🇹",
    "action": "Hit Grandmaster Drop",
    "payout": "+250 GRAM",
    "time": "59m ago",
    "icon": "sparkle",
    "color": "text-fg-caution bg-caution-soft/15 border-caution/30"
  },
  {
    "id": "s-191",
    "player": "EndgameOracle",
    "flag": "🇬🇷",
    "action": "Withdrew USDT",
    "payout": "✓ On-Chain",
    "time": "17s ago",
    "icon": "arrow-up-right",
    "color": "text-fg-premium bg-premium-soft/15 border-premium/30"
  },
  {
    "id": "s-192",
    "player": "BlitzTitan",
    "flag": "🇦🇹",
    "action": "Withdrew GRAM",
    "payout": "✓ On-Chain",
    "time": "36s ago",
    "icon": "arrow-up-right",
    "color": "text-fg-premium bg-premium-soft/15 border-premium/30"
  },
  {
    "id": "s-193",
    "player": "BulletGhost",
    "flag": "🇧🇪",
    "action": "Climbed to 2400 ELO",
    "payout": "Master Tier",
    "time": "55s ago",
    "icon": "trend-up",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-194",
    "player": "CryptoCastling",
    "flag": "🇩🇰",
    "action": "Climbed to 2500 ELO",
    "payout": "Master Tier",
    "time": "1m ago",
    "icon": "trend-up",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-195",
    "player": "DecentralizedMate",
    "flag": "🇫🇮",
    "action": "Claimed Season 1 Badge",
    "payout": "Master Tier",
    "time": "1m ago",
    "icon": "shield-check",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  },
  {
    "id": "s-196",
    "player": "Web3Tactician",
    "flag": "🇮🇪",
    "action": "Withdrew USDT",
    "payout": "✓ On-Chain",
    "time": "1m ago",
    "icon": "arrow-up-right",
    "color": "text-fg-premium bg-premium-soft/15 border-premium/30"
  },
  {
    "id": "s-197",
    "player": "GramGrandmaster",
    "flag": "🇳🇿",
    "action": "Withdrew GRAM",
    "payout": "✓ On-Chain",
    "time": "2m ago",
    "icon": "arrow-up-right",
    "color": "text-fg-premium bg-premium-soft/15 border-premium/30"
  },
  {
    "id": "s-198",
    "player": "UsdtWhale_Chess",
    "flag": "🇨🇱",
    "action": "Climbed to 2400 ELO",
    "payout": "Master Tier",
    "time": "2m ago",
    "icon": "trend-up",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-199",
    "player": "FastCheckmate",
    "flag": "🇨🇴",
    "action": "Climbed to 2500 ELO",
    "payout": "Master Tier",
    "time": "2m ago",
    "icon": "trend-up",
    "color": "text-fg-win bg-win-fill/15 border-win/30"
  },
  {
    "id": "s-200",
    "player": "RapidGladiator",
    "flag": "🇵🇪",
    "action": "Claimed Season 1 Badge",
    "payout": "Master Tier",
    "time": "3m ago",
    "icon": "shield-check",
    "color": "text-fg-muted bg-fg-muted/15 border-line/30"
  }
];
