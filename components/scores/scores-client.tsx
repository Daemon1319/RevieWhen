"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/cn";
import { ui } from "@/lib/ui";
import type { ScoreLogWithSubjects, Subject } from "@/lib/types";

function percent(score: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((score / total) * 1000) / 10;
}

function formatShortDate(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ScoresClient({
  initialScores,
  subjects,
  userId,
}: {
  initialScores: ScoreLogWithSubjects[];
  subjects: Pick<Subject, "id" | "name" | "color">[];
  userId: string;
}) {
  const router = useRouter();
  const { confirm, dialog } = useConfirmDialog();
  const [quizName, setQuizName] = useState("");
  const [score, setScore] = useState("");
  const [totalItems, setTotalItems] = useState("");
  const [notes, setNotes] = useState("");
  const [takenAt, setTakenAt] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [filterSubject, setFilterSubject] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const subjectNameById = useMemo(
    () => Object.fromEntries(subjects.map((s) => [s.id, s.name])),
    [subjects],
  );
  const subjectColorById = useMemo(
    () => Object.fromEntries(subjects.map((s) => [s.id, s.color])),
    [subjects],
  );

  const visible = filterSubject
    ? initialScores.filter((s) => s.subject_ids.includes(filterSubject))
    : initialScores;

  const avgPct = useMemo(() => {
    if (initialScores.length === 0) return null;
    const sum = initialScores.reduce(
      (acc, s) => acc + percent(s.score, s.total_items),
      0,
    );
    return Math.round((sum / initialScores.length) * 10) / 10;
  }, [initialScores]);

  function toggleSubject(id: string) {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const scoreNum = Number(score);
    const totalNum = Number(totalItems);

    if (
      !Number.isFinite(scoreNum) ||
      !Number.isFinite(totalNum) ||
      totalNum < 1 ||
      scoreNum < 0 ||
      scoreNum > totalNum
    ) {
      setError("Score must be between 0 and total items.");
      setSaving(false);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    if (takenAt && takenAt > today) {
      setError("Date cannot be in the future.");
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const { data: row, error: insertError } = await supabase
      .from("score_logs")
      .insert({
        user_id: userId,
        quiz_name: quizName.trim(),
        score: scoreNum,
        total_items: totalNum,
        notes: notes.trim() || null,
        taken_at: takenAt && takenAt <= today ? takenAt : today,
      })
      .select("id")
      .single();

    if (insertError || !row) {
      setError(insertError?.message ?? "Failed to create score log.");
      setSaving(false);
      return;
    }

    if (selectedSubjects.length > 0) {
      const { error: tagError } = await supabase
        .from("score_log_subjects")
        .insert(
          selectedSubjects.map((subject_id) => ({
            score_log_id: row.id,
            subject_id,
            user_id: userId,
          })),
        );
      if (tagError) {
        setError(tagError.message);
        setSaving(false);
        return;
      }
    }

    setQuizName("");
    setScore("");
    setTotalItems("");
    setNotes("");
    setSelectedSubjects([]);
    setTakenAt(new Date().toISOString().slice(0, 10));
    setSaving(false);
    router.refresh();
  }

  async function onDelete(id: string) {
    const ok = await confirm({
      title: "Delete score?",
      description: "This score log will be removed permanently.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    const supabase = createClient();
    await supabase.from("score_logs").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {dialog}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={cn(ui.card, ui.cardPad)}>
          <p className={ui.sectionLabel}>Logged scores</p>
          <p className={ui.statValue}>{initialScores.length}</p>
        </div>
        <div className={cn(ui.card, ui.cardPad)}>
          <p className={ui.sectionLabel}>Average</p>
          <p
            className={cn(
              ui.statValue,
              "text-emerald-600 dark:text-emerald-400",
            )}
          >
            {avgPct == null ? "—" : `${avgPct}%`}
          </p>
        </div>
      </div>

      <form onSubmit={onCreate} className={cn(ui.card, ui.cardPad, "space-y-4")}>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Add a score
          </h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            Quiz or assessment result. Tag subjects to filter later.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={ui.label}>Quiz name</label>
            <input
              required
              value={quizName}
              onChange={(e) => setQuizName(e.target.value)}
              placeholder="e.g. Midterm 1, Unit quiz 3"
              className={ui.input}
            />
          </div>
          <div>
            <label className={ui.label}>Score</label>
            <input
              required
              type="number"
              min={0}
              step={1}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="e.g. 18"
              className={ui.input}
            />
          </div>
          <div>
            <label className={ui.label}>Total items</label>
            <input
              required
              type="number"
              min={1}
              step={1}
              value={totalItems}
              onChange={(e) => setTotalItems(e.target.value)}
              placeholder="e.g. 20"
              className={ui.input}
            />
          </div>
          <div>
            <label className={ui.label}>Date</label>
            <input
              type="date"
              value={takenAt}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => {
                const today = new Date().toISOString().slice(0, 10);
                const next = e.target.value;
                setTakenAt(next && next > today ? today : next);
              }}
              className={ui.input}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={ui.label}>
              Notes
              <span className="font-normal text-zinc-400"> (optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="What went well / what to review"
              className={ui.textarea}
            />
          </div>
        </div>

        <div>
          <p className={ui.label}>Subject tags (optional)</p>
          {subjects.length === 0 ? (
            <p className={ui.metaText}>
              No subjects yet — create subjects first to tag scores.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => {
                const on = selectedSubjects.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSubject(s.id)}
                    className={on ? ui.chipActive : ui.chip}
                  >
                    {s.color && (
                      <span
                        className="mr-1.5 inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                    )}
                    {s.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button type="submit" disabled={saving} className={ui.btnPrimary}>
          {saving ? "Saving…" : "Add score"}
        </button>
      </form>
      {error && <p className={ui.errorText}>{error}</p>}

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            History
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterSubject("")}
              className={!filterSubject ? ui.chipActive : ui.chip}
            >
              All
            </button>
            {subjects.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setFilterSubject(s.id)}
                className={filterSubject === s.id ? ui.chipActive : ui.chip}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className={cn(ui.empty, "flex flex-col items-center gap-2")}>
            <p className="font-medium text-zinc-600 dark:text-zinc-300">
              No scores yet
            </p>
            <p className="text-sm">Add a quiz result above.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {visible.map((item) => {
              const pct = percent(item.score, item.total_items);
              const barColor =
                pct >= 80
                  ? "bg-emerald-500"
                  : pct >= 60
                    ? "bg-amber-500"
                    : "bg-red-500";
              return (
                <li
                  key={item.id}
                  className={cn(
                    ui.card,
                    "flex overflow-hidden transition hover:border-zinc-300 dark:hover:border-zinc-700",
                  )}
                >
                  <div className="min-w-0 flex-1 p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                          {item.quiz_name}
                        </p>
                        <p className="mt-1 text-sm tabular-nums text-zinc-500">
                          {item.score}/{item.total_items}
                          <span className="text-zinc-400"> ({pct}%)</span>
                          {item.taken_at ? (
                            <span className="text-zinc-400">
                              {" "}
                              · {formatShortDate(item.taken_at)}
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <span className="shrink-0 text-base font-semibold tabular-nums text-zinc-500">
                        {pct}%
                      </span>
                    </div>
                    {item.notes && (
                      <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                        {item.notes}
                      </p>
                    )}
                    {item.subject_ids.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.subject_ids.map((sid) => (
                          <span key={sid} className={ui.chipSoft}>
                            {subjectColorById[sid] && (
                              <span
                                className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
                                style={{
                                  backgroundColor:
                                    subjectColorById[sid] ?? undefined,
                                }}
                              />
                            )}
                            {subjectNameById[sid] ?? "Subject"}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-4">
                      <ProgressBar value={pct} barClassName={barColor} />
                    </div>
                  </div>
                  <div className="flex shrink-0 items-start border-l border-zinc-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      className={cn(
                        ui.deleteLink,
                        "h-full px-3 py-5 hover:bg-red-50 dark:hover:bg-red-950/30 sm:px-4 sm:py-6",
                      )}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
