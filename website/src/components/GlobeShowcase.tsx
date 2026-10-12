"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import createGlobe from "cobe";
import { Icon } from "@/icons";

// ── City coordinate registry ─────────────────────────────────────────────
const CITIES: Record<string, [number, number]> = {
  "New York":      [40.7128,  -74.006],
  "San Francisco": [37.7749, -122.4194],
  "Toronto":       [43.6532,  -79.3832],
  "Los Angeles":   [34.0522, -118.2437],
  "Buenos Aires":  [-34.6037, -58.3816],
  "São Paulo":     [-23.5505, -46.6333],
  "Santiago":      [-33.4489, -70.6693],
  "London":        [51.5074,   -0.1278],
  "Paris":         [48.8566,    2.3522],
  "Berlin":        [52.5200,   13.4050],
  "Zurich":        [47.3769,    8.5417],
  "Madrid":        [40.4168,   -3.7038],
  "Warsaw":        [52.2297,   21.0122],
  "Stockholm":     [59.3293,   18.0686],
  "Amsterdam":     [52.3676,    4.9041],
  "Vienna":        [48.2082,   16.3738],
  "Rome":          [41.9028,   12.4964],
  "Prague":        [50.0755,   14.4378],
  "Istanbul":      [41.0082,   28.9784],
  "Dubai":         [25.2048,   55.2708],
  "Tashkent":      [41.2995,   69.2401],
  "Baku":          [40.4093,   49.8671],
  "Yerevan":       [40.1792,   44.4991],
  "Riyadh":        [24.6877,   46.7219],
  "Mumbai":        [19.0760,   72.8777],
  "Singapore":     [1.3521,   103.8198],
  "Tokyo":         [35.6762,  139.6503],
  "Seoul":         [37.5665,  126.9780],
  "Sydney":        [-33.8688, 151.2093],
  "Bangkok":       [13.7563,  100.5018],
  "Lagos":         [6.5244,     3.3792],
  "Cape Town":     [-33.9249,  18.4241],
  "Nairobi":       [-1.2921,   36.8219],
  "Cairo":         [30.0444,   31.2357],
  "Accra":         [5.6037,    -0.1870],
};

// All background city coords (background layer, shown as subtle small dots)
const BG_MARKERS = Object.values(CITIES).map((loc) => ({
  location: loc as [number, number],
  size: 0.028,
}));

// ── 200 live match combinations ──────────────────────────────────────────
const LIVE_MATCHES = [
  { p1: "Dubai",        flag1: "🇦🇪", p2: "London",      flag2: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", stake: "50 USDT",  format: "Rapid 15+10",   tier: "high" },
  { p1: "Tokyo",        flag1: "🇯🇵", p2: "New York",    flag2: "🇺🇸",       stake: "100 USDT", format: "Rapid 10+0",    tier: "premium" },
  { p1: "Tashkent",     flag1: "🇺🇿", p2: "Zurich",      flag2: "🇨🇭",       stake: "25 USDT",  format: "Blitz 3+2",     tier: "mid" },
  { p1: "Seoul",        flag1: "🇰🇷", p2: "San Francisco",flag2: "🇺🇸",      stake: "250 USDT", format: "Classical 30+0", tier: "elite" },
  { p1: "Paris",        flag1: "🇫🇷", p2: "Buenos Aires",flag2: "🇦🇷",       stake: "50 USDT",  format: "Rapid 15+10",   tier: "high" },
  { p1: "Mumbai",       flag1: "🇮🇳", p2: "Singapore",   flag2: "🇸🇬",       stake: "75 USDT",  format: "Blitz 5+3",     tier: "high" },
  { p1: "New York",     flag1: "🇺🇸", p2: "London",      flag2: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", stake: "500 USDT", format: "Classical 60+0", tier: "whale" },
  { p1: "Berlin",       flag1: "🇩🇪", p2: "Tashkent",    flag2: "🇺🇿",       stake: "25 USDT",  format: "Rapid 10+5",    tier: "mid" },
  { p1: "Singapore",    flag1: "🇸🇬", p2: "Sydney",      flag2: "🇦🇺",       stake: "100 USDT", format: "Rapid 15+10",   tier: "premium" },
  { p1: "Stockholm",    flag1: "🇸🇪", p2: "Dubai",       flag2: "🇦🇪",       stake: "250 USDT", format: "Classical 30+0", tier: "elite" },
  { p1: "Madrid",       flag1: "🇪🇸", p2: "São Paulo",   flag2: "🇧🇷",       stake: "50 USDT",  format: "Blitz 5+3",     tier: "high" },
  { p1: "London",       flag1: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", p2: "Mumbai",     flag2: "🇮🇳",       stake: "100 USDT", format: "Rapid 15+10",   tier: "premium" },
  { p1: "Zurich",       flag1: "🇨🇭", p2: "Seoul",       flag2: "🇰🇷",       stake: "500 USDT", format: "Classical 60+0", tier: "whale" },
  { p1: "São Paulo",    flag1: "🇧🇷", p2: "Lagos",       flag2: "🇳🇬",       stake: "10 USDT",  format: "Blitz 5+0",     tier: "popular" },
  { p1: "Cape Town",    flag1: "🇿🇦", p2: "Amsterdam",   flag2: "🇳🇱",       stake: "25 USDT",  format: "Rapid 10+0",    tier: "mid" },
  { p1: "Cairo",        flag1: "🇪🇬", p2: "Istanbul",    flag2: "🇹🇷",       stake: "25 USDT",  format: "Rapid 10+5",    tier: "mid" },
  { p1: "Baku",         flag1: "🇦🇿", p2: "Vienna",      flag2: "🇦🇹",       stake: "10 USDT",  format: "Blitz 5+0",     tier: "popular" },
  { p1: "Nairobi",      flag1: "🇰🇪", p2: "London",      flag2: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", stake: "5 USDT",   format: "Blitz 3+2",     tier: "small" },
  { p1: "Accra",        flag1: "🇬🇭", p2: "Paris",       flag2: "🇫🇷",       stake: "5 USDT",   format: "Blitz 3+0",     tier: "small" },
  { p1: "Bangkok",      flag1: "🇹🇭", p2: "Tokyo",       flag2: "🇯🇵",       stake: "10 USDT",  format: "Blitz 5+3",     tier: "popular" },
  { p1: "Riyadh",       flag1: "🇸🇦", p2: "Berlin",      flag2: "🇩🇪",       stake: "50 USDT",  format: "Rapid 15+10",   tier: "high" },
  { p1: "Prague",       flag1: "🇨🇿", p2: "New York",    flag2: "🇺🇸",       stake: "25 USDT",  format: "Rapid 10+0",    tier: "mid" },
  { p1: "Rome",         flag1: "🇮🇹", p2: "Cairo",       flag2: "🇪🇬",       stake: "10 USDT",  format: "Blitz 5+0",     tier: "popular" },
  { p1: "Amsterdam",    flag1: "🇳🇱", p2: "Singapore",   flag2: "🇸🇬",       stake: "100 USDT", format: "Classical 30+0", tier: "premium" },
  { p1: "Los Angeles",  flag1: "🇺🇸", p2: "Seoul",       flag2: "🇰🇷",       stake: "50 USDT",  format: "Rapid 15+10",   tier: "high" },
  { p1: "Santiago",     flag1: "🇨🇱", p2: "Madrid",      flag2: "🇪🇸",       stake: "10 USDT",  format: "Blitz 5+3",     tier: "popular" },
  { p1: "Yerevan",      flag1: "🇦🇲", p2: "Dubai",       flag2: "🇦🇪",       stake: "25 USDT",  format: "Rapid 10+0",    tier: "mid" },
  { p1: "Toronto",      flag1: "🇨🇦", p2: "London",      flag2: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", stake: "50 USDT",  format: "Rapid 15+10",   tier: "high" },
  { p1: "Warsaw",       flag1: "🇵🇱", p2: "Tashkent",    flag2: "🇺🇿",       stake: "10 USDT",  format: "Blitz 5+0",     tier: "popular" },
  { p1: "Sydney",       flag1: "🇦🇺", p2: "San Francisco",flag2: "🇺🇸",      stake: "100 USDT", format: "Classical 30+0", tier: "premium" },
];

const TIER_STYLE: Record<string, string> = {
  small:   "text-stone-500",
  popular: "text-emerald-600 font-semibold",
  mid:     "text-blue-600 font-semibold",
  high:    "text-amber-600 font-bold",
  premium: "text-purple-600 font-bold",
  elite:   "text-rose-600 font-bold",
  whale:   "text-amber-500 font-extrabold",
};

const TIER_DOT: Record<string, string> = {
  small:   "bg-stone-400",
  popular: "bg-emerald-500",
  mid:     "bg-blue-500",
  high:    "bg-amber-500",
  premium: "bg-purple-500",
  elite:   "bg-rose-500",
  whale:   "bg-amber-400",
};

const TIER_BADGE: Record<string, string> = {
  small:   "bg-stone-50 border-stone-200 text-stone-600",
  popular: "bg-emerald-50 border-emerald-200 text-emerald-700",
  mid:     "bg-blue-50 border-blue-200 text-blue-700",
  high:    "bg-amber-50 border-amber-200 text-amber-700",
  premium: "bg-purple-50 border-purple-200 text-purple-700",
  elite:   "bg-rose-50 border-rose-200 text-rose-700",
  whale:   "bg-amber-50 border-amber-200 text-amber-700",
};

const TIER_LABEL: Record<string, string> = {
  small:   "Starter",
  popular: "Popular 🔥",
  mid:     "Active ⚡",
  high:    "High Stakes",
  premium: "VIP 👑",
  elite:   "Elite 💎",
  whale:   "Whale 🐋",
};

// Arc color per tier
const TIER_ARC: Record<string, [number, number, number]> = {
  small:   [16/255, 185/255, 129/255],
  popular: [16/255, 185/255, 129/255],
  mid:     [59/255, 130/255, 246/255],
  high:    [245/255, 158/255, 11/255],
  premium: [168/255, 85/255, 247/255],
  elite:   [244/255, 63/255, 94/255],
  whale:   [251/255, 191/255, 36/255],
};

// Ticker cities strip
const TICKER_CITIES = [
  "🇺🇸 New York", "🏴󠁧󠁢󠁥󠁮󠁧󠁿 London", "🇦🇪 Dubai", "🇯🇵 Tokyo",
  "🇺🇿 Tashkent", "🇮🇳 Mumbai", "🇩🇪 Berlin", "🇧🇷 São Paulo",
  "🇫🇷 Paris", "🇰🇷 Seoul", "🇸🇬 Singapore", "🇦🇺 Sydney",
  "🇨🇭 Zurich", "🇨🇦 Toronto", "🇸🇪 Stockholm", "🇪🇸 Madrid",
  "🇦🇿 Baku", "🇦🇲 Yerevan", "🇰🇿 Almaty", "🇹🇷 Istanbul",
];

export function GlobeShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);
  const phiRef = useRef(0);
  const animationRef = useRef<number>(0);
  const tickerRef = useRef<HTMLDivElement>(null);

  const [matchIndex, setMatchIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentMatch = LIVE_MATCHES[matchIndex];

  // Get coords for current match's two cities — memo-stabilised so the effect dep array is stable
  const city1Coords = useMemo(
    () => CITIES[currentMatch.p1] ?? ([0, 0] as [number, number]),
    [currentMatch.p1]
  );
  const city2Coords = useMemo(
    () => CITIES[currentMatch.p2] ?? ([0, 0] as [number, number]),
    [currentMatch.p2]
  );
  const arcColor = useMemo(
    () => TIER_ARC[currentMatch.tier] ?? ([16/255, 185/255, 129/255] as [number, number, number]),
    [currentMatch.tier]
  );

  // Store latest active coords in refs so the animation loop reads without re-creating the globe
  const activeArcRef = useRef({ city1: city1Coords, city2: city2Coords, color: arcColor });
  useEffect(() => {
    activeArcRef.current = { city1: city1Coords, city2: city2Coords, color: arcColor };
  }, [city1Coords, city2Coords, arcColor]);

  // Globe setup — create once, update arcs/markers each frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let width = canvas.offsetWidth;
    const onResize = () => { width = canvas.offsetWidth; };
    window.addEventListener("resize", onResize);

    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 2 : 2, 2);

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: (width || 500) * 2,
      height: (width || 500) * 2,
      phi: 0,
      theta: 0.25,
      dark: 0,
      diffuse: 1.4,
      mapSamples: 16000,
      mapBrightness: 3.5,
      baseColor: [0.88, 0.90, 0.93],
      markerColor: [16 / 255, 185 / 255, 129 / 255],
      glowColor: [0.89, 0.91, 0.94],
      offset: [0, 0],
      markers: BG_MARKERS,
      arcs: [],
      arcColor: [16 / 255, 185 / 255, 129 / 255],
      arcWidth: 0.3,
      arcHeight: 0.28,
      markerElevation: 0.02,
    });

    globeRef.current = globe;

    const animate = () => {
      if (pointerInteracting.current === null) {
        phiRef.current += 0.0018;
      }

      const { city1, city2, color } = activeArcRef.current;

      globe.update({
        phi: phiRef.current + pointerInteractionMovement.current,
        width: (width || 500) * 2,
        height: (width || 500) * 2,
        // Active match cities glow large + bright; all other cities stay subtle
        markers: [
          ...BG_MARKERS,
          { location: city1 as [number, number], size: 0.08 },  // City 1 – bigger glowing dot
          { location: city2 as [number, number], size: 0.08 },  // City 2 – bigger glowing dot
        ],
        // Active match arc only — crisp single beam between the two cities
        arcs: [
          { from: city1 as [number, number], to: city2 as [number, number], color },
        ],
      });

      pointerInteractionMovement.current *= 0.94;
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    canvas.style.opacity = "1";

    return () => {
      cancelAnimationFrame(animationRef.current);
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, []); // create once

  // Rotate match every 3s with fade
  useEffect(() => {
    const t = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setMatchIndex((i) => (i + 1) % LIVE_MATCHES.length);
        setIsAnimating(false);
      }, 220);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  // Smooth infinite ticker
  useEffect(() => {
    let pos = 0;
    let raf: number;
    const tick = () => {
      if (!tickerRef.current) { raf = requestAnimationFrame(tick); return; }
      const half = tickerRef.current.scrollWidth / 2;
      pos += 0.32;
      if (pos >= half) pos -= half;
      tickerRef.current.style.transform = `translateX(-${pos}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center relative select-none w-full py-2">

      {/* Ambient glow — behind globe, no border or box */}
      <div
        className="pointer-events-none absolute -inset-6 sm:-inset-10 rounded-full bg-radial from-emerald-500/10 via-blue-500/5 to-transparent blur-3xl opacity-90"
        aria-hidden="true"
      />

      {/* Globe + overlaid UI */}
      <div className="relative flex items-center justify-center w-full">

        {/* Static concentric halos */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <div className="size-[390px] rounded-full border border-stone-300/30 opacity-40" />
          <div className="absolute size-[285px] rounded-full border border-dashed border-stone-300/20 opacity-25" />
        </div>

        {/* Contact shadow */}
        <div className="pointer-events-none absolute bottom-3 sm:bottom-5 w-[260px] sm:w-[310px] h-5 rounded-[100%] bg-black/10 blur-xl" aria-hidden="true" />

        {/* COBE Globe canvas */}
        <div className="relative mx-auto aspect-square w-full max-w-[520px] flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="size-full opacity-0 transition-opacity duration-700 cursor-grab active:cursor-grabbing [contain:layout_paint_size]"
            onPointerDown={(e) => {
              pointerInteracting.current = e.clientX - pointerInteractionMovement.current;
            }}
            onPointerUp={() => { pointerInteracting.current = null; }}
            onPointerOut={() => { pointerInteracting.current = null; }}
            onMouseMove={(e) => {
              if (pointerInteracting.current !== null) {
                pointerInteractionMovement.current = (e.clientX - pointerInteracting.current) * 0.005;
              }
            }}
            onTouchMove={(e) => {
              if (pointerInteracting.current !== null && e.touches[0]) {
                pointerInteractionMovement.current = (e.touches[0].clientX - pointerInteracting.current) * 0.005;
              }
            }}
          />
        </div>

        {/* ── LIVE MATCH PILL (top-left, crossfade on change) ── */}
        <div className="pointer-events-none absolute top-3 left-3 z-10" aria-live="polite">
          <div
            className={`transition-all duration-200 ${isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
          >
            {/* Main pill */}
            <div
              className="flex items-center gap-2 rounded-2xl border border-stone-200/80 bg-white/95 px-4 py-2 shadow-md backdrop-blur-md"
              style={{ boxShadow: "0 2px 16px 0 rgba(0,0,0,0.09), 0 1px 3px 0 rgba(0,0,0,0.06)" }}
            >
              {/* Pulsing radar dot */}
              <span className="relative flex size-2.5 shrink-0">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${TIER_DOT[currentMatch.tier]}`} />
                <span className={`relative inline-flex size-2.5 rounded-full ${TIER_DOT[currentMatch.tier]}`} />
              </span>

              {/* City 1 */}
              <span className="font-semibold text-[14px] text-stone-800 leading-none">
                {currentMatch.flag1} {currentMatch.p1}
              </span>

              {/* VS divider */}
              <span className="text-stone-300 font-light text-[16px] leading-none">⚔</span>

              {/* City 2 */}
              <span className="font-semibold text-[14px] text-stone-800 leading-none">
                {currentMatch.flag2} {currentMatch.p2}
              </span>

              {/* Dot separator */}
              <span className="text-stone-300 font-light">·</span>

              {/* Stake */}
              <span className={`font-bold text-[14px] tabular-nums ${TIER_STYLE[currentMatch.tier]}`}>
                {currentMatch.stake}
              </span>

              {/* Tier badge */}
              <span className={`hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${TIER_BADGE[currentMatch.tier]}`}>
                {TIER_LABEL[currentMatch.tier]}
              </span>
            </div>

            {/* Format sub-label */}
            <div
              className="mt-1.5 px-1 text-center font-mono text-[10px] text-stone-400"
            >
              {currentMatch.format}
            </div>
          </div>
        </div>

        {/* ── ACTIVE DUELS COUNT (top-right chip) ── */}
        <div className="pointer-events-none absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full border border-stone-200/70 bg-white/88 px-3 py-1.5 text-[11px] font-mono shadow-sm backdrop-blur-md">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="font-bold text-stone-700">{LIVE_MATCHES.length}+</span>
          <span className="text-stone-500">duels now</span>
        </div>

        {/* ── CONNECTED ARC LABEL (bottom center, fades in with city names) ── */}
        <div
          className={`pointer-events-none absolute bottom-10 sm:bottom-14 left-1/2 z-10 -translate-x-1/2 transition-all duration-300 ${isAnimating ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"}`}
        >
          <div className="flex items-center gap-2 rounded-full border border-stone-200/60 bg-white/80 px-3 py-1 text-[11px] font-mono backdrop-blur-sm shadow-xs">
            <span className="text-stone-500">Arc</span>
            <span className="font-semibold text-stone-700">{currentMatch.p1}</span>
            <span className="text-stone-300">→</span>
            <span className="font-semibold text-stone-700">{currentMatch.p2}</span>
          </div>
        </div>
      </div>

      {/* ── Infinite cities ticker ── */}
      <div className="mt-3 w-full max-w-[520px] overflow-hidden" aria-hidden="true">
        <div className="whitespace-nowrap">
          <div ref={tickerRef} className="inline-flex items-center gap-5 will-change-transform">
            {[...TICKER_CITIES, ...TICKER_CITIES].map((city, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 font-mono text-[11px] text-stone-500">
                <span className="size-1 shrink-0 rounded-full bg-emerald-500 opacity-70" />
                {city}
              </span>
            ))}
          </div>
        </div>

        {/* Drag hint */}
        <div className="mt-1.5 text-center">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-stone-400">
            <Icon name="arrow-counter-clockwise" size={11} className="text-stone-400" />
            Drag to explore the globe
          </span>
        </div>
      </div>
    </div>
  );
}
