import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { progressForTopics } from "@/lib/progress";
import { SubjectsClient } from "@/components/subjects/subjects-client";
import { PageHeader } from "@/components/ui/page-header";
import { ui } from "@/lib/ui";
import type { Subject } from "@/lib/types";

type NestedSubject = Subject & {
  topics:
    | {
        id: string;
        subject_id: string;
        subtopics: { id: string; topic_id: string; is_done: boolean }[] | null;
      }[]
    | null;
};

export default async function SubjectsPage() {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();

  // One nested query instead of subjects → topics → subtopics waterfall
  const { data: subjects } = await supabase
    .from("subjects")
    .select(
      `
      id,
      user_id,
      name,
      color,
      sort_order,
      created_at,
      updated_at,
      topics (
        id,
        subject_id,
        subtopics ( id, topic_id, is_done )
      )
    `,
    )
    .eq("user_id", user.id)
    .order("sort_order")
    .order("created_at");

  const subjectList = (subjects ?? []) as NestedSubject[];

  const rows = subjectList.map((subject) => {
    const subjectTopics = subject.topics ?? [];
    const byTopic = new Map<
      string,
      { id: string; topic_id: string; is_done: boolean }[]
    >();
    let subtopicCount = 0;
    let doneCount = 0;
    for (const t of subjectTopics) {
      const subs = t.subtopics ?? [];
      byTopic.set(t.id, subs);
      subtopicCount += subs.length;
      doneCount += subs.filter((s) => s.is_done).length;
    }
    const { subject: progress } = progressForTopics(subjectTopics, byTopic);
    return {
      id: subject.id,
      user_id: subject.user_id,
      name: subject.name,
      color: subject.color,
      sort_order: subject.sort_order,
      created_at: subject.created_at,
      updated_at: subject.updated_at,
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
