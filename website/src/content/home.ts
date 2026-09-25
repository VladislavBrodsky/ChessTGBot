/**
 * All marketing copy for the home page, in one object.
 * Every claim here is checked against the product (see DESIGN.md §10.4):
 * no custody claims, no promised earnings, fees sourced from src/lib/config.ts.
 * Translating the site = translating this file (i18n is the next step).
 */
export const home = {
  nav: [
    { href: "/#play", label: "How it works" },
    { href: "/#wagers", label: "Wagers" },
    { href: "/#academy", label: "Academy" },
    { href: "/#money", label: "Money" },
    { href: "/blog", label: "Blog" },
    { href: "/#faq", label: "FAQ" },
  ],
  hero: {
    headlineBefore: "Sk",
    headlineAfter: "ll is the only edge.",
    headlinePlain: "Skill is the only edge.",
    lead: "Real-time chess inside Telegram. Play rated games for free, or put USDT on the board against players at your level.",
    ctaNote: "Free to play · No download · 18+ for wager matches",
    boardCaption: "Morphy vs. Duke of Brunswick & Count Isouard, Paris 1858 — the final position.",
  },
  chips: [
    "Runs inside Telegram",
    "No download",
    "Free games, always",
    "Play the A.I. or real players",
    "USDT & TON wallet",
    "10 languages",
  ],
  play: {
    title: "Close the app. We'll call you to the board.",
    lead: "Pick a time control and join the queue. Telegram messages you the moment an opponent is found, so you don't sit and watch a spinner.",
    points: [
      "Rating-based matchmaking, so games stay competitive.",
      "Moves are validated on the server, not in your browser.",
      "Clocks, draw offers and resignation work like any serious chess app.",
    ],
  },
  wagers: {
    title: "Put something on the board.",
    lead: "Both players stake the same amount. The winner takes 95% of the pot; 3% is the platform fee and 2% funds referral payouts.",
    risk: "Wager matches involve real money and you can lose your stake. Play responsibly. 18+.",
  },
  academy: {
    title: "Train before you stake.",
    lead: "A daily puzzle, four mastery tracks and unlimited games against the engine — all inside the same Telegram tab.",
    tracks: [
      { name: "Origins & Motivation", level: "Introductory" },
      { name: "Opening Principles", level: "Beginner" },
      { name: "Tactical Patterns", level: "Intermediate" },
      { name: "Endgame Magic", level: "Intermediate" },
    ],
  },
  arena: {
    title: "This is the arena.",
    lead: "The game runs in a dark, high-contrast board room built for one-handed play on a phone.",
  },
  money: {
    title: "Your balance, in plain sight.",
    lead: "Deposit USDT or TON, see every movement in one ledger, and withdraw to your own TON wallet.",
    points: [
      { title: "One ledger", body: "Deposits, stakes, winnings and withdrawals appear as plain rows with amounts and timestamps." },
      { title: "Checked before it's sent", body: "Every withdrawal is reviewed before the transfer goes out; larger amounts get a second look." },
      { title: "Verifiable on-chain", body: "Once sent, the transfer is a normal TON transaction you can look up on Tonviewer." },
    ],
    custodyNote: "Your deposit is held as a platform balance until you withdraw it. Web3Chess is not a self-custody wallet.",
  },
  progression: {
    title: "Every win moves you up.",
    tiles: [
      { title: "XP and levels", body: "Every game, lesson and puzzle adds XP toward your next rank." },
      { title: "Seasons", body: "Leaderboards reset each season, so a bad month is never permanent." },
      { title: "Mystery Vault", body: "Spend XP on vault drops instead of cash." },
      { title: "Board themes", body: "Unlock 2D and 3D boards as you climb." },
      { title: "Premium", body: "2× rewards and XP, deeper referral levels, full Academy access." },
      { title: "Referrals", body: "Invite a rival and earn USDT commission from their matches." },
    ],
  },
  mission: {
    overline: "OUR GOAL",
    title: "To make skill the only thing that counts.",
    body: "Chess has no luck in it. Nobody gets a better opening because they paid more. We want the money side to be just as plain: equal stakes, a published cut, and a withdrawal you can verify yourself.",
  },
  philosophy: {
    overline: "YOU KNOW,",
    title: "It's only a game, after all.",
    body: "A chess player resigns by laying the king down. It costs nothing to do the same with a session that stopped being fun. Set a limit before you stake, not after.",
  },
  moveOfTheDay: {
    overline: "MOVE OF THE DAY",
    title: "White to play. Mate in one.",
    body: "Find it, then go play one for real.",
    answer: "Ra8#",
    hint: "The back rank is the whole story.",
  },
  faq: [
    {
      q: "Is it free?",
      a: "Yes. Rated games against other players and unlimited games against the A.I. cost nothing. Wager matches are optional and separate.",
    },
    {
      q: "How does a wager match work?",
      a: "Both players stake the same amount from their platform balance. The pot is twice the stake, and the winner receives 95% of it: 3% is the platform fee and 2% funds referral payouts.",
    },
    {
      q: "How do I deposit?",
      a: "From the wallet screen in the app: USDT through Telegram's @CryptoBot invoice, or TON sent to the master wallet with the exact comment shown on screen. The comment is what credits your balance, so copy it exactly.",
    },
    {
      q: "How do withdrawals work?",
      a: "Request one from the wallet screen and it's paid out to your connected TON wallet. Withdrawals are checked before they're sent, and larger amounts are held for review. Once sent, you can verify the transfer on Tonviewer.",
    },
    {
      q: "What do I need to start?",
      a: "A Telegram account. That's it for free games. A TON wallet is only needed if you want to deposit, stake or withdraw.",
    },
    {
      q: "Is it available where I live?",
      a: "Free play is open to everyone. Real-money features depend on local law and are 18+, so check the rules where you live before you stake.",
    },
  ],
  footer: {
    statement: "How money moves on Web3Chess.",
    columns: [
      { title: "Play", links: [ { label: "Play in Telegram", href: "#" }, { label: "How it works", href: "/#play" }, { label: "Academy", href: "/#academy" }, { label: "Blog & Chronicles", href: "/blog" }, { label: "Fair Play Protocol", href: "/fair-play" } ] },
      { title: "Community", links: [ { label: "Telegram channel", href: "https://t.me/chess_hub" }, { label: "Telegram chat", href: "https://t.me/chesshub_chat" } ] },
      { title: "Trust & Legal", links: [ { label: "Fair play protocol", href: "/fair-play" }, { label: "Terms of service", href: "/terms" }, { label: "Privacy policy", href: "/privacy" }, { label: "FAQ", href: "/#faq" } ] },
    ],
    legal: "18+. Wager matches involve real money and you can lose your stake. Free play is always available.",
  },
} as const;
