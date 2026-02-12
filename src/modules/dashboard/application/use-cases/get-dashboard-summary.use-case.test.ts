import { describe, expect, it } from "vitest";

import type {
  DashboardRepositoryPort,
  DashboardSummary,
} from "@/modules/dashboard/application/ports/dashboard-repository.port";
import { GetDashboardSummaryUseCase } from "@/modules/dashboard/application/use-cases/get-dashboard-summary.use-case";

class FakeDashboardRepository implements DashboardRepositoryPort {
  async getSummary(): Promise<DashboardSummary> {
    return {
      totalProposals: 10,
      wonProposals: 4,
      lostProposals: 2,
      conversionRate: 0.66,
      estimatedValueTotalBrl: 120000,
      wonValueTotalBrl: 50000,
      byStatus: [
        { status: "enviada", count: 3, totalValueBrl: 45000 },
        { status: "ganha", count: 4, totalValueBrl: 75000 },
      ],
      byCustomer: [
        {
          customerId: "customer-1",
          customerName: "EGIS",
          proposalCount: 5,
          wonProposals: 3,
          lostProposals: 1,
          conversionRate: 0.75,
          totalEstimatedValueBrl: 70000,
          wonValueTotalBrl: 50000,
        },
      ],
      valueTimelineByStatus: [
        { month: "2025-10", status: "enviada", totalValueBrl: 30000 },
        { month: "2025-10", status: "ganha", totalValueBrl: 15000 },
        { month: "2025-11", status: "ganha", totalValueBrl: 35000 },
      ],
      valueTimelineByCustomer: [
        {
          month: "2025-10",
          customerId: "customer-1",
          customerName: "EGIS",
          totalValueBrl: 45000,
        },
        {
          month: "2025-11",
          customerId: "customer-1",
          customerName: "EGIS",
          totalValueBrl: 35000,
        },
      ],
    };
  }
}

describe("GetDashboardSummaryUseCase", () => {
  it("retorna consolidado de indicadores", async () => {
    const useCase = new GetDashboardSummaryUseCase(new FakeDashboardRepository());

    const summary = await useCase.execute();

    expect(summary.totalProposals).toBe(10);
    expect(summary.byCustomer[0]?.customerName).toBe("EGIS");
  });
});
