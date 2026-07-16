"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { mapAuthError } from "@/lib/auth-errors";
import {
  checkPasswordRules,
  getPasswordError,
  isPasswordStrong,
} from "@/lib/password";
import { cn } from "@/lib/cn";
import { ui } from "@/lib/ui";

export function ResetPasswordForm({ hasSession }: { hasSession: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const passwordChecks = useMemo(
    () => checkPasswordRules(password),
    [password],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setConfirmError("");
    setMessage("");

    const pwIssue = getPasswordError(password);
    if (pwIssue) {
      setPasswordError(pwIssue);
      setStatus("error");
      return;
    }
    if (!isPasswordStrong(password)) {
      setPasswordError("Password does not meet the requirements.");
      setStatus("error");
      return;
    }
    if (password !== confirm) {
      setConfirmError("Passwords do not match.");
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setStatus("error");
        setMessage(mapAuthError(error, "reset"));
        return;
      }

      setStatus("done");
      setMessage("Password updated. You can use it to sign in.");
      // Brief beat then home
      router.push("/dashboard");
      router.refresh();
    } catch {
      setStatus("error");
      setMessage(
        "Could not update your password. Check your connection and try again.",
      );
    }
  }

  if (!hasSession) {
    return (
      <div className="space-y-4 text-center">
        <div
          className="rounded-xl bg-red-50 px-3.5 py-3 text-sm leading-relaxed text-red-700 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          This reset link is invalid or has expired. Request a new one to
          continue.
        </div>
        <Link href="/forgot-password" className={cn(ui.btnPrimary, "w-full")}>
          Request new link
        </Link>
        <p className="text-sm text-zinc-500">
          <Link href="/login" className={ui.link}>
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="new-password" className={ui.label}>
          New password
        </label>
        <div className="relative">
          <input
            id="new-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError("");
            }}
            className={cn(
              ui.input,
              "pr-20",
              passwordError &&
                "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-700",
            )}
            placeholder="Create a strong password"
            aria-invalid={Boolean(passwordError)}
            aria-describedby="new-password-rules"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 px-3 text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {passwordError && (
          <p className={cn(ui.errorText, "mt-1.5 text-sm")}>{passwordError}</p>
        )}
        <ul
          id="new-password-rules"
          className="mt-3 space-y-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950/50"
        >
          {passwordChecks.map((rule) => (
            <li
              key={rule.id}
              className={cn(
                "flex items-center gap-2 text-sm",
                rule.ok
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-zinc-500 dark:text-zinc-400",
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                  rule.ok
                    ? "bg-emerald-500 text-white"
                    : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
                )}
                aria-hidden
              >
                {rule.ok ? "✓" : "·"}
              </span>
              {rule.label}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <label htmlFor="confirm-password" className={ui.label}>
          Confirm password
        </label>
        <input
          id="confirm-password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            if (confirmError) setConfirmError("");
          }}
          className={cn(
            ui.input,
            confirmError &&
              "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-700",
          )}
          placeholder="Repeat new password"
          aria-invalid={Boolean(confirmError)}
        />
        {confirmError && (
          <p className={cn(ui.errorText, "mt-1.5 text-sm")}>{confirmError}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={status === "loading" || status === "done"}
        className={cn(ui.btnPrimary, "w-full")}
      >
        {status === "loading"
          ? "Updating…"
          : status === "done"
            ? "Updated"
            : "Update password"}
      </button>

      {message && (
        <div
          className={cn(
            "rounded-xl px-3.5 py-3 text-sm leading-relaxed",
            status === "done"
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
          )}
          role="alert"
        >
          {message}
        </div>
      )}

      <p className="text-center text-sm text-zinc-500">
        <Link href="/login" className={ui.link}>
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
