import { ChartNoAxesCombined, TrendingUp, Trophy } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const kpis = [
  {
    title: "Propostas no mês",
    value: "—",
    note: "Sem dados consolidados ainda",
    icon: <ChartNoAxesCombined size={16} />,
  },
  {
    title: "Taxa de conversão",
    value: "—",
    note: "Ganhas / (Ganhas + Perdidas)",
    icon: <TrendingUp size={16} />,
  },
  {
    title: "Valor ganho",
    value: "—",
    note: "Aguardando propostas finalizadas",
    icon: <Trophy size={16} />,
  },
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        badge="Comercial"
        title="Dashboard de Propostas"
        description="Visão gerencial de conversão, valores e performance por cliente."
        action={<Button variant="secondary">Exportar resumo</Button>}
      />

      <section className="grid gap-4 md:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader>
              <CardDescription className="flex items-center gap-2 text-[#0f766e]">
                {kpi.icon}
                {kpi.title}
              </CardDescription>
              <CardTitle className="text-3xl">{kpi.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#5b6d84]">{kpi.note}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Funil por status</CardTitle>
            <CardDescription>Estrutura visual pronta para dados reais do banco.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ["recebida", 0],
              ["em_elaboracao", 0],
              ["enviada", 0],
              ["em_revisao", 0],
              ["ganha", 0],
              ["perdida", 0],
            ].map(([status, count]) => (
              <div key={status as string}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="capitalize text-[#0b1220]">{status as string}</span>
                  <span className="font-medium text-[#42556d]">{count as number}</span>
                </div>
                <div className="h-2 rounded-full bg-[#ecf1f7]">
                  <div
                    className="h-2 rounded-full bg-[#0f766e]"
                    style={{ width: `${Math.min(100, (count as number) * 10)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ranking por cliente</CardTitle>
            <CardDescription>Quantidade e valor total de propostas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-dashed border-[#c9d5e2] bg-[#f8fbff] p-4 text-sm text-[#5b6d84]">
              Nenhum cliente com propostas registradas ainda.
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
