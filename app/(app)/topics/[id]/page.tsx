import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { topicProgress } from "@/lib/progress";
import { TopicDetailClient } from "@/components/subjects/topic-detail-client";
import type { Subtopic } from "@/lib/types";

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();

  const { data: topic } = await supabase
    .from("topics")
    .select("id, name, subject_id, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!topic) notFound();

  // Subject name + subtopics in parallel (was sequential)
  const [{ data: subject }, { data: subData }] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, name")
      .eq("id", topic.subject_id)
      .maybeSingle(),
    supabase
      .from("subtopics")
      .select(
        "id, user_id, topic_id, name, is_done, completed_at, sort_order, created_at, updated_at",
      )
      .eq("topic_id", id)
      .order("sort_order")
      .order("created_at"),
  ]);

  const subtopics = (subData ?? []) as Subtopic[];
  const progress = topicProgress(subtopics);

  return (
    <TopicDetailClient
      topicId={topic.id}
      topicName={topic.name}
      subjectId={subject?.id ?? topic.subject_id}
      subjectName={subject?.name ?? "Subject"}
      progress={progress}
      subtopics={subtopics}
      userId={user.id}
    />
  );
}
