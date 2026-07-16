import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDuration, progressForTopics } from "@/lib/progress";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/cn";
import { ui } from "@/lib/ui";
import type { ErrorLog, Subject, Subtopic, Todo, Topic } from "@/lib/types";

function todayLocalDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatShortDate(isoOrDate: string) {
  // Accept YYYY-MM-DD or full ISO
  const d = isoOrDate.length <= 10
    ? new Date(`${isoOrDate}T12:00:00`)
    : new Date(isoOrDate);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatLongDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const todayDate = todayLocalDate();
  // End of local today — so "review on Jul 16 1:37 PM" counts as due all day
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const endOfTodayIso = endOfToday.toISOString();

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [
    { data: subjects },
    { data: topics },
    { data: subtopics },
    { data: openTodos },
    { data: dueTodos },
    { data: dueReviews },
    { data: weekSessions },
  ] = await Promise.all([
    supabase
      .from("subjects")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order")
      .limit(6),
    supabase.from("topics").select("*").eq("user_id", user.id),
    supabase.from("subtopics").select("*").eq("user_id", user.id),
    supabase
      .from("todos")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_done", false),
    supabase
      .from("todos")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_done", false)
      .lte("due_at", todayDate)
      .order("due_at"),
    supabase
      .from("error_logs")
      .select("*")
      .eq("user_id", user.id)
      .neq("status", "resolved")
      .not("remind_at", "is", null)
      .lte("remind_at", endOfTodayIso)
      .order("remind_at"),
    supabase
      .from("study_sessions")
      .select("duration_sec")
      .eq("user_id", user.id)
      .gte("started_at", weekAgo.toISOString()),
  ]);

  const subjectList = (subjects ?? []) as Subject[];
  const topicList = (topics ?? []) as Topic[];
  const subList = (subtopics ?? []) as Subtopic[];
  const openTodoCount = (openTodos ?? []).length;
  const dueTodoList = (dueTodos ?? []) as Todo[];
  const dueReviewList = (dueReviews ?? []) as ErrorLog[];

  const subjectCards = subjectList.map((subject) => {
    const subjectTopics = topicList.filter((t) => t.subject_id === subject.id);
    const byTopic = new Map<string, Subtopic[]>();
    for (const t of subjectTopics) {
      byTopic.set(
        t.id,
        subList.filter((s) => s.topic_id === t.id),
      );
    }
    const { subject: progress } = progressForTopics(subjectTopics, byTopic);
    return { ...subject, progress, topicCount: subjectTopics.length };
  });

  const weekSeconds = (weekSessions ?? []).reduce(
    (acc, s) => acc + (s.duration_sec as number),
    0,
  );

  const now = new Date();
  const greetingHour = now.getHours();
  const greeting =
    greetingHour < 12
      ? "Good morning"
      : greetingHour < 17
        ? "Good afternoon"
        : "Good evening";

  const attentionCount = dueTodoList.length + dueReviewList.length;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
            {formatLongDate(now)}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {greeting}
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-zinc-500 dark:text-zinc-400">
            {attentionCount > 0
              ? `${attentionCount} item${attentionCount === 1 ? "" : "s"} need your attention today.`
              : "Nothing urgent due. Pick a subject or start a session."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/subjects" className={ui.btnSecondary}>
            Subjects
          </Link>
          <Link href="/timer" className={ui.btnAccent}>
            Start timer
          </Link>
        </div>
      </header>

      {/* Needs attention — top of dashboard */}
      <section className={cn(ui.card, "overflow-hidden")}>
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3.5 dark:border-zinc-800 sm:px-5">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Needs attention
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Due today or overdue
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 lg:divide-x lg:divide-zinc-100 dark:lg:divide-zinc-800">
          {/* Todos due */}
          <div className="flex min-h-0 flex-col">
            <div className="flex items-center justify-between gap-2 border-b border-zinc-50 px-4 py-2.5 dark:border-zinc-800/60 sm:px-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Todos due
              </h3>
              <Link href="/todos" className={ui.linkMuted}>
                View all
              </Link>
            </div>
            <ul className="flex-1 divide-y divide-zinc-100 dark:divide-zinc-800">
              {dueTodoList.slice(0, 6).map((t) => (
                <li
                  key={t.id}
                  className="flex items-start gap-3 px-4 py-3.5 sm:px-5"
                >
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-50">
                      {t.title}
                    </p>
                    {t.due_at && (
                      <p className="mt-0.5 text-xs text-zinc-400">
                        Complete by {formatShortDate(t.due_at)}
                        {t.due_at < todayDate ? " · overdue" : ""}
                      </p>
                    )}
                  </div>
                </li>
              ))}
              {dueTodoList.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-zinc-400 sm:px-5">
                  Nothing due right now
                </li>
              )}
            </ul>
          </div>

          {/* Reviews due */}
          <div className="flex min-h-0 flex-col border-t border-zinc-100 dark:border-zinc-800 lg:border-t-0">
            <div className="flex items-center justify-between gap-2 border-b border-zinc-50 px-4 py-2.5 dark:border-zinc-800/60 sm:px-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Reviews due
              </h3>
              <Link href="/reviews" className={ui.linkMuted}>
                View all
              </Link>
            </div>
            <ul className="flex-1 divide-y divide-zinc-100 dark:divide-zinc-800">
              {dueReviewList.slice(0, 6).map((e) => (
                <li
                  key={e.id}
                  className="flex items-start gap-3 px-4 py-3.5 sm:px-5"
                >
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-50">
                      {e.title}
                    </p>
                    {e.remind_at && (
                      <p className="mt-0.5 text-xs text-zinc-400">
                        Review {formatShortDate(e.remind_at)}
                      </p>
                    )}
                  </div>
                </li>
              ))}
              {dueReviewList.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-zinc-400 sm:px-5">
                  No reviews due
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* Stats — whole card is the link */}
      <section className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/timer"
          className={cn(
            ui.card,
            ui.cardPad,
            "group transition hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-700 dark:hover:shadow-none",
          )}
        >
          <p className={ui.sectionLabel}>Study this week</p>
          <p
            className={cn(
              ui.statValue,
              "text-emerald-600 dark:text-emerald-400",
            )}
          >
            {formatDuration(weekSeconds)}
          </p>
          <p className="mt-3 text-xs font-medium text-zinc-400 transition group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
            Open timer →
          </p>
        </Link>

        <Link
          href="/todos"
          className={cn(
            ui.card,
            ui.cardPad,
            "group transition hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-700 dark:hover:shadow-none",
          )}
        >
          <p className={ui.sectionLabel}>Open todos</p>
          <p className={ui.statValue}>{openTodoCount}</p>
          <p className="mt-3 text-xs font-medium text-zinc-400 transition group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
            View todos →
          </p>
        </Link>

        <Link
          href="/reviews"
          className={cn(
            ui.card,
            ui.cardPad,
            "group transition hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-700 dark:hover:shadow-none",
          )}
        >
          <p className={ui.sectionLabel}>Reviews due</p>
          <p className={ui.statValue}>{dueReviewList.length}</p>
          <p className="mt-3 text-xs font-medium text-zinc-400 transition group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
            View reviews →
          </p>
        </Link>
      </section>

      {/* Subjects */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Subjects
          </h2>
          <Link href="/subjects" className={ui.linkMuted}>
            View all
          </Link>
        </div>

        {subjectCards.length === 0 ? (
          <div className={cn(ui.empty, "flex flex-col items-center gap-3")}>
            <p>No subjects yet. Create one to track progress.</p>
            <Link href="/subjects" className={ui.btnPrimary}>
              Add subject
            </Link>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {subjectCards.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/subjects/${s.id}`}
                  className={cn(
                    ui.card,
                    "block p-4 transition hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-700 dark:hover:shadow-none sm:p-5",
                  )}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white dark:ring-zinc-900"
                        style={{ backgroundColor: s.color ?? "#a1a1aa" }}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                          {s.name}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          {s.topicCount} topic
                          {s.topicCount === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-medium tabular-nums text-zinc-500">
                      {s.progress}%
                    </span>
                  </div>
                  <ProgressBar
                    value={s.progress}
                    barClassName="bg-emerald-500"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
