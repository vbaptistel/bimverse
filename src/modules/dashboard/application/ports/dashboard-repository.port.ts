export interface DashboardStatusMetric {
  status: string;
  count: number;
}

export interface DashboardCompanyMetric {
  companyId: string;
  companyName: string;
  proposalCount: number;
  totalEstimatedValueBrl: number;
}

export interface DashboardSummary {
  totalProposals: number;
  wonProposals: number;
  lostProposals: number;
  conversionRate: number;
  estimatedValueTotalBrl: number;
  wonValueTotalBrl: number;
  byStatus: DashboardStatusMetric[];
  byCompany: DashboardCompanyMetric[];
}

export interface DashboardRepositoryPort {
  getSummary(): Promise<DashboardSummary>;
}
