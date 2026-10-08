import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { color } from "../../../design-system/website/tokens";
import { BrandMark } from "./BrandMark";
import { BrandWordmark } from "./BrandWordmark";
import { BRAND_LETTERING } from "@/lib/brand-lettering";
import { BRAND } from "@/lib/brand";
import { chessArt, type ChessArtVariant } from "@/lib/chess-art";

/** One visual language for Telegram, X, and all page previews. */
export async function socialImage({
  title,
  eyebrow,
  description,
  art = "home",
}: {
  title: string;
  eyebrow: string;
  description: string;
  art?: ChessArtVariant;
}) {
  const sculpture = await readFile(
    join(
      process.cwd(),
      `public/illustrations/${chessArt[art].file}-social.png`,
    ),
  );
  const displayFont = await readFile(
    join(process.cwd(), "public/fonts/barlow-condensed-bold.ttf"),
  );
  const bodyFont = await readFile(
    join(process.cwd(), "public/fonts/onest.ttf"),
  );
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: color.fog,
          color: color.ink,
          fontFamily: "Onest",
          padding: "48px 56px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 48,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BrandMark
              foreground={color.brandInk}
              style={{ width: 48, height: 48 }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <BrandWordmark
                foreground={color.ink}
                style={{
                  width: BRAND_LETTERING.wordmark.width,
                  height: BRAND_LETTERING.wordmark.height,
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 400,
                  color: color.slate,
                  marginTop: 6,
                  letterSpacing: .42,
                }}
              >
                {BRAND.tagline}
              </span>
            </div>
          </div>
          <span
            style={{
              background: color.mintChip,
              display: "flex",
              alignItems: "center",
              maxWidth: 440,
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 16,
              lineHeight: 1.4,
            }}
          >
            {eyebrow}
          </span>
        </div>
        <div
          style={{ display: "flex", alignItems: "center", gap: 24, flex: 1 }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
              width: 640,
            }}
          >
            <div
              style={{
                display: "flex",
                fontFamily: "Barlow Condensed",
                fontSize: title.length > 70 ? 62 : title.length > 45 ? 76 : 104,
                fontWeight: 700,
                letterSpacing: "-1px",
                lineHeight: 0.96,
                textTransform: "uppercase",
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: "flex",
                color: color.slate,
                fontSize: 24,
                lineHeight: 1.4,
                maxWidth: 550,
              }}
            >
              {description}
            </div>
          </div>
          {/* ImageResponse needs an ordinary img and a self-contained data URL. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${sculpture.toString("base64")}`}
            alt=""
            width={420}
            height={420}
            style={{ objectFit: "contain" }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: `1px solid ${color.ash}`,
            paddingTop: 18,
            fontSize: 18,
          }}
        >
          <span>No download. A whole new arena.</span>
          <span>web3chess.online</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Barlow Condensed",
          data: displayFont,
          weight: 700,
          style: "normal",
        },
        { name: "Onest", data: bodyFont, weight: 400, style: "normal" },
      ],
    },
  );
}
