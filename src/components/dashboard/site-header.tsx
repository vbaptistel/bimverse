"use client";

import { usePathname } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/empresas": "Empresas",
  "/propostas": "Propostas",
  "/propostas/nova": "Nova proposta",
  "/fornecedores": "Fornecedores",
  "/admin/usuarios": "Usuários",
};

function getTitleForPath(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  if (pathname.startsWith("/propostas/")) return "Proposta";
  if (pathname.startsWith("/admin")) return "Administração";
  return "Documentos";
}

export function SiteHeader() {
  const pathname = usePathname();
  const title = getTitleForPath(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-6 !self-center" />
      <div className="flex flex-1 items-center gap-2">
        <span className="text-lg font-semibold">{title}</span>
      </div>
    </header>
  );
}
