import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";

export default function LoginPage() {
  return (
    <AuthShell
      title="RevieWhen"
      description="Study tracker for subjects, sessions, and reviews."
    >
      <Suspense
        fallback={
          <p className="text-center text-sm text-zinc-500">Loading…</p>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
