import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Supabase auth redirect (password recovery, etc.). */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  // Only allow same-origin relative paths
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  const isRecovery = safeNext.startsWith("/reset-password");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
    const dest = isRecovery ? "/forgot-password" : "/login";
    return NextResponse.redirect(
      `${origin}${dest}?error=${encodeURIComponent(
        isRecovery
          ? "This reset link is invalid or has expired. Request a new one."
          : error.message,
      )}`,
    );
  }

  return NextResponse.redirect(
    `${origin}${isRecovery ? "/forgot-password" : "/login"}`,
  );
}
