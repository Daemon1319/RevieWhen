"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/cn";
import { ui } from "@/lib/ui";
import type { Topic } from "@/lib/types";

type TopicRow = Topic & { progress: number; subtopicCount?: number };

export function SubjectDetailClient({
  subjectId,
  subjectName,
  subjectProgress,
  topics,
  userId,
}: {
  subjectId: string;
  subjectName: string;
  subjectProgress: number;
  topics: TopicRow[];
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
    const { error: insertError } = await supabase.from("topics").insert({
      user_id: userId,
      subject_id: subjectId,
      name: name.trim(),
      sort_order: topics.length,
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setName("");
    router.refresh();
  }

  async function onDelete(id: string) {
    const ok = await confirm({
      title: "Delete topic?",
      description: "This will also delete all subtopics under it.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    const supabase = createClient();
    await supabase.from("topics").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div className={ui.page}>
      {dialog}
      <div className="space-y-4">
        <Link
          href="/subjects"
          className={cn(ui.linkMuted, "inline-flex items-center gap-1")}
        >
          <span aria-hidden>←</span> Subjects
        </Link>

        <div
          className={cn(
            ui.card,
            ui.cardPad,
            "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <div className="min-w-0 flex-1">
            <h1 className={ui.pageTitle}>{subjectName}</h1>
            <div className="mt-4 flex items-center gap-3">
              <ProgressBar value={subjectProgress} className="flex-1" />
              <span className="shrink-0 text-base font-semibold tabular-nums text-zinc-500">
                {subjectProgress}%
              </span>
            </div>
          </div>
          <Link
            href={`/timer?subject=${subjectId}&start=1`}
            className={cn(ui.btnAccent, "shrink-0 self-start sm:self-center")}
          >
            Start timer
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Topics
          </h2>
          <span className="text-sm text-zinc-400">
            {topics.length} topic{topics.length === 1 ? "" : "s"}
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
            placeholder="New topic name"
            className={cn(ui.input, "flex-1")}
          />
          <button type="submit" className={ui.btnPrimary}>
            Add topic
          </button>
        </form>
        {error && <p className={ui.errorText}>{error}</p>}

        {topics.length === 0 ? (
          <div className={ui.empty}>No topics yet. Add one above.</div>
        ) : (
          <ul className="space-y-3">
            {topics.map((topic) => (
              <li
                key={topic.id}
                className={cn(
                  ui.card,
                  "flex overflow-hidden transition hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-700 dark:hover:shadow-none",
                )}
              >
                <Link
                  href={`/topics/${topic.id}`}
                  className="min-w-0 flex-1 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/30 sm:p-6"
                >
                  <div className="mb-3 flex items-baseline justify-between gap-3">
                    <p className="min-w-0 truncate text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                      {topic.name}
                    </p>
                    <span className="shrink-0 text-base font-semibold tabular-nums text-zinc-500">
                      {topic.progress}%
                    </span>
                  </div>
                  <ProgressBar value={topic.progress} />
                </Link>
                <div className="flex shrink-0 items-start border-l border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => onDelete(topic.id)}
                    className={cn(
                      ui.deleteLink,
                      "h-full px-3 py-5 hover:bg-red-50 dark:hover:bg-red-950/30 sm:px-4 sm:py-6",
                    )}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
