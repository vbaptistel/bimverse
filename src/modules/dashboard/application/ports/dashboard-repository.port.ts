export interface DashboardStatusMetric {
  status: string;
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

export interface DashboardSummary {
  totalProposals: number;
  wonProposals: number;
  lostProposals: number;
  conversionRate: number;
  estimatedValueTotalBrl: number;
  wonValueTotalBrl: number;
  byStatus: DashboardStatusMetric[];
  byCustomer: DashboardCustomerMetric[];
}

export interface DashboardRepositoryPort {
  getSummary(): Promise<DashboardSummary>;
}
