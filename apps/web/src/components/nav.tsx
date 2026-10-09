"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const LINKS = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
  },
  {
    href: "/library",
    label: "Library",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
        <path d="M6 6h10" />
        <path d="M6 10h10" />
      </svg>
    ),
  },
  {
    href: "/personas",
    label: "Personas",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/runs",
    label: "Runs",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="6 3 20 12 6 21 6 3" />
      </svg>
    ),
  },
];

export function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Header with Hamburger */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b border-border bg-cream/95 px-4 py-3 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-purple via-lavender to-cyan flex items-center justify-center shadow-sm">
            <div className="w-3.5 h-3.5 rounded-full bg-text" />
          </div>
          <span className="font-bold text-base tracking-tight text-text">
            Persona<span className="text-purple">Forge</span>
          </span>
        </Link>

        {/* Hamburger Icon Button */}
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle navigation menu"
          className="p-2 rounded-xl border border-border bg-white/80 text-text hover:bg-lavender/20 transition-colors focus:outline-none"
        >
          {mobileOpen ? (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Slide-in Drawer */}
      <div
        className={clsx(
          "md:hidden fixed inset-y-0 left-0 w-72 max-w-[85vw] z-50 bg-cream border-r border-border flex flex-col transition-transform duration-300 ease-in-out shadow-2xl",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-5 border-b border-border/50 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-purple via-lavender to-cyan flex items-center justify-center shadow-sm">
              <div className="w-3.5 h-3.5 rounded-full bg-text" />
            </div>
            <span className="font-bold text-lg tracking-tight text-text">
              Persona<span className="text-purple">Forge</span>
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-lavender/20 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-4 py-5 space-y-2 overflow-y-auto">
          <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted/70">
            Navigation
          </div>
          {LINKS.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all",
                  active
                    ? "bg-purple text-cream shadow-sm font-bold"
                    : "text-muted hover:text-text hover:bg-lavender/20"
                )}
              >
                <span className={clsx(active ? "text-cream" : "text-muted")}>
                  {l.icon}
                </span>
                <span>{l.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="p-3.5 rounded-2xl bg-white/80 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-purple" />
              <span className="text-xs font-bold text-text">1,000 Agents Armed</span>
            </div>
            <p className="text-[11px] text-muted font-mono leading-tight">
              Synthetic Testing Ready
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 z-40 bg-cream/90 backdrop-blur-2xl border-r border-border">
        {/* Brand / Logo */}
        <div className="p-5 border-b border-border/50">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple via-lavender to-cyan flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0">
              <div className="w-3.5 h-3.5 rounded-full bg-text" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-text leading-tight">
                Persona<span className="text-purple">Forge</span>
              </span>
              <span className="text-[10px] font-mono text-purple/80 font-medium">
                Pixel OS Material You
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted/80">
            Navigation
          </div>
          {LINKS.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "group flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all",
                  active
                    ? "bg-purple text-cream shadow-sm font-bold"
                    : "text-muted hover:text-text hover:bg-lavender/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={clsx(
                    "transition-colors",
                    active ? "text-cream" : "text-muted group-hover:text-text"
                  )}>
                    {l.icon}
                  </span>
                  <span>{l.label}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom Status Card */}
        <div className="p-4 border-t border-border/50">
          <div className="p-3.5 rounded-2xl bg-white/70 border border-border shadow-xs">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple"></span>
              </span>
              <span className="text-xs font-bold text-text">Live Synthetic Engine</span>
            </div>
            <p className="text-[11px] text-muted font-mono leading-tight">
              1,000 Agents Armed
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}