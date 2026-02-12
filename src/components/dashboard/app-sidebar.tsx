"use client";

import {
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  Database,
  FileSpreadsheet,
  Gauge,
  HelpCircle,
  Search,
  Settings,
  Sparkles,
  Users
} from "lucide-react";
import Link from "next/link";

import { NavMain } from "@/components/dashboard/nav-main";
import { NavSecondary } from "@/components/dashboard/nav-secondary";
import { NavUser } from "@/components/dashboard/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from "@/components/ui/sidebar";

const navMain = [
  { title: "Dashboard", url: "/dashboard", icon: Gauge },
  { title: "Empresas", url: "/empresas", icon: Building2 },
  { title: "Propostas", url: "/propostas", icon: FileSpreadsheet },
  { title: "Fornecedores", url: "/fornecedores", icon: BriefcaseBusiness },
  { title: "Usuários", url: "/admin/usuarios", icon: Users },
];

const navDocuments = [
  { name: "Base de propostas", url: "/propostas", icon: Database },
  { name: "Relatórios", url: "/dashboard", icon: FileSpreadsheet },
  { name: "Nova proposta", url: "/propostas/nova", icon: Sparkles },
];

const navSecondary = [
  { title: "Configurações", url: "/admin/usuarios", icon: Settings },
  { title: "Ajuda", url: "#", icon: HelpCircle },
  { title: "Buscar", url: "#", icon: Search },
];

const user = {
  name: "vinicius",
  email: "v@bimverse.com",
  avatar: "",
};

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="rounded-lgp-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-foreground"
            >
              <Link href="/dashboard">
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Bimverse</span>
                  <span className="truncate text-xs">Plataforma comercial</span>
                </div>
                <ChevronDown className="ml-auto size-4" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavSecondary items={navSecondary} />
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
