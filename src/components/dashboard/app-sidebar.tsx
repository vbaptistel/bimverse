"use client";

import {
  BriefcaseBusiness,
  Building2,
  FileSpreadsheet,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";

import { NavMain } from "@/components/dashboard/nav-main";
import { NavUser } from "@/components/dashboard/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail
} from "@/components/ui/sidebar";

const navMain: { title: string; url: string; icon: LucideIcon }[] = [
  { title: "Dashboard", url: "/dashboard", icon: Gauge },
  { title: "Empresas", url: "/empresas", icon: Building2 },
  { title: "Propostas", url: "/propostas", icon: FileSpreadsheet },
  { title: "Fornecedores", url: "/fornecedores", icon: BriefcaseBusiness },
];

const user = {
  name: "vinicius",
  email: "v@bimverse.com",
  avatar: "",
};

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="rounded-lg p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <Image
              src="/logo.png"
              alt="bimverse - Projetamos conexões, construímos soluções"
              width={160}
              height={48}
              className="h-8 w-auto shrink-0 object-contain"
              priority
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
