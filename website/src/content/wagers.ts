import { SETTLEMENT } from "@/lib/config";

export const wagersContent = {
  hero: {
    badge: "The Economics of Skill",
    headlineBefore: "Stop playing for fake points.",
    headlineAfter: "Play for real USDT.",
    lead: "Chess has zero RNG, zero lucky rolls, and zero pay-to-win boosts. If your calculation is deeper and your clock management is sharper, you walk away with 95% of the pot. Simple, mathematical, and instant.",
    ctaNote: "Minimum wager: 1 USDT · Transparent 3% platform fee · 18+",
  },
  tiers: [
    {
      tier: "Micro Stakes",
      stake: "1 USDT",
      pot: "2.00 USDT",
      winnerTakes: "1.90 USDT",
      desc: "Perfect for testing the waters, warming up your opening prep, and experiencing the adrenaline of real-stakes blitz with low exposure.",
      recommendedFor: "Newcomers & Quick Warmups",
      badge: "Most Popular",
    },
    {
      tier: "Blitz Club",
      stake: "5 USDT",
      pot: "10.00 USDT",
      winnerTakes: "9.50 USDT",
      desc: "The standard battleground. Serious competitors playing sharp 3+2 lines where tactical vision earns clean payouts.",
      recommendedFor: "Intermediate Competitors",
      badge: "Core Arena",
    },
    {
      tier: "Tactical Arena",
      stake: "10 USDT",
      pot: "20.00 USDT",
      winnerTakes: "19.00 USDT",
      desc: "Higher adrenaline. Opponents calculate 4 moves deep and punish any opening inaccuracy. Real rewards for tactical discipline.",
      recommendedFor: "Advanced Club Players",
      badge: "High Stakes",
    },
    {
      tier: "Master Table",
      stake: "25 USDT",
      pot: "50.00 USDT",
      winnerTakes: "47.50 USDT",
      desc: "The premier division. FIDE-rated players, titled masters, and razor-sharp blitz specialists competing for maximum pots.",
      recommendedFor: "Master-Level Specialists",
      badge: "Elite Division",
    },
  ],
  economics: {
    headline: "The 95% Winner Take All Equation",
    subheadline: "Where every cent of the pot actually goes.",
    points: [
      {
        percent: `${SETTLEMENT.winnerPercent}%`,
        title: "To the Victor",
        body: "The victor claims 95% of the combined pot instantly upon checkmate, opponent resignation, or clock expiration.",
      },
      {
        percent: `${SETTLEMENT.platformFeePercent}%`,
        title: "Platform Maintenance",
        body: "3% funds high-performance backend cluster hosting, low-latency WebSocket infrastructure, and Stockfish server analysis.",
      },
      {
        percent: `${SETTLEMENT.referralFeePercent}%`,
        title: "Community Referral Pool",
        body: "2% is distributed to players who invited friends and fellow competitors to the arena via our affiliate system.",
      },
    ],
  },
  trustPoints: [
    {
      icon: "wallet",
      title: "Real-Time Ledger Transparency",
      body: "Every single transaction — deposits, match entries, victory settlements, and payouts — is logged chronologically with timestamps on your in-app ledger.",
    },
    {
      icon: "shield-check",
      title: "Manual Security Thresholds",
      body: "Small withdrawals execute with rapid automated verification. High-volume transfers pass through secondary security checks to prevent unauthorized account drain.",
    },
    {
      icon: "check-circle",
      title: "Verifiable on TON Blockchain",
      body: "When you withdraw your winnings, you receive a transaction hash verifiable on Tonviewer or any public TON block explorer.",
    },
    {
      icon: "scales",
      title: "Strict 18+ & Responsible Play",
      body: "Real-money games carry financial risk. You can lose your stake. Never wager more than you can comfortably afford to lose. Practice is always 100% free.",
    },
  ],
  riskNotice: "Wager matches involve real cryptocurrency and you can lose your stake. Web3Chess is not a bank or financial investment vehicle. Matches are 18+ skill-based games. Play responsibly.",
} as const;
