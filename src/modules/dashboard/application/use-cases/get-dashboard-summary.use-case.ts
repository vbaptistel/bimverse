import type { UseCase } from "@/shared/application/use-case";
import type {
  DashboardRepositoryPort,
  DashboardSummary,
} from "@/modules/dashboard/application/ports/dashboard-repository.port";

export class GetDashboardSummaryUseCase
  implements UseCase<void, DashboardSummary>
{
  constructor(private readonly dashboardRepository: DashboardRepositoryPort) {}

  async execute(): Promise<DashboardSummary> {
    return this.dashboardRepository.getSummary();
  }
}
