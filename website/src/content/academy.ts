export interface AcademyTrack {
  id: string;
  title: string;
  level: "Introductory" | "Beginner" | "Intermediate" | "Advanced" | "Mastery";
  description: string;
  lessonsCount: number;
  tacticsCount: number;
  badge: string;
  previewFen: string;
  keyConcepts: string[];
}

export const academyContent = {
  hero: {
    badge: "Interactive Chess Academy",
    headlineBefore: "Turn opening prep into",
    headlineAfter: "instant USDT.",
    lead: "Stop blundering your edge in time trouble. Master high-percentage blitz openings, calculate killer tactical forks, and dominate the endgame before putting a single dollar on the board.",
    ctaNote: "100% Free interactive lessons · Unlimited A.I. sparring · 0 download required",
  },
  valueProps: [
    {
      icon: "sparkle",
      title: "Tactical Muscle Memory",
      body: "Solve hyper-realistic tactical positions extracted directly from real high-stakes blitz games. Spot skewers, pins, and back-rank mates in under 2 seconds.",
    },
    {
      icon: "cpu",
      title: "Unlimited A.I. Sparring",
      body: "Test your opening repertoire against Stockfish 17 tuned from Elo 800 to 2800. No clock pressure, zero risk, infinite practice rounds.",
    },
    {
      icon: "strategy",
      title: "Speed Repertoire Weapons",
      body: "Learn aggressive opening traps designed specifically for 3+2 blitz and 1+0 bullet time controls where opponents crack under clock pressure.",
    },
    {
      icon: "trophy",
      title: "Direct Conversion to Cash",
      body: "Every lesson is engineered for one goal: increasing your win rate in real 95% payout wager matches inside Telegram.",
    },
  ],
  tracks: [
    {
      id: "origins",
      title: "Origins & Tactical Foundations",
      level: "Introductory",
      description: "Master piece geometry, board vision, and the mathematical value of initiative. The bedrock every winning chess wager is built upon.",
      lessonsCount: 8,
      tacticsCount: 45,
      badge: "Foundations",
      previewFen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
      keyConcepts: ["Center control", "Piece activity", "King safety", "Material equilibrium"],
    },
    {
      id: "openings",
      title: "Speed Opening Weaponry",
      level: "Beginner",
      description: "Fast-strike opening repertoires for White and Black. Punish passive play and force opponents into defensive time trouble before move 10.",
      lessonsCount: 12,
      tacticsCount: 60,
      badge: "Repertoire",
      previewFen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
      keyConcepts: ["Italian Game sharp lines", "Sicilian Dragon defense", "Stafford Gambit venom", "Pawn structure blueprints"],
    },
    {
      id: "tactics",
      title: "Tactical Pattern Decapitation",
      level: "Intermediate",
      description: "Calculate forcing moves with absolute clarity: checks, captures, and threats. Exploit uncoordinated pieces and loose kings with laser precision.",
      lessonsCount: 15,
      tacticsCount: 120,
      badge: "Calculation",
      previewFen: "r2qkb1r/pp2nppp/2n1p3/3pP3/3P4/2NQBN2/PP3PPP/R4RK1 b kq - 5 10",
      keyConcepts: ["Overloaded defenders", "Discovered checks", "Deflection & Decoy", "Greek Gift sacrifices"],
    },
    {
      id: "endgames",
      title: "Endgame Conversion & Technique",
      level: "Intermediate",
      description: "Turn a single passed pawn into guaranteed victory. Learn Lucena, Philidor, and king opposition mechanics so you never throw a winning position.",
      lessonsCount: 10,
      tacticsCount: 50,
      badge: "Conversion",
      previewFen: "8/5pk1/4p1p1/7p/7P/4PKP1/5P2/8 w - - 0 40",
      keyConcepts: ["The Lucena Position", "Philidor drawing technique", "Rule of the Square", "Pawn triangulation"],
    },
    {
      id: "clock-mastery",
      title: "Blitz Psychology & Time Management",
      level: "Advanced",
      description: "The mental game of playing for stakes. How to manage the 3+2 clock, utilize defensive premoves, and tilt your opponent under pressure.",
      lessonsCount: 6,
      tacticsCount: 30,
      badge: "Psychology",
      previewFen: "2r3k1/1p3ppp/p3p3/3p4/8/1P1R4/P4PPP/6K1 w - - 0 25",
      keyConcepts: ["Clock bleeding strategies", "Premove hazard avoidance", "Swindle opportunities", "Practical flagging skills"],
    },
  ] as AcademyTrack[],
  aiSparring: {
    headline: "The Sandbox Engine",
    subheadline: "Stockfish 17. From Novice to Grandmaster.",
    description: "Before wagering your USDT in the live arena, test your opening novelties against our authoritative neural chess engine. Dial the difficulty to match your exact skill bracket.",
    levels: [
      { elo: "800 Elo", name: "Novice Sparring", desc: "Forgiving opponent. Leaves occasional tactical openings to exploit." },
      { elo: "1400 Elo", name: "Club Competitor", desc: "Solid positional fundamentals. Punishes one-move tactical blunders." },
      { elo: "1900 Elo", name: "Tactical Shark", desc: "Aggressive speed lines and ruthless clock conversion." },
      { elo: "2800 Elo", name: "Stockfish NNUE", desc: "Absolute superhuman perfection. The ultimate benchmark." },
    ],
  },
  dailyPuzzle: {
    badge: "Daily Mental Workout",
    headline: "Solve the daily puzzle, earn instant XP.",
    description: "Every day, a new high-leverage chess position is generated from tournament archives. Solve it directly on this page or inside Telegram to boost your seasonal rank.",
  },
} as const;
