import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

interface PageHeaderProps {
  badge?: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export function PageHeader({ badge, title, description, action }: PageHeaderProps) {
  return (
    <header className="mb-6 rounded-2xl bg-[linear-gradient(125deg,#0f172a_0%,#134e4a_45%,#164e63_100%)] px-5 py-6 text-white sm:px-7 sm:py-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          {badge ? <Badge className="bg-white/15 text-white">{badge}</Badge> : null}
          <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
          <p className="max-w-2xl text-sm text-white/80 sm:text-base">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
