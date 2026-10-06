import { ImageResponse } from "next/og";
import { SETTLEMENT } from "@/lib/config";

export const runtime = "nodejs";
export const alt = "Web3Chess — How It Works: Zero Downloads, Pure Skill, Instant USDT";
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
              ⚡
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
              WEB3CHESS ARCHITECTURE
            </div>
          </div>

          <div
            style={{
              display: "flex",
              backgroundColor: "#d1ffca",
              padding: "8px 20px",
              borderRadius: 40,
              fontSize: 16,
              fontWeight: 700,
              color: "#000000",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            HOW IT WORKS
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
              fontSize: 64,
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              color: "#000000",
              textTransform: "uppercase",
            }}
          >
            ZERO DOWNLOADS. ZERO DELAY. REAL USDT.
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
            1-tap Telegram launch • Asynchronous push matchmaking • {SETTLEMENT.winnerPercent}% instant checkmate payouts
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
              📲 NATIVE MINI APP
            </div>
            <div style={{ display: "flex", fontSize: 18, fontWeight: 700, color: "#000000" }}>
              🛡️ SERVER STOCKFISH VALIDATED
            </div>
            <div style={{ display: "flex", fontSize: 18, fontWeight: 700, color: "#000000" }}>
              ⏱️ 1+0 TO 10+0 CLOCKS
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
            WEB3CHESS.ONLINE/HOW-IT-WORKS
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
