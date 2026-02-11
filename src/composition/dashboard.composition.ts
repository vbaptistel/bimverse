import { GetDashboardSummaryUseCase } from "@/modules/dashboard/application/use-cases/get-dashboard-summary.use-case";
import { DrizzleDashboardRepository } from "@/modules/dashboard/infrastructure/repositories/drizzle-dashboard.repository";
import { db } from "@/shared/infrastructure/db/client";

export function buildDashboardComposition() {
  const dashboardRepository = new DrizzleDashboardRepository(db);

  return {
    getDashboardSummaryUseCase: new GetDashboardSummaryUseCase(dashboardRepository),
  };
}
