export const howItWorksContent = {
  hero: {
    badge: "Architecture & Mechanics",
    headlineBefore: "Zero downloads",
    headlineAfter: "Zero setup. Real USDT",
    lead: "Experience competitive chess engineered from the ground up for Telegram. Rating-based matchmaking, server-authoritative move validation, and 95% of the pot credited to the winner’s balance as soon as the game ends.",
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
        "Direct GRAM Connect & CryptoBot deposit support",
        "Zero battery drain background matchmaking",
      ],
    },
    {
      step: "02",
      tag: "Matchmaking & Queues",
      title: "Queue Up and Close the App",
      body: "Select your clock (a flat 1, 3, 5, 10, 15, 30, or 60 minutes per side, with no increment) and set your wager stake. You don't have to stare at a loading circle — close Telegram, answer your messages, and our bot alerts you with an audible ping the second your rival sits down.",
      bullets: [
        "Pairing starts within ±100 Elo of your rating",
        "Instant push notifications via Telegram Bot API",
        "Matchmaker expands bands transparently if queue is quiet",
      ],
    },
    {
      step: "03",
      tag: "Deterministic Play",
      title: "Server-Side Move Verification",
      body: "Every pawn push, knight fork, and king evasion is checked against the rules on the server before it reaches the board. Client devices have no authority over clock state or piece legality, so a tampered client cannot play an illegal move or pause its own clock.",
      bullets: [
        "Server-kept clocks that run only on your move",
        "Wager pairing skips same-IP, referral-linked, and recent opponents",
        "Reconnect before your clock runs out to resume after a Wi-Fi drop",
      ],
    },
    {
      step: "04",
      tag: "Instant Settlement",
      title: "95% Pot Directly to Your Ledger",
      body: "The moment checkmate is delivered, your opponent resigns, or their clock flags zero, the pot is settled immediately. 95% goes directly into your in-app platform balance, ready for your next match or a withdrawal to your GRAM wallet, which you confirm in the bot before it is sent.",
      bullets: [
        "Deterministic math: 95% winner, 3% platform fee, 2% referral pool",
        "Visible on your live personal ledger in real time",
        "Withdrawals confirmed in your bot chat, then verifiable on-chain",
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
        web3chess: "Server move validation & anti-collusion pairing",
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
