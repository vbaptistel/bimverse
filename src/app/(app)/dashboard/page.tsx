import { SectionCards } from "@/components/dashboard/section-cards";
import { StatusPieChart } from "@/components/dashboard/status-pie-chart";
import {
  ValueOverTimeAreaChart,
  type ValueOverTimeSeries,
} from "@/components/dashboard/value-over-time-area-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardSummaryAction } from "@/modules/dashboard/interface";
import { formatCurrencyBrl } from "@/shared/domain/currency";
import { PROPOSAL_STATUSES, type ProposalStatus } from "@/shared/domain/types";

type DashboardSummary = Extract<
  Awaited<ReturnType<typeof getDashboardSummaryAction>>,
  { success: true; }
>["data"];

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const monthShortFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  timeZone: "UTC",
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

const CUSTOMER_SERIES_COLORS = [
  "#1B8087",
  "#4A8D97",
  "#5B9EA6",
  "#73AEB4",
  "#98795C",
  "#AD6871",
];

const OTHER_CUSTOMERS_SERIES_KEY = "__outros_clientes__";

function monthKeyToIndex(monthKey: string): number | null {
  const [yearPart, monthPart] = monthKey.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return year * 12 + (month - 1);
}

function monthIndexToKey(index: number): string {
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;

  return `${year}-${String(month).padStart(2, "0")}`;
}

function buildContinuousMonthKeys(monthKeys: string[]): string[] {
  const indexes = monthKeys
    .map((monthKey) => monthKeyToIndex(monthKey))
    .filter((index): index is number => index !== null)
    .sort((left, right) => left - right);

  if (indexes.length === 0) {
    return [];
  }

  const first = indexes[0];
  const last = indexes[indexes.length - 1];
  const range: string[] = [];

  for (let monthIndex = first; monthIndex <= last; monthIndex += 1) {
    range.push(monthIndexToKey(monthIndex));
  }

  return range;
}

function formatMonthLabel(monthKey: string): string {
  const monthIndex = monthKeyToIndex(monthKey);

  if (monthIndex === null) {
    return monthKey;
  }

  const year = Math.floor(monthIndex / 12);
  const month = monthIndex % 12;
  const monthLabel = monthShortFormatter
    .format(new Date(Date.UTC(year, month, 1)))
    .replace(/\./g, "");

  return `${monthLabel}/${String(year).slice(-2)}`;
}

function buildStatusValueSeries(summary: DashboardSummary | null): ValueOverTimeSeries {
  const rows = summary?.valueTimelineByStatus ?? [];
  const monthKeys = buildContinuousMonthKeys(rows.map((row) => row.month));
  const valuesByMonth = new Map<string, Map<ProposalStatus, number>>();

  for (const row of rows) {
    const monthValues = valuesByMonth.get(row.month) ?? new Map<ProposalStatus, number>();
    monthValues.set(row.status, (monthValues.get(row.status) ?? 0) + row.totalValueBrl);
    valuesByMonth.set(row.month, monthValues);
  }

  const segments = PROPOSAL_STATUSES
    .filter((status) => rows.some((row) => row.status === status && row.totalValueBrl > 0))
    .map((status) => ({
      key: status,
      label: PROPOSAL_STATUS_LABELS[status],
      color: PROPOSAL_STATUS_COLORS[status],
    }));

  return {
    points: monthKeys.map((month) => ({
      period: month,
      label: formatMonthLabel(month),
      values: segments.reduce<Record<string, number>>((accumulator, segment) => {
        const monthValues = valuesByMonth.get(month);
        accumulator[segment.key] = monthValues?.get(segment.key as ProposalStatus) ?? 0;
        return accumulator;
      }, {}),
    })),
    segments,
    emptyMessage: "Nenhum valor com segmentação por status disponível para exibir.",
  };
}

function buildCustomerValueSeries(summary: DashboardSummary | null): ValueOverTimeSeries {
  const rows = summary?.valueTimelineByCustomer ?? [];
  const monthKeys = buildContinuousMonthKeys(rows.map((row) => row.month));
  const totalsByCustomer = new Map<string, { name: string; totalValueBrl: number; }>();

  for (const row of rows) {
    const current = totalsByCustomer.get(row.customerId);
    totalsByCustomer.set(row.customerId, {
      name: row.customerName,
      totalValueBrl: (current?.totalValueBrl ?? 0) + row.totalValueBrl,
    });
  }

  const topCustomers = [...totalsByCustomer.entries()]
    .filter(([, customer]) => customer.totalValueBrl > 0)
    .sort((left, right) => right[1].totalValueBrl - left[1].totalValueBrl)
    .slice(0, 6);
  const topCustomerIds = new Set(topCustomers.map(([customerId]) => customerId));

  const valuesByMonth = new Map<string, Map<string, number>>();
  let hasOtherCustomers = false;

  for (const row of rows) {
    const segmentKey = topCustomerIds.has(row.customerId)
      ? row.customerId
      : OTHER_CUSTOMERS_SERIES_KEY;

    if (segmentKey === OTHER_CUSTOMERS_SERIES_KEY && row.totalValueBrl > 0) {
      hasOtherCustomers = true;
    }

    const monthValues = valuesByMonth.get(row.month) ?? new Map<string, number>();
    monthValues.set(segmentKey, (monthValues.get(segmentKey) ?? 0) + row.totalValueBrl);
    valuesByMonth.set(row.month, monthValues);
  }

  const segments = topCustomers.map(([customerId, customer], index) => ({
    key: customerId,
    label: customer.name,
    color: CUSTOMER_SERIES_COLORS[index % CUSTOMER_SERIES_COLORS.length],
  }));

  if (hasOtherCustomers) {
    segments.push({
      key: OTHER_CUSTOMERS_SERIES_KEY,
      label: "Outros",
      color: "#A5B0B6",
    });
  }

  return {
    points: monthKeys.map((month) => ({
      period: month,
      label: formatMonthLabel(month),
      values: segments.reduce<Record<string, number>>((accumulator, segment) => {
        const monthValues = valuesByMonth.get(month);
        accumulator[segment.key] = monthValues?.get(segment.key) ?? 0;
        return accumulator;
      }, {}),
    })),
    segments,
    emptyMessage: "Nenhum valor com segmentação por cliente disponível para exibir.",
  };
}

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
  const rankedCustomers = summary?.byCustomer.filter(({ proposalCount }) => proposalCount > 0) ?? [];
  const statusValueSeries = buildStatusValueSeries(summary);
  const customerValueSeries = buildCustomerValueSeries(summary);

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

      <Card>
        <CardHeader>
          <CardTitle>Evolução de valores no tempo</CardTitle>
          <CardDescription>
            Soma mensal por data de criação (valor final quando houver, senão estimado),
            com alternância por status ou cliente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ValueOverTimeAreaChart byStatus={statusValueSeries} byCustomer={customerValueSeries} />
        </CardContent>
      </Card>

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
            {rankedCustomers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-2 py-2 font-medium">Cliente</th>
                      <th className="px-2 py-2 font-medium text-right">Valor estimado</th>
                      <th className="px-2 py-2 font-medium text-right">Valor ganho</th>
                      <th className="px-2 py-2 font-medium text-right">Conversão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankedCustomers.map((customer) => (
                      <tr key={customer.customerId} className="border-b border-border/70">
                        <td className="px-2 py-2 font-medium text-foreground">
                          {customer.customerName} ({customer.proposalCount})
                        </td>
                        <td className="px-2 py-2 text-muted-foreground text-right">
                          {formatCurrencyBrl(customer.totalEstimatedValueBrl)}
                        </td>
                        <td className="px-2 py-2 text-muted-foreground text-right">
                          {formatCurrencyBrl(customer.wonValueTotalBrl)}
                        </td>
                        <td className="px-2 py-2 text-muted-foreground text-right">
                          {percentFormatter.format(customer.conversionRate)}
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
