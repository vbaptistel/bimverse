import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: ReactNode; }) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return <AppShell defaultOpen={defaultOpen}>{children}</AppShell>;
}
