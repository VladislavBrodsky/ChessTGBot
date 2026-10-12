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
      href: "/rules",
      label: "Rules",
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
      a: "Open Wallet in the Mini App and follow the current deposit instructions. Platform deposits use USDT on GRAM with your unique reference comment. Check the token, network, reference, and any displayed fee before sending. Buying or swapping assets into your personal wallet does not automatically credit your Web3Chess balance.",
    },
    {
      q: "How fast are withdrawals processed?",
      a: "A match result first credits your platform balance. To move funds to your wallet, request a withdrawal and follow the confirmation instructions in the bot chat. Some requests require additional review. Processing and network conditions affect timing; a completed transfer can be checked on Tonviewer.",
    },
    {
      q: "How does Web3Chess approach fair play?",
      a: "Web3Chess validates all legal moves deterministically on the server, maintains tamper-proof clocks, and actively monitors gameplay with statistical engine-correlation heuristics. Outside engine assistance is strictly prohibited in real matches. Check the Fair Play page for full integrity guidelines.",
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
            label: "Telegram Chess Bot",
            href: "/play",
          },
          {
            label: "How to Play on Telegram",
            href: "/how-it-works",
          },
          {
            label: "Play Chess for USDT",
            href: "/wagers",
          },
          {
            label: "Free Chess Puzzles",
            href: "/academy",
          },
          {
            label: "Chess Strategy Guides",
            href: "/blog",
          },
          {
            label: "Chess Rules Guide",
            href: "/rules",
          },
        ],
      },
      {
        title: "Integrity",
        links: [
          {
            label: "Fair Play & Anti-Cheat",
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
            label: "Telegram channel",
            href: "https://t.me/chess_hub",
          },
          {
            label: "Community chat",
            href: "https://t.me/chesshub_chat",
          },
        ],
      },
    ],
    legal:
      "18+. Wager matches carry risk; you can lose your stake. A.I. practice and puzzles are free.",
  },
} as const;
