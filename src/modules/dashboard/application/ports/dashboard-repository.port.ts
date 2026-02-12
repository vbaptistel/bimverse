import type { ProposalStatus } from "@/shared/domain/types";

export interface DashboardStatusMetric {
  status: ProposalStatus;
  count: number;
  totalValueBrl: number;
}

export interface DashboardCustomerMetric {
  customerId: string;
  customerName: string;
  proposalCount: number;
  wonProposals: number;
  lostProposals: number;
  conversionRate: number;
  totalEstimatedValueBrl: number;
  wonValueTotalBrl: number;
}

export interface DashboardValueTimelineByStatusMetric {
  month: string;
  status: ProposalStatus;
  totalValueBrl: number;
}

export interface DashboardValueTimelineByCustomerMetric {
  month: string;
  customerId: string;
  customerName: string;
  totalValueBrl: number;
}

export interface DashboardSummary {
  totalProposals: number;
  wonProposals: number;
  lostProposals: number;
  conversionRate: number;
  estimatedValueTotalBrl: number;
  wonValueTotalBrl: number;
  byStatus: DashboardStatusMetric[];
  byCustomer: DashboardCustomerMetric[];
  valueTimelineByStatus: DashboardValueTimelineByStatusMetric[];
  valueTimelineByCustomer: DashboardValueTimelineByCustomerMetric[];
}

export interface DashboardRepositoryPort {
  getSummary(): Promise<DashboardSummary>;
}
