"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/cn";
import { ui } from "@/lib/ui";
import type { Subtopic } from "@/lib/types";

export function TopicDetailClient({
  topicId,
  topicName,
  subjectId,
  subjectName,
  progress,
  subtopics,
  userId,
}: {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  progress: number;
  subtopics: Subtopic[];
  userId: string;
}) {
  const router = useRouter();
  const { confirm, dialog } = useConfirmDialog();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    const supabase = createClient();
    const { error: insertError } = await supabase.from("subtopics").insert({
      user_id: userId,
      topic_id: topicId,
      name: name.trim(),
      sort_order: subtopics.length,
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setName("");
    router.refresh();
  }

  async function toggleDone(sub: Subtopic) {
    const supabase = createClient();
    const next = !sub.is_done;
    await supabase
      .from("subtopics")
      .update({
        is_done: next,
        completed_at: next ? new Date().toISOString() : null,
      })
      .eq("id", sub.id);
    router.refresh();
  }

  async function onDelete(id: string) {
    const ok = await confirm({
      title: "Delete subtopic?",
      description: "This cannot be undone.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    const supabase = createClient();
    await supabase.from("subtopics").delete().eq("id", id);
    router.refresh();
  }

  const doneCount = subtopics.filter((s) => s.is_done).length;

  return (
    <div className={ui.page}>
      {dialog}
      <div className="space-y-4">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          <Link
            href="/subjects"
            className="rounded-md px-1 py-0.5 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            Subjects
          </Link>
          <span className="text-zinc-300 dark:text-zinc-600" aria-hidden>
            /
          </span>
          <Link
            href={`/subjects/${subjectId}`}
            className="rounded-md px-1 py-0.5 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            {subjectName}
          </Link>
        </nav>

        <div
          className={cn(
            ui.card,
            ui.cardPad,
            "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <div className="min-w-0 flex-1">
            <h1 className={ui.pageTitle}>{topicName}</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {doneCount}/{subtopics.length} subtopics done
            </p>
            <div className="mt-4 flex items-center gap-3">
              <ProgressBar value={progress} className="flex-1" />
              <span className="shrink-0 text-base font-semibold tabular-nums text-zinc-500">
                {progress}%
              </span>
            </div>
          </div>
          <Link
            href={`/timer?subject=${subjectId}&topic=${topicId}&start=1`}
            className={cn(ui.btnAccent, "shrink-0 self-start sm:self-center")}
          >
            Start timer
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Subtopics
          </h2>
          <span className="text-sm text-zinc-400">
            Tap a row to mark done
          </span>
        </div>

        <form
          onSubmit={onCreate}
          className={cn(ui.card, ui.cardPad, "flex flex-col gap-3 sm:flex-row")}
        >
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New subtopic"
            className={cn(ui.input, "flex-1")}
          />
          <button type="submit" className={ui.btnPrimary}>
            Add
          </button>
        </form>
        {error && <p className={ui.errorText}>{error}</p>}

        {subtopics.length === 0 ? (
          <div className={ui.empty}>
            No subtopics yet. Add one and check it off when done.
          </div>
        ) : (
          <ul className={ui.list}>
            {subtopics.map((sub) => (
              <li key={sub.id} className="flex items-stretch">
                <button
                  type="button"
                  onClick={() => toggleDone(sub)}
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-3.5 px-5 py-4 text-left transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/30 dark:hover:bg-zinc-800/50",
                    sub.is_done && "bg-zinc-50/80 dark:bg-zinc-950/30",
                  )}
                  aria-pressed={sub.is_done}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition",
                      sub.is_done
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-950",
                    )}
                    aria-hidden
                  >
                    {sub.is_done && (
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M3.5 8.5 6.5 11.5 12.5 4.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 text-base font-medium",
                      sub.is_done
                        ? "text-zinc-400 line-through"
                        : "text-zinc-900 dark:text-zinc-50",
                    )}
                  >
                    {sub.name}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(sub.id)}
                  className={cn(
                    ui.deleteLink,
                    "shrink-0 border-l border-zinc-100 px-4 hover:bg-red-50 dark:border-zinc-800 dark:hover:bg-red-950/30",
                  )}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
