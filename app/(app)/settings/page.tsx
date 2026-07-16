import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/settings/sign-out-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/cn";
import { ui } from "@/lib/ui";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className={ui.page}>
      <PageHeader
        title="Settings"
        description="Account, appearance, and session."
      />

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Appearance
        </h2>
        <div
          className={cn(
            ui.card,
            ui.cardPad,
            "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <div className="min-w-0">
            <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">
              Theme
            </p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              Light is the default. Switch anytime — preference is saved on this
              device.
            </p>
          </div>
          <ThemeToggle className="shrink-0 self-start sm:self-center" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Account
        </h2>
        <div
          className={cn(
            ui.card,
            ui.cardPad,
            "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <div className="min-w-0">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Signed in as
            </p>
            <p className="mt-1 truncate text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {user?.email ?? "Unknown"}
            </p>
          </div>
          <SignOutButton />
        </div>
      </section>
    </div>
  );
}
