/** Shared website copy. Product facts must match the current backend. */
export const home = {
  nav: [
    {
      href: "/how-it-works",
      label: "How it works",
    },
    {
      href: "/wagers",
      label: "Wagers",
    },
    {
      href: "/academy",
      label: "Academy",
    },
    {
      href: "/blog",
      label: "Blog",
    },
    {
      href: "/fair-play",
      label: "Fair Play",
    },
    {
      href: "/#faq",
      label: "FAQ",
    },
  ],
  academy: {
    tracks: [
      {
        name: "Origins & Motivation",
        level: "Start here",
      },
      {
        name: "Opening Principles",
        level: "Develop",
      },
      {
        name: "Tactical Patterns",
        level: "Calculate",
      },
      {
        name: "Endgame Magic",
        level: "Convert",
      },
    ],
  },
  faq: [
    {
      q: "Can I play chess for free on Web3Chess?",
      a: "A.I. practice and tactical puzzles are free. Matches against other players use USDT stakes starting at 1 USDT. You can explore the Academy and practise before deciding whether to play a wager match.",
    },
    {
      q: "How does a wager match work and who gets the pot?",
      a: "Both players commit equal stakes from their platform balances. In a decided match, 95% of the combined pot is credited to the winner’s balance, with 3% allocated to the platform and 2% to the referral pool. Draw handling follows the match rules. You can lose your stake. Wager matches are 18+.",
    },
    {
      q: "How do I deposit funds to play?",
      a: "Open Wallet in the Mini App and follow the current deposit instructions. Platform deposits use USDT on TON with your unique reference comment. Check the token, network, reference, and any displayed fee before sending. Buying or swapping assets into your personal wallet does not automatically credit your Web3Chess balance.",
    },
    {
      q: "How fast are withdrawals processed?",
      a: "A match result first credits your platform balance. To move funds to your wallet, request a withdrawal and follow the confirmation instructions in the bot chat. Some requests require additional review. Processing and network conditions affect timing; a completed transfer can be checked on Tonviewer.",
    },
    {
      q: "How does Web3Chess approach fair play?",
      a: "The server validates legal moves and maintains the game state and clocks. Players must make their own moves without outside assistance. Legal-move validation alone cannot prove that a player is unassisted; contact support about suspicious play and read the Fair Play page for the current rules.",
    },
    {
      q: "What are the age and legal requirements to play?",
      a: "Wager matches are for players aged 18 and older and are subject to local availability and rules. Check the terms and in-app eligibility requirements before playing for a stake. Free A.I. practice is available without committing a stake.",
    },
  ],
  footer: {
    statement: "The Premier Skill-Based Chess Arena on Telegram",
    columns: [
      {
        title: "Platform",
        links: [
          {
            label: "Ways to play",
            href: "/play",
          },
          {
            label: "How It Works",
            href: "/how-it-works",
          },
          {
            label: "Stakes & fees",
            href: "/wagers",
          },
          {
            label: "Chess Academy",
            href: "/academy",
          },
          {
            label: "Chess journal",
            href: "/blog",
          },
        ],
      },
      {
        title: "Integrity",
        links: [
          {
            label: "Fair play",
            href: "/fair-play",
          },
          {
            label: "Terms of Service",
            href: "/terms",
          },
          {
            label: "Privacy Policy",
            href: "/privacy",
          },
          {
            label: "FAQ",
            href: "/#faq",
          },
        ],
      },
      {
        title: "Community",
        links: [
          {
            label: "Telegram Channel",
            href: "https://t.me/chess_hub",
          },
          {
            label: "Telegram Community Chat",
            href: "https://t.me/chesshub_chat",
          },
        ],
      },
    ],
    legal:
      "18+. Wager matches carry risk; you can lose your stake. A.I. practice and daily puzzles are free.",
  },
} as const;
