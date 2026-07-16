"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import { cn } from "@/lib/cn";
import {
  IconBook,
  IconChart,
  IconCheck,
  IconHome,
  IconMore,
  IconReview,
  IconSettings,
  IconTimer,
} from "@/components/layout/nav-icons";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  match?: (pathname: string) => boolean;
};

const primaryLinks: NavItem[] = [
  {
    href: "/dashboard",
    label: "Home",
    icon: IconHome,
    match: (p) => p === "/dashboard" || p === "/",
  },
  {
    href: "/subjects",
    label: "Subjects",
    icon: IconBook,
    match: (p) => p.startsWith("/subjects") || p.startsWith("/topics"),
  },
  {
    href: "/timer",
    label: "Timer",
    icon: IconTimer,
    match: (p) => p.startsWith("/timer"),
  },
  {
    href: "/todos",
    label: "Todos",
    icon: IconCheck,
    match: (p) => p.startsWith("/todos"),
  },
];

const moreLinks: NavItem[] = [
  {
    href: "/reviews",
    label: "Reviews",
    icon: IconReview,
    match: (p) => p.startsWith("/reviews") || p.startsWith("/errors"),
  },
  {
    href: "/scores",
    label: "Scores",
    icon: IconChart,
    match: (p) => p.startsWith("/scores"),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: IconSettings,
    match: (p) => p.startsWith("/settings"),
  },
];

const desktopLinks: NavItem[] = [
  ...primaryLinks,
  moreLinks[0],
  moreLinks[1],
];

function isActive(item: NavItem, pathname: string) {
  return item.match
    ? item.match(pathname)
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function moreIsActive(pathname: string) {
  return moreLinks.some((item) => isActive(item, pathname));
}

export function AppNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  // Reset sheet when the route changes (React-recommended “adjust state while rendering”).
  const [menuPath, setMenuPath] = useState(pathname);
  if (pathname !== menuPath) {
    setMenuPath(pathname);
    if (moreOpen) setMoreOpen(false);
  }

  useEffect(() => {
    if (!moreOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  return (
    <>
      {/* Desktop top bar */}
      <header className="sticky top-0 z-40 hidden border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80 md:block">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 md:px-6">
          <Link
            href="/dashboard"
            className="group flex items-center gap-2.5 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-sm shadow-emerald-600/20 transition group-hover:bg-emerald-500">
              R
            </span>
            RevieWhen
          </Link>

          <nav aria-label="Main">
            <ul className="flex items-center gap-1">
              {desktopLinks.map((link) => {
                const active = isActive(link, pathname);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "rounded-xl px-3.5 py-2 text-base font-medium transition-colors",
                        active
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link
                  href="/settings"
                  className={cn(
                    "ml-1 flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                    isActive(moreLinks[2], pathname)
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
                  )}
                  aria-label="Settings"
                  title="Settings"
                >
                  <IconSettings className="h-5 w-5" />
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Mobile top brand strip */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80 md:hidden">
        <div className="flex h-14 items-center justify-between px-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 text-base font-semibold tracking-tight"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
              R
            </span>
            RevieWhen
          </Link>
          <Link
            href="/settings"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
            aria-label="Settings"
          >
            <IconSettings className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {/* Mobile more sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal>
          <button
            type="button"
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-zinc-200 bg-white p-5 pb-[calc(1.25rem+var(--safe-bottom))] shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              More
            </p>
            <ul className="space-y-1">
              {moreLinks.map((link) => {
                const active = isActive(link, pathname);
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3.5 py-3.5 text-base font-medium transition",
                        active
                          ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                          : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800",
                      )}
                    >
                      <Icon className="h-6 w-6" />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90 md:hidden"
        style={{ paddingBottom: "var(--safe-bottom)" }}
      >
        <ul className="grid h-[4.5rem] grid-cols-5">
          {primaryLinks.map((link) => {
            const active = isActive(link, pathname);
            const Icon = link.icon;
            const isTimer = link.href === "/timer";
            return (
              <li key={link.href} className="flex">
                <Link
                  href={link.href}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition",
                    isTimer
                      ? active
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-zinc-500"
                      : active
                        ? "text-zinc-900 dark:text-zinc-50"
                        : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200",
                  )}
                >
                  {isTimer ? (
                    <span
                      className={cn(
                        "-mt-4 mb-0.5 flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition",
                        active
                          ? "bg-emerald-600 text-white shadow-emerald-600/30"
                          : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900",
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                  ) : (
                    <Icon
                      className={cn(
                        "h-6 w-6",
                        active && "scale-105",
                      )}
                    />
                  )}
                  {link.label}
                </Link>
              </li>
            );
          })}
          <li className="flex">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition",
                moreOpen || moreIsActive(pathname)
                  ? "text-zinc-900 dark:text-zinc-50"
                  : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200",
              )}
              aria-expanded={moreOpen}
              aria-haspopup="dialog"
            >
              <IconMore className="h-6 w-6" />
              More
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
