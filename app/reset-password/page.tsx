import { getAuthUser } from "@/lib/supabase/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage() {
  const user = await getAuthUser();

  return (
    <AuthShell
      title="Set new password"
      description="Choose a strong password for your account."
    >
      <ResetPasswordForm hasSession={Boolean(user)} />
    </AuthShell>
  );
}
