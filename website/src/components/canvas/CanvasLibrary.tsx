"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/icons";
import { CANVAS_TEMPLATES } from "./templates";
import type { CanvasTemplate } from "./types";
import { exportCanvasPng, renderCanvas, getBotCommand } from "./engine";

const CATEGORIES = [
  "All",
  "Awareness",
  "Culture",
  "Tactics",
  "Education",
  "Speed",
  "Wagers",
  "Openings",
  "Manifesto",
] as const;

export function CanvasLibrary({
  onSelectTemplate,
}: {
  onSelectTemplate?: (id: string) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    return CANVAS_TEMPLATES.filter((tmpl) => {
      const matchesCategory =
        selectedCategory === "All" || tmpl.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tmpl.name.toLowerCase().includes(q) ||
        tmpl.headline.toLowerCase().includes(q) ||
        tmpl.body.toLowerCase().includes(q) ||
        tmpl.tag.toLowerCase().includes(q) ||
        tmpl.purpose.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  async function handleQuickExport(template: CanvasTemplate) {
    try {
      setExportingId(template.id);
      const offscreenCanvas = document.createElement("canvas");
      await renderCanvas(offscreenCanvas, template, "square");
      const filename = `web3chess-${template.id}-square.png`;
      exportCanvasPng(offscreenCanvas, filename);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setTimeout(() => setExportingId(null), 800);
    }
  }

  async function handleCopyCommand(template: CanvasTemplate) {
    try {
      const cmd = getBotCommand(template);
      await navigator.clipboard.writeText(cmd);
      setCopiedId(template.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // Ignore clipboard fail
    }
  }

  function handleOpenStudio(id: string) {
    if (onSelectTemplate) {
      onSelectTemplate(id);
    }
    const studioEl = document.getElementById("studio");
    if (studioEl) {
      studioEl.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <section className="w-full flex flex-col gap-6" aria-labelledby="library-heading">
      {/* ── HEADER & SEARCH / FILTER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <span className="eyebrow text-fg-muted">TEMPLATES DIRECTORY</span>
          <h2 id="library-heading" className="text-section font-bold text-fg">
            Marketing Signal Library
          </h2>
          <p className="text-caption text-fg-muted max-w-[54ch]">
            Browse all 12 certified viral canvas layouts. Formatted for high conversion across Telegram feeds, X cards, and Instagram stories.
          </p>
        </div>

        {/* Search Input */}
        <div className="w-full md:w-72">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates or hooks..."
            className="site-input text-caption"
            aria-label="Search templates"
          />
        </div>
      </div>

      {/* ── CATEGORY PILLS ── */}
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-caption font-semibold rounded-control transition-colors ${
                isSelected
                  ? "bg-inverse text-fg-inverse"
                  : "bg-wash hover:bg-wash/80 text-fg-muted hover:text-fg border border-line"
              }`}
              aria-pressed={isSelected}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* ── TEMPLATES GRID ── */}
      {filteredTemplates.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-line rounded-card flex flex-col items-center gap-3">
          <p className="text-lead font-medium text-fg">No matching templates found</p>
          <p className="text-caption text-fg-muted">
            Try searching for another keyword or reset the category filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("All");
              setSearchQuery("");
            }}
            className="px-4 py-2 bg-mint text-black font-semibold text-caption rounded-control"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const isInk = template.theme === "ink";
            const isCopied = copiedId === template.id;
            const isExporting = exportingId === template.id;

            return (
              <article
                key={template.id}
                className="bg-surface border border-line rounded-card p-5 sm:p-6 flex flex-col justify-between gap-5 transition-colors hover:border-line-strong"
              >
                {/* Top Meta Line */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-overline text-fg-muted font-bold">
                      SIGNAL #{template.number}
                    </span>
                    <span className="tag text-overline py-0.5">
                      {template.category}
                    </span>
                  </div>

                  <h3 className="text-title font-bold text-fg">
                    {template.name}
                  </h3>

                  <p className="text-overline font-mono text-fg-muted">
                    PURPOSE: {template.purpose}
                  </p>
                </div>

                {/* Card Canvas Visual Preview Representation */}
                <div
                  className={`p-5 rounded-media border border-line flex flex-col gap-3 min-h-[160px] justify-between ${
                    isInk ? "bg-inverse text-white" : "bg-wash text-black"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-overline font-semibold px-2 py-0.5 rounded-control ${
                        isInk ? "bg-white/10 text-mint" : "bg-mint text-black"
                      }`}
                    >
                      {template.tag}
                    </span>
                    <Icon name={template.icon} size={18} />
                  </div>

                  {/* Headline Preview */}
                  <div className="font-condensed font-bold text-heading-sm leading-tight uppercase tracking-tight line-clamp-2">
                    {template.headline}
                  </div>

                  {/* CTA strip */}
                  <div
                    className={`py-1.5 px-3 rounded-control text-overline font-semibold flex items-center justify-between ${
                      isInk ? "bg-mint text-black" : "bg-inverse text-white"
                    }`}
                  >
                    <span>{template.cta}</span>
                    <span>web3chess.online ↗</span>
                  </div>
                </div>

                {/* Proof Items List */}
                <ul className="flex flex-col gap-1 text-caption text-fg-muted border-t border-line pt-3">
                  {template.proof.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-mint font-bold">•</span>
                      <span className="truncate">{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-line">
                  <button
                    type="button"
                    onClick={() => handleOpenStudio(template.id)}
                    className="flex-1 py-2.5 px-3 rounded-control bg-inverse text-fg-inverse hover:opacity-90 font-semibold text-caption text-center transition-opacity"
                  >
                    Edit in Studio
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickExport(template)}
                    disabled={isExporting}
                    className="py-2.5 px-3 rounded-control bg-wash hover:bg-wash/80 border border-line text-fg text-caption font-semibold transition-colors"
                    title="Quick download 1:1 PNG"
                  >
                    {isExporting ? "Saving..." : "PNG"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyCommand(template)}
                    className="py-2.5 px-3 rounded-control bg-wash hover:bg-wash/80 border border-line text-fg text-caption font-semibold transition-colors"
                    title="Copy bot command"
                  >
                    {isCopied ? "✓" : "Cmd"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
