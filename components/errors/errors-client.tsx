"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/cn";
import { ui } from "@/lib/ui";
import type { ErrorLog, ErrorLogStatus, Subject } from "@/lib/types";

const STATUS_META: Record<
  ErrorLogStatus,
  { label: string; badge: string; dot: string }
> = {
  open: {
    label: "Open",
    badge:
      "bg-amber-50 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800",
    dot: "bg-amber-500",
  },
  reviewed: {
    label: "Reviewed",
    badge:
      "bg-sky-50 text-sky-800 ring-1 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-800",
    dot: "bg-sky-500",
  },
  resolved: {
    label: "Resolved",
    badge:
      "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800",
    dot: "bg-emerald-500",
  },
};

function toLocalDateString(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todayLocal() {
  return toLocalDateString(new Date());
}

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toLocalDateString(d);
}

function dateToRemindAt(dateStr: string) {
  return `${dateStr}T12:00:00.000Z`;
}

function formatReviewDate(remindAt: string) {
  return new Date(remindAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isDue(remindAt: string | null) {
  if (!remindAt) return false;
  const remindDay = toLocalDateString(new Date(remindAt));
  return remindDay <= todayLocal();
}

export function ErrorsClient({
  initialErrors,
  subjects,
  userId,
}: {
  initialErrors: ErrorLog[];
  subjects: Pick<Subject, "id" | "name" | "color">[];
  userId: string;
}) {
  const router = useRouter();
  const { confirm, dialog } = useConfirmDialog();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | ErrorLogStatus | "due">("all");

  const counts = useMemo(() => {
    const open = initialErrors.filter((e) => e.status === "open").length;
    const reviewed = initialErrors.filter(
      (e) => e.status === "reviewed",
    ).length;
    const resolved = initialErrors.filter(
      (e) => e.status === "resolved",
    ).length;
    const due = initialErrors.filter(
      (e) => e.status !== "resolved" && isDue(e.remind_at),
    ).length;
    return { open, reviewed, resolved, due, total: initialErrors.length };
  }, [initialErrors]);

  const visible = useMemo(() => {
    return initialErrors.filter((e) => {
      if (filter === "all") return true;
      if (filter === "due") return e.status !== "resolved" && isDue(e.remind_at);
      return e.status === filter;
    });
  }, [initialErrors, filter]);

  const minRemind = todayLocal();

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    if (remindAt && remindAt < minRemind) {
      setError("Review date cannot be in the past.");
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const { error: insertError } = await supabase.from("error_logs").insert({
      user_id: userId,
      title: title.trim(),
      notes: notes.trim() || null,
      subject_id: subjectId || null,
      remind_at: remindAt ? dateToRemindAt(remindAt) : null,
      status: "open",
    });

    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setTitle("");
    setNotes("");
    setSubjectId("");
    setRemindAt("");
    router.refresh();
  }

  async function setStatus(id: string, status: ErrorLogStatus) {
    const supabase = createClient();
    await supabase.from("error_logs").update({ status }).eq("id", id);
    router.refresh();
  }

  async function onDelete(id: string) {
    const ok = await confirm({
      title: "Delete review?",
      description: "This review item will be removed permanently.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    const supabase = createClient();
    await supabase.from("error_logs").delete().eq("id", id);
    router.refresh();
  }

  const filters: {
    key: "all" | ErrorLogStatus | "due";
    label: string;
    count: number;
  }[] = [
    { key: "all", label: "All", count: counts.total },
    { key: "due", label: "Due", count: counts.due },
    { key: "open", label: "Open", count: counts.open },
    { key: "reviewed", label: "Reviewed", count: counts.reviewed },
    { key: "resolved", label: "Resolved", count: counts.resolved },
  ];

  return (
    <div className="space-y-6">
      {dialog}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className={cn(ui.card, ui.cardPad)}>
          <p className={ui.sectionLabel}>Open</p>
          <p className={ui.statValue}>{counts.open}</p>
        </div>
        <div className={cn(ui.card, ui.cardPad)}>
          <p className={ui.sectionLabel}>Reviews due</p>
          <p className={ui.statValue}>{counts.due}</p>
        </div>
        <div className={cn(ui.card, ui.cardPad)}>
          <p className={ui.sectionLabel}>Resolved</p>
          <p
            className={cn(
              ui.statValue,
              "text-emerald-600 dark:text-emerald-400",
            )}
          >
            {counts.resolved}
          </p>
        </div>
      </div>

      <form onSubmit={onCreate} className={cn(ui.card, ui.cardPad, "space-y-4")}>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Add a review item
          </h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            Capture a mistake and optionally set when to review it again.
          </p>
        </div>

        <div>
          <label htmlFor="error-title" className={ui.label}>
            What went wrong
          </label>
          <input
            id="error-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Forgot chain rule on derivative"
            className={ui.input}
          />
        </div>

        <div>
          <label htmlFor="error-notes" className={ui.label}>
            Notes / correct approach
            <span className="font-normal text-zinc-400"> (optional)</span>
          </label>
          <textarea
            id="error-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What should you remember next time?"
            rows={3}
            className={ui.textarea}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="error-subject" className={ui.label}>
              Subject
            </label>
            <select
              id="error-subject"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className={ui.select}
            >
              <option value="">No subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="error-remind" className={ui.label}>
              Review on
              <span className="font-normal text-zinc-400"> (optional)</span>
            </label>
            <input
              id="error-remind"
              type="date"
              value={remindAt}
              min={minRemind}
              onChange={(e) => {
                const next = e.target.value;
                setRemindAt(next && next < minRemind ? minRemind : next);
              }}
              className={ui.input}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={ui.metaText}>Quick:</span>
          {[
            { label: "Tomorrow", days: 1 },
            { label: "In 3 days", days: 3 },
            { label: "In 1 week", days: 7 },
          ].map((q) => (
            <button
              key={q.days}
              type="button"
              onClick={() => setRemindAt(addDays(q.days))}
              className={ui.chip}
            >
              {q.label}
            </button>
          ))}
          {remindAt && (
            <button
              type="button"
              onClick={() => setRemindAt("")}
              className={ui.linkMuted}
            >
              Clear
            </button>
          )}
        </div>

        <button type="submit" disabled={saving} className={ui.btnPrimary}>
          {saving ? "Saving…" : "Add review"}
        </button>
      </form>
      {error && <p className={ui.errorText}>{error}</p>}

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Items
          </h2>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={filter === f.key ? ui.chipActive : ui.chip}
              >
                {f.label}
                <span className="ml-1.5 tabular-nums opacity-70">{f.count}</span>
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className={cn(ui.empty, "flex flex-col items-center gap-2")}>
            <p className="font-medium text-zinc-600 dark:text-zinc-300">
              {filter === "all"
                ? "No reviews yet"
                : filter === "due"
                  ? "No reviews due"
                  : "Nothing in this filter"}
            </p>
            <p className="text-sm">
              {filter === "all"
                ? "Add a mistake above to start."
                : "Try another filter."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {visible.map((item) => {
              const meta = STATUS_META[item.status];
              const due = item.status !== "resolved" && isDue(item.remind_at);
              const subject = subjects.find((s) => s.id === item.subject_id);

              return (
                <li
                  key={item.id}
                  className={cn(
                    ui.card,
                    "overflow-hidden",
                    due && "border-zinc-300 dark:border-zinc-600",
                  )}
                >
                  <div className="space-y-3 p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                          meta.badge,
                        )}
                      >
                        <span
                          className={cn("h-1.5 w-1.5 rounded-full", meta.dot)}
                        />
                        {meta.label}
                      </span>
                      {due && (
                        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700">
                          Due
                        </span>
                      )}
                      {subject && (
                        <span className={ui.chipSoft}>
                          {subject.color && (
                            <span
                              className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: subject.color }}
                            />
                          )}
                          {subject.name}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-base font-semibold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50">
                        {item.title}
                      </p>
                      {item.notes && (
                        <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                          {item.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-zinc-400">
                      <span>
                        Logged{" "}
                        {new Date(item.created_at).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </span>
                      {item.remind_at && (
                        <span>
                          Review {formatReviewDate(item.remind_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 bg-zinc-50/80 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-950/40 sm:px-6">
                    {item.status === "open" && (
                      <button
                        type="button"
                        onClick={() => setStatus(item.id, "reviewed")}
                        className={ui.btnSm}
                      >
                        Mark reviewed
                      </button>
                    )}
                    {item.status !== "resolved" && (
                      <button
                        type="button"
                        onClick={() => setStatus(item.id, "resolved")}
                        className={ui.btnSmAccent}
                      >
                        Resolve
                      </button>
                    )}
                    {item.status !== "open" && (
                      <button
                        type="button"
                        onClick={() => setStatus(item.id, "open")}
                        className={ui.btnSm}
                      >
                        Reopen
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      className={cn(ui.btnSmDanger, "ml-auto")}
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
