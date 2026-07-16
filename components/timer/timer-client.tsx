"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDuration } from "@/lib/progress";
import {
  MIN_SESSION_SEC,
  POMODORO_BREAK_SEC,
  POMODORO_WORK_SEC,
  computeElapsed,
  formatClock,
  loadPersistedTimer,
  savePersistedTimer,
  type PersistedTimer,
  type TimerMode,
  type TimerPhase,
  type TimerRunState,
} from "@/lib/timer-storage";
import type { StudySession, Subject, Topic } from "@/lib/types";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/cn";
import { ui } from "@/lib/ui";

type WeekSubjectRow = {
  subjectId: string | null;
  name: string;
  seconds: number;
};

export function TimerClient({
  subjects,
  topics,
  recentSessions,
  weekSeconds,
  todaySeconds,
  weekBySubject,
  userId,
  initialSubjectId = "",
  initialTopicId = "",
  autoStart = false,
}: {
  subjects: Pick<Subject, "id" | "name">[];
  topics: Pick<Topic, "id" | "name" | "subject_id">[];
  recentSessions: StudySession[];
  weekSeconds: number;
  todaySeconds: number;
  weekBySubject: WeekSubjectRow[];
  userId: string;
  initialSubjectId?: string;
  initialTopicId?: string;
  autoStart?: boolean;
}) {
  const router = useRouter();
  const { confirm, dialog } = useConfirmDialog();
  const [state, setState] = useState<TimerRunState>("idle");
  const [mode, setMode] = useState<TimerMode>("stopwatch");
  const [phase, setPhase] = useState<TimerPhase>("work");
  const [elapsed, setElapsed] = useState(0);
  const [subjectId, setSubjectId] = useState(initialSubjectId);
  const [topicId, setTopicId] = useState(initialTopicId);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);

  const accumulatedRef = useRef(0);
  const segmentStartedAtRef = useRef<string | null>(null);
  const sessionStartedAtRef = useRef<string | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(state);
  const modeRef = useRef(mode);
  const phaseRef = useRef(phase);
  const subjectIdRef = useRef(subjectId);
  const topicIdRef = useRef(topicId);
  const autoStartDone = useRef(false);
  const pomodoroHandling = useRef(false);
  const startTickRef = useRef<() => void>(() => {});

  // Keep refs in sync for interval callbacks (must not read these during render).
  useEffect(() => {
    stateRef.current = state;
    modeRef.current = mode;
    phaseRef.current = phase;
    subjectIdRef.current = subjectId;
    topicIdRef.current = topicId;
  }, [state, mode, phase, subjectId, topicId]);

  const subjectNameById = useMemo(
    () => Object.fromEntries(subjects.map((s) => [s.id, s.name])),
    [subjects],
  );
  const topicNameById = useMemo(
    () => Object.fromEntries(topics.map((t) => [t.id, t.name])),
    [topics],
  );

  // Topics only make sense under a subject — don't list everything when subject is empty.
  const filteredTopics = subjectId
    ? topics.filter((t) => t.subject_id === subjectId)
    : [];

  const quickSubjects = useMemo(() => {
    const seen = new Set<string>();
    const ordered: { id: string; name: string }[] = [];
    for (const s of recentSessions) {
      if (!s.subject_id || seen.has(s.subject_id)) continue;
      seen.add(s.subject_id);
      ordered.push({
        id: s.subject_id,
        name: subjectNameById[s.subject_id] ?? "Subject",
      });
      if (ordered.length >= 3) break;
    }
    return ordered;
  }, [recentSessions, subjectNameById]);

  const pomodoroTarget =
    phase === "work" ? POMODORO_WORK_SEC : POMODORO_BREAK_SEC;
  const displaySeconds =
    mode === "pomodoro" ? Math.max(0, pomodoroTarget - elapsed) : elapsed;

  function clearTick() {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  function playChime() {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.08;
      osc.start();
      setTimeout(() => {
        osc.stop();
        void ctx.close();
      }, 400);
    } catch {
      // ignore
    }
  }

  const writePersist = useCallback(
    (next: {
      state: TimerRunState;
      mode: TimerMode;
      phase: TimerPhase;
      subjectId: string;
      topicId: string;
    }) => {
      const payload: PersistedTimer = {
        state: next.state,
        mode: next.mode,
        phase: next.phase,
        accumulatedSec: accumulatedRef.current,
        segmentStartedAt: segmentStartedAtRef.current,
        subjectId: next.subjectId,
        topicId: next.topicId,
        sessionStartedAt: sessionStartedAtRef.current,
      };
      savePersistedTimer(payload);
    },
    [],
  );

  const getLiveElapsed = useCallback(() => {
    return computeElapsed({
      accumulatedSec: accumulatedRef.current,
      segmentStartedAt: segmentStartedAtRef.current,
      state: stateRef.current,
    });
  }, []);

  const resetLocal = useCallback(() => {
    clearTick();
    pomodoroHandling.current = false;
    accumulatedRef.current = 0;
    segmentStartedAtRef.current = null;
    sessionStartedAtRef.current = null;
    setElapsed(0);
    setState("idle");
    setPhase("work");
    savePersistedTimer(null);
    document.title = "RevieWhen";
  }, []);

  const insertSession = useCallback(
    async (total: number, sid: string, tid: string) => {
      if (total < MIN_SESSION_SEC) return { ok: true as const, skipped: true };
      const endedAt = new Date();
      const started =
        sessionStartedAtRef.current ??
        new Date(endedAt.getTime() - total * 1000).toISOString();
      const supabase = createClient();
      const { error: insertError } = await supabase
        .from("study_sessions")
        .insert({
          user_id: userId,
          subject_id: sid || null,
          topic_id: tid || null,
          started_at: started,
          ended_at: endedAt.toISOString(),
          duration_sec: total,
        });
      if (insertError) return { ok: false as const, error: insertError.message };
      return { ok: true as const, skipped: false };
    },
    [userId],
  );

  const startTick = useCallback(() => {
    clearTick();
    tickRef.current = setInterval(() => {
      const live = computeElapsed({
        accumulatedSec: accumulatedRef.current,
        segmentStartedAt: segmentStartedAtRef.current,
        state: "running",
      });
      setElapsed(live);

      if (modeRef.current !== "pomodoro" || pomodoroHandling.current) return;

      const target =
        phaseRef.current === "work" ? POMODORO_WORK_SEC : POMODORO_BREAK_SEC;

      if (live < target) return;

      pomodoroHandling.current = true;
      clearTick();
      playChime();
      accumulatedRef.current = target;
      segmentStartedAtRef.current = null;
      setElapsed(target);

      const sid = subjectIdRef.current;
      const tid = topicIdRef.current;

      if (phaseRef.current === "work") {
        void (async () => {
          const result = await insertSession(POMODORO_WORK_SEC, sid, tid);
          if (!result.ok) {
            setError(result.error);
            setState("paused");
            pomodoroHandling.current = false;
            return;
          }
          if (!result.skipped) router.refresh();

          const now = new Date().toISOString();
          accumulatedRef.current = 0;
          segmentStartedAtRef.current = now;
          sessionStartedAtRef.current = now;
          setPhase("break");
          setState("running");
          setElapsed(0);
          setInfo("Work block saved. Break started (5 min).");
          writePersist({
            state: "running",
            mode: "pomodoro",
            phase: "break",
            subjectId: sid,
            topicId: tid,
          });
          pomodoroHandling.current = false;
          startTickRef.current();
        })();
      } else {
        setState("paused");
        setPhase("work");
        accumulatedRef.current = 0;
        setElapsed(0);
        setInfo("Break done. Start work when ready.");
        writePersist({
          state: "paused",
          mode: "pomodoro",
          phase: "work",
          subjectId: sid,
          topicId: tid,
        });
        pomodoroHandling.current = false;
      }
    }, 250);
  }, [insertSession, router, writePersist]);

  useEffect(() => {
    startTickRef.current = startTick;
  }, [startTick]);

  const onStartWith = useCallback(
    (sid: string, tid: string, m: TimerMode) => {
      setError("");
      setInfo("");
      setSubjectId(sid);
      setTopicId(tid);
      const now = new Date().toISOString();
      accumulatedRef.current = 0;
      segmentStartedAtRef.current = now;
      sessionStartedAtRef.current = now;
      setElapsed(0);
      setPhase("work");
      setMode(m);
      setState("running");
      writePersist({
        state: "running",
        mode: m,
        phase: "work",
        subjectId: sid,
        topicId: tid,
      });
      startTick();
    },
    [startTick, writePersist],
  );

  // Hydrate from localStorage / deep-link once on the client (external system).
  useEffect(() => {
    let cancelled = false;

    // Defer so this is clearly an async external sync, not a cascading render.
    const id = window.setTimeout(() => {
      if (cancelled) return;
      const saved = loadPersistedTimer();
      if (saved && saved.state !== "idle") {
        accumulatedRef.current = saved.accumulatedSec;
        segmentStartedAtRef.current = saved.segmentStartedAt;
        sessionStartedAtRef.current = saved.sessionStartedAt;
        setMode(saved.mode);
        setPhase(saved.phase);
        setSubjectId(saved.subjectId);
        setTopicId(saved.topicId);
        setState(saved.state);
        setElapsed(computeElapsed(saved));
        if (saved.state === "running") startTickRef.current();
        setInfo("Restored your previous session.");
      } else {
        if (initialSubjectId) setSubjectId(initialSubjectId);
        if (initialTopicId) setTopicId(initialTopicId);
        if (autoStart && !autoStartDone.current) {
          autoStartDone.current = true;
          onStartWith(initialSubjectId, initialTopicId, "stopwatch");
        }
      }
      setHydrated(true);
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
      clearTick();
    };
    // Intentionally once on mount for persistence restore.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (state === "idle") {
      document.title = "RevieWhen";
      return;
    }
    const label =
      mode === "pomodoro"
        ? formatClock(Math.max(0, pomodoroTarget - elapsed))
        : formatClock(elapsed);
    document.title = `${label} · Studying · RevieWhen`;
  }, [elapsed, state, mode, pomodoroTarget, hydrated]);

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (stateRef.current !== "idle") {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (state === "idle") {
      savePersistedTimer(null);
      return;
    }
    writePersist({ state, mode, phase, subjectId, topicId });
  }, [state, mode, phase, subjectId, topicId, hydrated, writePersist]);

  function onStart() {
    onStartWith(subjectId, topicId, mode);
  }

  function onPause() {
    if (state !== "running") return;
    accumulatedRef.current = getLiveElapsed();
    segmentStartedAtRef.current = null;
    setElapsed(accumulatedRef.current);
    setState("paused");
    clearTick();
  }

  function onResume() {
    segmentStartedAtRef.current = new Date().toISOString();
    setState("running");
    startTick();
  }

  async function onSave() {
    clearTick();
    const total = getLiveElapsed();
    const sid = subjectId;
    const tid = topicId;

    if (mode === "pomodoro" && phase === "break") {
      setInfo("Break discarded (not counted as study).");
      resetLocal();
      return;
    }

    if (total < MIN_SESSION_SEC) {
      setInfo(
        `Session under ${MIN_SESSION_SEC}s — not saved. Start again when ready.`,
      );
      resetLocal();
      return;
    }

    setSaving(true);
    const result = await insertSession(total, sid, tid);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setInfo("Session saved.");
    resetLocal();
    router.refresh();
  }

  async function onDiscard() {
    if (getLiveElapsed() > 0) {
      const ok = await confirm({
        title: "Discard session?",
        description: "Time will not be saved.",
        confirmLabel: "Discard",
      });
      if (!ok) return;
    }
    setInfo("Session discarded.");
    resetLocal();
  }

  async function onDeleteSession(id: string) {
    const ok = await confirm({
      title: "Delete session?",
      description: "This study session will be removed from your history.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    const supabase = createClient();
    await supabase.from("study_sessions").delete().eq("id", id);
    router.refresh();
  }

  function sessionLabel(s: StudySession) {
    const parts: string[] = [];
    if (s.subject_id) {
      parts.push(subjectNameById[s.subject_id] ?? "Subject");
    }
    if (s.topic_id) {
      parts.push(topicNameById[s.topic_id] ?? "Topic");
    }
    return parts.length > 0 ? parts.join(" · ") : "Any subject";
  }

  const maxWeekBar = Math.max(...weekBySubject.map((w) => w.seconds), 1);

  return (
    <div className="space-y-8">
      {dialog}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={cn(ui.card, ui.cardPad)}>
          <p className={ui.sectionLabel}>Today</p>
          <p
            className={cn(
              ui.statValue,
              "text-emerald-600 dark:text-emerald-400",
            )}
          >
            {formatDuration(todaySeconds)}
          </p>
        </div>
        <div className={cn(ui.card, ui.cardPad)}>
          <p className={ui.sectionLabel}>This week</p>
          <p
            className={cn(
              ui.statValue,
              "text-emerald-600 dark:text-emerald-400",
            )}
          >
            {formatDuration(weekSeconds)}
          </p>
        </div>
      </div>

      {weekBySubject.length > 0 && (
        <section className={cn(ui.card, ui.cardPad)}>
          <h2 className={cn(ui.sectionLabel, "mb-3")}>This week by subject</h2>
          <ul className="space-y-2.5">
            {weekBySubject.map((row) => (
              <li key={row.subjectId ?? "none"} className="text-sm">
                <div className="mb-1 flex justify-between gap-2">
                  <span className="truncate font-medium">{row.name}</span>
                  <span className="tabular-nums text-zinc-500">
                    {formatDuration(row.seconds)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{
                      width: `${Math.round((row.seconds / maxWeekBar) * 100)}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div
        className={cn(
          ui.card,
          "px-6 py-10 text-center sm:px-8",
          state === "running" &&
            "ring-2 ring-emerald-500/20 dark:ring-emerald-400/20",
        )}
      >
        <div className="mb-5 flex justify-center gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800/80 mx-auto max-w-xs">
          <button
            type="button"
            disabled={state !== "idle"}
            onClick={() => setMode("stopwatch")}
            className={cn(
              "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50",
              mode === "stopwatch"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200",
            )}
          >
            Stopwatch
          </button>
          <button
            type="button"
            disabled={state !== "idle"}
            onClick={() => setMode("pomodoro")}
            className={cn(
              "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50",
              mode === "pomodoro"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200",
            )}
          >
            Pomodoro 25/5
          </button>
        </div>

        {mode === "pomodoro" && (
          <p className={ui.sectionLabel}>
            {phase === "work" ? "Focus" : "Break"} ·{" "}
            {phase === "work" ? "25 min" : "5 min"}
          </p>
        )}

        <p className="mt-4 font-mono text-6xl tabular-nums tracking-tight sm:text-7xl">
          {formatClock(displaySeconds)}
        </p>
        {state === "paused" && (
          <p className="mt-2 text-sm font-medium text-amber-600 dark:text-amber-400">
            Paused
          </p>
        )}
        {state === "running" && (
          <p className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Running
          </p>
        )}

        {state === "idle" && quickSubjects.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {quickSubjects.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onStartWith(s.id, "", mode)}
                className={ui.chip}
              >
                Start · {s.name}
              </button>
            ))}
          </div>
        )}

        <div className="mx-auto mt-6 grid max-w-md gap-3 sm:grid-cols-2">
          <select
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              setTopicId("");
            }}
            disabled={state !== "idle"}
            className={ui.select}
          >
            <option value="">Any subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            disabled={state !== "idle" || !subjectId}
            className={ui.select}
          >
            <option value="">
              {subjectId ? "Any topic" : "Select a subject first"}
            </option>
            {filteredTopics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {state === "idle" && (
            <button
              type="button"
              onClick={onStart}
              className={cn(ui.btnAccent, "min-w-[7rem] px-6")}
            >
              Start
            </button>
          )}
          {state === "running" && (
            <>
              <button
                type="button"
                onClick={onPause}
                className={cn(ui.btnWarn, "min-w-[7rem] px-6")}
              >
                Pause
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className={cn(ui.btnPrimary, "min-w-[7rem] px-6")}
              >
                {saving ? "Saving…" : "Stop & save"}
              </button>
              <button
                type="button"
                onClick={onDiscard}
                className={ui.btnSecondary}
              >
                Discard
              </button>
            </>
          )}
          {state === "paused" && (
            <>
              <button
                type="button"
                onClick={onResume}
                className={cn(ui.btnAccent, "min-w-[7rem] px-6")}
              >
                Resume
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className={cn(ui.btnPrimary, "min-w-[7rem] px-6")}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={onDiscard}
                className={ui.btnSecondary}
              >
                Discard
              </button>
            </>
          )}
        </div>
        {error && <p className={cn("mt-4", ui.errorText)}>{error}</p>}
        {info && !error && <p className={cn("mt-4", ui.mutedText)}>{info}</p>}
      </div>

      <section>
        <h2 className={cn(ui.sectionLabel, "mb-3")}>Recent sessions</h2>
        <ul className={ui.list}>
          {recentSessions.map((s) => (
            <li
              key={s.id}
              className={cn(
                ui.listItem,
                "flex items-center justify-between gap-3 text-sm",
              )}
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{sessionLabel(s)}</p>
                <p className={ui.metaText}>
                  {new Date(s.started_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="tabular-nums text-zinc-500">
                  {formatDuration(s.duration_sec)}
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteSession(s.id)}
                  className={ui.deleteLink}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
          {recentSessions.length === 0 && (
            <li className={cn(ui.listItem, ui.mutedText)}>
              No sessions yet. Start the timer when you study.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
