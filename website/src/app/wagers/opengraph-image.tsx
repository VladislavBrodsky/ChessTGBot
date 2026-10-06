import { ImageResponse } from "next/og";
import { SETTLEMENT } from "@/lib/config";

export const runtime = "nodejs";
export const alt = "Web3Chess — The Economics of Skill: 95% Winner Payouts in USDT";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#e5e5e5",
          padding: 64,
        }}
      >
        {/* Top Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: "#000000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: 28,
                fontWeight: 900,
              }}
            >
              💰
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 28,
                fontWeight: 800,
                color: "#000000",
                letterSpacing: "-0.03em",
                textTransform: "uppercase",
              }}
            >
              WEB3CHESS WAGERS
            </div>
          </div>

          <div
            style={{
              display: "flex",
              backgroundColor: "#fff100",
              padding: "8px 20px",
              borderRadius: 40,
              fontSize: 16,
              fontWeight: 700,
              color: "#000000",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {SETTLEMENT.winnerPercent}% WINNER POT
          </div>
        </div>

        {/* Hero Card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#ffffff",
            padding: 48,
            borderRadius: 36,
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 62,
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              color: "#000000",
              textTransform: "uppercase",
            }}
          >
            STOP PLAYING FOR FAKE POINTS. PLAY FOR REAL USDT
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: "#444444",
              fontWeight: 500,
              marginTop: 8,
            }}
          >
            Zero RNG • 1 USDT minimum stake • {SETTLEMENT.winnerPercent}% winner payout • Direct TON wallet withdrawals
          </div>
        </div>

        {/* Bottom Feature Triad */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 32 }}>
            <div style={{ display: "flex", fontSize: 18, fontWeight: 700, color: "#000000" }}>
              💵 1, 5, 10, 25 USDT TIERS
            </div>
            <div style={{ display: "flex", fontSize: 18, fontWeight: 700, color: "#000000" }}>
              📊 LIVE AUDITABLE LEDGER
            </div>
            <div style={{ display: "flex", fontSize: 18, fontWeight: 700, color: "#000000" }}>
              🔒 18+ RESPONSIBLE GAMING
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 18,
              fontWeight: 800,
              color: "#666666",
              letterSpacing: "0.05em",
            }}
          >
            WEB3CHESS.ONLINE/WAGERS
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
