"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import createGlobe from "cobe";

// ── Complete Verified Global City Coordinates ───────────────────────────
const CITIES: Record<string, [number, number]> = {
  // Americas
  "New York":      [40.7128,  -74.0060],
  "San Francisco": [37.7749, -122.4194],
  "Los Angeles":   [34.0522, -118.2437],
  "Toronto":       [43.6532,  -79.3832],
  "Buenos Aires":  [-34.6037, -58.3816],
  "São Paulo":     [-23.5505, -46.6333],
  "Santiago":      [-33.4489, -70.6693],
  "Mexico City":   [19.4326,  -99.1332],
  "Bogota":        [4.7110,   -74.0721],
  "Lima":          [-12.0464, -77.0428],

  // Europe
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
  "Oslo":          [59.9139,   10.7522],
  "Reykjavik":     [64.1466,  -21.9426],
  "Budapest":      [47.4979,   19.0402],
  "Belgrade":      [44.7866,   20.4489],

  // Central Asia & Caucasus
  "Tashkent":      [41.2995,   69.2401],
  "Baku":          [40.4093,   49.8671],
  "Yerevan":       [40.1792,   44.4991],
  "Tbilisi":       [41.7151,   44.8271],
  "Almaty":        [43.2220,   76.8512],

  // Middle East
  "Dubai":         [25.2048,   55.2708],
  "Riyadh":        [24.6877,   46.7219],
  "Istanbul":      [41.0082,   28.9784],

  // Asia & Pacific
  "Tokyo":         [35.6762,  139.6503],
  "Seoul":         [37.5665,  126.9780],
  "Singapore":     [1.3521,   103.8198],
  "Mumbai":        [19.0760,   72.8777],
  "New Delhi":     [28.6139,   77.2090],
  "Bangkok":       [13.7563,  100.5018],
  "Sydney":        [-33.8688, 151.2093],
  "Melbourne":     [-37.8136, 144.9631],

  // Africa
  "Cairo":         [30.0444,   31.2357],
  "Lagos":         [6.5244,     3.3792],
  "Nairobi":       [-1.2921,   36.8219],
  "Cape Town":     [-33.9249,  18.4241],
  "Casablanca":    [33.5731,   -7.5898],
  "Accra":         [5.6037,    -0.1870],
  "Dakar":         [14.7167,  -17.4677],
  "Addis Ababa":   [9.0300,    38.7400],
};

// Background base dots for all 45+ cities (subtle small dots)
const BASE_MARKERS = Object.values(CITIES).map((coords) => ({
  location: coords as [number, number],
  size: 0.025,
}));

// Subtle ambient routes that give the globe permanent global activity
const AMBIENT_ARCS = [
  { from: CITIES["London"],        to: CITIES["New York"],  color: [16/255, 185/255, 129/255] as [number, number, number] },
  { from: CITIES["Dubai"],         to: CITIES["Singapore"], color: [59/255, 130/255, 246/255] as [number, number, number] },
  { from: CITIES["Tokyo"],         to: CITIES["Sydney"],    color: [16/255, 185/255, 129/255] as [number, number, number] },
  { from: CITIES["Paris"],         to: CITIES["Tokyo"],     color: [147/255, 51/255, 234/255] as [number, number, number] },
];

// ── Curated Real-World Match Combinations (100% matched to CITIES) ──────
const LIVE_MATCHES = [
  { p1: "Tokyo",        flag1: "🇯🇵", p2: "New York",     flag2: "🇺🇸", stake: "100 USDT", pot: "190 USDT", format: "Rapid 10+0",    tier: "vip",     label: "VIP Duel" },
  { p1: "Dubai",        flag1: "🇦🇪", p2: "London",       flag2: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", stake: "50 USDT",  pot: "95 USDT",  format: "Rapid 15+10",   tier: "high",    label: "High Stakes" },
  { p1: "Tashkent",     flag1: "🇺🇿", p2: "Zurich",       flag2: "🇨🇭", stake: "25 USDT",  pot: "47.5 USDT",format: "Blitz 3+2",     tier: "active",  label: "Active" },
  { p1: "Seoul",        flag1: "🇰🇷", p2: "San Francisco",flag2: "🇺🇸", stake: "250 USDT", pot: "475 USDT", format: "Classical 30+0", tier: "elite",   label: "Elite 💎" },
  { p1: "Paris",        flag1: "🇫🇷", p2: "Buenos Aires", flag2: "🇦🇷", stake: "50 USDT",  pot: "95 USDT",  format: "Rapid 15+10",   tier: "high",    label: "High Stakes" },
  { p1: "Mumbai",       flag1: "🇮🇳", p2: "Singapore",    flag2: "🇸🇬", stake: "75 USDT",  pot: "142.5 USDT",format: "Blitz 5+3",    tier: "high",    label: "High Stakes" },
  { p1: "New York",     flag1: "🇺🇸", p2: "London",       flag2: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", stake: "500 USDT", pot: "950 USDT", format: "Classical 60+0", tier: "whale",   label: "Whale 🐋" },
  { p1: "Berlin",       flag1: "🇩🇪", p2: "Tashkent",     flag2: "🇺🇿", stake: "25 USDT",  pot: "47.5 USDT",format: "Rapid 10+5",    tier: "active",  label: "Active" },
  { p1: "Singapore",    flag1: "🇸🇬", p2: "Sydney",       flag2: "🇦🇺", stake: "100 USDT", pot: "190 USDT", format: "Rapid 15+10",   tier: "vip",     label: "VIP Duel" },
  { p1: "Stockholm",    flag1: "🇸🇪", p2: "Dubai",        flag2: "🇦🇪", stake: "250 USDT", pot: "475 USDT", format: "Classical 30+0", tier: "elite",   label: "Elite 💎" },
  { p1: "Madrid",       flag1: "🇪🇸", p2: "São Paulo",    flag2: "🇧🇷", stake: "50 USDT",  pot: "95 USDT",  format: "Blitz 5+3",     tier: "high",    label: "High Stakes" },
  { p1: "London",       flag1: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", p2: "Mumbai",      flag2: "🇮🇳", stake: "100 USDT", pot: "190 USDT", format: "Rapid 15+10",   tier: "vip",     label: "VIP Duel" },
  { p1: "Zurich",       flag1: "🇨🇭", p2: "Seoul",        flag2: "🇰🇷", stake: "500 USDT", pot: "950 USDT", format: "Classical 60+0", tier: "whale",   label: "Whale 🐋" },
  { p1: "São Paulo",    flag1: "🇧🇷", p2: "Lagos",        flag2: "🇳🇬", stake: "10 USDT",  pot: "19 USDT",  format: "Blitz 5+0",     tier: "popular", label: "Popular 🔥" },
  { p1: "Cape Town",    flag1: "🇿🇦", p2: "Amsterdam",    flag2: "🇳🇱", stake: "25 USDT",  pot: "47.5 USDT",format: "Rapid 10+0",    tier: "active",  label: "Active" },
  { p1: "Cairo",        flag1: "🇪🇬", p2: "Istanbul",     flag2: "🇹🇷", stake: "25 USDT",  pot: "47.5 USDT",format: "Rapid 10+5",    tier: "active",  label: "Active" },
  { p1: "Baku",         flag1: "🇦🇿", p2: "Vienna",       flag2: "🇦🇹", stake: "10 USDT",  pot: "19 USDT",  format: "Blitz 5+0",     tier: "popular", label: "Popular 🔥" },
  { p1: "Nairobi",      flag1: "🇰🇪", p2: "London",       flag2: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", stake: "5 USDT",   pot: "9.5 USDT", format: "Blitz 3+2",     tier: "starter", label: "Starter" },
  { p1: "Accra",        flag1: "🇬🇭", p2: "Dakar",        flag2: "🇸🇳", stake: "1 USDT",   pot: "1.9 USDT", format: "Bullet 1+1",    tier: "micro",   label: "Micro" },
  { p1: "Bangkok",      flag1: "🇹🇭", p2: "Tokyo",        flag2: "🇯🇵", stake: "10 USDT",  pot: "19 USDT",  format: "Blitz 5+3",     tier: "popular", label: "Popular 🔥" },
  { p1: "Riyadh",       flag1: "🇸🇦", p2: "Berlin",       flag2: "🇩🇪", stake: "50 USDT",  pot: "95 USDT",  format: "Rapid 15+10",   tier: "high",    label: "High Stakes" },
  { p1: "Prague",       flag1: "🇨🇿", p2: "New York",     flag2: "🇺🇸", stake: "25 USDT",  pot: "47.5 USDT",format: "Rapid 10+0",    tier: "active",  label: "Active" },
  { p1: "Rome",         flag1: "🇮🇹", p2: "Cairo",        flag2: "🇪🇬", stake: "10 USDT",  pot: "19 USDT",  format: "Blitz 5+0",     tier: "popular", label: "Popular 🔥" },
  { p1: "Amsterdam",    flag1: "🇳🇱", p2: "Singapore",    flag2: "🇸🇬", stake: "100 USDT", pot: "190 USDT", format: "Classical 30+0", tier: "vip",     label: "VIP Duel" },
  { p1: "Los Angeles",  flag1: "🇺🇸", p2: "Seoul",        flag2: "🇰🇷", stake: "50 USDT",  pot: "95 USDT",  format: "Rapid 15+10",   tier: "high",    label: "High Stakes" },
  { p1: "Santiago",     flag1: "🇨🇱", p2: "Madrid",       flag2: "🇪🇸", stake: "10 USDT",  pot: "19 USDT",  format: "Blitz 5+3",     tier: "popular", label: "Popular 🔥" },
  { p1: "Yerevan",      flag1: "🇦🇲", p2: "Dubai",        flag2: "🇦🇪", stake: "25 USDT",  pot: "47.5 USDT",format: "Rapid 10+0",    tier: "active",  label: "Active" },
  { p1: "Toronto",      flag1: "🇨🇦", p2: "London",       flag2: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", stake: "50 USDT",  pot: "95 USDT",  format: "Rapid 15+10",   tier: "high",    label: "High Stakes" },
  { p1: "Warsaw",       flag1: "🇵🇱", p2: "Tashkent",     flag2: "🇺🇿", stake: "10 USDT",  pot: "19 USDT",  format: "Blitz 5+0",     tier: "popular", label: "Popular 🔥" },
  { p1: "Sydney",       flag1: "🇦🇺", p2: "San Francisco",flag2: "🇺🇸", stake: "100 USDT", pot: "190 USDT", format: "Classical 30+0", tier: "vip",     label: "VIP Duel" },
];

// Color definitions per tier
const TIER_COLORS: Record<string, {
  text: string;
  pill: string;
  badge: string;
  arc: [number, number, number];
}> = {
  micro: {
    text: "text-stone-600",
    pill: "bg-stone-50 border-stone-200 text-stone-700",
    badge: "bg-stone-100 text-stone-700 border-stone-200",
    arc: [16/255, 185/255, 129/255],
  },
  starter: {
    text: "text-emerald-600",
    pill: "bg-emerald-50 border-emerald-200 text-emerald-800",
    badge: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    arc: [16/255, 185/255, 129/255],
  },
  popular: {
    text: "text-emerald-700",
    pill: "bg-emerald-50 border-emerald-300 text-emerald-900",
    badge: "bg-emerald-500/15 text-emerald-800 border-emerald-500/30",
    arc: [16/255, 185/255, 129/255],
  },
  active: {
    text: "text-blue-600",
    pill: "bg-blue-50 border-blue-200 text-blue-800",
    badge: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    arc: [59/255, 130/255, 246/255],
  },
  high: {
    text: "text-amber-600",
    pill: "bg-amber-50 border-amber-200 text-amber-900",
    badge: "bg-amber-500/15 text-amber-800 border-amber-500/30",
    arc: [245/255, 158/255, 11/255],
  },
  vip: {
    text: "text-purple-600",
    pill: "bg-purple-50 border-purple-200 text-purple-900",
    badge: "bg-purple-500/15 text-purple-800 border-purple-500/30",
    arc: [168/255, 85/255, 247/255],
  },
  elite: {
    text: "text-rose-600",
    pill: "bg-rose-50 border-rose-200 text-rose-900",
    badge: "bg-rose-500/15 text-rose-800 border-rose-500/30",
    arc: [244/255, 63/255, 94/255],
  },
  whale: {
    text: "text-amber-500",
    pill: "bg-amber-100 border-amber-300 text-amber-950 font-bold",
    badge: "bg-amber-500/20 text-amber-900 border-amber-500/40",
    arc: [251/255, 191/255, 36/255],
  },
};

// Global Node Ticker
const NODES = [
  { city: "Tokyo", flag: "🇯🇵", ping: "14ms" },
  { city: "London", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", ping: "8ms" },
  { city: "Dubai", flag: "🇦🇪", ping: "12ms" },
  { city: "New York", flag: "🇺🇸", ping: "15ms" },
  { city: "Singapore", flag: "🇸🇬", ping: "11ms" },
  { city: "Zurich", flag: "🇨🇭", ping: "9ms" },
  { city: "Tashkent", flag: "🇺🇿", ping: "16ms" },
  { city: "São Paulo", flag: "🇧🇷", ping: "22ms" },
  { city: "Sydney", flag: "🇦🇺", ping: "18ms" },
  { city: "Berlin", flag: "🇩🇪", ping: "10ms" },
];

export function GlobeShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const phiRef = useRef(0);
  const animationRef = useRef<number>(0);

  const [isVisible, setIsVisible] = useState(false);
  const [matchIndex, setMatchIndex] = useState(0);
  const [isCrossfading, setIsCrossfading] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: "60px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const current = LIVE_MATCHES[matchIndex];
  const tierConfig = TIER_COLORS[current.tier] || TIER_COLORS["popular"];

  // Memoize active city coordinates
  const city1Coords = useMemo(
    () => CITIES[current.p1] ?? ([0, 0] as [number, number]),
    [current.p1]
  );
  const city2Coords = useMemo(
    () => CITIES[current.p2] ?? ([0, 0] as [number, number]),
    [current.p2]
  );

  const activeArcRef = useRef({
    city1: city1Coords,
    city2: city2Coords,
    color: tierConfig.arc,
  });

  useEffect(() => {
    activeArcRef.current = {
      city1: city1Coords,
      city2: city2Coords,
      color: tierConfig.arc,
    };
  }, [city1Coords, city2Coords, tierConfig.arc]);

  // Setup globe WebGL with cobe only when in viewport
  useEffect(() => {
    if (!isVisible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let width = canvas.offsetWidth;
    const onResize = () => { width = canvas.offsetWidth; };
    window.addEventListener("resize", onResize);

    const isMobile = typeof window !== "undefined" && (window.innerWidth < 768 || (typeof navigator !== "undefined" && navigator.maxTouchPoints > 1));
    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, isMobile ? 1.4 : 1.8);
    const mapSamples = isMobile ? 3600 : 8000;

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: (width || 500) * 2,
      height: (width || 500) * 2,
      phi: phiRef.current,
      theta: 0.22,
      dark: 0,
      diffuse: 1.4,
      mapSamples,
      mapBrightness: 3.6,
      baseColor: [0.89, 0.91, 0.93],
      markerColor: [16 / 255, 185 / 255, 129 / 255],
      glowColor: [0.90, 0.92, 0.95],
      offset: [0, 0],
      markers: BASE_MARKERS,
      arcs: AMBIENT_ARCS,
      arcColor: [16 / 255, 185 / 255, 129 / 255],
      arcWidth: 0.32,
      arcHeight: 0.30,
      markerElevation: 0.02,
    });

    const animate = () => {
      if (document.hidden) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      if (pointerInteracting.current === null) {
        phiRef.current += isMobile ? 0.0012 : 0.0016;
      }

      const { city1, city2, color } = activeArcRef.current;

      globe.update({
        phi: phiRef.current + pointerInteractionMovement.current,
        width: (width || 500) * 2,
        height: (width || 500) * 2,
        markers: [
          ...BASE_MARKERS,
          { location: city1, size: 0.085 },
          { location: city2, size: 0.085 },
        ],
        arcs: [
          ...AMBIENT_ARCS,
          { from: city1, to: city2, color },
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
  }, [isVisible]);

  // Smooth match flip every 3.5s only when visible
  useEffect(() => {
    if (!isVisible) return;
    const timer = setInterval(() => {
      setIsCrossfading(true);
      setTimeout(() => {
        setMatchIndex((i) => (i + 1) % LIVE_MATCHES.length);
        setIsCrossfading(false);
      }, 200);
    }, 3500);
    return () => clearInterval(timer);
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center select-none w-full py-2 min-h-[460px]"
    >

      {/* ── Ambient Radial Atmosphere Halo (Frameless, NO white box) ── */}
      <div
        className="pointer-events-none absolute -inset-10 rounded-full bg-radial from-emerald-500/10 via-blue-500/5 to-transparent blur-3xl opacity-80"
        aria-hidden="true"
      />

      {/* ── Floating Live Match Pill (Compact, modern glass pill) ── */}
      <div className="relative z-20 mb-3 w-full max-w-[520px] px-2" aria-live="polite">
        <div
          className={`flex items-center justify-between gap-2 sm:gap-3 rounded-full border border-line bg-surface/95 px-3.5 sm:px-4 py-2 shadow-xs backdrop-blur-md transition-all duration-200 ${
            isCrossfading ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100"
          }`}
        >
          {/* Left: Players */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-semibold text-fg-default text-[12px] sm:text-[13px] whitespace-nowrap">
              {current.flag1} {current.p1}
            </span>
            <span className="text-fg-muted text-[11px] sm:text-[12px] font-mono shrink-0 px-0.5 select-none">⚔</span>
            <span className="font-semibold text-fg-default text-[12px] sm:text-[13px] whitespace-nowrap">
              {current.flag2} {current.p2}
            </span>
          </div>

          {/* Right: Stake & Format */}
          <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-caption shrink-0">
            <span className={`font-bold tabular-nums text-[12px] sm:text-[13px] ${tierConfig.text}`}>
              {current.stake}
            </span>
            <span className="hidden sm:inline text-fg-muted text-[10px] sm:text-[11px]">
              ({current.format.replace("Classical ", "").replace("Rapid ", "").replace("Blitz ", "").replace("Bullet ", "")})
            </span>
            <span className={`hidden md:inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tierConfig.badge}`}>
              {current.label}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3D Interactive WebGL Globe (Frameless, Natural Atmosphere) ── */}
      <div className="relative mx-auto aspect-square w-full max-w-[460px] flex items-center justify-center">
        {/* Soft contact shadow beneath globe */}
        <div
          className="pointer-events-none absolute -bottom-2 w-[280px] h-6 rounded-[100%] bg-black/10 blur-xl"
          aria-hidden="true"
        />

        {/* COBE WebGL Canvas */}
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

      {/* ── Live Nodes Ticker (Frameless, GPU-accelerated CSS animation) ── */}
      <div className="relative z-10 w-full max-w-[460px] mt-3 overflow-hidden select-none" aria-hidden="true">
        <div className="whitespace-nowrap overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_32px,black_calc(100%-32px),transparent)]">
          <div className="inline-flex items-center gap-4 animate-[node-marquee_24s_linear_infinite] will-change-transform">
            {[...NODES, ...NODES].map((n, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] text-fg-muted shrink-0"
              >
                <span className="size-1 rounded-full bg-emerald-500 opacity-80" />
                <span>{n.flag}</span>
                <span className="font-semibold text-fg-default">{n.city}</span>
                <span className="text-emerald-700 text-[10px]">{n.ping}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
