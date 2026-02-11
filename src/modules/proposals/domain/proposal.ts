import type { ProposalStatus } from "@/shared/domain/types";

export interface Proposal {
  id: string;
  companyId: string;
  code: string;
  seqNumber: number;
  year: number;
  invitationCode: string | null;
  projectName: string;
  scopeDescription: string;
  status: ProposalStatus;
  dueDate: string | null;
  estimatedValueBrl: number | null;
  finalValueBrl: number | null;
  outcomeReason: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProposalRevision {
  id: string;
  proposalId: string;
  revisionNumber: number;
  reason: string | null;
  scopeChanges: string | null;
  discountBrl: number | null;
  discountPercent: number | null;
  valueBeforeBrl: number | null;
  valueAfterBrl: number | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
}
