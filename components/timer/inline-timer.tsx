"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  TIMER_STORAGE_KEY,
  computeElapsed,
  formatClock,
  type PersistedTimer,
} from "@/lib/timer-storage";
import { cn } from "@/lib/cn";

export function InlineTimer() {
  const pathname = usePathname();
  const [timer, setTimer] = useState<PersistedTimer | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Poll localStorage for timer state
  useEffect(() => {
    function check() {
      try {
        const raw = localStorage.getItem(TIMER_STORAGE_KEY);
        if (!raw) {
          setTimer(null);
          return;
        }
        const parsed = JSON.parse(raw) as PersistedTimer;
        if (parsed.state === "idle") {
          setTimer(null);
        } else {
          setTimer(parsed);
          setElapsed(computeElapsed(parsed));
        }
      } catch {
        setTimer(null);
      }
    }

    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, []);

  // Tick elapsed every second when running
  useEffect(() => {
    if (!timer || timer.state !== "running") return;
    const tick = setInterval(() => {
      setElapsed(computeElapsed(timer));
    }, 1000);
    return () => clearInterval(tick);
  }, [timer]);

  const isTimerPage = pathname === "/timer";
  const isActive = timer && (timer.state === "running" || timer.state === "paused");

  if (isTimerPage || !isActive) return null;

  const isPaused = timer.state === "paused";

  return (
    <Link
      href="/timer"
      className={cn(
        "flex items-center gap-2 rounded-full border px-2.5 py-1 text-sm font-medium transition",
        isPaused
          ? "border-amber-200/50 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-900/40"
          : "border-emerald-200/50 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
      )}
      title={isPaused ? "Timer is paused" : "Timer is running"}
    >
      <div className="relative flex h-2 w-2 items-center justify-center">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            isPaused ? "bg-amber-500" : "bg-emerald-500"
          )}
        />
        {!isPaused && (
          <span className="absolute h-2 w-2 animate-ping rounded-full bg-emerald-500/60" />
        )}
      </div>
      <span className="font-mono tracking-tight">{formatClock(elapsed)}</span>
    </Link>
  );
}
