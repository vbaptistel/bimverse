function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

/**
 * NEXT_PUBLIC_* vars must use static process.env access so Next.js can inline
 * them into the client bundle. Dynamic process.env[name] is not replaced.
 */
function requirePublicEnv(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  databaseUrl: () => getEnv("DATABASE_URL"),
  supabaseUrl: () =>
    requirePublicEnv(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      "NEXT_PUBLIC_SUPABASE_URL",
    ),
  supabaseAnonKey: () =>
    requirePublicEnv(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ),
  supabaseServiceRoleKey: () => getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  appUrl: () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  devBypassUserId: () => process.env.DEV_BYPASS_USER_ID,
  devBypassRole: () => process.env.DEV_BYPASS_ROLE,
};
