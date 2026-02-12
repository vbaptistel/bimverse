import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server-client";

export default async function AppLayout({ children }: { children: ReactNode; }) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? "";
  const userName =
    (user?.user_metadata.full_name as string | undefined) ??
    (user?.user_metadata.name as string | undefined) ??
    email.split("@")[0] ??
    "Usuario";
  const avatar =
    (user?.user_metadata.avatar_url as string | undefined) ??
    (user?.user_metadata.picture as string | undefined) ??
    "";

  return (
    <AppShell
      defaultOpen={defaultOpen}
      user={{
        name: userName,
        email,
        avatar,
      }}
    >
      {children}
    </AppShell>
  );
}
