"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  mapAuthError,
  mapUrlAuthError,
  validateEmail,
} from "@/lib/auth-errors";
import {
  checkPasswordRules,
  getPasswordError,
  isPasswordStrong,
} from "@/lib/password";
import { cn } from "@/lib/cn";
import { ui } from "@/lib/ui";

type AuthMode = "signin" | "signup";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = mapUrlAuthError(searchParams.get("error"));

  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "info">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const passwordChecks = useMemo(
    () => checkPasswordRules(password),
    [password],
  );

  function clearFieldErrors() {
    setEmailError("");
    setPasswordError("");
  }

  function switchMode(mode: AuthMode) {
    setAuthMode(mode);
    setStatus("idle");
    setMessage("");
    clearFieldErrors();
  }

  function validateForm(): boolean {
    clearFieldErrors();
    let ok = true;

    const emailIssue = validateEmail(email);
    if (emailIssue) {
      setEmailError(emailIssue);
      ok = false;
    }

    if (!password) {
      setPasswordError(
        authMode === "signup" ? "Choose a password." : "Enter your password.",
      );
      ok = false;
    } else if (authMode === "signup") {
      const pwIssue = getPasswordError(password);
      if (pwIssue) {
        setPasswordError(pwIssue);
        ok = false;
      }
    }

    return ok;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setStatus("idle");

    if (!validateForm()) {
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      const supabase = createClient();

      if (authMode === "signup") {
        // Defense in depth — never hit the API with a weak password
        if (!isPasswordStrong(password)) {
          const pwIssue = getPasswordError(password);
          setPasswordError(pwIssue ?? "Password does not meet the requirements.");
          setStatus("error");
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          setStatus("error");
          const friendly = mapAuthError(error, "signup");
          // Don't surface "already registered" — keeps email enumeration harder
          if (
            friendly.toLowerCase().includes("already exists") ||
            friendly.toLowerCase().includes("already registered")
          ) {
            setStatus("info");
            setMessage(
              "If this email is new, you're all set — try signing in. If you already have an account, sign in with your password.",
            );
            setAuthMode("signin");
            setPassword("");
            return;
          }
          if (friendly.toLowerCase().includes("password")) {
            setPasswordError(friendly);
          } else if (friendly.toLowerCase().includes("valid email")) {
            setEmailError(friendly);
          } else {
            setMessage(friendly);
          }
          return;
        }

        // Confirm-email off + new account → session; go straight in
        if (data.session) {
          router.push("/dashboard");
          router.refresh();
          return;
        }

        // No session: new signup pending, or existing email (Supabase may hide which).
        // Same neutral copy either way — no "this email is taken" leak.
        setStatus("info");
        setMessage(
          "If this email is new, you're all set — try signing in. If you already have an account, sign in with your password.",
        );
        setAuthMode("signin");
        setPassword("");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setStatus("error");
        const friendly = mapAuthError(error, "signin");
        if (friendly.toLowerCase().includes("incorrect email or password")) {
          setMessage(friendly);
          setPasswordError("Double-check your password and try again.");
        } else if (
          friendly.toLowerCase().includes("already exists") ||
          friendly.toLowerCase().includes("valid email")
        ) {
          setEmailError(friendly);
        } else {
          setMessage(friendly);
        }
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setStatus("error");
      setMessage(
        authMode === "signin"
          ? "Could not reach the server. Check your connection and try again."
          : "Could not create your account. Check your connection and try again.",
      );
    }
  }

  return (
    <div className="space-y-5">
      <div
        className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800"
        role="tablist"
        aria-label="Auth mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={authMode === "signup"}
          onClick={() => switchMode("signup")}
          className={cn(
            "rounded-lg py-2 text-sm font-medium transition",
            authMode === "signup"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200",
          )}
        >
          Sign up
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={authMode === "signin"}
          onClick={() => switchMode("signin")}
          className={cn(
            "rounded-lg py-2 text-sm font-medium transition",
            authMode === "signin"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200",
          )}
        >
          Sign in
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className={ui.label}>
            Email
          </label>
          <input
            id="email"
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
            aria-describedby={emailError ? "email-error" : undefined}
          />
          {emailError && (
            <p id="email-error" className={cn(ui.errorText, "mt-1.5 text-sm")}>
              {emailError}
            </p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor="password" className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Password
            </label>
            {authMode === "signin" && (
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete={
                authMode === "signup" ? "new-password" : "current-password"
              }
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
              placeholder={
                authMode === "signup"
                  ? "Create a strong password"
                  : "Your password"
              }
              aria-invalid={Boolean(passwordError)}
              aria-describedby={
                authMode === "signup"
                  ? "password-rules"
                  : passwordError
                    ? "password-error"
                    : undefined
              }
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
            <p
              id="password-error"
              className={cn(ui.errorText, "mt-1.5 text-sm")}
            >
              {passwordError}
            </p>
          )}

          {authMode === "signup" && (
            <ul
              id="password-rules"
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
          )}
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className={cn(ui.btnPrimary, "w-full")}
        >
          {status === "loading"
            ? authMode === "signup"
              ? "Creating account…"
              : "Signing in…"
            : authMode === "signup"
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      {(message || urlError) && (
        <div
          className={cn(
            "rounded-xl px-3.5 py-3 text-sm leading-relaxed",
            status === "info"
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
          )}
          role="alert"
        >
          {urlError && status !== "info" && <p>{urlError}</p>}
          {message && <p>{message}</p>}
        </div>
      )}
    </div>
  );
}
