"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Logo } from "./Logo";
import { PlayButton } from "./PlayButton";
import { home } from "@/content/home";
import { Icon } from "@/icons";

export function Nav() {
  const path = usePathname();
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    let frame = 0;
    const heroActions = document.querySelector<HTMLElement>(
      ".hero-actions, .page-hero-details",
    );
    const update = () =>
      setStuck(
        heroActions
          ? heroActions.getBoundingClientRect().bottom <= 0
          : window.scrollY > 480,
      );
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [path]);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    const previousOverflow = document.body.style.overflow;
    if (open) {
      node.showModal();
      document.body.style.overflow = "hidden";
    } else node.close();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (node.open) node.close();
    };
  }, [open]);
  const links = (mobile = false) =>
    home.nav.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        aria-current={path === item.href ? "page" : undefined}
        onClick={() => setOpen(false)}
        className={`${mobile ? "flex min-h-14 items-center rounded-media px-5 text-title" : "inline-flex min-h-11 items-center rounded-pill px-3.5 text-button"} transition-colors ${path === item.href ? "bg-surface font-semibold" : "hover:bg-surface"}`}
      >
        {item.label}
        {mobile && <Icon name="arrow-up-right" size={18} className="ms-auto" />}
      </Link>
    ));
  return (
    <>
      <header className="shell-wide flex h-20 items-center justify-between gap-3 sm:h-24">
        <Link
          href="/"
          aria-label="Web3Chess home"
          className="inline-flex min-h-11 items-center"
        >
          <Logo />
        </Link>
        <nav
          aria-label="Main"
          className="hidden items-center gap-1 rounded-nav border border-line bg-inset p-1 lg:flex"
        >
          {links()}
        </nav>
        <div className="flex items-center gap-3">
          <PlayButton className="hidden! sm:inline-flex!" />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="grid size-11 place-items-center rounded-control bg-surface lg:hidden"
          >
            <Icon name="list" size={20} />
          </button>
        </div>
      </header>
      <div
        inert={!stuck || open}
        aria-hidden={!stuck || open}
        className={`fixed inset-x-0 top-4 z-40 hidden justify-center transition-[opacity,transform] duration-200 lg:flex ${stuck ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"}`}
      >
        <nav
          aria-label="Sticky"
          className="flex items-center gap-1 rounded-nav border border-line bg-canvas p-1.5 ps-5"
        >
          <Link
            href="/"
            aria-label="Web3Chess home"
            className="inline-flex min-h-11 items-center pe-3"
          >
            <Logo />
          </Link>
          {links()}
          <PlayButton size="sm" className="ms-2 rounded-pill!" />
        </nav>
      </div>
      <dialog
        id="mobile-menu"
        ref={dialog}
        aria-label="Navigation menu"
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              "a[href], button:not([disabled])",
            ),
          );
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
        className="fixed inset-0 z-[110] m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-black/60"
      >
        <div
          className="mx-auto max-h-full overflow-y-auto rounded-b-card bg-canvas p-6"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-center justify-between">
            <Logo />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="grid size-11 place-items-center rounded-control bg-surface"
            >
              <Icon name="x" size={20} />
            </button>
          </div>
          <nav aria-label="Mobile" className="my-6 grid gap-2">
            {links(true)}
          </nav>
          <PlayButton size="lg" className="w-full" />
          <p className="mt-4 text-caption text-fg-muted">
            No download · Free A.I. practice
          </p>
        </div>
      </dialog>
    </>
  );
}
