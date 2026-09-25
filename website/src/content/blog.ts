export interface BlogPost {
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  category: "Strategy" | "Product" | "Web3 & Tech" | "Academy";
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  publishedAt: string;
  readingTime: string;
  featured?: boolean;
  coverImage?: string;
  takeaways: string[];
  content: {
    type: "paragraph" | "heading" | "subheading" | "quote" | "callout" | "chess_position" | "list";
    text?: string;
    items?: string[];
    fen?: string;
    caption?: string;
    highlight?: boolean;
  }[];
  relatedSlugs?: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "fair-play-in-web3-chess",
    title: "How Web3Chess Solves Fair Play and Latency in Real-Time Wager Matches",
    subtitle: "Server-side state validation, zero-trust move verification, and anti-collusion architecture inside Telegram.",
    excerpt: "When real money is on the line, chess integrity is paramount. Here is a technical breakdown of how we prevent engine cheating, eliminate network lag advantages, and guarantee fair settlement.",
    category: "Web3 & Tech",
    author: {
      name: "Alex V.",
      role: "Core Protocol & Backend Lead",
      avatar: "/avatar-alex.png",
    },
    publishedAt: "September 24, 2026",
    readingTime: "6 min read",
    featured: true,
    takeaways: [
      "All move validation runs in isolated server memory using authoritative python-chess engines, making client-side tampering impossible.",
      "Latency compensation with synchronized millisecond server clocks ensures players in any geographic region enjoy identical clock precision.",
      "Automated statistical anomaly detection checks move distributions against top Stockfish evaluation lines to flag suspicious play instantly.",
      "Wager pools are locked in cryptographic escrow and settled deterministically upon verified checkmate or resignation."
    ],
    content: [
      {
        type: "paragraph",
        text: "In traditional online chess, playing for stakes has always suffered from two chronic vulnerabilities: engine-assisted cheating and latency exploitation. When building Web3Chess as a high-speed Telegram Mini App, our foundational mandate was clear: skill must be the only edge that exists."
      },
      {
        type: "heading",
        text: "1. The Authoritative Server Architecture"
      },
      {
        type: "paragraph",
        text: "Many casual browser games trust the client to compute piece legality or report timers. In Web3Chess, the frontend is strictly a view layer. When you make a move, your client emits a standard SAN/UCI payload via real-time WebSocket. The backend validates:"
      },
      {
        type: "list",
        items: [
          "Is the move strictly legal in the active FEN board state?",
          "Does the move belong to the player whose turn it is?",
          "Did the move arrive before the player's server-managed clock reached 00:00.000?",
          "Is the game in an active, non-paused, non-terminal state?"
        ]
      },
      {
        type: "quote",
        text: "“If a move is not verified by the server's master engine in under 5ms, the move never happened. No client modification can force an illegal state.”"
      },
      {
        type: "heading",
        text: "2. Millisecond Clock Synchronization & Lag Protection"
      },
      {
        type: "paragraph",
        text: "In bullet (1 min) and blitz (3 min) time controls, network jitter of 200ms can ruin a player's tactical defense. Web3Chess utilizes NTP-style ping-pong heartbeats to continuously measure round-trip time (RTT). The server offsets network transit delay so that a player with higher latency is not unfairly penalized on their countdown clock."
      },
      {
        type: "callout",
        text: "Crucial Rule: Disconnections do not automatically forfeit a player instantly. A 30-second reconnection grace period activates, allowing mobile users switching between Wi-Fi and 5G to reconnect without losing their wager.",
        highlight: true
      },
      {
        type: "heading",
        text: "3. Statistical Anti-Cheat & Fair Play Auditing"
      },
      {
        type: "paragraph",
        text: "Every completed wager game generates an immutable PGN ledger stored in the database. Our telemetry scanner analyzes move timings, centipawn loss (ACPL), and correlation percentage with Stockfish 17 at depth 22."
      },
      {
        type: "paragraph",
        text: "Matches showing superhuman correlation across non-trivial middlegame positions trigger automated escrow freezes for manual grandmaster review before withdrawal release. This protects honest competitors and ensures our 95% winner payout ecosystem remains pristine."
      },
      {
        type: "heading",
        text: "4. Transparent Settlement Split"
      },
      {
        type: "paragraph",
        text: "When the arbiter verifies a checkmate or resignation, the total wager pool is distributed instantly: 95% goes directly to the winner's balance, 3% sustains the platform infrastructure and gas subsidies, and 2% is distributed to the referral network. Everything is visible in your personal transaction ledger."
      }
    ],
    relatedSlugs: ["elo-xp-progression-guide", "why-telegram-mini-apps-for-chess"]
  },
  {
    slug: "elo-xp-progression-guide",
    title: "From Pawn to Grandmaster: The Complete Guide to FinChess ELO & XP Progression",
    subtitle: "How ratings are calibrated, tasks generate reward boosts, and XP unlocks free VIP privileges.",
    excerpt: "Understand how your rating evolves across time controls, how seasonal leagues work, and how to maximize your XP gains to unlock board themes and Mystery Vault drops without spending cash.",
    category: "Academy",
    author: {
      name: "Elena Rostova",
      role: "WIM & Academy Curriculum Director",
      avatar: "/avatar-elena.png",
    },
    publishedAt: "September 18, 2026",
    readingTime: "5 min read",
    takeaways: [
      "ELO ratings are maintained independently across Blitz, Rapid, and Classical pools to reflect true time-control mastery.",
      "Completing the Daily Puzzle and Academy Mastery Tracks grants guaranteed XP boosts every single day.",
      "5,000 XP can be exchanged directly for a 30-day VIP Membership Pass, unlocking 2x multipliers and custom 3D themes without depositing funds.",
      "Seasonal leaderboard resets prevent stagnation and reward the most active climb each month with platform prizes."
    ],
    content: [
      {
        type: "paragraph",
        text: "Rating is more than just a number: it is the heartbeat of fair matchmaking. Whether you are stepping onto the board at 800 ELO or battling titled masters at 2100+, understanding how rating and XP progression interact is the key to optimizing your journey on Web3Chess."
      },
      {
        type: "heading",
        text: "The Dynamic Glicko-2 Matchmaking Curve"
      },
      {
        type: "paragraph",
        text: "Unlike rudimentary ladder systems, Web3Chess implements a calibrated Glicko-2 rating model. When you join the matchmaking pool for a free or wager game, our matchmaker searches within a dynamic ±50 ELO bracket, expanding slightly if no opponent is found within 10 seconds."
      },
      {
        type: "chess_position",
        fen: "r1bqk2r/pppp1ppp/2n5/4p3/1bB1n3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 6",
        caption: "Tactical Sharpness in the Italian Game: Precision calculation converts to consistent ELO gains."
      },
      {
        type: "heading",
        text: "Experience Points (XP): The Zero-Cost Economy"
      },
      {
        type: "paragraph",
        text: "We believe that dedicated study and consistent play should be rewarded just as much as capital deposits. That is why every action in the Telegram Mini App awards XP:"
      },
      {
        type: "list",
        items: [
          "Solving the Daily Puzzle: +25 XP (+100 XP streak bonus on Day 7)",
          "Winning a Ranked Match: +15 XP (+30 XP if playing with a wager)",
          "Completing an Academy Track Lesson: +50 XP",
          "Daily Check-in Wheel Spin: 10 to 500 XP"
        ]
      },
      {
        type: "callout",
        text: "Pro Tip: Once your account reaches 5,000 XP, you can trigger the 'Upgrade with XP' button in the Membership tab to claim 30 Days of VIP access completely free of charge.",
        highlight: true
      },
      {
        type: "heading",
        text: "Mystery Vaults & Collectible Drops"
      },
      {
        type: "paragraph",
        text: "The Marketplace features 5 tiers of Mystery Vaults (Common, Rare, Unique, Limited, and Epic). Players can spend excess XP to unbox exclusive 2D piece sets, obsidian 3D marble boards, and holographic avatars that can be showcased during live matches."
      }
    ],
    relatedSlugs: ["fair-play-in-web3-chess", "opening-mastery-tactics"]
  },
  {
    slug: "why-telegram-mini-apps-for-chess",
    title: "Why We Built Web3Chess Directly Inside Telegram (and What's Coming in Season 2)",
    subtitle: "Frictionless onboarding, native TON wallet integration, and the death of traditional app store gatekeepers.",
    excerpt: "Over 900 million users already open Telegram every day. Here is why building chess on Telegram Bot API 8.0 beats native iOS/Android apps for real-time multiplayer gaming.",
    category: "Product",
    author: {
      name: "Vladislav B.",
      role: "Founder & Lead Architect",
      avatar: "/avatar-vlad.png",
    },
    publishedAt: "September 12, 2026",
    readingTime: "4 min read",
    takeaways: [
      "Zero install friction: One tap on a Telegram link launches a full-featured 60fps chess app in under 800ms.",
      "Asynchronous push notifications eliminate waiting on match spinners—Telegram pings you when your opponent moves.",
      "Native TON Connect and USDT transfers provide instant peer-to-peer settlement without 30% App Store fees.",
      "Season 2 roadmap brings Swiss System Telegram Tournaments, Spectator Live Betting, and Club Arenas."
    ],
    content: [
      {
        type: "paragraph",
        text: "For the past two decades, playing online chess meant either downloading a 150MB mobile app or sitting at a desktop browser. Both models suffer from high churn: players close the app, forget to check back, and matchmaking queues empty out."
      },
      {
        type: "heading",
        text: "1. The Power of 'Close and We'll Message You'"
      },
      {
        type: "paragraph",
        text: "Telegram Mini Apps have a superpower that web apps lack: native chat communication. When you queue for a 10-minute game, you don't need to stare at a loading screen. You can close the app, reply to your friends, and our bot messages you with an interactive button the second your match begins."
      },
      {
        type: "quote",
        text: "“Telegram is the modern operating system for real-time web3 utility. Combining chess with instant messaging turns every chat into a tournament arena.”"
      },
      {
        type: "heading",
        text: "2. Zero Intermediary Fees"
      },
      {
        type: "paragraph",
        text: "Traditional app stores take 30% of every in-app transaction, making micro-wagers and competitive peer-to-peer prize pools economically impossible. By utilizing USDT on TON, Web3Chess passes 95% of every pot directly to the winning player, maintaining only a 3% platform commission to subsidize gas and infrastructure."
      },
      {
        type: "heading",
        text: "3. What's Launching in Season 2"
      },
      {
        type: "list",
        items: [
          "Swiss System Telegram Arena Tournaments with automated round pairings.",
          "Guild & Club Arenas: Telegram group admins can host automated weekly chess leagues for their community.",
          "Interactive Spectator Arena with live emoji reactions and tactical prediction pools.",
          "Stockfish 17 Cloud Analysis integration for instant post-game blunder breakdowns."
        ]
      }
    ],
    relatedSlugs: ["fair-play-in-web3-chess", "elo-xp-progression-guide"]
  },
  {
    slug: "opening-mastery-tactics",
    title: "5 Critical Opening Traps Every Blitz & Rapid Player Must Master",
    subtitle: "How to punish premature attacks, punish greedy pawn grabs, and turn early mistakes into checkmates.",
    excerpt: "Blitz chess forgives no lapses in opening preparation. Study these five universal tactical patterns to defend against tricky gambits and seize winning positions in the first 10 moves.",
    category: "Strategy",
    author: {
      name: "Elena Rostova",
      role: "WIM & Academy Curriculum Director",
      avatar: "/avatar-elena.png",
    },
    publishedAt: "September 05, 2026",
    readingTime: "7 min read",
    takeaways: [
      "Never grab the b2 or b7 'poisoned pawn' with your queen unless your king safety is 100% secured.",
      "The Fried Liver and Traxler Counterattack require razor-sharp calculation—know your lines before playing d5.",
      "In 3-minute blitz, initiative and king safety are worth more than material equality in 80% of tactical positions.",
      "Always scan for back-rank weaknesses and loose pieces before committing to central pawn breaks."
    ],
    content: [
      {
        type: "paragraph",
        text: "In fast time controls like 3+0 and 5+0, opening knowledge isn't about memorizing 25 moves of deep Grandmaster theory—it is about recognizing universal tactical motifs and avoiding time-costly blunders."
      },
      {
        type: "heading",
        text: "1. The Poisoned b-Pawn Trap"
      },
      {
        type: "paragraph",
        text: "One of the most common mistakes in sub-1500 wager matches is venturing out with the queen to capture the unprotected b2 or b7 pawn. White often traps Black's queen with Rb1 followed by a devastating kingside assault."
      },
      {
        type: "chess_position",
        fen: "rnb1k1nr/pppp1ppp/8/4p3/1b2P2q/2N5/PPPP1PPP/R1BQKBNR w KQkq - 2 4",
        caption: "Early Queen Development: Vulnerable to tempo attacks from developing minor pieces."
      },
      {
        type: "heading",
        text: "2. The Greek Gift Sacrifice (Bxh7+)"
      },
      {
        type: "paragraph",
        text: "When Black castles kingside without a knight on f6, White can frequently sacrifice the light-squared bishop on h7. The follow-up with Ng5+ and Qh5 forces either mate or immediate surrender."
      },
      {
        type: "list",
        items: [
          "Check if your knight is ready to jump to g5 with check.",
          "Ensure your queen has an open diagonal to h5 or g4.",
          "Verify that Black's dark-squared bishop cannot easily defend on f5 or g6."
        ]
      },
      {
        type: "callout",
        text: "Academy Reminder: You can practice interactive Greek Gift and Back-Rank Mate puzzles daily in the Academy section of the Web3Chess app.",
        highlight: true
      }
    ],
    relatedSlugs: ["elo-xp-progression-guide", "fair-play-in-web3-chess"]
  }
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getRelatedBlogPosts(currentSlug: string): BlogPost[] {
  const current = getBlogPostBySlug(currentSlug);
  if (!current) return BLOG_POSTS.slice(0, 3);
  if (current.relatedSlugs && current.relatedSlugs.length > 0) {
    const related = BLOG_POSTS.filter((p) => current.relatedSlugs?.includes(p.slug));
    if (related.length > 0) return related;
  }
  return BLOG_POSTS.filter((p) => p.slug !== currentSlug).slice(0, 3);
}
