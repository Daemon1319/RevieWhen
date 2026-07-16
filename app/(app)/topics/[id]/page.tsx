import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { topicProgress } from "@/lib/progress";
import { TopicDetailClient } from "@/components/subjects/topic-detail-client";
import type { Subtopic } from "@/lib/types";

export default async function TopicDetailPage({
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

  const { data: topic } = await supabase
    .from("topics")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!topic) notFound();

  const { data: subject } = await supabase
    .from("subjects")
    .select("id, name")
    .eq("id", topic.subject_id)
    .maybeSingle();

  const { data: subData } = await supabase
    .from("subtopics")
    .select("*")
    .eq("topic_id", id)
    .order("sort_order")
    .order("created_at");

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
