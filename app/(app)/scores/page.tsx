import { createClient } from "@/lib/supabase/server";
import { ScoresClient } from "@/components/scores/scores-client";
import { PageHeader } from "@/components/ui/page-header";
import { ui } from "@/lib/ui";
import type {
  ScoreLog,
  ScoreLogSubject,
  ScoreLogWithSubjects,
  Subject,
} from "@/lib/types";

export default async function ScoresPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: scores }, { data: links }, { data: subjects }] =
    await Promise.all([
      supabase
        .from("score_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("taken_at", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase.from("score_log_subjects").select("*").eq("user_id", user.id),
      supabase
        .from("subjects")
        .select("id, name, color")
        .eq("user_id", user.id)
        .order("name"),
    ]);

  const linksByScore = new Map<string, string[]>();
  for (const link of (links ?? []) as ScoreLogSubject[]) {
    const list = linksByScore.get(link.score_log_id) ?? [];
    list.push(link.subject_id);
    linksByScore.set(link.score_log_id, list);
  }

  const rows: ScoreLogWithSubjects[] = ((scores ?? []) as ScoreLog[]).map(
    (s) => ({
      ...s,
      subject_ids: linksByScore.get(s.id) ?? [],
    }),
  );

  return (
    <div className={ui.page}>
      <PageHeader
        title="Score logs"
        description="Track quiz and assessment scores. Tag with subjects for filtering."
      />
      <ScoresClient
        initialScores={rows}
        subjects={
          (subjects ?? []) as Pick<Subject, "id" | "name" | "color">[]
        }
        userId={user.id}
      />
    </div>
  );
}
