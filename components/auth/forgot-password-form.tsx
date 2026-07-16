"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { mapAuthError, mapUrlAuthError, validateEmail } from "@/lib/auth-errors";
import { cn } from "@/lib/cn";
import { ui } from "@/lib/ui";

/**
 * Always shows the same success message whether or not the email exists
 * (avoids leaking which accounts are registered).
 */
const SUCCESS_MESSAGE =
  "If an account exists for that email, we sent a reset link. Check your inbox (and spam).";

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const urlError = mapUrlAuthError(searchParams.get("error"));

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "sent">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setEmailError("");
    setMessage("");

    const emailIssue = validateEmail(email);
    if (emailIssue) {
      setEmailError(emailIssue);
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${origin}/auth/callback?next=/reset-password`,
        },
      );

      // Even on error (e.g. rate limit), prefer specific handling; for unknown
      // "user not found" style errors, still show neutral success when possible.
      if (error) {
        const friendly = mapAuthError(error, "reset");
        const msg = friendly.toLowerCase();
        // Rate limit / network — show real error
        if (
          msg.includes("too many") ||
          msg.includes("network") ||
          msg.includes("connection") ||
          msg.includes("wait")
        ) {
          setStatus("error");
          setMessage(friendly);
          return;
        }
        // Otherwise neutral success (enumeration-safe)
      }

      setStatus("sent");
      setMessage(SUCCESS_MESSAGE);
    } catch {
      setStatus("error");
      setMessage(
        "Could not send a reset email. Check your connection and try again.",
      );
    }
  }

  return (
    <div className="space-y-5">
      {status === "sent" ? (
        <div className="space-y-4">
          <div
            className="rounded-xl bg-emerald-50 px-3.5 py-3 text-sm leading-relaxed text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
            role="status"
          >
            {message}
          </div>
          <Link href="/login" className={cn(ui.btnPrimary, "w-full")}>
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="reset-email" className={ui.label}>
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
              className={cn(
                ui.input,
                emailError &&
                  "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-700",
              )}
              placeholder="you@example.com"
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "reset-email-error" : undefined}
            />
            {emailError && (
              <p
                id="reset-email-error"
                className={cn(ui.errorText, "mt-1.5 text-sm")}
              >
                {emailError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className={cn(ui.btnPrimary, "w-full")}
          >
            {status === "loading" ? "Sending link…" : "Send reset link"}
          </button>

          {(message || urlError) && (
            <div
              className="rounded-xl bg-red-50 px-3.5 py-3 text-sm leading-relaxed text-red-700 dark:bg-red-950/40 dark:text-red-300"
              role="alert"
            >
              {message || urlError}
            </div>
          )}

          <p className="text-center text-sm text-zinc-500">
            <Link href="/login" className={ui.link}>
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
