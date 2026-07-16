import { createClient } from "@/lib/supabase/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AuthShell
      title="Set new password"
      description="Choose a strong password for your account."
    >
      <ResetPasswordForm hasSession={Boolean(user)} />
    </AuthShell>
  );
}
