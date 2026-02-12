import { SectionCards } from "@/components/dashboard/section-cards";
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

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const result = await getDashboardSummaryAction();
  const summary = result.success ? result.data : null;

  const byStatusMap = new Map(
    summary?.byStatus.map(({ status, count }) => [status, count]) ?? [],
  );
  const byStatus = PROPOSAL_STATUSES.map((status) => ({
    status,
    count: byStatusMap.get(status) ?? 0,
  }));

  const maxStatusCount = Math.max(1, ...byStatus.map(({ count }) => count));
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
        description: "Soma do valor estimado de todas as propostas",
        footerText: "Base de previsão comercial",
      },
      {
        title: "Valor ganho",
        value: formatCurrencyBrl(summary.wonValueTotalBrl),
        description: "Soma do valor final das propostas ganhas",
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

  const hasStatusData = byStatus.some(({ count }) => count > 0);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <SectionCards cards={sectionCardsData} />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Funil por status</CardTitle>
            <CardDescription>Distribuição atual das propostas por etapa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {hasStatusData ? (
              byStatus.map(({ status, count }) => (
                <div key={status}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-foreground">{PROPOSAL_STATUS_LABELS[status]}</span>
                    <span className="font-medium text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${(count / maxStatusCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))
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
            <CardDescription>Quantidade e valor total de propostas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rankedCompanies.length > 0 ? (
              rankedCompanies.map((company) => (
                <div key={company.companyId} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-foreground">{company.companyName}</p>
                    <p className="text-xs text-muted-foreground">
                      {company.proposalCount} propostas
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Valor estimado: {formatCurrencyBrl(company.totalEstimatedValueBrl)}
                  </p>
                </div>
              ))
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
