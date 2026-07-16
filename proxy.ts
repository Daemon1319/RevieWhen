import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/update-session";

/**
 * Next.js 16+: `proxy` replaces the deprecated `middleware` file convention.
 * Session refresh + auth route gating for Supabase.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and image optimization.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
