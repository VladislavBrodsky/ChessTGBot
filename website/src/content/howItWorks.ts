export const howItWorksContent = {
  hero: {
    badge: "Architecture & Mechanics",
    headlineBefore: "Zero downloads.",
    headlineAfter: "Zero delay. Real USDT.",
    lead: "Experience competitive chess engineered from the ground up for Telegram. Lightning-fast rating matchmaking, server-authoritative move validation, and instant 95% pot payouts the microsecond checkmate lands.",
    ctaNote: "Instant 1-tap launch · Built for iOS & Android Telegram · 18+",
  },
  steps: [
    {
      step: "01",
      tag: "Launch & Onboarding",
      title: "One Tap Inside Telegram",
      body: "No seed phrase friction, no 200MB app store downloads, and no clunky browser wallet extensions. Tap start, and your Web3Chess profile launches seamlessly inside Telegram with your handle and rating profile ready.",
      bullets: [
        "Native Telegram Mini App architecture",
        "Direct TON Connect & CryptoBot deposit support",
        "Zero battery drain background matchmaking",
      ],
    },
    {
      step: "02",
      tag: "Matchmaking & Queues",
      title: "Queue Up and Close the App",
      body: "Select your preferred time control (1+0, 3+2, 5+0, or 10+0) and set your wager stake. You don't have to stare at a loading circle — close Telegram, answer your messages, and our bot alerts you with an audible ping the second your rival sits down.",
      bullets: [
        "Strict Elo rating bands prevent predatory matchups",
        "Instant push notifications via Telegram Bot API",
        "Matchmaker expands bands transparently if queue is quiet",
      ],
    },
    {
      step: "03",
      tag: "Deterministic Play",
      title: "Server-Side Move Verification",
      body: "Every pawn push, knight fork, and king evasion is verified on isolated server clusters in under 5 milliseconds. Client devices possess zero authority over clock state or piece legality, making client tampering and lag-switching physically impossible.",
      bullets: [
        "Millisecond-synchronized NTP clocks with lag compensation",
        "Stockfish 17 continuous heuristic telemetry for anti-cheat",
        "30-second mobile reconnection protection against Wi-Fi drops",
      ],
    },
    {
      step: "04",
      tag: "Instant Settlement",
      title: "95% Pot Directly to Your Ledger",
      body: "The moment checkmate is delivered, your opponent resigns, or their clock flags zero, the pot is settled immediately. 95% goes directly into your in-app platform balance, ready for immediate withdrawal to your TON wallet or your next match.",
      bullets: [
        "Deterministic math: 95% winner, 3% platform fee, 2% referral pool",
        "Visible on your live personal ledger in real time",
        "Fast, verifiable withdrawal transfers via the TON blockchain",
      ],
    },
  ],
  comparison: {
    headline: "Why Casual Chess Is Dead",
    subheadline: "Traditional Platforms vs. Crypto Casinos vs. Web3Chess",
    rows: [
      {
        feature: "Real Stakes Payout",
        web3chess: "95% Winner Take All in USDT",
        traditional: "0 USDT (Meaningless digital badges)",
        casinos: "Rigged house edge (Slot RNG)",
      },
      {
        feature: "Outcome Determination",
        web3chess: "100% Pure Intellect & Skill",
        traditional: "100% Skill (No financial upside)",
        casinos: "Random Number Generator (House wins)",
      },
      {
        feature: "App Onboarding",
        web3chess: "1 Tap in Telegram (0s setup)",
        traditional: "Email signup + heavy mobile app",
        casinos: "Lengthy KYC + complex crypto bridges",
      },
      {
        feature: "Anti-Cheat Protection",
        web3chess: "Server Stockfish 17 & ACPL telemetry",
        traditional: "Delayed post-game bans",
        casinos: "Blackbox server-side algorithms",
      },
      {
        feature: "Notification UX",
        web3chess: "Telegram Bot instant board call",
        traditional: "Must keep browser/app open",
        casinos: "Spam emails and push spam",
      },
    ],
  },
} as const;
