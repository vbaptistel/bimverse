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

export interface UpdateRevisionRecordInput {
  revisionId: string;
  reason?: string | null;
  scopeChanges?: string | null;
  discountBrl?: number | null;
  discountPercent?: number | null;
  valueBeforeBrl?: number | null;
  valueAfterBrl?: number | null;
  notes?: string | null;
}

export interface RevisionRepositoryPort {
  getNextRevisionNumber(proposalId: string): Promise<number>;
  findById(revisionId: string): Promise<ProposalRevision | null>;
  findManyByProposalId(proposalId: string): Promise<ProposalRevision[]>;
  createRevision(input: CreateRevisionRecordInput): Promise<ProposalRevision>;
  updateRevision(input: UpdateRevisionRecordInput): Promise<ProposalRevision>;
  deleteById(revisionId: string): Promise<void>;
}
