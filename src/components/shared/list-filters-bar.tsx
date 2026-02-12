"use client";

import { Plus, Search } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface ListFiltersTab {
  value: string;
  label: string;
  count?: number;
}

export interface ListFiltersBarProps {
  /** Abas de filtro por status/categoria (ex.: Todas, Ativa, Bloqueada) */
  tabs: ListFiltersTab[];
  activeTab: string;
  onTabChange: (value: string) => void;
  /** Placeholder do campo de busca */
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  /** Chamado ao pressionar Enter no campo de busca */
  onSearchApply: () => void;
  /** Ação principal (ex.: "Nova empresa", "Nova proposta") */
  primaryAction: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
    disabled?: boolean;
  };
}

export function ListFiltersBar({
  tabs,
  activeTab,
  onTabChange,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onSearchApply,
  primaryAction,
}: ListFiltersBarProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <div className="flex flex-col gap-4">
        {/* Abas de status (Tabs) + filtro + botões em um único bloco */}
        <div className="space-y-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between w-full">
          <TabsList className="h-auto w-full flex-wrap bg-transparent border-b border-border">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                <span>{tab.label}</span>
                {tab.count != null && (
                  <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-md bg-muted px-1.5 text-xs font-normal text-muted-foreground">
                    {tab.count}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-0 flex-1 sm:max-w-[280px]">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                className="h-9 bg-muted/50 pl-9 placeholder:text-muted-foreground"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onSearchApply();
                  }
                }}
                aria-label={searchPlaceholder}
              />
            </div>

            <Button
              type="button"
              className="h-9 shrink-0"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
            >
              {primaryAction.icon ?? <Plus className="size-3.5" />}
              {primaryAction.label}
            </Button>
          </div>
        </div>
      </div>
    </Tabs>
  );
}
