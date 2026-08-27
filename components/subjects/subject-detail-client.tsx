"use client";

import Link from "next/link";
import { FormEvent, useRef, useState, useEffect } from "react";
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

  // Subject heading edit state
  const [editingSubjectName, setEditingSubjectName] = useState(false);
  const [subjectNameDraft, setSubjectNameDraft] = useState(subjectName);
  const subjectNameInputRef = useRef<HTMLInputElement>(null);

  // Topic inline edit state
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingTopicName, setEditingTopicName] = useState("");
  const topicEditRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingSubjectName && subjectNameInputRef.current) {
      subjectNameInputRef.current.focus();
      subjectNameInputRef.current.select();
    }
  }, [editingSubjectName]);

  useEffect(() => {
    if (editingTopicId && topicEditRef.current) {
      topicEditRef.current.focus();
      topicEditRef.current.select();
    }
  }, [editingTopicId]);

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

  async function onRenameSubject() {
    const trimmed = subjectNameDraft.trim();
    if (!trimmed) {
      setEditingSubjectName(false);
      setSubjectNameDraft(subjectName);
      return;
    }
    const supabase = createClient();
    await supabase
      .from("subjects")
      .update({ name: trimmed })
      .eq("id", subjectId);
    setEditingSubjectName(false);
    router.refresh();
  }

  async function onRenameTopic(id: string) {
    const trimmed = editingTopicName.trim();
    if (!trimmed) {
      setEditingTopicId(null);
      setEditingTopicName("");
      return;
    }
    const supabase = createClient();
    await supabase
      .from("topics")
      .update({ name: trimmed })
      .eq("id", id);
    setEditingTopicId(null);
    setEditingTopicName("");
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
            {editingSubjectName ? (
              <input
                ref={subjectNameInputRef}
                value={subjectNameDraft}
                onChange={(e) => setSubjectNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onRenameSubject();
                  } else if (e.key === "Escape") {
                    setEditingSubjectName(false);
                    setSubjectNameDraft(subjectName);
                  }
                }}
                className="w-full rounded-xl border border-emerald-400 bg-white px-3 py-1.5 text-3xl font-semibold tracking-tight text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-600 dark:bg-zinc-950 dark:text-zinc-50"
              />
            ) : (
              <div className="group flex items-center gap-2">
                <h1 className={ui.pageTitle}>{subjectName}</h1>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSubjectName(true);
                    setSubjectNameDraft(subjectName);
                  }}
                  className="rounded-lg p-1.5 text-zinc-300 opacity-0 transition hover:bg-zinc-100 hover:text-zinc-600 group-hover:opacity-100 dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  title="Edit subject name"
                >
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11.5 1.5l3 3-9 9H2.5v-3l9-9z" />
                  </svg>
                </button>
              </div>
            )}
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
            {topics.map((topic) => {
              const isEditing = editingTopicId === topic.id;
              return (
                <li
                  key={topic.id}
                  className={cn(
                    ui.card,
                    "flex overflow-hidden transition hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-700 dark:hover:shadow-none",
                  )}
                >
                  <Link
                    href={`/topics/${topic.id}`}
                    className={cn(
                      "min-w-0 flex-1 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/30 sm:p-6",
                      isEditing && "pointer-events-none",
                    )}
                    onClick={(e) => { if (isEditing) e.preventDefault(); }}
                  >
                    <div className="mb-3 flex items-baseline justify-between gap-3">
                      {isEditing ? (
                        <input
                          ref={topicEditRef}
                          value={editingTopicName}
                          onChange={(e) => setEditingTopicName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              onRenameTopic(topic.id);
                            } else if (e.key === "Escape") {
                              setEditingTopicId(null);
                              setEditingTopicName("");
                            }
                          }}
                          className="pointer-events-auto w-full truncate rounded-lg border border-emerald-400 bg-white px-2 py-0.5 text-base font-semibold tracking-tight text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-600 dark:bg-zinc-950 dark:text-zinc-50"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <p className="min-w-0 truncate text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                          {topic.name}
                        </p>
                      )}
                      <span className="shrink-0 text-base font-semibold tabular-nums text-zinc-500">
                        {topic.progress}%
                      </span>
                    </div>
                    <ProgressBar value={topic.progress} />
                  </Link>
                  <div className="flex shrink-0 flex-col items-stretch border-l border-zinc-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        if (isEditing) {
                          onRenameTopic(topic.id);
                        } else {
                          setEditingTopicId(topic.id);
                          setEditingTopicName(topic.name);
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
                      onClick={() => onDelete(topic.id)}
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
    </div>
  );
}

