import type { ProposalRevision } from "@/modules/proposals/domain/proposal";

export interface CreateRevisionRecordInput {
  proposalId: string;
  revisionNumber: number;
  reason?: string | null;
  scopeChanges?: string | null;
  discountBrl?: number | null;
  discountPercent?: number | null;
  valueBeforeBrl?: number | null;
  valueAfterBrl?: number | null;
  notes?: string | null;
  createdBy: string;
}

export interface RevisionRepositoryPort {
  getNextRevisionNumber(proposalId: string): Promise<number>;
  createRevision(input: CreateRevisionRecordInput): Promise<ProposalRevision>;
}
