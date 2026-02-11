import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/shared/infrastructure/env";

export function createSupabaseBrowserClient() {
  return createBrowserClient(env.supabaseUrl(), env.supabaseAnonKey());
}
