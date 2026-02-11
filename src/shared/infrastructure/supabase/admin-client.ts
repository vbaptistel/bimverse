import { createClient } from "@supabase/supabase-js";

import { env } from "@/shared/infrastructure/env";

export function createSupabaseAdminClient() {
  return createClient(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
