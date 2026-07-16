import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { progressForTopics } from "@/lib/progress";
import { SubjectDetailClient } from "@/components/subjects/subject-detail-client";
import type { Topic } from "@/lib/types";

type NestedTopic = Topic & {
  subtopics: { id: string; topic_id: string; is_done: boolean }[] | null;
};

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();

  // Subject + topics + subtopics in one round-trip
  const { data: subject } = await supabase
    .from("subjects")
    .select(
      `
      id,
      name,
      topics (
        id,
        user_id,
        subject_id,
        name,
        sort_order,
        created_at,
        updated_at,
        subtopics ( id, topic_id, is_done )
      )
    `,
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .order("sort_order", { referencedTable: "topics" })
    .order("created_at", { referencedTable: "topics" })
    .maybeSingle();

  if (!subject) notFound();

  const topics = ((subject.topics ?? []) as NestedTopic[]).slice().sort(
    (a, b) =>
      a.sort_order - b.sort_order ||
      a.created_at.localeCompare(b.created_at),
  );

  const byTopic = new Map<
    string,
    { id: string; topic_id: string; is_done: boolean }[]
  >();
  for (const t of topics) {
    byTopic.set(t.id, t.subtopics ?? []);
  }
  const { byTopicId, subject: subjectProgress } = progressForTopics(
    topics,
    byTopic,
  );

  const topicRows = topics.map((t) => ({
    id: t.id,
    user_id: t.user_id,
    subject_id: t.subject_id,
    name: t.name,
    sort_order: t.sort_order,
    created_at: t.created_at,
    updated_at: t.updated_at,
    progress: byTopicId.get(t.id) ?? 0,
    subtopicCount: (t.subtopics ?? []).length,
  }));

  return (
    <SubjectDetailClient
      subjectId={subject.id as string}
      subjectName={subject.name as string}
      subjectProgress={subjectProgress}
      topics={topicRows}
      userId={user.id}
    />
  );
}
