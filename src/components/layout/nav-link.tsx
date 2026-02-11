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
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-[#0f766e] text-white"
          : "text-[#42556d] hover:bg-[#f5f8fb] hover:text-[#0b1220]",
      )}
    >
      <span className="inline-flex h-4 w-4 items-center justify-center">{icon}</span>
      <span>{children}</span>
    </Link>
  );
}
