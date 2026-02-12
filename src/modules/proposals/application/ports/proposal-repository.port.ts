import type { Proposal } from "@/modules/proposals/domain/proposal";
import type { ProposalStatus } from "@/shared/domain/types";

export interface CompanyLookup {
  id: string;
  slug: string;
}

export interface ProposalStorageContext {
  proposalId: string;
  companySlug: string;
  proposalCode: string;
  year: number;
}

export interface ListProposalsFilters {
  search?: string | null;
  status?: ProposalStatus | null;
}

export interface CreateProposalRecordInput {
  companyId: string;
  code: string;
  seqNumber: number;
  year: number;
  invitationCode?: string | null;
  projectName: string;
  scopeDescription: string;
  dueDate?: string | null;
  estimatedValueBrl?: number | null;
  finalValueBrl?: number | null;
  outcomeReason?: string | null;
  createdBy: string;
}

export interface UpdateProposalStatusInput {
  proposalId: string;
  status: ProposalStatus;
  outcomeReason?: string | null;
  finalValueBrl?: number | null;
}

export interface ProposalRepositoryPort {
  getCompanyById(companyId: string): Promise<CompanyLookup | null>;
  findMany(filters?: ListProposalsFilters): Promise<Proposal[]>;
  allocateNextSequence(companyId: string, year: number): Promise<number>;
  createProposal(input: CreateProposalRecordInput): Promise<Proposal>;
  getProposalById(proposalId: string): Promise<Proposal | null>;
  getProposalStorageContext(
    proposalId: string,
  ): Promise<ProposalStorageContext | null>;
  updateProposalStatus(input: UpdateProposalStatusInput): Promise<Proposal>;
}
