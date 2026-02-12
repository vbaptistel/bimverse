import { SectionCards } from "@/components/dashboard/section-cards";
import { StatusPieChart } from "@/components/dashboard/status-pie-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardSummaryAction } from "@/modules/dashboard/interface";
import { formatCurrencyBrl } from "@/shared/domain/currency";
import { PROPOSAL_STATUSES, type ProposalStatus } from "@/shared/domain/types";

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  recebida: "Recebida",
  em_elaboracao: "Em elaboração",
  enviada: "Enviada",
  em_revisao: "Em revisão",
  ganha: "Ganha",
  perdida: "Perdida",
  cancelada: "Cancelada",
};

const PROPOSAL_STATUS_COLORS: Record<ProposalStatus, string> = {
  recebida: "#8EBEC3",
  em_elaboracao: "#73AEB4",
  enviada: "#5B9EA6",
  em_revisao: "#4A8D97",
  ganha: "#1B8087",
  perdida: "#D47A88",
  cancelada: "#A5B0B6",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const result = await getDashboardSummaryAction();
  const summary = result.success ? result.data : null;

  const byStatusMap = new Map(summary?.byStatus.map((item) => [item.status, item]) ?? []);
  const byStatus = PROPOSAL_STATUSES.map((status) => ({
    status,
    count: Number(byStatusMap.get(status)?.count ?? 0),
    totalValueBrl: Number(byStatusMap.get(status)?.totalValueBrl ?? 0),
  }));

  const byStatusWithAnyData = byStatus.filter(
    ({ count, totalValueBrl }) => count > 0 || totalValueBrl > 0,
  );
  const statusSlices = byStatusWithAnyData
    .filter(({ totalValueBrl }) => totalValueBrl > 0)
    .map(({ status, count, totalValueBrl }) => ({
      status,
      label: PROPOSAL_STATUS_LABELS[status],
      count,
      valueBrl: totalValueBrl,
      fill: PROPOSAL_STATUS_COLORS[status],
    }));
  const rankedCompanies = summary?.byCompany.filter(({ proposalCount }) => proposalCount > 0) ?? [];

  const sectionCardsData = summary
    ? [
      {
        title: "Propostas totais",
        value: String(summary.totalProposals),
        description: "Total cadastrado no pipeline",
        footerText: `${summary.wonProposals} ganhas e ${summary.lostProposals} perdidas`,
      },
      {
        title: "Taxa de conversão",
        value: percentFormatter.format(summary.conversionRate),
        description: "Ganhas / (Ganhas + Perdidas)",
        trend: summary.conversionRate >= 0.5 ? ("up" as const) : ("down" as const),
        trendValue: percentFormatter.format(summary.conversionRate),
        footerText: "Considera apenas propostas finalizadas",
      },
      {
        title: "Valor estimado",
        value: formatCurrencyBrl(summary.estimatedValueTotalBrl),
        titleTip: "Desconsidera propostas com status perdida e cancelada.",
        description: "Soma do valor estimado das propostas ativas e ganhas",
        footerText: "Base de previsão comercial",
      },
      {
        title: "Valor ganho",
        value: formatCurrencyBrl(summary.wonValueTotalBrl),
        description: "Soma das propostas ganhas (valor final ou estimado)",
        footerText: "Receita confirmada",
      },
    ]
    : [
      {
        title: "Propostas totais",
        value: "—",
        description: "Não foi possível carregar os dados",
        footerText: "Tente atualizar a página",
      },
      {
        title: "Taxa de conversão",
        value: "—",
        description: "Ganhas / (Ganhas + Perdidas)",
        trend: "down" as const,
        trendValue: "—",
        footerText: "Sem dados disponíveis",
      },
      {
        title: "Valor estimado",
        value: "—",
        titleTip: "Desconsidera propostas com status perdida e cancelada.",
        description: "Sem dados disponíveis",
        footerText: "Tente novamente em instantes",
      },
      {
        title: "Valor ganho",
        value: "—",
        description: "Sem dados disponíveis",
        footerText: "Tente novamente em instantes",
      },
    ];

  const hasStatusData = byStatusWithAnyData.length > 0;
  const hasStatusValueData = statusSlices.length > 0;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <SectionCards cards={sectionCardsData} />

      <div className="grid gap-4 lg:grid-cols-[0.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por status (R$)</CardTitle>
            <CardDescription>Composição do pipeline por status em valor monetário.</CardDescription>
          </CardHeader>
          <CardContent>
            {hasStatusValueData ? (
              <StatusPieChart data={statusSlices} />
            ) : hasStatusData ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                Há propostas com valor zerado ou não informado; preencha valores para montar a pizza.
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                Nenhuma proposta registrada ainda.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ranking por cliente</CardTitle>
            <CardDescription>
              Quantidade, somas e conversão com a mesma regra do consolidado geral.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rankedCompanies.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-2 py-2 font-medium">Cliente</th>
                      <th className="px-2 py-2 font-medium">Propostas</th>
                      <th className="px-2 py-2 font-medium">Valor estimado</th>
                      <th className="px-2 py-2 font-medium">Valor ganho</th>
                      <th className="px-2 py-2 font-medium">Conversão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankedCompanies.map((company) => (
                      <tr key={company.companyId} className="border-b border-border/70">
                        <td className="px-2 py-2 font-medium text-foreground">
                          {company.companyName}
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">
                          {company.proposalCount}
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">
                          {formatCurrencyBrl(company.totalEstimatedValueBrl)}
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">
                          {formatCurrencyBrl(company.wonValueTotalBrl)}
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">
                          {percentFormatter.format(company.conversionRate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                Nenhum cliente com propostas registradas ainda.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!result.success ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          Não foi possível carregar o resumo: {result.error}
        </p>
      ) : null}
    </div>
  );
}
