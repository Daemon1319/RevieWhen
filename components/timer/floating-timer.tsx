"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  TIMER_STORAGE_KEY,
  computeElapsed,
  formatClock,
  type PersistedTimer,
} from "@/lib/timer-storage";

const EDGE_MARGIN = 12;
const MOBILE_BOTTOM_NAV_HEIGHT = 72;
const POSITION_KEY = "reviewhen-floating-timer-pos";
const WIDGET_HEIGHT = 48; // approximate
const WIDGET_WIDTH_EXPANDED = 200;
const WIDGET_WIDTH_MINI = 80;

type Position = { x: number; y: number };

function isMobile() {
  return window.innerWidth < 768;
}

function getBottomGuard() {
  return isMobile() ? MOBILE_BOTTOM_NAV_HEIGHT + EDGE_MARGIN : EDGE_MARGIN;
}

/** Clamp position so the widget is always fully visible */
function clampPosition(x: number, y: number): Position {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const bottomGuard = getBottomGuard();

  return {
    x: Math.max(EDGE_MARGIN, Math.min(x, vw - WIDGET_WIDTH_MINI - EDGE_MARGIN)),
    y: Math.max(EDGE_MARGIN, Math.min(y, vh - WIDGET_HEIGHT - bottomGuard)),
  };
}

function snapToEdge(x: number, y: number): Position {
  const vw = window.innerWidth;
  const clamped = clampPosition(x, y);

  // Snap to nearest horizontal edge
  const midpoint = (vw - WIDGET_WIDTH_EXPANDED) / 2;
  const snapX = clamped.x < midpoint
    ? EDGE_MARGIN
    : vw - WIDGET_WIDTH_EXPANDED - EDGE_MARGIN;

  return clampPosition(snapX, clamped.y);
}

function getDefaultPosition(): Position {
  const mobile = isMobile();
  return snapToEdge(
    window.innerWidth, // will snap to right edge
    mobile
      ? window.innerHeight - MOBILE_BOTTOM_NAV_HEIGHT - WIDGET_HEIGHT - EDGE_MARGIN * 2
      : EDGE_MARGIN,
  );
}

function loadPosition(): Position | null {
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Position;
    if (typeof parsed.x !== "number" || typeof parsed.y !== "number") return null;
    // Always clamp to current viewport in case screen size changed
    return clampPosition(parsed.x, parsed.y);
  } catch {
    return null;
  }
}

function savePosition(pos: Position) {
  try {
    localStorage.setItem(POSITION_KEY, JSON.stringify(pos));
  } catch {
    // ignore
  }
}

export function FloatingTimer() {
  const pathname = usePathname();
  const [timer, setTimer] = useState<PersistedTimer | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [pos, setPos] = useState<Position>({ x: -1, y: -1 });
  const [dragging, setDragging] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef<Position>({ x: 0, y: 0 });

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

  // Initialize position
  useEffect(() => {
    const saved = loadPosition();
    if (saved) {
      setPos(saved);
    } else {
      setPos(getDefaultPosition());
    }
  }, []);

  // Re-clamp on window resize
  useEffect(() => {
    function onResize() {
      setPos((prev) => {
        if (prev.x < 0) return prev;
        const clamped = snapToEdge(prev.x, prev.y);
        savePosition(clamped);
        return clamped;
      });
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Drag handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!widgetRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = widgetRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setDragging(true);
    widgetRef.current.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      e.preventDefault();
      setPos(clampPosition(
        e.clientX - dragOffset.current.x,
        e.clientY - dragOffset.current.y,
      ));
    },
    [dragging],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !widgetRef.current) return;
      setDragging(false);
      widgetRef.current.releasePointerCapture(e.pointerId);
      const snapped = snapToEdge(
        e.clientX - dragOffset.current.x,
        e.clientY - dragOffset.current.y,
      );
      setPos(snapped);
      savePosition(snapped);
    },
    [dragging],
  );

  // Don't show on the timer page or when no timer is active
  const isTimerPage = pathname === "/timer";
  const isActive = timer && (timer.state === "running" || timer.state === "paused");

  if (isTimerPage || !isActive || pos.x < 0) return null;

  const isPaused = timer.state === "paused";

  return (
    <div
      ref={widgetRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="fixed z-[9999] select-none touch-none"
      style={{
        left: pos.x,
        top: pos.y,
        transition: dragging ? "none" : "left 0.3s cubic-bezier(.4,0,.2,1), top 0.3s cubic-bezier(.4,0,.2,1)",
      }}
    >
      <div
        className={`
          flex items-center rounded-2xl border border-zinc-200/80 bg-white/90 shadow-lg backdrop-blur-xl
          dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:shadow-zinc-950/50
          ${dragging ? "scale-105 shadow-2xl" : ""}
          transition-shadow transition-transform duration-200
          gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3
        `}
      >
        {/* Pulsing indicator */}
        <div className="relative flex items-center justify-center">
          <span
            className={`h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5 ${
              isPaused ? "bg-amber-500" : "bg-emerald-500"
            }`}
          />
          {!isPaused && (
            <span className="absolute h-2 w-2 animate-ping rounded-full bg-emerald-500/60 sm:h-2.5 sm:w-2.5" />
          )}
        </div>

        {/* Timer display */}
        {!minimized && (
          <Link
            href="/timer"
            onClick={(e) => e.stopPropagation()}
            className="font-mono text-base font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-lg"
          >
            {formatClock(elapsed)}
          </Link>
        )}

        {/* Status badge — hidden on mobile to save space */}
        {!minimized && (
          <span
            className={`hidden rounded-full px-2 py-0.5 text-xs font-semibold sm:inline-flex ${
              isPaused
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
            }`}
          >
            {isPaused ? "Paused" : "Running"}
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMinimized((m) => !m);
            }}
            className="rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            title={minimized ? "Expand" : "Minimize"}
          >
            {minimized ? (
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 6l4 4 4-4" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 8h8" />
              </svg>
            )}
          </button>
          <Link
            href="/timer"
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg p-1 text-zinc-400 transition hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400"
            title="Go to timer"
          >
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3l5 5-5 5" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
