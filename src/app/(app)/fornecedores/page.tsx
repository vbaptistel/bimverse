"use client";

import { BriefcaseBusiness, Plus } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { ListFiltersBar } from "@/components/shared/list-filters-bar";
import { Card, CardContent } from "@/components/ui/card";

export default function SuppliersPage() {
  const [search, setSearch] = useState("");

  const applyFilters = () => {
    // TODO: integrar com listagem de fornecedores quando existir
  };

  return (
    <div className="space-y-4">
      <ListFiltersBar
        tabs={[{ value: "all", label: "Todos" }]}
        activeTab="all"
        onTabChange={() => { }}
        searchPlaceholder="Filtrar fornecedores..."
        searchValue={search}
        onSearchChange={setSearch}
        onSearchApply={applyFilters}
        primaryAction={{
          label: "Novo fornecedor",
          onClick: () => { },
          icon: <Plus className="size-3.5" />,
        }}
      />
      <Card>
        <CardContent className="overflow-x-auto gap-4 space-y-4">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-2 py-2">Fornecedor</th>
                <th className="px-2 py-2">Especialidade</th>
                <th className="px-2 py-2">Custo/hora</th>
                <th className="px-2 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-2 py-5 text-muted-foreground" colSpan={4}>
                  Nenhum fornecedor cadastrado.
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="mt-6">
        <EmptyState
          title="Vínculo com propostas"
          description="A interface para associação fornecedor x proposta/revisão ficará nesta mesma área em cards laterais."
          icon={<BriefcaseBusiness size={16} />}
        />
      </div>
    </div>
  );
}
