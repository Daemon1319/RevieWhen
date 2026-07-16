import { createClient } from "@/lib/supabase/server";
import { ErrorsClient } from "@/components/errors/errors-client";
import { PageHeader } from "@/components/ui/page-header";
import { ui } from "@/lib/ui";
import type { ErrorLog, Subject } from "@/lib/types";

export default async function ReviewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: errors }, { data: subjects }] = await Promise.all([
    supabase
      .from("error_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("subjects")
      .select("id, name, color")
      .eq("user_id", user.id)
      .order("name"),
  ]);

  return (
    <div className={ui.page}>
      <PageHeader
        title="Reviews"
        description={
          <>
            Log mistakes, set a review date, and clear them when they stick.
            Items due today or earlier appear under{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Reviews due
            </span>
            .
          </>
        }
      />
      <ErrorsClient
        initialErrors={(errors ?? []) as ErrorLog[]}
        subjects={
          (subjects ?? []) as Pick<Subject, "id" | "name" | "color">[]
        }
        userId={user.id}
      />
    </div>
  );
}
