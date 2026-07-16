import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { progressForTopics } from "@/lib/progress";
import { SubjectDetailClient } from "@/components/subjects/subject-detail-client";
import type { Subtopic, Topic } from "@/lib/types";

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: subject } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!subject) notFound();

  const { data: topicData } = await supabase
    .from("topics")
    .select("*")
    .eq("subject_id", id)
    .order("sort_order")
    .order("created_at");

  const topics = (topicData ?? []) as Topic[];
  const topicIds = topics.map((t) => t.id);

  let subtopics: Subtopic[] = [];
  if (topicIds.length > 0) {
    const { data: subData } = await supabase
      .from("subtopics")
      .select("*")
      .in("topic_id", topicIds);
    subtopics = (subData ?? []) as Subtopic[];
  }

  const byTopic = new Map<string, Subtopic[]>();
  for (const t of topics) {
    byTopic.set(
      t.id,
      subtopics.filter((s) => s.topic_id === t.id),
    );
  }
  const { byTopicId, subject: subjectProgress } = progressForTopics(
    topics,
    byTopic,
  );

  const topicRows = topics.map((t) => ({
    ...t,
    progress: byTopicId.get(t.id) ?? 0,
  }));

  return (
    <SubjectDetailClient
      subjectId={subject.id}
      subjectName={subject.name}
      subjectProgress={subjectProgress}
      topics={topicRows}
      userId={user.id}
    />
  );
}
