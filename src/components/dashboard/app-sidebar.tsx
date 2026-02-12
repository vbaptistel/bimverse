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

const navMain: { title: string; url: string; icon: LucideIcon; }[] = [
  { title: "Dashboard", url: "/dashboard", icon: Gauge },
  { title: "Clientes", url: "/clientes", icon: Building2 },
  { title: "Propostas", url: "/propostas", icon: FileSpreadsheet },
  { title: "Fornecedores", url: "/fornecedores", icon: BriefcaseBusiness },
];

interface AppSidebarUser {
  name: string;
  email: string;
  avatar?: string;
}

interface AppSidebarProps {
  user: AppSidebarUser;
}

export function AppSidebar({ user }: AppSidebarProps) {
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
