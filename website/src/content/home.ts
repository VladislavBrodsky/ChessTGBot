/**
 * All marketing copy for the home page.
 * Strictly compliant with truth-in-product rules (DESIGN.md §10.4):
 * no custody claims, no promised earnings, exact fees sourced from src/lib/config.ts.
 * Typography Rule: Headlines, titles, and hooks NEVER end with a trailing period.
 */
export const home = {
  nav: [
    { href: "/how-it-works", label: "How it works" },
    { href: "/wagers", label: "Wagers" },
    { href: "/academy", label: "Academy" },
    { href: "/blog", label: "Blog" },
    { href: "/fair-play", label: "Fair Play" },
    { href: "/#faq", label: "FAQ" },
  ],
  hero: {
    headlineBefore: "Sk",
    headlineAfter: "ll is the only edge",
    headlinePlain: "Skill is the only edge",
    lead: "Stop playing chess for meaningless virtual rating points. Every player match on Web3Chess is fought for real USDT — 1 USDT minimum — against verified players at your rating level. Beat your rival, take 95% of the pot.",
    ctaNote: "No download · 1-click in Telegram · Free vs the A.I. · 18+",
    boardCaption: "Morphy vs. Duke of Brunswick & Count Isouard, Paris 1858 — the final position.",
  },
  chips: [
    "Runs inside Telegram",
    "Zero download",
    "1 USDT minimum stake",
    "Instant 95% winner payout",
    "Free practice vs A.I.",
    "USDT & TON wallet",
    "10 languages",
  ],
  play: {
    title: "Queue up. Close Telegram. We'll alert you when your rival sits down",
    lead: "No staring at loading spinners. Pick your time control and stake. Our Telegram bot pings you with an instant alert the millisecond an opponent in your rating bracket enters your board.",
    points: [
      "Strict rating-based matchmaking ensures games stay fiercely competitive.",
      "Moves are validated on the server with Stockfish 17 heuristics, not in browser memory.",
      "Millisecond clocks, draw offers, and resignation work with FIDE-standard precision.",
    ],
  },
  wagers: {
    title: "Why settle for virtual trophies when you can win USDT?",
    lead: "Both players deposit equal stakes into match escrow. The winner takes 95% of the pot in seconds upon checkmate or clock flag. 3% is the platform fee and 2% funds affiliate referral rewards.",
    risk: "Wager matches involve real money and you can lose your stake. Play responsibly. 18+.",
  },
  academy: {
    title: "Sharpen your tactical edge before you wager",
    lead: "From back-rank checkmate patterns to deep rook endgame conversions — train with interactive tactical tracks, daily puzzles, and unlimited A.I. sparring inside Telegram.",
    tracks: [
      { name: "Origins & Board Geometry", level: "Introductory" },
      { name: "Speed Opening Weaponry", level: "Beginner" },
      { name: "Tactical Pattern Decapitation", level: "Intermediate" },
      { name: "Endgame Conversion Technique", level: "Intermediate" },
      { name: "Blitz Clock & Flag Psychology", level: "Advanced" },
    ],
  },
  arena: {
    title: "Engineered for rapid thumb execution under pressure",
    lead: "A ruthless, zero-distraction dark board room built specifically for one-handed play in Telegram. High-contrast piece geometry, haptic feedback, and zero latency.",
  },
  money: {
    title: "Your funds. In plain sight. Settle in seconds",
    lead: "Deposit USDT or TON seamlessly, track every move on a chronological ledger, and withdraw directly to your TON wallet.",
    points: [
      { title: "Transparent Ledger", body: "Deposits, stakes, winnings, and withdrawals appear as verifiable rows with exact amounts and timestamps." },
      { title: "Automated & Reviewed Payouts", body: "Every withdrawal is verified before the transfer executes; high-volume amounts receive secondary security checks." },
      { title: "Verifiable On-Chain", body: "Once sent, the transfer is an open TON transaction you can independently confirm on Tonviewer." },
    ],
    custodyNote: "Your deposit is held as a platform balance until you withdraw it. Web3Chess is not a self-custody wallet.",
  },
  progression: {
    title: "Every checkmate elevates your seasonal status",
    tiles: [
      { title: "XP & Competitive Ranks", body: "Every rated game, completed lesson, and tactical puzzle awards XP toward your seasonal rank tier." },
      { title: "Seasonal Leaderboards", body: "Climb monthly division ladders for exclusive prize pools and tournament invitations." },
      { title: "Mystery Vault", body: "Spend your earned battle XP to unlock tactical perks and collectible assets." },
      { title: "High-Contrast Board Themes", body: "Unlock sleek obsidian, brutalist fog, and classic wooden tournament boards." },
      { title: "Premium Pass", body: "Enjoy 2× reward multipliers, advanced match telemetry, and complete Academy curriculum access." },
      { title: "Affiliate Commissions", body: "Invite chess rivals with your personal link and earn 2% USDT commission on every match they contest." },
    ],
  },
  mission: {
    overline: "THE MANIFESTO",
    title: "Making chess skill the only currency that matters",
    body: "In a world of predatory casinos and pay-to-win mobile games, chess remains the ultimate bastion of pure intellect. Nobody buys a better bishop or pays to skip a blunder. We built Web3Chess to honour that pure edge: equal stakes, transparent 95% winner payouts, and instant settlement you can verify yourself.",
  },
  philosophy: {
    overline: "SPORTSMANSHIP",
    title: "Honor the game. Respect your limits",
    body: "In classical chess, a master resigns by gently laying their king down. Know when to walk away from the tables. Set clear bankroll limits before you sit down, never chase losses, and remember that training is always free.",
  },
  moveOfTheDay: {
    overline: "MOVE OF THE DAY",
    title: "White to play. Mate in one",
    body: "Spot the back-rank weakness, deliver checkmate, and prove your tactical vision.",
    answer: "Ra8#",
    hint: "The black king has no escape square along the back rank.",
  },
  faq: [
    {
      q: "Can I play chess for free on Web3Chess?",
      a: "Yes! Practising against our A.I. engine across all skill levels and solving daily puzzles is 100% free and unlimited. Matches against other human players are real-money wager games with a 1 USDT minimum stake.",
    },
    {
      q: "How does a wager match work and who gets the pot?",
      a: "Both players deposit identical stakes from their in-app platform balance into escrow. The winner receives 95% of the total pot. 3% covers platform infrastructure and anti-cheat servers, and 2% funds affiliate referral commissions.",
    },
    {
      q: "How do I deposit funds to play?",
      a: "Inside the Telegram Mini App, open the Wallet tab. You can deposit USDT via Telegram's native @CryptoBot invoice, or send TON directly from your personal wallet to the master deposit address with your unique reference comment.",
    },
    {
      q: "How fast are withdrawals processed?",
      a: "You can request a withdrawal to your TON wallet at any time. Standard payouts are processed quickly after automated security verification. High-value withdrawals receive secondary review to prevent fraud. Every completed transfer is verifiable on Tonviewer.",
    },
    {
      q: "How do you prevent opponents from using chess engines to cheat?",
      a: "All moves are executed server-side with zero client-side authority. Our backend runs real-time Stockfish 17 evaluation, centipawn loss (ACPL) heuristics, and move-timing analysis. Matches showing superhuman engine correlation are flagged and frozen for grandmaster review.",
    },
    {
      q: "What are the age and legal requirements to play?",
      a: "A.I. practice and tactical puzzles are open to all ages globally. Real-money wager matches are restricted to players aged 18 and older. Players must ensure that real-money skill gaming is permissible under their local jurisdiction before wagering.",
    },
  ],
  footer: {
    statement: "The Premier Skill-Based Chess Arena on Telegram",
    columns: [
      {
        title: "Platform",
        links: [
          { label: "Play in Telegram", href: "#" },
          { label: "How It Works", href: "/how-it-works" },
          { label: "Wagers & Economics", href: "/wagers" },
          { label: "Chess Academy", href: "/academy" },
          { label: "Chronicles & Blog", href: "/blog" },
        ],
      },
      {
        title: "Integrity",
        links: [
          { label: "Fair Play Protocol", href: "/fair-play" },
          { label: "Terms of Service", href: "/terms" },
          { label: "Privacy Policy", href: "/privacy" },
          { label: "FAQ", href: "/#faq" },
        ],
      },
      {
        title: "Community",
        links: [
          { label: "Telegram Channel", href: "https://t.me/chess_hub" },
          { label: "Telegram Community Chat", href: "https://t.me/chesshub_chat" },
        ],
      },
    ],
    legal: "18+. Real-money wager matches involve financial risk and you can lose your stake. Practice against the A.I. and daily tactical training are always 100% free.",
  },
} as const;
