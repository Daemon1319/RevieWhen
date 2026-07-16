import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { TodosClient } from "@/components/todos/todos-client";
import { PageHeader } from "@/components/ui/page-header";
import { ui } from "@/lib/ui";
import type { Subject, Todo } from "@/lib/types";

export default async function TodosPage() {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();

  const [{ data: todos }, { data: subjects }] = await Promise.all([
    supabase
      .from("todos")
      .select(
        "id, user_id, title, description, is_done, due_at, subject_id, sort_order, created_at, updated_at",
      )
      .eq("user_id", user.id)
      .order("is_done")
      .order("due_at", { nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("subjects")
      .select("id, name")
      .eq("user_id", user.id)
      .order("name"),
  ]);

  return (
    <div className={ui.page}>
      <PageHeader
        title="Todos"
        description="Loose tasks — separate from curriculum subtopics."
      />
      <TodosClient
        initialTodos={(todos ?? []) as Todo[]}
        subjects={(subjects ?? []) as Pick<Subject, "id" | "name">[]}
        userId={user.id}
      />
    </div>
  );
}
