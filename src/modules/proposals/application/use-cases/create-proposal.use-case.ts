import { buildProposalCode } from "@/modules/proposals/domain/proposal-code";
import type { Proposal, ProposalRevision } from "@/modules/proposals/domain/proposal";
import type { ProposalRepositoryPort } from "@/modules/proposals/application/ports/proposal-repository.port";
import type { RevisionRepositoryPort } from "@/modules/proposals/application/ports/revision-repository.port";
import type { UseCase } from "@/shared/application/use-case";
import { NotFoundError } from "@/shared/domain/errors";

export interface CreateProposalInput {
  customerId: string;
  year: number;
  invitationCode?: string | null;
  projectName: string;
  scopeDescription: string;
  dueDate?: string | null;
  estimatedValueBrl?: number | null;
  createdBy: string;
}

export interface CreateProposalOutput {
  proposal: Proposal;
  initialRevision: ProposalRevision;
}

export class CreateProposalUseCase
  implements UseCase<CreateProposalInput, CreateProposalOutput>
{
  constructor(
    private readonly proposalRepository: ProposalRepositoryPort,
    private readonly revisionRepository: RevisionRepositoryPort,
  ) {}

  async execute(input: CreateProposalInput): Promise<CreateProposalOutput> {
    const customer = await this.proposalRepository.getCustomerById(input.customerId);
    if (!customer) {
      throw new NotFoundError("Cliente não encontrado");
    }

    const sequence = await this.proposalRepository.allocateNextSequence(
      customer.id,
      input.year,
    );

    const code = buildProposalCode({
      customerSlug: customer.slug,
      year: input.year,
      sequence,
    });

    const proposal = await this.proposalRepository.createProposal({
      customerId: input.customerId,
      code,
      seqNumber: sequence,
      year: input.year,
      invitationCode: input.invitationCode,
      projectName: input.projectName,
      scopeDescription: input.scopeDescription,
      dueDate: input.dueDate,
      estimatedValueBrl: input.estimatedValueBrl,
      createdBy: input.createdBy,
    });

    const initialRevision = await this.revisionRepository.createRevision({
      proposalId: proposal.id,
      revisionNumber: 0,
      reason: null,
      valueAfterBrl: input.estimatedValueBrl,
      createdBy: input.createdBy,
    });

    return {
      proposal,
      initialRevision,
    };
  }
}
