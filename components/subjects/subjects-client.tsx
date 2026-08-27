"use client";

import Link from "next/link";
import { FormEvent, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/cn";
import { ui } from "@/lib/ui";
import type { Subject } from "@/lib/types";

type SubjectRow = Subject & {
  progress: number;
  topicCount?: number;
  subtopicCount?: number;
  doneCount?: number;
};

export function SubjectsClient({
  initialSubjects,
  userId,
}: {
  initialSubjects: SubjectRow[];
  userId: string;
}) {
  const router = useRouter();
  const { confirm, dialog } = useConfirmDialog();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#10b981");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: insertError } = await supabase.from("subjects").insert({
      user_id: userId,
      name: name.trim(),
      color,
      sort_order: initialSubjects.length,
    });
    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setName("");
    router.refresh();
  }

  async function onRename(id: string) {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setEditingId(null);
      setEditingName("");
      return;
    }
    const supabase = createClient();
    await supabase
      .from("subjects")
      .update({ name: trimmed })
      .eq("id", id);
    setEditingId(null);
    setEditingName("");
    router.refresh();
  }

  async function onDelete(id: string) {
    const ok = await confirm({
      title: "Delete subject?",
      description: "This will also delete all topics and subtopics under it.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    const supabase = createClient();
    await supabase.from("subjects").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {dialog}
      <form
        onSubmit={onCreate}
        className={cn(
          ui.card,
          ui.cardPad,
          "flex flex-col gap-3 sm:flex-row sm:items-end",
        )}
      >
        <div className="flex-1">
          <label className={ui.label}>New subject</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Calculus"
            className={ui.input}
          />
        </div>
        <div>
          <label className={ui.label}>Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-12 w-14 cursor-pointer rounded-xl border border-zinc-200 bg-transparent p-1 dark:border-zinc-700"
          />
        </div>
        <button type="submit" disabled={loading} className={ui.btnPrimary}>
          {loading ? "Adding…" : "Add"}
        </button>
      </form>
      {error && <p className={ui.errorText}>{error}</p>}

      {initialSubjects.length === 0 ? (
        <div className={cn(ui.empty, "flex flex-col items-center gap-2")}>
          <p className="font-medium text-zinc-600 dark:text-zinc-300">
            No subjects yet
          </p>
          <p className="text-sm">Add one above to start tracking progress.</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {initialSubjects.map((subject) => {
            const topics = subject.topicCount ?? 0;
            const subs = subject.subtopicCount ?? 0;
            const done = subject.doneCount ?? 0;
            const isEditing = editingId === subject.id;
            return (
              <li
                key={subject.id}
                className={cn(
                  ui.card,
                  "flex overflow-hidden transition hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-700 dark:hover:shadow-none",
                )}
              >
                <Link
                  href={`/subjects/${subject.id}`}
                  className={cn(
                    "min-w-0 flex-1 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/30 sm:p-6",
                    isEditing && "pointer-events-none",
                  )}
                  onClick={(e) => { if (isEditing) e.preventDefault(); }}
                >
                  <div className="mb-1 flex items-start gap-3">
                    <span
                      className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-white dark:ring-zinc-900"
                      style={{
                        backgroundColor: subject.color ?? "#a1a1aa",
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        {isEditing ? (
                          <input
                            ref={editInputRef}
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                onRename(subject.id);
                              } else if (e.key === "Escape") {
                                setEditingId(null);
                                setEditingName("");
                              }
                            }}
                            className="pointer-events-auto w-full truncate rounded-lg border border-emerald-400 bg-white px-2 py-0.5 text-lg font-semibold tracking-tight text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-600 dark:bg-zinc-950 dark:text-zinc-50"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <p className="truncate text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                            {subject.name}
                          </p>
                        )}
                        <span className="shrink-0 text-base font-semibold tabular-nums text-zinc-500">
                          {subject.progress}%
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-400">
                        {topics} topic{topics === 1 ? "" : "s"}
                        {subs > 0
                          ? ` · ${done}/${subs} subtopics done`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <ProgressBar
                      value={subject.progress}
                      barClassName="bg-emerald-500"
                    />
                  </div>
                </Link>
                <div className="flex shrink-0 flex-col items-stretch border-l border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditing) {
                        onRename(subject.id);
                      } else {
                        setEditingId(subject.id);
                        setEditingName(subject.name);
                      }
                    }}
                    className={cn(
                      "flex-1 px-3 text-sm font-medium transition sm:px-4",
                      isEditing
                        ? "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                        : "text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400",
                    )}
                  >
                    {isEditing ? "Save" : "Edit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(subject.id)}
                    className={cn(
                      ui.deleteLink,
                      "flex-1 border-t border-zinc-100 px-3 hover:bg-red-50 dark:border-zinc-800 dark:hover:bg-red-950/30 sm:px-4",
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
  );
}
