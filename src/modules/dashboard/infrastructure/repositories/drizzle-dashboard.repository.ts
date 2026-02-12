import { eq, sql } from "drizzle-orm";

import type {
  DashboardCustomerMetric,
  DashboardRepositoryPort,
  DashboardStatusMetric,
  DashboardSummary,
} from "@/modules/dashboard/application/ports/dashboard-repository.port";
import { customers, proposals } from "@/shared/infrastructure/db/schema";
import type { db } from "@/shared/infrastructure/db/client";

type Database = typeof db;

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}

export class DrizzleDashboardRepository implements DashboardRepositoryPort {
  constructor(private readonly database: Database) {}

  async getSummary(): Promise<DashboardSummary> {
    const monthBucket = sql`DATE_TRUNC('month', ${proposals.createdAt})`;

    const [totals] = await this.database
      .select({
        totalProposals: sql<number>`COUNT(*)`,
        wonProposals:
          sql<number>`COUNT(*) FILTER (WHERE ${proposals.status} = 'ganha')`,
        lostProposals:
          sql<number>`COUNT(*) FILTER (WHERE ${proposals.status} = 'perdida')`,
        estimatedValueTotalBrl:
          sql<string>`COALESCE(SUM(${proposals.estimatedValueBrl}) FILTER (WHERE ${proposals.status} NOT IN ('perdida', 'cancelada')), 0)`,
        wonValueTotalBrl:
          sql<string>`COALESCE(SUM(COALESCE(${proposals.finalValueBrl}, ${proposals.estimatedValueBrl})) FILTER (WHERE ${proposals.status} = 'ganha'), 0)`,
      })
      .from(proposals);

    const byStatusRows = await this.database
      .select({
        status: proposals.status,
        count: sql<number>`COUNT(*)`,
        totalValueBrl:
          sql<string>`COALESCE(SUM(COALESCE(${proposals.finalValueBrl}, ${proposals.estimatedValueBrl})), 0)`,
      })
      .from(proposals)
      .groupBy(proposals.status);

    const byCustomerRows = await this.database
      .select({
        customerId: customers.id,
        customerName: customers.name,
        proposalCount: sql<number>`COUNT(${proposals.id})`,
        wonProposals:
          sql<number>`COUNT(${proposals.id}) FILTER (WHERE ${proposals.status} = 'ganha')`,
        lostProposals:
          sql<number>`COUNT(${proposals.id}) FILTER (WHERE ${proposals.status} = 'perdida')`,
        totalEstimatedValueBrl:
          sql<string>`COALESCE(SUM(${proposals.estimatedValueBrl}) FILTER (WHERE ${proposals.status} NOT IN ('perdida', 'cancelada')), 0)`,
        wonValueTotalBrl:
          sql<string>`COALESCE(SUM(COALESCE(${proposals.finalValueBrl}, ${proposals.estimatedValueBrl})) FILTER (WHERE ${proposals.status} = 'ganha'), 0)`,
      })
      .from(customers)
      .leftJoin(proposals, eq(proposals.customerId, customers.id))
      .groupBy(customers.id, customers.name)
      .orderBy(sql`COUNT(${proposals.id}) DESC`)
      .limit(10);

    const valueTimelineByStatusRows = await this.database
      .select({
        month: sql<string>`TO_CHAR(${monthBucket}, 'YYYY-MM')`,
        status: proposals.status,
        totalValueBrl:
          sql<string>`COALESCE(SUM(COALESCE(${proposals.finalValueBrl}, ${proposals.estimatedValueBrl})), 0)`,
      })
      .from(proposals)
      .groupBy(monthBucket, proposals.status)
      .orderBy(monthBucket, proposals.status);

    const valueTimelineByCustomerRows = await this.database
      .select({
        month: sql<string>`TO_CHAR(${monthBucket}, 'YYYY-MM')`,
        customerId: customers.id,
        customerName: customers.name,
        totalValueBrl:
          sql<string>`COALESCE(SUM(COALESCE(${proposals.finalValueBrl}, ${proposals.estimatedValueBrl})), 0)`,
      })
      .from(proposals)
      .innerJoin(customers, eq(customers.id, proposals.customerId))
      .groupBy(monthBucket, customers.id, customers.name)
      .orderBy(monthBucket, customers.name);

    const won = toNumber(totals?.wonProposals);
    const lost = toNumber(totals?.lostProposals);
    const base = won + lost;

    return {
      totalProposals: toNumber(totals?.totalProposals),
      wonProposals: won,
      lostProposals: lost,
      conversionRate: base > 0 ? won / base : 0,
      estimatedValueTotalBrl: toNumber(totals?.estimatedValueTotalBrl),
      wonValueTotalBrl: toNumber(totals?.wonValueTotalBrl),
      byStatus: byStatusRows.map((row) => ({
        status: row.status,
        count: toNumber(row.count),
        totalValueBrl: toNumber(row.totalValueBrl),
      })) as DashboardStatusMetric[],
      byCustomer: byCustomerRows.map((row) => {
        const proposalCount = toNumber(row.proposalCount);
        const customerWon = toNumber(row.wonProposals);
        const customerLost = toNumber(row.lostProposals);
        const conversionBase = customerWon + customerLost;

        return {
          ...row,
          proposalCount,
          wonProposals: customerWon,
          lostProposals: customerLost,
          conversionRate: conversionBase > 0 ? customerWon / conversionBase : 0,
          totalEstimatedValueBrl: toNumber(row.totalEstimatedValueBrl),
          wonValueTotalBrl: toNumber(row.wonValueTotalBrl),
        };
      }) as DashboardCustomerMetric[],
      valueTimelineByStatus: valueTimelineByStatusRows.map((row) => ({
        month: row.month,
        status: row.status,
        totalValueBrl: toNumber(row.totalValueBrl),
      })),
      valueTimelineByCustomer: valueTimelineByCustomerRows.map((row) => ({
        month: row.month,
        customerId: row.customerId,
        customerName: row.customerName,
        totalValueBrl: toNumber(row.totalValueBrl),
      })),
    };
  }
}
