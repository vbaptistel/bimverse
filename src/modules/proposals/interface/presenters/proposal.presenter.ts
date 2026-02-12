import type { Proposal, ProposalRevision } from "@/modules/proposals/domain/proposal";
import type { ProposalStatus } from "@/shared/domain/types";

export interface ProposalPresenter {
  id: string;
  companyId: string;
  code: string;
  seqNumber: number;
  year: number;
  projectName: string;
  status: ProposalStatus;
  estimatedValueBrl: number | null;
  finalValueBrl: number | null;
  createdAt: string;
}

export interface ProposalRevisionPresenter {
  id: string;
  revisionNumber: number;
  reason: string | null;
  valueBeforeBrl: number | null;
  valueAfterBrl: number | null;
  createdAt: string;
}

export function presentProposal(proposal: Proposal): ProposalPresenter {
  return {
    id: proposal.id,
    companyId: proposal.companyId,
    code: proposal.code,
    seqNumber: proposal.seqNumber,
    year: proposal.year,
    projectName: proposal.projectName,
    status: proposal.status,
    estimatedValueBrl: proposal.estimatedValueBrl,
    finalValueBrl: proposal.finalValueBrl,
    createdAt: proposal.createdAt.toISOString(),
  };
}

export function presentRevision(
  revision: ProposalRevision,
): ProposalRevisionPresenter {
  return {
    id: revision.id,
    revisionNumber: revision.revisionNumber,
    reason: revision.reason,
    valueBeforeBrl: revision.valueBeforeBrl,
    valueAfterBrl: revision.valueAfterBrl,
    createdAt: revision.createdAt.toISOString(),
  };
}
