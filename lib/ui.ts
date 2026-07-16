/**
 * Shared visual primitives for polished-minimal UI.
 * Prefer these over one-off zinc/border combos so the app stays consistent.
 */

export const ui = {
  page: "space-y-9",
  pageHeader: "space-y-1.5",
  pageTitle:
    "text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50",
  pageDesc: "text-base leading-relaxed text-zinc-500 dark:text-zinc-400",

  sectionLabel:
    "text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500",

  card: "rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none",
  cardPad: "p-5 sm:p-6",
  cardInteractive:
    "rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:shadow-none",

  list: "divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none",
  listItem: "px-5 py-4",

  label: "mb-1.5 block text-sm font-medium text-zinc-500 dark:text-zinc-400",
  input:
    "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-base text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-emerald-500",
  select:
    "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-base text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-emerald-500",
  textarea:
    "w-full resize-y rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-base text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-emerald-500",

  btnPrimary:
    "inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-5 py-3 text-base font-medium text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:pointer-events-none disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white",
  btnAccent:
    "inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-3 text-base font-medium text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:pointer-events-none disabled:opacity-50",
  btnSecondary:
    "inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-5 py-3 text-base font-medium text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
  btnGhost:
    "inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5 text-base font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 disabled:pointer-events-none disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
  btnDanger:
    "inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5 text-base font-medium text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 disabled:pointer-events-none disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40",
  btnWarn:
    "inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-5 py-3 text-base font-medium text-white transition hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 disabled:pointer-events-none disabled:opacity-50",
  btnSm:
    "inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
  btnSmAccent:
    "inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 disabled:pointer-events-none disabled:opacity-50 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60",
  btnSmGhost:
    "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 disabled:pointer-events-none disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
  btnSmDanger:
    "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-red-950/40 dark:hover:text-red-400",

  link: "text-base font-medium text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300",
  linkMuted:
    "text-sm font-medium text-zinc-400 transition hover:text-zinc-700 dark:hover:text-zinc-200",
  deleteLink:
    "text-sm font-medium text-zinc-400 transition hover:text-red-600 dark:hover:text-red-400",

  chip: "inline-flex items-center rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800",
  chipActive:
    "inline-flex items-center rounded-full bg-zinc-900 px-3.5 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900",
  chipSoft:
    "inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-sm font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",

  empty:
    "rounded-2xl border border-dashed border-zinc-200 px-5 py-12 text-center text-base text-zinc-500 dark:border-zinc-800 dark:text-zinc-400",

  errorText: "text-base text-red-600 dark:text-red-400",
  successText: "text-base text-emerald-700 dark:text-emerald-400",
  mutedText: "text-base text-zinc-500 dark:text-zinc-400",
  metaText: "text-sm text-zinc-400 dark:text-zinc-500",

  statValue: "mt-2 text-3xl font-semibold tabular-nums tracking-tight",
  checkbox:
    "h-5 w-5 shrink-0 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500/30 dark:border-zinc-600",
} as const;
