import { SectionCards } from "@/components/dashboard/section-cards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const sectionCardsData = [
  {
    title: "Propostas no mês",
    value: "—",
    description: "Sem dados consolidados ainda",
    footerText: "Aguardando propostas no período",
  },
  {
    title: "Taxa de conversão",
    value: "—",
    description: "Ganhas / (Ganhas + Perdidas)",
    trend: "up" as const,
    trendValue: "0%",
    footerText: "Trending this month",
  },
  {
    title: "Valor ganho",
    value: "—",
    description: "Aguardando propostas finalizadas",
    footerText: "Total de propostas ganhas",
  },
  {
    title: "Performance",
    value: "—",
    trend: "up" as const,
    trendValue: "—",
    footerText: "Steady performance",
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <SectionCards cards={sectionCardsData} />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Funil por status</CardTitle>
            <CardDescription>
              Estrutura visual pronta para dados reais do banco.
            </CardDescription>
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
                  <span className="capitalize text-foreground">{status as string}</span>
                  <span className="font-medium text-muted-foreground">{count as number}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
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
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Nenhum cliente com propostas registradas ainda.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
