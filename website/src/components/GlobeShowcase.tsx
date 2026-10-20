"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useShowcaseActivity } from "./home/useShowcaseActivity";
import createGlobe from "cobe";
import { Card } from "./ui/Card";
import { ShowcaseMotionControl } from "./ui/ShowcaseMotionControl";

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

// Illustrative routes demonstrate the global play concept, not live matches.
const ROUTE_EXAMPLES = [
  { p1: "Tokyo", flag1: "🇯🇵", p2: "London", flag2: "🇬🇧" },
  { p1: "São Paulo", flag1: "🇧🇷", p2: "New York", flag2: "🇺🇸" },
  { p1: "Mumbai", flag1: "🇮🇳", p2: "Singapore", flag2: "🇸🇬" },
  { p1: "Nairobi", flag1: "🇰🇪", p2: "Berlin", flag2: "🇩🇪" },
];

const ARC_COLOR: [number, number, number] = [16 / 255, 185 / 255, 129 / 255];

const NODES = [
  { city: "Tokyo", flag: "🇯🇵" },
  { city: "London", flag: "🇬🇧" },
  { city: "Dubai", flag: "🇦🇪" },
  { city: "New York", flag: "🇺🇸" },
  { city: "Singapore", flag: "🇸🇬" },
  { city: "Zurich", flag: "🇨🇭" },
  { city: "Tashkent", flag: "🇺🇿" },
  { city: "São Paulo", flag: "🇧🇷" },
  { city: "Sydney", flag: "🇦🇺" },
  { city: "Berlin", flag: "🇩🇪" },
];

export function GlobeShowcase() {
  const globeId = useId();
  const fallbackRef = useRef<SVGSVGElement>(null);
  const { ref: containerRef, visible: isVisible, foreground, reduced, active } = useShowcaseActivity();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const phiRef = useRef(0);
  const animationRef = useRef<number>(0);

  const [matchIndex, setMatchIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [width, setWidth] = useState(280);
  const [isCrossfading, setIsCrossfading] = useState(false);

  const current = ROUTE_EXAMPLES[matchIndex];

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
    color: ARC_COLOR,
  });

  useEffect(() => {
    activeArcRef.current = {
      city1: city1Coords,
      city2: city2Coords,
      color: ARC_COLOR,
    };
  }, [city1Coords, city2Coords]);

  // Setup globe WebGL with cobe only when in viewport
  useEffect(() => {
    if (!isVisible || !foreground) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let width = canvas.offsetWidth;
    const onResize = () => { width = canvas.offsetWidth; setWidth(width); };
    const sizeObserver = new ResizeObserver(onResize);
    sizeObserver.observe(canvas);

    const isMobile = typeof window !== "undefined" && (window.innerWidth < 768 || (typeof navigator !== "undefined" && navigator.maxTouchPoints > 1));
    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, isMobile ? 1.4 : 1.8);
    const mapSamples = isMobile ? 9000 : 16000;

    let globe: ReturnType<typeof createGlobe>;
    try { globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: (width || 320) * dpr,
      height: (width || 320) * dpr,
      phi: phiRef.current,
      theta: 0.22,
      // Light globe: low diffuse keeps the land dots legible across the face, not only at the rim.
      dark: 0,
      diffuse: 0.4,
      mapSamples,
      mapBrightness: 1.2,
      baseColor: [1, 1, 1],
      markerColor: [16 / 255, 185 / 255, 129 / 255],
      glowColor: [0.94, 0.94, 0.94],
      offset: [0, 0],
      markers: BASE_MARKERS,
      arcs: AMBIENT_ARCS,
      arcColor: [16 / 255, 185 / 255, 129 / 255],
      arcWidth: 0.32,
      arcHeight: 0.30,
      markerElevation: 0.02,
    }); } catch {
      canvas.style.opacity = "0";
      if (fallbackRef.current) fallbackRef.current.style.opacity = "1";
      sizeObserver.disconnect();
      return;
    }

    // COBE decodes its land map asynchronously. A paused or reduced-motion globe still draws for a short
    // warm-up so the continents appear; otherwise the single first frame shows an empty sphere.
    let warmupFrames = 60;
    const animate = () => {
      if (document.hidden) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      if (pointerInteracting.current === null && !paused) {
        phiRef.current += isMobile ? 0.0012 : 0.0016;
      }

      const { city1, city2, color } = activeArcRef.current;

      globe.update({
        phi: phiRef.current + pointerInteractionMovement.current,
        width: (width || 320) * dpr,
        height: (width || 320) * dpr,
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
      warmupFrames -= 1;
      if ((!reduced && !paused) || warmupFrames > 0) animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    const supported = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    if (fallbackRef.current) fallbackRef.current.style.opacity = supported ? "0" : "1";
    canvas.style.opacity = supported ? "1" : "0";

    return () => {
      cancelAnimationFrame(animationRef.current);
      globe.destroy();
      sizeObserver.disconnect();
    };
  }, [isVisible, foreground, reduced, paused]);

  // Rotate illustrative routes only while visible
  useEffect(() => {
    if (!active || paused) return;
    let flip: ReturnType<typeof setTimeout>;
    const timer = setInterval(() => {
      setIsCrossfading(true);
      flip = setTimeout(() => {
        setMatchIndex((i) => (i + 1) % ROUTE_EXAMPLES.length);
        setIsCrossfading(false);
      }, 200);
    }, 3500);
    return () => { clearInterval(timer); clearTimeout(flip); };
  }, [active, paused]);

  const nodeCount = width < 340 ? 2 : 3;
  const nodes = Array.from({ length: nodeCount }, (_, i) => NODES[(matchIndex * nodeCount + i) % NODES.length]);
  return (
    <Card className="globe-showcase showcase-panel" data-interactive-workspace>
      <div ref={containerRef} className="globe-marketing" data-active={active && !paused}>
        <div className="showcase-panel-heading"><span>Global play illustration</span><ShowcaseMotionControl name="globe" paused={paused} onToggle={() => setPaused((value) => !value)} /></div>
        <div className="globe-match" data-changing={isCrossfading || undefined}>
          <div className="globe-match-cities"><span>{current.flag1} {current.p1}</span><span aria-hidden="true">↔</span><span>{current.flag2} {current.p2}</span></div>
          <div className="globe-match-details"><strong>Example route</strong><span>Chess across time zones</span></div>
        </div>
        <div className="globe-marketing-stage">
          <svg ref={fallbackRef} className="globe-fallback" viewBox="0 0 320 320" aria-hidden="true">
            <defs><radialGradient id={globeId} cx="35%" cy="28%"><stop offset="0" stopColor="var(--surface-card)" /><stop offset="1" stopColor="var(--surface-canvas)" /></radialGradient></defs>
            <circle cx="160" cy="160" r="137" fill={`url(#${globeId})`} stroke="var(--line-hairline)" />
            <g fill="none" stroke="var(--line-hairline)"><ellipse cx="160" cy="160" rx="70" ry="137" /><ellipse cx="160" cy="160" rx="136" ry="46" /><path d="M40 92c70 34 170 34 240 0M40 228c70-34 170-34 240 0M160 23v274" /></g>
            <path d="M83 103Q160 27 239 186" fill="none" stroke="var(--color-win)" strokeWidth="1.5" />
            <g fill="var(--color-win)"><circle cx="83" cy="103" r="5" /><circle cx="239" cy="186" r="5" /><circle cx="130" cy="179" r="3" /><circle cx="213" cy="126" r="3" /></g>
          </svg>
          <canvas ref={canvasRef} className="globe-canvas" role="img" aria-label="Illustrative chess routes across the world"
            onPointerDown={(e) => { pointerInteracting.current = e.clientX - pointerInteractionMovement.current; }}
            onPointerUp={() => { pointerInteracting.current = null; }} onPointerOut={() => { pointerInteracting.current = null; }}
            onMouseMove={(e) => { if (pointerInteracting.current !== null) pointerInteractionMovement.current = (e.clientX - pointerInteracting.current) * 0.005; }}
            onTouchMove={(e) => { if (pointerInteracting.current !== null && e.touches[0]) pointerInteractionMovement.current = (e.touches[0].clientX - pointerInteracting.current) * 0.005; }} />
        </div>
        <ul className="globe-node-list" style={{ gridTemplateColumns: `repeat(${nodeCount}, minmax(0, 1fr))` }}>{nodes.map((node) => <li key={node.city}><span>{node.flag} {node.city}</span><span>Example</span></li>)}</ul>
      </div>
    </Card>
  );
}
