"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Icon } from "@/icons";
import {
  CANVAS_FORMATS,
  type CanvasFormat,
  type CanvasTheme,
  type CanvasArtType,
  type CanvasTemplate,
} from "./types";
import { CANVAS_TEMPLATES } from "./templates";
import {
  renderCanvas,
  generateSvg,
  exportCanvasPng,
  getBotCommand,
} from "./engine";

const FEN_PRESETS = [
  {
    name: "Smothered Mate (Philidor)",
    fen: "6k1/5ppp/8/8/8/8/5QPP/4R1K1 w - - 0 1",
  },
  {
    name: "Opera Game (Morphy 1858)",
    fen: "4kb1r/p2n1ppp/4p3/1B1p4/3P4/4PN2/1P1B1PPP/R3K2R w KQk - 0 1",
  },
  {
    name: "Kasparov's Immortal (1999)",
    fen: "b2r3r/k4p1p/p2q1np1/NppP4/3p1Q2/P4PPB/1PP4P/1K1RR3 w - - 0 25",
  },
  {
    name: "Fischer's Game of Century",
    fen: "r3r1k1/pp3pbp/1qp1b1p1/2B5/2BP4/1Pn2N2/P1Q2PPP/R4RK1 b - - 4 17",
  },
  {
    name: "The Immortal Game (1851)",
    fen: "r1bk3r/p2pBpNp/n4n2/1p1NP2P/6P1/3P4/P1P1K3/q5b1 b - - 1 23",
  },
  {
    name: "Tactics Drill (Qh6)",
    fen: "r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
  },
  {
    name: "Opening Trap (Fried Liver)",
    fen: "r1bqkb1r/ppp2ppp/2np1n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 5",
  },
  {
    name: "Initial Board",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  },
];

export function CanvasStudio({
  initialTemplateId,
}: {
  initialTemplateId?: string;
}) {
  const [selectedId, setSelectedId] = useState<string>(
    initialTemplateId || CANVAS_TEMPLATES[0].id
  );
  const [format, setFormat] = useState<CanvasFormat>("square");
  const [showGuides, setShowGuides] = useState<boolean>(false);
  const [flipped, setFlipped] = useState<boolean>(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Find base template
  const baseTemplate =
    CANVAS_TEMPLATES.find((t) => t.id === selectedId) || CANVAS_TEMPLATES[0];

  // Editable template state
  const [activeTemplate, setActiveTemplate] = useState<CanvasTemplate>({
    ...baseTemplate,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }

  // Update active template when base template selection changes
  function handleSelectTemplate(newId: string) {
    setSelectedId(newId);
    const tmpl = CANVAS_TEMPLATES.find((t) => t.id === newId);
    if (tmpl) {
      setActiveTemplate({ ...tmpl });
    }
  }

  // Reset to original preset
  function handleReset() {
    const tmpl = CANVAS_TEMPLATES.find((t) => t.id === selectedId);
    if (tmpl) {
      setActiveTemplate({ ...tmpl });
      showToast("Reset to template preset");
    }
  }

  // Redraw canvas whenever template, format, or options change
  useEffect(() => {
    let isCancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    renderCanvas(canvas, activeTemplate, format, { showGuides, flipped }).catch(
      (err) => {
        if (!isCancelled) {
          console.error("Canvas render error:", err);
        }
      }
    );

    return () => {
      isCancelled = true;
    };
  }, [activeTemplate, format, showGuides, flipped]);

  // Copy Bot Command
  async function handleCopyBotCommand() {
    try {
      const cmd = getBotCommand(activeTemplate);
      await navigator.clipboard.writeText(cmd);
      showToast("Copied bot command: " + cmd.slice(0, 32) + "...");
    } catch {
      showToast("Clipboard access denied");
    }
  }

  // Export high-res PNG
  function handleExportPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cleanId = activeTemplate.id.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const filename = `web3chess-${cleanId}-${format}.png`;
    exportCanvasPng(canvas, filename);
    showToast(`Exported ${filename}`);
  }

  // Copy SVG markup
  async function handleCopySvg() {
    try {
      const svg = generateSvg(activeTemplate, format);
      await navigator.clipboard.writeText(svg);
      showToast("Copied SVG code to clipboard");
    } catch {
      showToast("Clipboard access denied");
    }
  }

  // Cycle theme
  function handleToggleTheme() {
    setActiveTemplate((prev) => {
      const nextTheme: CanvasTheme =
        prev.theme === "ink" ? "canvas" : prev.theme === "canvas" ? "paper" : "ink";
      return { ...prev, theme: nextTheme };
    });
  }

  const currentFormatSpec = CANVAS_FORMATS[format];

  return (
    <div className="w-full flex flex-col gap-6" id="studio">
      {/* ── TOP ACTION & TOOLBAR BAR (Matches Screenshot) ── */}
      <div className="bg-inverse text-fg-inverse rounded-card p-4 sm:p-5 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 border border-line-strong">
        {/* Left: Format Segmented Control */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {(["square", "portrait", "wide", "story"] as CanvasFormat[]).map(
            (fmt) => {
              const spec = CANVAS_FORMATS[fmt];
              const isSelected = format === fmt;
              return (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFormat(fmt)}
                  className={`px-3 py-2 text-caption font-semibold rounded-control transition-colors duration-fast ${
                    isSelected
                      ? "bg-mint text-black"
                      : "bg-surface/10 text-fg-inverse hover:bg-surface/20"
                  }`}
                  aria-pressed={isSelected}
                >
                  {spec.label}
                </button>
              );
            }
          )}
        </div>

        {/* Center: SIGNAL / Template Selector */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="eyebrow text-fg-muted shrink-0 text-caption">SIGNAL:</span>
          <select
            value={selectedId}
            onChange={(e) => handleSelectTemplate(e.target.value)}
            className="bg-surface/10 text-fg-inverse border border-surface/20 rounded-control px-3 py-2 text-caption font-medium max-w-[280px] sm:max-w-[340px] truncate focus:outline-none focus:ring-1 focus:ring-mint"
          >
            {CANVAS_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id} className="bg-black text-white">
                {t.number} {t.name} ({t.category})
              </option>
            ))}
          </select>
        </div>

        {/* Right: Actions (Theme, Bot Command, PNG, SVG, Broadcast) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={handleToggleTheme}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-control bg-surface/10 hover:bg-surface/20 text-caption font-medium text-fg-inverse transition-colors"
            title="Cycle theme (Ink, Canvas, Paper)"
          >
            {activeTemplate.theme === "ink" ? (
              <>
                <span>🌙</span>
                <span className="hidden sm:inline">Ink Mode</span>
              </>
            ) : activeTemplate.theme === "paper" ? (
              <>
                <span>📄</span>
                <span className="hidden sm:inline">Paper Mode</span>
              </>
            ) : (
              <>
                <span>☀️</span>
                <span className="hidden sm:inline">Canvas Mode</span>
              </>
            )}
          </button>

          {/* Safe Area Guides Toggle */}
          <button
            type="button"
            onClick={() => setShowGuides(!showGuides)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-control text-caption font-medium transition-colors ${
              showGuides
                ? "bg-mint/20 text-mint border border-mint/40"
                : "bg-surface/10 hover:bg-surface/20 text-fg-inverse"
            }`}
            title="Toggle safe margin guide overlays"
            aria-pressed={showGuides}
          >
            <Icon name="strategy" size={16} />
            <span className="hidden sm:inline">Guides</span>
          </button>

          {/* Copy Bot Command */}
          <button
            type="button"
            onClick={handleCopyBotCommand}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-control bg-surface/10 hover:bg-surface/20 text-caption font-medium text-fg-inverse transition-colors"
            title="Copy /post command for Telegram CMO Bot"
          >
            <Icon name="copy" size={16} />
            <span className="hidden md:inline">Bot Command</span>
          </button>

          {/* Export PNG */}
          <button
            type="button"
            onClick={handleExportPng}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-mint text-black font-semibold text-caption hover:opacity-90 transition-opacity"
            title="Download high-resolution PNG"
          >
            <Icon name="arrow-up-right" size={16} className="rotate-90" />
            <span>Export PNG</span>
          </button>

          {/* Copy SVG */}
          <button
            type="button"
            onClick={handleCopySvg}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-control bg-surface/10 hover:bg-surface/20 text-caption font-medium text-fg-inverse transition-colors"
            title="Copy SVG vector markup"
          >
            <span className="font-mono text-caption">&lt;&gt;</span>
            <span className="hidden lg:inline">SVG</span>
          </button>

          {/* Broadcast to Channel */}
          <button
            type="button"
            onClick={() => setShowBroadcastModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-control bg-surface/15 hover:bg-surface/25 text-caption font-semibold text-mint transition-colors"
            title="Broadcast signal to official Telegram channel"
          >
            <Icon name="telegram-logo" size={16} />
            <span className="hidden sm:inline">Broadcast</span>
          </button>
        </div>
      </div>

      {/* ── TOAST NOTIFICATION ── */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="bg-inverse text-mint text-caption px-4 py-2.5 rounded-control font-medium border border-mint/30 self-center flex items-center gap-2 transition-all"
        >
          <Icon name="check-circle" size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── MAIN WORKSPACE (Preview + Live Editor Form) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / CENTER: CANVAS PREVIEW STAGE (Cols 1-7 on desktop) */}
        <div className="lg:col-span-7 bg-surface border border-line rounded-card p-4 sm:p-6 flex flex-col items-center gap-4">
          {/* Stage Header Info */}
          <div className="w-full flex items-center justify-between text-caption text-fg-muted border-b border-line pb-3">
            <span className="font-medium text-fg">
              {currentFormatSpec.label}
            </span>
            <span className="font-mono text-overline">
              {currentFormatSpec.width} × {currentFormatSpec.height}px · {currentFormatSpec.use}
            </span>
          </div>

          {/* Canvas Wrapper */}
          <div className="w-full flex items-center justify-center p-2 sm:p-4 bg-wash rounded-media overflow-hidden border border-line-soft">
            <div
              className="relative max-w-full flex items-center justify-center"
              style={{
                aspectRatio: currentFormatSpec.aspect,
                maxHeight: "580px",
              }}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain rounded-control border border-line shadow-card"
                style={{
                  maxHeight: "580px",
                }}
              />
            </div>
          </div>

          {/* Quick Guidance Under Canvas */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 text-caption text-fg-muted pt-2 border-t border-line">
            <div className="flex items-center gap-2">
              <span className="tag">Ready for Social</span>
              <span>100% Vector & High-Res</span>
            </div>
            <div className="font-mono text-overline">
              THEME: {activeTemplate.theme.toUpperCase()}
            </div>
          </div>
        </div>

        {/* RIGHT: LIVE TEMPLATE EDITOR (Cols 8-12 on desktop) */}
        <div className="lg:col-span-5 bg-surface border border-line rounded-card p-5 sm:p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex flex-col">
              <span className="eyebrow text-fg-muted">EDITOR</span>
              <h2 className="text-title font-medium text-fg">Customise Signal</h2>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-caption font-semibold text-fg-muted hover:text-fg underline transition-colors"
              title="Reset fields to template presets"
            >
              Reset to preset
            </button>
          </div>

          {/* 1. Tag / Badge */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="input-tag" className="text-caption font-semibold text-fg">
              Overline Tag
            </label>
            <input
              id="input-tag"
              type="text"
              value={activeTemplate.tag}
              onChange={(e) =>
                startTransition(() => {
                  setActiveTemplate((p) => ({ ...p, tag: e.target.value }));
                })
              }
              className="site-input"
              placeholder="e.g. Settle It on the Board"
            />
          </div>

          {/* 2. Headline / Hook */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="input-headline" className="text-caption font-semibold text-fg">
                Headline / Hook
              </label>
              <span className="text-overline text-fg-muted font-mono">
                NO TERMINAL PERIOD
              </span>
            </div>
            <textarea
              id="input-headline"
              rows={2}
              value={activeTemplate.headline}
              onChange={(e) =>
                startTransition(() => {
                  setActiveTemplate((p) => ({ ...p, headline: e.target.value }));
                })
              }
              className="site-input font-condensed font-bold text-lead uppercase tracking-tight"
              placeholder="YOUR FRIEND&#10;YOUR NEXT RIVAL"
            />
          </div>

          {/* 3. Body / Subhead */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="input-body" className="text-caption font-semibold text-fg">
              Subhead / Body Copy
            </label>
            <input
              id="input-body"
              type="text"
              value={activeTemplate.body}
              onChange={(e) =>
                startTransition(() => {
                  setActiveTemplate((p) => ({ ...p, body: e.target.value }));
                })
              }
              className="site-input"
              placeholder="Send an invite · Agree the stake · Play chess"
            />
          </div>

          {/* 4. CTA Button Text */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="input-cta" className="text-caption font-semibold text-fg">
              CTA Action Label
            </label>
            <input
              id="input-cta"
              type="text"
              value={activeTemplate.cta}
              onChange={(e) =>
                startTransition(() => {
                  setActiveTemplate((p) => ({ ...p, cta: e.target.value }));
                })
              }
              className="site-input"
              placeholder="Challenge a friend"
            />
          </div>

          {/* 5. Proof Rows (3 points) */}
          <div className="flex flex-col gap-2">
            <label className="text-caption font-semibold text-fg">
              Proof Points (3 Single-Line Proofs)
            </label>
            {[0, 1, 2].map((idx) => (
              <input
                key={idx}
                type="text"
                value={activeTemplate.proof[idx] || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  startTransition(() => {
                    setActiveTemplate((p) => {
                      const newProof = [...p.proof] as [string, string, string];
                      newProof[idx] = val;
                      return { ...p, proof: newProof };
                    });
                  });
                }}
                className="site-input text-caption"
                placeholder={`Proof item ${idx + 1}`}
              />
            ))}
          </div>

          {/* 6. Visual Art Asset Type */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="select-art" className="text-caption font-semibold text-fg">
              Visual Asset
            </label>
            <select
              id="select-art"
              value={activeTemplate.art}
              onChange={(e) =>
                startTransition(() => {
                  setActiveTemplate((p) => ({
                    ...p,
                    art: e.target.value as CanvasArtType,
                  }));
                })
              }
              className="site-input site-select"
            >
              <option value="sculpture">3D Chess Sculpture (Knight, Rook, Pawn)</option>
              <option value="clock">Twin-Dial Blitz Clock</option>
              <option value="academy">Open Academy Book</option>
              <option value="stakes">Pawn Balance Scale</option>
              <option value="fair-play">Kings &amp; Shield</option>
              <option value="board">8×8 Chessboard (Tactics / FEN)</option>
            </select>
          </div>

          {/* 7. If Board: FEN Position & Presets */}
          {activeTemplate.art === "board" && (
            <div className="flex flex-col gap-2 p-3 bg-wash rounded-media border border-line-soft">
              <div className="flex items-center justify-between">
                <label htmlFor="input-fen" className="text-caption font-semibold text-fg">
                  Board FEN Position
                </label>
                <button
                  type="button"
                  onClick={() => setFlipped(!flipped)}
                  className={`text-overline font-semibold px-2 py-0.5 rounded-control transition-colors ${
                    flipped
                      ? "bg-mint text-black"
                      : "bg-surface text-fg border border-line hover:bg-wash"
                  }`}
                  title="Flip board perspective between White and Black"
                >
                  {flipped ? "Black's View ♟" : "White's View ♙"}
                </button>
              </div>
              <input
                id="input-fen"
                type="text"
                value={
                  activeTemplate.fen ||
                  "r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4"
                }
                onChange={(e) =>
                  startTransition(() => {
                    setActiveTemplate((p) => ({ ...p, fen: e.target.value }));
                  })
                }
                className="site-input font-mono text-overline"
                placeholder="rnbqkbnr/..."
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {FEN_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() =>
                      startTransition(() => {
                        setActiveTemplate((p) => ({ ...p, fen: preset.fen }));
                      })
                    }
                    className="px-2 py-1 text-overline font-semibold bg-surface border border-line rounded-control hover:bg-surface/80"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 8. Disclaimer Note */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="input-note" className="text-caption font-semibold text-fg">
              Footnote Disclaimer
            </label>
            <input
              id="input-note"
              type="text"
              value={activeTemplate.note}
              onChange={(e) =>
                startTransition(() => {
                  setActiveTemplate((p) => ({ ...p, note: e.target.value }));
                })
              }
              className="site-input text-caption"
              placeholder="USDT matches · 18+ where permitted"
            />
          </div>

          {/* Quick Actions in Editor footer */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-line">
            <button
              type="button"
              onClick={handleExportPng}
              className="flex-1 py-3 px-4 rounded-control bg-fg text-fg-inverse font-semibold text-caption hover:opacity-90 transition-opacity text-center"
            >
              Download {currentFormatSpec.label} PNG
            </button>
            <button
              type="button"
              onClick={handleCopyBotCommand}
              className="py-3 px-4 rounded-control bg-wash hover:bg-wash/80 border border-line text-fg font-semibold text-caption transition-colors"
            >
              Copy Bot Command
            </button>
          </div>
        </div>
      </div>

      {/* ── BROADCAST TO TELEGRAM CHANNEL MODAL ── */}
      {showBroadcastModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="broadcast-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="bg-surface text-fg border border-line rounded-panel max-w-xl w-full p-6 sm:p-8 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-mint flex items-center justify-center text-black">
                  <Icon name="paper-plane-tilt" size={20} />
                </div>
                <div>
                  <h3 id="broadcast-title" className="text-title font-bold text-fg">
                    Broadcast Signal
                  </h3>
                  <p className="text-caption text-fg-muted">
                    Post to Telegram channel &amp; community hub
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="p-2 rounded-control hover:bg-wash text-fg-muted hover:text-fg"
                aria-label="Close dialog"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            {/* Telegram Command */}
            <div className="flex flex-col gap-2">
              <label className="text-caption font-semibold text-fg">
                Telegram Bot Content Command
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-inverse text-mint font-mono text-caption rounded-control overflow-x-auto">
                  {getBotCommand(activeTemplate)}
                </code>
                <button
                  type="button"
                  onClick={handleCopyBotCommand}
                  className="px-4 py-3 bg-mint text-black font-semibold text-caption rounded-control shrink-0 hover:opacity-90"
                >
                  Copy
                </button>
              </div>
              <p className="text-overline text-fg-muted font-mono">
                Run this command in the CMO Agent terminal or admin chat to schedule the post.
              </p>
            </div>

            {/* Caption Draft Preview */}
            <div className="flex flex-col gap-2">
              <label className="text-caption font-semibold text-fg">
                Draft Social Caption
              </label>
              <div className="p-3 bg-wash rounded-media border border-line text-caption font-sans text-fg whitespace-pre-line">
                {activeTemplate.caption}
                {"\n\n"}
                Play free or challenge friends: {activeTemplate.destination}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="px-4 py-2.5 rounded-control text-caption font-semibold text-fg-muted hover:text-fg"
              >
                Close
              </button>
              <a
                href={activeTemplate.destination}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-control bg-mint text-black font-semibold text-caption hover:opacity-90"
              >
                Open in Telegram ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
