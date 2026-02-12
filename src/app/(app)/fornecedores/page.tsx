import { BriefcaseBusiness, Plus } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SuppliersPage() {
  return (
    <>
      <section className="mb-4 rounded-xl border border-[#d6dde6] bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
          <Input placeholder="Buscar fornecedor" />
          <Input placeholder="Especialidade" />
          <Input placeholder="Faixa de custo/hora" />
          <Button>
            <Plus size={14} /> Novo fornecedor
          </Button>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Lista de fornecedores</CardTitle>
          <CardDescription>Visão base para ordenação por especialidade e custo.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e3e9f1] text-[#5b6d84]">
                <th className="px-2 py-2">Fornecedor</th>
                <th className="px-2 py-2">Especialidade</th>
                <th className="px-2 py-2">Custo/hora</th>
                <th className="px-2 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#f0f4f9]">
                <td className="px-2 py-5 text-[#5b6d84]" colSpan={4}>
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
    </>
  );
}
