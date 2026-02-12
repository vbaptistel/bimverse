import type { ReactNode } from "react";
import { PanelsTopLeft } from "lucide-react";

interface PageHeaderProps {
  badge?: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export function PageHeader({ badge, title, description, action }: PageHeaderProps) {
  return (
    <header className="mb-5 rounded-xl border border-[#d8dce3] bg-white px-4 py-3 sm:px-5">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="min-w-0">
          <div className="mb-1 inline-flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-[#d8dce3] bg-[#f6f7f9] text-[#5b6d84]">
              <PanelsTopLeft size={13} />
            </span>
            {badge ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5b6d84]">
                {badge}
              </p>
            ) : null}
          </div>
          <h1 className="text-xl font-semibold text-[#111214] sm:text-2xl">{title}</h1>
          <p className="mt-0.5 max-w-3xl text-sm text-[#5b6d84]">{description}</p>
        </div>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </div>
    </header>
  );
}
