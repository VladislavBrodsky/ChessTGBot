"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { PlayButton } from "./PlayButton";
import { home } from "@/content/home";
import { Icon } from "@/icons";

export function Nav() {
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="shell-wide flex h-20 items-center justify-between gap-4 sm:h-24">
        <Link href="/" aria-label="Web3Chess home">
          <Logo />
        </Link>

        {/* Nav pill: 48px radius, Mist ground, hairline only */}
        <nav
          aria-label="Main"
          className="hidden items-center gap-1 rounded-nav border border-line bg-inset p-1.5 lg:flex"
        >
          {home.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-pill px-4 py-2 text-button text-fg transition-colors duration-150 hover:bg-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <PlayButton size="md" label="Play in Telegram" className="hidden sm:inline-flex" />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="grid size-11 place-items-center rounded-control bg-surface text-fg lg:hidden"
          >
            <Icon name="list" size={20} />
          </button>
        </div>
      </header>

      {/* Sticky condensed pill (appears after 480px) */}
      <div
        className={`fixed inset-x-0 top-4 z-40 hidden justify-center transition-[opacity,transform] duration-200 lg:flex ${
          stuck ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
        }`}
      >
        <nav
          aria-label="Sticky"
          className="flex items-center gap-1 rounded-nav border border-line bg-canvas p-1.5 ps-5"
        >
          <Link href="/" aria-label="Web3Chess home" className="pe-3">
            <Logo />
          </Link>
          {home.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              tabIndex={stuck ? 0 : -1}
              className="rounded-pill px-3.5 py-2 text-body-sm font-semibold text-fg transition-colors duration-150 hover:bg-white"
            >
              {item.label}
            </Link>
          ))}
          <PlayButton size="sm" className="ms-2 rounded-pill!" />
        </nav>
      </div>

      {/* Mobile sheet */}
      {open && (
        <div className="fixed inset-0 z-[110] lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-x-0 top-0 rounded-b-card border-b border-line bg-canvas p-6"
          >
            <div className="flex items-center justify-between">
              <Logo />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid size-11 place-items-center rounded-control bg-surface text-fg"
              >
                <Icon name="x" size={20} />
              </button>
            </div>
            <ul className="mt-8 grid gap-2">
              {home.nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="poster flex min-h-14 items-center rounded-media bg-surface px-5 text-heading-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <PlayButton size="lg" className="mt-6 w-full" />
          </div>
        </div>
      )}
    </>
  );
}
