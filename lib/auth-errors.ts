/**
 * Map Supabase Auth / network errors to clear user-facing copy.
 * Prefer specific, actionable messages over raw API strings.
 */

function normalize(message: string) {
  return message.trim().toLowerCase();
}

export function mapAuthError(
  error: { message?: string; code?: string; status?: number } | null | undefined,
  context: "signin" | "signup" | "reset" = "signin",
): string {
  if (!error) {
    if (context === "signup") return "Could not create your account. Please try again.";
    if (context === "reset") return "Could not reset your password. Please try again.";
    return "Could not sign in. Please try again.";
  }

  const raw = error.message ?? "";
  const msg = normalize(raw);
  const code = (error.code ?? "").toLowerCase();

  // Network / infrastructure
  if (
    msg.includes("failed to fetch") ||
    msg.includes("network") ||
    msg.includes("fetch failed") ||
    msg.includes("timeout")
  ) {
    return "Network error. Check your connection and try again.";
  }

  // Invalid credentials (sign-in)
  if (
    code === "invalid_credentials" ||
    msg.includes("invalid login credentials") ||
    msg.includes("invalid email or password")
  ) {
    return "Incorrect email or password.";
  }

  // User already registered — keep generic for callers that want to avoid enumeration
  if (
    code === "user_already_exists" ||
    msg.includes("user already registered") ||
    msg.includes("already been registered") ||
    msg.includes("already registered")
  ) {
    return "If this email is new, you're all set — try signing in. If you already have an account, sign in with your password.";
  }

  // Weak password (server-side)
  if (
    code === "weak_password" ||
    msg.includes("password should be") ||
    msg.includes("password is known to be weak") ||
    msg.includes("weak password")
  ) {
    return "That password is too weak. Use at least 8 characters with an uppercase letter, a number, and a special character.";
  }

  // Rate limiting
  if (
    code === "over_request_rate_limit" ||
    code === "over_email_send_rate_limit" ||
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("email rate limit")
  ) {
    return "Too many attempts. Wait a minute and try again.";
  }

  // Invalid email format
  if (
    code === "validation_failed" ||
    code === "email_address_invalid" ||
    msg.includes("unable to validate email") ||
    msg.includes("invalid email") ||
    msg.includes("email address") && msg.includes("invalid")
  ) {
    return "Enter a valid email address.";
  }

  // Signup disabled
  if (msg.includes("signups not allowed") || msg.includes("signup is disabled")) {
    return "New accounts are not allowed right now.";
  }

  // Session / token issues
  if (
    msg.includes("refresh token") ||
    (msg.includes("session") && msg.includes("expired")) ||
    msg.includes("auth session missing") ||
    code === "session_not_found"
  ) {
    return context === "reset"
      ? "This reset link is invalid or has expired. Request a new one."
      : "Your session expired. Sign in again.";
  }

  // Same password as before
  if (
    msg.includes("same as the old password") ||
    msg.includes("should be different") ||
    msg.includes("different from the old")
  ) {
    return "Choose a password you haven't used recently.";
  }

  // Generic Auth API failures with little detail
  if (msg.includes("unexpected_failure") || msg.includes("internal server error")) {
    if (context === "signup") {
      return "Something went wrong while creating your account. Try again in a moment.";
    }
    if (context === "reset") {
      return "Something went wrong while resetting your password. Try again in a moment.";
    }
    return "Something went wrong while signing in. Try again in a moment.";
  }

  // Fallback: use cleaned original if it looks human-readable, else generic
  if (raw && raw.length < 160 && !msg.includes("json") && !msg.includes("http")) {
    // Capitalize first letter
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  if (context === "signup") return "Could not create your account. Please try again.";
  if (context === "reset") return "Could not reset your password. Please try again.";
  return "Could not sign in. Please try again.";
}

export function mapUrlAuthError(errorParam: string | null): string | null {
  if (!errorParam) return null;
  return mapAuthError({ message: errorParam }, "signin");
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "Enter your email.";
  // Practical email check (not full RFC)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Enter a valid email address.";
  }
  return null;
}
