import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";

/**
 * Server Supabase client — one instance per request (React cache).
 */
export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll from a Server Component — proxy will refresh session
        }
      },
    },
  });
});
