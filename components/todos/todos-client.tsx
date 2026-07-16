"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/cn";
import { ui } from "@/lib/ui";
import type { Subject, Todo } from "@/lib/types";

function todayLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatShortDate(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function TodosClient({
  initialTodos,
  subjects,
  userId,
}: {
  initialTodos: Todo[];
  subjects: Pick<Subject, "id" | "name">[];
  userId: string;
}) {
  const router = useRouter();
  const { confirm, dialog } = useConfirmDialog();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [error, setError] = useState("");
  const minDue = todayLocal();

  const openCount = initialTodos.filter((t) => !t.is_done).length;
  const doneCount = initialTodos.length - openCount;

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (dueAt && dueAt < minDue) {
      setError("Due date cannot be in the past.");
      return;
    }

    const supabase = createClient();
    const { error: insertError } = await supabase.from("todos").insert({
      user_id: userId,
      title: title.trim(),
      description: description.trim() || null,
      due_at: dueAt || null,
      subject_id: subjectId || null,
      sort_order: initialTodos.length,
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setTitle("");
    setDescription("");
    setDueAt("");
    setSubjectId("");
    router.refresh();
  }

  async function toggle(todo: Todo) {
    const supabase = createClient();
    await supabase
      .from("todos")
      .update({ is_done: !todo.is_done })
      .eq("id", todo.id);
    router.refresh();
  }

  async function onDelete(id: string) {
    const ok = await confirm({
      title: "Delete todo?",
      description: "This todo will be removed permanently.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    const supabase = createClient();
    await supabase.from("todos").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {dialog}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={cn(ui.card, ui.cardPad)}>
          <p className={ui.sectionLabel}>Open</p>
          <p className={ui.statValue}>{openCount}</p>
        </div>
        <div className={cn(ui.card, ui.cardPad)}>
          <p className={ui.sectionLabel}>Done</p>
          <p
            className={cn(
              ui.statValue,
              "text-emerald-600 dark:text-emerald-400",
            )}
          >
            {doneCount}
          </p>
        </div>
      </div>

      <form onSubmit={onCreate} className={cn(ui.card, ui.cardPad, "space-y-4")}>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Add a todo
          </h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            Optional due date and subject tag.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="todo-title" className={ui.label}>
              Title
            </label>
            <input
              id="todo-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs doing?"
              className={ui.input}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="todo-desc" className={ui.label}>
              Description
              <span className="font-normal text-zinc-400"> (optional)</span>
            </label>
            <textarea
              id="todo-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes or context"
              rows={2}
              className={ui.textarea}
            />
          </div>
          <div>
            <label htmlFor="todo-due" className={ui.label}>
              Complete by
            </label>
            <input
              id="todo-due"
              type="date"
              value={dueAt}
              min={minDue}
              onChange={(e) => {
                const next = e.target.value;
                setDueAt(next && next < minDue ? minDue : next);
              }}
              className={ui.input}
            />
          </div>
          <div>
            <label htmlFor="todo-subject" className={ui.label}>
              Subject
            </label>
            <select
              id="todo-subject"
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
        </div>

        <button type="submit" className={ui.btnPrimary}>
          Add todo
        </button>
      </form>
      {error && <p className={ui.errorText}>{error}</p>}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            All todos
          </h2>
          <span className="text-sm text-zinc-400">
            {initialTodos.length} total
          </span>
        </div>

        {initialTodos.length === 0 ? (
          <div className={cn(ui.empty, "flex flex-col items-center gap-2")}>
            <p className="font-medium text-zinc-600 dark:text-zinc-300">
              No todos yet
            </p>
            <p className="text-sm">Add one above to get started.</p>
          </div>
        ) : (
          <ul className={ui.list}>
            {initialTodos.map((todo) => {
              const subjectName = todo.subject_id
                ? subjects.find((s) => s.id === todo.subject_id)?.name
                : null;
              return (
                <li key={todo.id} className="flex items-stretch">
                  <button
                    type="button"
                    onClick={() => toggle(todo)}
                    className={cn(
                      "flex min-w-0 flex-1 items-start gap-3.5 px-5 py-4 text-left transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/30 dark:hover:bg-zinc-800/50",
                      todo.is_done && "bg-zinc-50/80 dark:bg-zinc-950/30",
                    )}
                    aria-pressed={todo.is_done}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition",
                        todo.is_done
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-950",
                      )}
                      aria-hidden
                    >
                      {todo.is_done && (
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
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-base font-medium leading-snug",
                          todo.is_done
                            ? "text-zinc-400 line-through"
                            : "text-zinc-900 dark:text-zinc-50",
                        )}
                      >
                        {todo.title}
                      </p>
                      {todo.description && (
                        <p
                          className={cn(
                            "mt-1 text-sm leading-relaxed",
                            todo.is_done
                              ? "text-zinc-400 line-through"
                              : "text-zinc-500",
                          )}
                        >
                          {todo.description}
                        </p>
                      )}
                      <p className={cn(ui.metaText, "mt-1.5")}>
                        {todo.due_at
                          ? `Complete by ${formatShortDate(todo.due_at)}`
                          : "No complete-by date"}
                        {subjectName ? ` · ${subjectName}` : ""}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(todo.id)}
                    className={cn(
                      ui.deleteLink,
                      "shrink-0 border-l border-zinc-100 px-4 hover:bg-red-50 dark:border-zinc-800 dark:hover:bg-red-950/30",
                    )}
                  >
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
