import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type AuthUser = {
  id: string;
  email: string | undefined;
};

/**
 * Authenticated user for Server Components / Route Handlers.
 *
 * Uses `getClaims()` (local JWT verification) so pages do not re-hit the Auth
 * server after the proxy already called `getUser()` for session refresh + gate.
 * Memoized once per request via React `cache()`.
 */
export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;

  const { claims } = data;
  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : undefined,
  };
});
