import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";

/**
 * Refresh the Supabase auth session on each request and gate protected routes.
 * Used from root `proxy.ts` (Next.js 16 Proxy convention).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Prefer getUser() over getSession() — validates JWT with the Auth server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Supabase sometimes lands PKCE `?code=` on Site URL (/) or /login.
  // Only /auth/callback exchanges the code for a session — forward it there.
  const authCode = request.nextUrl.searchParams.get("code");
  if (authCode && !path.startsWith("/auth/callback")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    // Keep code (and any next=) as-is; drop unrelated noise by cloning search.
    return NextResponse.redirect(url);
  }

  const isAuthRoute =
    path.startsWith("/login") ||
    path.startsWith("/auth") ||
    path.startsWith("/forgot-password");
  // Recovery link lands here with a session; page handles missing session itself.
  const isResetPassword = path.startsWith("/reset-password");
  const isPublicAsset =
    path.startsWith("/_next") ||
    path.startsWith("/favicon") ||
    path.includes(".");

  if (!user && !isAuthRoute && !isResetPassword && !isPublicAsset) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged-in users skip login / forgot password (reset-password stays allowed)
  if (user && (path === "/login" || path.startsWith("/forgot-password"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
