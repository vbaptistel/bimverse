import Link from "next/link";
import type { ReactNode } from "react";
import {
  BriefcaseBusiness,
  Building2,
  FileSpreadsheet,
  Gauge,
  Menu,
  ShieldCheck,
  Users,
} from "lucide-react";

import { NavLink } from "@/components/layout/nav-link";

interface AppShellProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: <Gauge size={16} /> },
  { href: "/empresas", label: "Empresas", icon: <Building2 size={16} /> },
  {
    href: "/propostas",
    label: "Propostas",
    icon: <FileSpreadsheet size={16} />,
  },
  {
    href: "/fornecedores",
    label: "Fornecedores",
    icon: <BriefcaseBusiness size={16} />,
  },
  { href: "/admin/usuarios", label: "Usuários", icon: <Users size={16} /> },
];

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-transparent">
      <header className="sticky top-0 z-30 border-b border-[#d6dde6] bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#0f766e] text-white">
              <ShieldCheck size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0b1220]">Bimverse</p>
              <p className="text-xs text-[#5b6d84]">Plataforma Comercial</p>
            </div>
          </div>

          <details className="relative lg:hidden">
            <summary className="list-none rounded-md border border-[#d6dde6] bg-white p-2 text-[#42556d]">
              <Menu size={16} />
            </summary>
            <nav className="absolute right-0 mt-2 w-56 rounded-xl border border-[#d6dde6] bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
              <div className="grid gap-1">
                {NAV_ITEMS.map((item) => (
                  <NavLink key={item.href} href={item.href} icon={item.icon}>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </nav>
          </details>

          <Link
            href="/login"
            className="hidden text-sm font-medium text-[#0f766e] hover:underline lg:block"
          >
            Trocar usuário
          </Link>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[250px_1fr] lg:px-8">
        <aside className="hidden h-fit rounded-xl border border-[#d6dde6] bg-white p-3 lg:block">
          <nav className="grid gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} href={item.href} icon={item.icon}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
