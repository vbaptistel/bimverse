import { eq, sql } from "drizzle-orm";

import type {
  DashboardCompanyMetric,
  DashboardRepositoryPort,
  DashboardStatusMetric,
  DashboardSummary,
} from "@/modules/dashboard/application/ports/dashboard-repository.port";
import { companies, proposals } from "@/shared/infrastructure/db/schema";
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
    const [totals] = await this.database
      .select({
        totalProposals: sql<number>`COUNT(*)`,
        wonProposals:
          sql<number>`COUNT(*) FILTER (WHERE ${proposals.status} = 'ganha')`,
        lostProposals:
          sql<number>`COUNT(*) FILTER (WHERE ${proposals.status} = 'perdida')`,
        estimatedValueTotalBrl: sql<string>`COALESCE(SUM(${proposals.estimatedValueBrl}), 0)`,
        wonValueTotalBrl: sql<string>`COALESCE(SUM(${proposals.finalValueBrl}) FILTER (WHERE ${proposals.status} = 'ganha'), 0)`,
      })
      .from(proposals);

    const byStatusRows = await this.database
      .select({
        status: proposals.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(proposals)
      .groupBy(proposals.status);

    const byCompanyRows = await this.database
      .select({
        companyId: companies.id,
        companyName: companies.name,
        proposalCount: sql<number>`COUNT(${proposals.id})`,
        totalEstimatedValueBrl: sql<string>`COALESCE(SUM(${proposals.estimatedValueBrl}), 0)`,
      })
      .from(companies)
      .leftJoin(proposals, eq(proposals.companyId, companies.id))
      .groupBy(companies.id, companies.name)
      .orderBy(sql`COUNT(${proposals.id}) DESC`)
      .limit(10);

    const won = totals?.wonProposals ?? 0;
    const lost = totals?.lostProposals ?? 0;
    const base = won + lost;

    return {
      totalProposals: totals?.totalProposals ?? 0,
      wonProposals: won,
      lostProposals: lost,
      conversionRate: base > 0 ? won / base : 0,
      estimatedValueTotalBrl: toNumber(totals?.estimatedValueTotalBrl),
      wonValueTotalBrl: toNumber(totals?.wonValueTotalBrl),
      byStatus: byStatusRows as DashboardStatusMetric[],
      byCompany: byCompanyRows.map((row) => ({
        ...row,
        totalEstimatedValueBrl: toNumber(row.totalEstimatedValueBrl),
      })) as DashboardCompanyMetric[],
    };
  }
}
