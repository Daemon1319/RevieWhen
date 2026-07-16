import { createClient } from "@/lib/supabase/server";
import { progressForTopics } from "@/lib/progress";
import { SubjectsClient } from "@/components/subjects/subjects-client";
import { PageHeader } from "@/components/ui/page-header";
import { ui } from "@/lib/ui";
import type { Subject, Subtopic, Topic } from "@/lib/types";

export default async function SubjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: subjects } = await supabase
    .from("subjects")
    .select("*")
    .eq("user_id", user.id)
    .order("sort_order")
    .order("created_at");

  const subjectList = (subjects ?? []) as Subject[];
  const subjectIds = subjectList.map((s) => s.id);

  let topics: Topic[] = [];
  let subtopics: Subtopic[] = [];

  if (subjectIds.length > 0) {
    const { data: topicData } = await supabase
      .from("topics")
      .select("*")
      .in("subject_id", subjectIds);
    topics = (topicData ?? []) as Topic[];

    const topicIds = topics.map((t) => t.id);
    if (topicIds.length > 0) {
      const { data: subData } = await supabase
        .from("subtopics")
        .select("*")
        .in("topic_id", topicIds);
      subtopics = (subData ?? []) as Subtopic[];
    }
  }

  const rows = subjectList.map((subject) => {
    const subjectTopics = topics.filter((t) => t.subject_id === subject.id);
    const byTopic = new Map<string, Subtopic[]>();
    let subtopicCount = 0;
    let doneCount = 0;
    for (const t of subjectTopics) {
      const subs = subtopics.filter((s) => s.topic_id === t.id);
      byTopic.set(t.id, subs);
      subtopicCount += subs.length;
      doneCount += subs.filter((s) => s.is_done).length;
    }
    const { subject: progress } = progressForTopics(subjectTopics, byTopic);
    return {
      ...subject,
      progress,
      topicCount: subjectTopics.length,
      subtopicCount,
      doneCount,
    };
  });

  return (
    <div className={ui.page}>
      <PageHeader
        title="Subjects"
        description="Organize study material. Progress rolls up from subtopics."
      />
      <SubjectsClient initialSubjects={rows} userId={user.id} />
    </div>
  );
}
