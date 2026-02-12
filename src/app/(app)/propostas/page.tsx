import { Filter, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ProposalsPage() {
  return (
    <>
      <section className="mb-4 rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto_auto]">
          <Input placeholder="Buscar por código, projeto ou cliente" />
          <Input placeholder="Cliente" />
          <Input placeholder="Status" />
          <Button variant="secondary">
            <Filter className="size-3.5" /> Aplicar filtros
          </Button>
          <Button asChild>
            <Link href="/propostas/nova">
              <Plus className="size-3.5" /> Nova proposta
            </Link>
          </Button>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Propostas em andamento</CardTitle>
          <CardDescription>Lista principal com acesso ao detalhe por proposta.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e3e9f1] text-[#5b6d84]">
                <th className="px-2 py-2">Código</th>
                <th className="px-2 py-2">Projeto</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Valor</th>
                <th className="px-2 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#f0f4f9]">
                <td className="px-2 py-5 text-[#5b6d84]" colSpan={5}>
                  Nenhuma proposta cadastrada.
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}
