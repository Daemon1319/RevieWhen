import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthShell } from "@/components/auth/auth-shell";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot password"
      description="Enter your email and we'll send a link to reset it."
    >
      <Suspense
        fallback={
          <p className="text-center text-sm text-zinc-500">Loading…</p>
        }
      >
        <ForgotPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
