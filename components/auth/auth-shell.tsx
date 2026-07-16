import type { ReactNode } from "react";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <main className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/10" />
        <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-sky-400/15 blur-3xl dark:bg-sky-500/10" />
      </div>

      <div className="w-full max-w-lg rounded-2xl border border-zinc-200/80 bg-white/90 p-8 shadow-lg shadow-zinc-900/5 backdrop-blur sm:p-10 dark:border-zinc-800 dark:bg-zinc-900/90 dark:shadow-none">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-base font-bold text-white shadow-md shadow-emerald-600/25">
            R
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-2 text-base leading-relaxed text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </main>
  );
}
