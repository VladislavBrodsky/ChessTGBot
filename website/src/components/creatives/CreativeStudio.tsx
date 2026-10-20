"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Icon } from "@/icons";
import {
  ART_LIBRARY, FORMATS, PRESETS, PROOF_ICONS, copyProject, parseProject,
  type ArtKind, type ArtLayer, type CreativeFormat, type CreativeProject, type CreativeTheme,
} from "./model";
import { artBounds, downloadBlob, downloadPng, fileStem, renderProject } from "./render";

const STORAGE_KEY = "web3chess-creatives-v1";
const themes: { id: CreativeTheme; label: string }[] = [
  { id: "canvas", label: "Warm canvas" },
  { id: "paper", label: "White paper" },
  { id: "ink", label: "Black ink" },
];

function clamp(value: number, low: number, high: number) {
  return Math.min(high, Math.max(low, value));
}

function Field({ label, value, onChange, maxLength, multiline = false, hint }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  multiline?: boolean;
  hint?: string;
}) {
  const id = `creative-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-caption font-semibold text-fg">{label}</label>
      {multiline ? (
        <textarea id={id} className="site-input resize-y" rows={3} value={value}
          maxLength={maxLength} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input id={id} className="site-input" value={value} maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)} />
      )}
      {hint && <p className="text-caption text-fg-muted">{hint}</p>}
    </div>
  );
}

export function CreativeStudio() {
  const [project, setProject] = useState<CreativeProject>(() => copyProject(PRESETS[0].project));
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [selectedId, setSelectedId] = useState<string | null>("art-1");
  const [guides, setGuides] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [customWidth, setCustomWidth] = useState("1080");
  const [customHeight, setCustomHeight] = useState("1080");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const renderId = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed = stored ? parseProject(JSON.parse(stored)) : null;
        if (parsed) {
          setProject(parsed);
          setSelectedId(parsed.layers[0]?.id ?? null);
          setCustomWidth(String(parsed.width));
          setCustomHeight(String(parsed.height));
        }
      } catch { /* A damaged local draft is ignored safely. */ }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(project)); }
    catch { window.setTimeout(() => setNotice("Browser storage is unavailable; download your project to keep it"), 0); }
  }, [project, ready]);

  useEffect(() => {
    const ticket = ++renderId.current;
    const timer = window.setTimeout(() => {
      renderProject(project, { guides, selectedId: selectedId ?? undefined }).then(({ canvas, warnings: nextWarnings }) => {
        if (ticket !== renderId.current) return;
        const visible = canvasRef.current;
        if (!visible) return;
        visible.width = canvas.width;
        visible.height = canvas.height;
        visible.getContext("2d")?.drawImage(canvas, 0, 0);
        setWarnings(nextWarnings);
      }).catch((error) => {
        if (ticket === renderId.current) setWarnings([error instanceof Error ? error.message : "Preview could not render"]);
      });
    }, 45);
    return () => window.clearTimeout(timer);
  }, [project, guides, selectedId]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const selected = project.layers.find((layer) => layer.id === selectedId);
  const update = (change: Partial<CreativeProject>) => setProject((current) => ({ ...current, ...change }));
  const updateLayer = (id: string, change: Partial<ArtLayer>) => setProject((current) => ({
    ...current,
    layers: current.layers.map((layer) => layer.id === id ? { ...layer, ...change } : layer),
  }));

  function choosePreset(id: string) {
    const preset = PRESETS.find((item) => item.id === id);
    if (!preset) return;
    const next = copyProject(preset.project);
    setProject(next);
    setPresetId(id);
    setSelectedId(next.layers[0]?.id ?? null);
    setCustomWidth(String(next.width));
    setCustomHeight(String(next.height));
    setNotice(`Loaded ${preset.label}`);
  }

  function chooseFormat(id: CreativeFormat) {
    if (id === "custom") {
      update({ format: "custom" });
      return;
    }
    const format = FORMATS.find((item) => item.id === id)!;
    update({ format: id, width: format.width, height: format.height });
    setCustomWidth(String(format.width));
    setCustomHeight(String(format.height));
  }

  function applyCustomSize() {
    const width = Number(customWidth), height = Number(customHeight);
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 320 || height < 320 ||
        width > 4096 || height > 4096 || width * height > 16_000_000) {
      setNotice("Use 320–4096 px per side and no more than 16 million pixels");
      return;
    }
    update({ format: "custom", width, height });
    setNotice(`Canvas set to ${width} × ${height} px`);
  }

  function addArt(kind: ArtKind) {
    if (project.layers.length >= 8) {
      setNotice("A canvas can hold up to eight artwork layers");
      return;
    }
    let suffix = 1;
    while (project.layers.some((layer) => layer.id === `art-${suffix}`)) suffix += 1;
    const id = `art-${suffix}`;
    const step = project.layers.length;
    setProject((current) => ({
      ...current,
      layers: [...current.layers, {
        id, kind, x: clamp(0.64 + step * 0.035, 0.15, 0.85),
        y: clamp(0.55 + step * 0.035, 0.15, 0.85), size: 0.34,
        rotation: 0,
      }],
    }));
    setSelectedId(id);
    setNotice("Artwork added. Drag it on the canvas or adjust its controls");
  }

  function removeArt(id: string) {
    setProject((current) => ({ ...current, layers: current.layers.filter((layer) => layer.id !== id) }));
    setSelectedId(null);
  }

  function moveArt(id: string, offset: -1 | 1) {
    setProject((current) => {
      const layers = [...current.layers];
      const index = layers.findIndex((layer) => layer.id === id);
      const target = index + offset;
      if (index < 0 || target < 0 || target >= layers.length) return current;
      [layers[index], layers[target]] = [layers[target], layers[index]];
      return { ...current, layers };
    });
  }

  function duplicateArt(layer: ArtLayer) {
    if (project.layers.length >= 8) { setNotice("A canvas can hold up to eight artwork layers"); return; }
    let suffix = 1;
    while (project.layers.some((item) => item.id === `art-${suffix}`)) suffix += 1;
    const id = `art-${suffix}`;
    setProject((current) => ({ ...current, layers: [...current.layers, {
      ...layer, id, x: clamp(layer.x + 0.06, 0.02, 0.98), y: clamp(layer.y + 0.06, 0.02, 0.98),
    }] }));
    setSelectedId(id);
  }

  function pointerPosition(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * project.width,
      y: ((event.clientY - rect.top) / rect.height) * project.height,
    };
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    const pos = pointerPosition(event);
    const hit = [...project.layers].reverse().find((layer) => {
      const bounds = artBounds(project, layer);
      return pos.x >= bounds.x && pos.x <= bounds.x + bounds.size &&
        pos.y >= bounds.y && pos.y <= bounds.y + bounds.size;
    });
    if (!hit) { setSelectedId(null); return; }
    setSelectedId(hit.id);
    dragRef.current = { id: hit.id, dx: hit.x - pos.x / project.width, dy: hit.y - pos.y / project.height };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const pos = pointerPosition(event);
    updateLayer(drag.id, {
      x: clamp(pos.x / project.width + drag.dx, 0.02, 0.98),
      y: clamp(pos.y / project.height + drag.dy, 0.02, 0.98),
    });
  }

  async function handleExport() {
    setExporting(true);
    try {
      await downloadPng(project);
      setNotice(`Downloaded ${project.width} × ${project.height} PNG`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "PNG export failed");
    } finally { setExporting(false); }
  }

  function handleProjectDownload() {
    downloadBlob(new Blob([JSON.stringify(project, null, 2)], { type: "application/json" }), `${fileStem(project)}.json`);
    setNotice("Editable project downloaded");
  }

  async function handleProjectImport(file?: File) {
    if (!file) return;
    try {
      if (file.size > 1_000_000) throw new Error("Project file must be under 1 MB");
      const parsed = parseProject(JSON.parse(await file.text()));
      if (!parsed) throw new Error("This is not a valid Web3Chess creative project");
      setProject(parsed);
      setSelectedId(parsed.layers[0]?.id ?? null);
      setCustomWidth(String(parsed.width));
      setCustomHeight(String(parsed.height));
      setNotice("Editable project imported");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not import project");
    } finally { if (importRef.current) importRef.current.value = ""; }
  }

  return (
    <div className="space-y-6" id="creative-studio">
      <div className="rounded-panel bg-inverse p-4 text-fg-inverse sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-overline uppercase tracking-[0.16em] text-mint">Workspace / 01</p>
            <h2 className="mt-1 text-heading-sm font-medium">{project.name}</h2>
            <p className="mt-1 text-caption text-white/75">{project.width} × {project.height} px · Saved in this browser</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => importRef.current?.click()}
              className="min-h-11 rounded-control border border-white/30 px-4 text-caption font-semibold hover:bg-white/10">
              Import project
            </button>
            <input ref={importRef} type="file" accept="application/json,.json" className="sr-only"
              aria-label="Import editable project" onChange={(event) => void handleProjectImport(event.target.files?.[0])} />
            <button type="button" onClick={handleProjectDownload}
              className="min-h-11 rounded-control border border-white/30 px-4 text-caption font-semibold hover:bg-white/10">
              Save project
            </button>
            <button type="button" onClick={() => void handleExport()} disabled={exporting || warnings.length > 0}
              className="min-h-11 rounded-control bg-mint px-4 text-caption font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50">
              {exporting ? "Preparing PNG…" : "Download PNG"}
            </button>
          </div>
        </div>
      </div>

      <div aria-live="polite" className="min-h-6 text-caption text-fg-muted">{notice}</div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <section aria-label="Canvas preview" className="min-w-0 rounded-panel border border-line bg-surface p-4 sm:p-6 xl:sticky xl:top-24">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
            <div>
              <p className="eyebrow">Live preview</p>
              <h3 className="mt-1 text-title font-medium">Drag the 3D artwork to place it</h3>
            </div>
            <button type="button" aria-pressed={guides} onClick={() => setGuides((value) => !value)}
              className="min-h-11 rounded-control border border-line px-4 text-caption font-semibold hover:bg-wash">
              {guides ? "Hide safe area" : "Show safe area"}
            </button>
          </div>
          <div className="mt-5 flex min-h-[320px] items-center justify-center rounded-media border border-line bg-wash p-3 sm:min-h-[440px] sm:p-5">
            <canvas ref={canvasRef} tabIndex={0}
              aria-label={`Editable ${project.width} by ${project.height} canvas. Drag artwork or select a layer and use arrow keys.`}
              onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
              onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }}
              onKeyDown={(event) => {
                if (!selected) return;
                const step = event.shiftKey ? 0.025 : 0.008;
                const offsets: Record<string, [number, number]> = {
                  ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
                };
                if (event.key === "Delete" || event.key === "Backspace") {
                  event.preventDefault(); removeArt(selected.id); return;
                }
                if (offsets[event.key]) {
                  event.preventDefault();
                  updateLayer(selected.id, {
                    x: clamp(selected.x + offsets[event.key][0], 0.02, 0.98),
                    y: clamp(selected.y + offsets[event.key][1], 0.02, 0.98),
                  });
                }
              }}
              className="block h-auto max-h-[680px] max-w-full cursor-grab touch-none rounded-control shadow-card active:cursor-grabbing"
              style={{ aspectRatio: `${project.width} / ${project.height}` }} />
          </div>
          <p className="mt-4 text-caption text-fg-muted">Export uses the full-size canvas without selection outlines or safe-area guides</p>
          {warnings.length > 0 && <ul role="alert" className="mt-4 space-y-1 rounded-control border border-line bg-wash p-3 text-caption text-fg">
            {warnings.map((warning) => <li key={warning}>• {warning}</li>)}
          </ul>}
        </section>

        <div className="min-w-0 space-y-5">
          <section aria-labelledby="format-heading" className="rounded-panel border border-line bg-surface p-5">
            <p className="eyebrow">01 / Output</p>
            <h3 id="format-heading" className="mt-1 text-title font-medium">Size and format</h3>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {FORMATS.map((item) => <button key={item.id} type="button" aria-pressed={project.format === item.id}
                onClick={() => chooseFormat(item.id)}
                className={`min-h-14 rounded-control border px-3 text-start text-caption font-semibold ${project.format === item.id ? "border-black bg-inverse text-white" : "border-line bg-wash hover:border-line-strong"}`}>
                {item.label} <span className="ms-1 opacity-70">{item.detail}</span>
              </button>)}
            </div>
            <div className="mt-4 border-t border-line pt-4">
              <p className="text-caption font-semibold">Custom dimensions</p>
              <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                <label className="text-caption">Width <input className="site-input mt-1" type="number" min={320} max={4096} value={customWidth}
                  onChange={(event) => setCustomWidth(event.target.value)} /></label>
                <span className="pb-3 text-fg-muted">×</span>
                <label className="text-caption">Height <input className="site-input mt-1" type="number" min={320} max={4096} value={customHeight}
                  onChange={(event) => setCustomHeight(event.target.value)} /></label>
              </div>
              <button type="button" onClick={applyCustomSize} className="mt-3 min-h-11 w-full rounded-control border border-line px-4 text-caption font-semibold hover:bg-wash">Apply custom size</button>
            </div>
          </section>

          <section aria-labelledby="copy-heading" className="rounded-panel border border-line bg-surface p-5">
            <p className="eyebrow">02 / Message</p>
            <h3 id="copy-heading" className="mt-1 text-title font-medium">Edit the words</h3>
            <label className="mt-4 grid gap-1.5 text-caption font-semibold">Starting layout
              <select className="site-input site-select" value={presetId} onChange={(event) => choosePreset(event.target.value)}>
                {PRESETS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <div className="mt-4 grid gap-4">
              <Field label="Project name" value={project.name} maxLength={80} onChange={(name) => update({ name })} />
              <Field label="Small label" value={project.tag} maxLength={50} onChange={(tag) => update({ tag })} />
              <Field label="Title" value={project.title} maxLength={140} multiline
                hint="Use a line break to control the headline. Short copy reads best on phones."
                onChange={(title) => update({ title })} />
              <Field label="Subtitle" value={project.subtitle} maxLength={180} onChange={(subtitle) => update({ subtitle })} />
              {[0, 1, 2].map((index) => <div key={index} className="grid gap-2 rounded-control border border-line p-3">
                <Field label={`Proof line ${index + 1}`} value={project.proofs[index]} maxLength={80}
                  onChange={(value) => setProject((current) => {
                    const proofs = [...current.proofs] as CreativeProject["proofs"];
                    proofs[index] = value;
                    return { ...current, proofs };
                  })} />
                <label className="grid gap-1.5 text-caption font-semibold">Matching icon
                  <select className="site-input site-select" value={project.proofIcons[index]}
                    onChange={(event) => setProject((current) => {
                      const proofIcons = [...current.proofIcons] as CreativeProject["proofIcons"];
                      proofIcons[index] = event.target.value as CreativeProject["proofIcons"][number];
                      return { ...current, proofIcons };
                    })}>
                    {PROOF_ICONS.map((icon) => <option key={icon.id} value={icon.id}>{icon.label}</option>)}
                  </select>
                </label>
              </div>)}
              <Field label="Action" value={project.cta} maxLength={70} onChange={(cta) => update({ cta })} />
              <Field label="URL pill" value={project.urlLabel} maxLength={60} onChange={(urlLabel) => update({ urlLabel })} />
              <Field label="Footer note" value={project.note} maxLength={140} onChange={(note) => update({ note })} />
            </div>
          </section>

          <section aria-labelledby="art-heading" className="rounded-panel border border-line bg-surface p-5">
            <p className="eyebrow">03 / Visuals</p>
            <h3 id="art-heading" className="mt-1 text-title font-medium">Add 3D artwork</h3>
            <p className="mt-2 text-caption text-fg-muted">Choose a branded sculpture, then drag, size, and rotate it on the canvas</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {ART_LIBRARY.map((item) => <button type="button" key={item.kind}
                onClick={() => addArt(item.kind)} aria-label={`Add ${item.label}`}
                className="flex min-h-28 flex-col items-center justify-center rounded-control border border-line bg-wash p-2 text-center text-overline font-semibold hover:border-line-strong">
                <Image src={item.src} alt="" width={64} height={64} className="h-16 w-16 object-contain" />
                <span className="mt-1">{item.label}</span>
              </button>)}
            </div>
            <div className="mt-5 border-t border-line pt-4">
              <p className="text-caption font-semibold">Layers ({project.layers.length}/8)</p>
              <div className="mt-2 grid gap-2">
                {[...project.layers].reverse().map((layer) => <div key={layer.id} className="flex items-center gap-2">
                  <button type="button" aria-pressed={selectedId === layer.id} onClick={() => setSelectedId(layer.id)}
                    className={`min-h-11 min-w-0 flex-1 rounded-control border px-3 text-start text-caption ${selectedId === layer.id ? "border-black bg-mint font-semibold" : "border-line hover:bg-wash"}`}>
                    {ART_LIBRARY.find((item) => item.kind === layer.kind)?.label}
                  </button>
                  <button type="button" onClick={() => removeArt(layer.id)} aria-label={`Remove ${layer.kind} artwork`}
                    className="grid size-11 place-items-center rounded-control border border-line hover:bg-wash"><Icon name="x" size={16} /></button>
                </div>)}
                {project.layers.length === 0 && <p className="text-caption text-fg-muted">No artwork layers yet</p>}
              </div>
            </div>
            {selected && <div className="mt-5 grid gap-4 border-t border-line pt-4">
              <p className="text-caption font-semibold">Selected artwork</p>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => moveArt(selected.id, -1)}
                  disabled={project.layers[0]?.id === selected.id}
                  className="min-h-11 rounded-control border border-line px-2 text-caption font-semibold disabled:opacity-40">Send back</button>
                <button type="button" onClick={() => moveArt(selected.id, 1)}
                  disabled={project.layers.at(-1)?.id === selected.id}
                  className="min-h-11 rounded-control border border-line px-2 text-caption font-semibold disabled:opacity-40">Bring forward</button>
                <button type="button" onClick={() => duplicateArt(selected)}
                  disabled={project.layers.length >= 8}
                  className="min-h-11 rounded-control border border-line px-2 text-caption font-semibold disabled:opacity-40">Duplicate</button>
              </div>
              {([
                ["Horizontal position", "x", Math.round(selected.x * 100), 2, 98],
                ["Vertical position", "y", Math.round(selected.y * 100), 2, 98],
                ["Size", "size", Math.round(selected.size * 100), 8, 80],
                ["Rotation", "rotation", selected.rotation, -180, 180],
              ] as const).map(([label, key, value, min, max]) => <label key={key} className="grid gap-1.5 text-caption font-semibold">
                <span className="flex justify-between"><span>{label}</span><span>{value}{key === "rotation" ? "°" : "%"}</span></span>
                <input type="range" min={min} max={max} value={value}
                  onChange={(event) => updateLayer(selected.id, { [key]: key === "rotation" ? Number(event.target.value) : Number(event.target.value) / 100 })}
                  className="w-full accent-black" />
              </label>)}
            </div>}
          </section>

          <section aria-labelledby="theme-heading" className="rounded-panel border border-line bg-surface p-5">
            <p className="eyebrow">04 / Finish</p>
            <h3 id="theme-heading" className="mt-1 text-title font-medium">Canvas surface</h3>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {themes.map((item) => <button key={item.id} type="button" aria-pressed={project.theme === item.id}
                onClick={() => update({ theme: item.id })}
                className={`min-h-12 rounded-control border px-2 text-caption font-semibold ${project.theme === item.id ? "border-black bg-mint" : "border-line hover:bg-wash"}`}>
                {item.label}
              </button>)}
            </div>
            <p className="mt-4 text-caption text-fg-muted">The editor keeps your last project in this browser. Download the editable JSON to continue on another device.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
