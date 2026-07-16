import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { TimerClient } from "@/components/timer/timer-client";
import type { StudySession, Subject, Topic } from "@/lib/types";

export default async function TimerPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; topic?: string; start?: string }>;
}) {
  const params = await searchParams;
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    { data: subjects },
    { data: topics },
    { data: sessions },
    { data: weekSessions },
    { data: todaySessions },
  ] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, name")
      .eq("user_id", user.id)
      .order("name"),
    supabase
      .from("topics")
      .select("id, name, subject_id")
      .eq("user_id", user.id)
      .order("name"),
    supabase
      .from("study_sessions")
      .select(
        "id, user_id, subject_id, topic_id, started_at, ended_at, duration_sec, note, created_at",
      )
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(20),
    supabase
      .from("study_sessions")
      .select("duration_sec, subject_id")
      .eq("user_id", user.id)
      .gte("started_at", weekAgo.toISOString()),
    supabase
      .from("study_sessions")
      .select("duration_sec")
      .eq("user_id", user.id)
      .gte("started_at", startOfToday.toISOString()),
  ]);

  const subjectList = (subjects ?? []) as Pick<Subject, "id" | "name">[];
  const subjectNameById = Object.fromEntries(
    subjectList.map((s) => [s.id, s.name]),
  );

  const weekSeconds = (weekSessions ?? []).reduce(
    (acc, s) => acc + (s.duration_sec as number),
    0,
  );
  const todaySeconds = (todaySessions ?? []).reduce(
    (acc, s) => acc + (s.duration_sec as number),
    0,
  );

  const weekBySubjectMap = new Map<string, number>();
  for (const s of weekSessions ?? []) {
    const key = (s.subject_id as string | null) ?? "__none__";
    weekBySubjectMap.set(
      key,
      (weekBySubjectMap.get(key) ?? 0) + (s.duration_sec as number),
    );
  }
  const weekBySubject = Array.from(weekBySubjectMap.entries())
    .map(([id, seconds]) => ({
      subjectId: id === "__none__" ? null : id,
      name:
        id === "__none__"
          ? "Any subject"
          : (subjectNameById[id] ?? "Unknown"),
      seconds,
    }))
    .sort((a, b) => b.seconds - a.seconds);

  return (
    <div className="space-y-9">
      <header className="space-y-1.5">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Study timer
        </h1>
        <p className="text-base leading-relaxed text-zinc-500 dark:text-zinc-400">
          Sessions save when you stop. Timer survives refresh. Under 30s is
          discarded automatically.
        </p>
      </header>
      <TimerClient
        subjects={subjectList}
        topics={(topics ?? []) as Pick<Topic, "id" | "name" | "subject_id">[]}
        recentSessions={(sessions ?? []) as StudySession[]}
        weekSeconds={weekSeconds}
        todaySeconds={todaySeconds}
        weekBySubject={weekBySubject}
        userId={user.id}
        initialSubjectId={params.subject ?? ""}
        initialTopicId={params.topic ?? ""}
        autoStart={params.start === "1"}
      />
    </div>
  );
}
