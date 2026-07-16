export const TIMER_STORAGE_KEY = "reviewhen-timer-v1";
export const MIN_SESSION_SEC = 30;
export const POMODORO_WORK_SEC = 25 * 60;
export const POMODORO_BREAK_SEC = 5 * 60;

export type TimerMode = "stopwatch" | "pomodoro";
export type TimerPhase = "work" | "break";
export type TimerRunState = "idle" | "running" | "paused";

export type PersistedTimer = {
  state: TimerRunState;
  mode: TimerMode;
  phase: TimerPhase;
  /** Seconds accumulated while paused / before current run segment */
  accumulatedSec: number;
  /** ISO timestamp when current running segment started; null if paused/idle */
  segmentStartedAt: string | null;
  subjectId: string;
  topicId: string;
  /** Absolute session wall-clock start (for DB) */
  sessionStartedAt: string | null;
};

export function loadPersistedTimer(): PersistedTimer | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedTimer;
  } catch {
    return null;
  }
}

export function savePersistedTimer(data: PersistedTimer | null) {
  if (typeof window === "undefined") return;
  try {
    if (!data || data.state === "idle") {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    } else {
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(data));
    }
  } catch {
    // ignore
  }
}

export function computeElapsed(p: Pick<PersistedTimer, "accumulatedSec" | "segmentStartedAt" | "state">): number {
  let total = p.accumulatedSec;
  if (p.state === "running" && p.segmentStartedAt) {
    total += Math.floor(
      (Date.now() - new Date(p.segmentStartedAt).getTime()) / 1000,
    );
  }
  return Math.max(0, total);
}

export function formatClock(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
