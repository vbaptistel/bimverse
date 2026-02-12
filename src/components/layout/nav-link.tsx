"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}

export function NavLink({ href, icon, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-[#111214] text-white"
          : "text-[#202838] hover:bg-[#eceff4] hover:text-[#111214]",
      )}
    >
      <span className="inline-flex h-4 w-4 items-center justify-center">{icon}</span>
      <span>{children}</span>
    </Link>
  );
}
