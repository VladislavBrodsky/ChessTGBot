import { Icon, type IconName } from "@/icons";

interface RuleItem {
  number: string;
  title: string;
  icon: IconName;
  rule: string;
  detail: string;
}

const RULES: RuleItem[] = [
  {
    number: "01",
    title: "Monochrome Text Logo Only",
    icon: "crown-simple",
    rule: "Barlow Condensed 700 + Onest 400 tagline",
    detail: "Strictly black on light canvas or white on dark ink. Never use a purple rook, legacy gradients, or third-party badge assets.",
  },
  {
    number: "02",
    title: "Contextual Phosphor Icons",
    icon: "strategy",
    rule: "Context-specific iconography only",
    detail: "Icons must match the template content (clock for blitz, shield for fair play, target for tactics). Never use generic dice or unrelated emojis.",
  },
  {
    number: "03",
    title: "Compact Single-Line Proof Rows",
    icon: "check-circle",
    rule: "Three non-wrapping proof points",
    detail: "Bullet items must be concise, verified facts with single-line economy. No paragraphs or wrapped claims in the proof block.",
  },
  {
    number: "04",
    title: "Transparent Canvas Integration",
    icon: "sparkle",
    rule: "Authentic 3D porcelain sculptures and boards",
    detail: "All artwork renders on transparent alpha backgrounds directly against the warm #E5E5E5 canvas or #0A0A0A obsidian ink ground.",
  },
  {
    number: "05",
    title: "Dual-Action Button Bar",
    icon: "paper-plane-tilt",
    rule: "High-contrast action + mint URL pill",
    detail: "Primary dark or light action pill paired with a high-contrast mint web3chess.online anchor pill to establish clean provenance.",
  },
  {
    number: "06",
    title: "Zero Terminal Periods in UI Copy",
    icon: "x",
    rule: "The Hook Punctuation Law",
    detail: "Headlines, overlines, tags, button labels, and proof points must NEVER end with a full stop. Sentences in the Telegram caption retain normal punctuation.",
  },
  {
    number: "07",
    title: "Multi-Format Geometry",
    icon: "device-mobile",
    rule: "Square, Portrait, Wide, and Story",
    detail: "Every visual signal is designed to adapt losslessly across 1:1 feeds, 4:5 portrait carousels, 16:9 banners, and 9:16 vertical stories with safe margins.",
  },
];

export function CanvasStyleGuide() {
  return (
    <section className="w-full flex flex-col gap-6" aria-labelledby="styleguide-heading">
      <div className="flex flex-col gap-1 border-b border-line pb-4">
        <span className="eyebrow text-fg-muted">CANVAS STANDARDS</span>
        <h2 id="styleguide-heading" className="text-section font-bold text-fg">
          Seven Golden Rules of Marketing Canvases
        </h2>
        <p className="text-caption text-fg-muted max-w-[56ch]">
          Every template and visual asset follows the strict Web3Chess brand design system and conversion guidelines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {RULES.map((rule) => (
          <div
            key={rule.number}
            className="bg-surface border border-line rounded-card p-6 flex flex-col justify-between gap-4"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-overline text-fg-muted font-bold">
                  RULE #{rule.number}
                </span>
                <div className="w-8 h-8 rounded-control bg-wash border border-line flex items-center justify-center text-fg">
                  <Icon name={rule.icon} size={16} />
                </div>
              </div>

              <h3 className="text-title font-bold text-fg">
                {rule.title}
              </h3>

              <div className="text-caption font-semibold text-mint bg-inverse px-2.5 py-1 rounded-control w-fit">
                {rule.rule}
              </div>

              <p className="text-caption text-fg-muted leading-relaxed">
                {rule.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
