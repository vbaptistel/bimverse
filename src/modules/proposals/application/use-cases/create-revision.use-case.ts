import type { ProposalRevision } from "@/modules/proposals/domain/proposal";
import type { ProposalRepositoryPort } from "@/modules/proposals/application/ports/proposal-repository.port";
import type { RevisionRepositoryPort } from "@/modules/proposals/application/ports/revision-repository.port";
import type { UseCase } from "@/shared/application/use-case";
import { NotFoundError, ValidationError } from "@/shared/domain/errors";

export interface CreateRevisionInput {
  proposalId: string;
  reason: string;
  scopeChanges?: string | null;
  discountBrl?: number | null;
  discountPercent?: number | null;
  valueBeforeBrl?: number | null;
  valueAfterBrl?: number | null;
  notes?: string | null;
  createdBy: string;
}

export type CreateRevisionOutput = ProposalRevision;

export class CreateRevisionUseCase
  implements UseCase<CreateRevisionInput, CreateRevisionOutput>
{
  constructor(
    private readonly proposalRepository: ProposalRepositoryPort,
    private readonly revisionRepository: RevisionRepositoryPort,
  ) {}

  async execute(input: CreateRevisionInput): Promise<CreateRevisionOutput> {
    const proposal = await this.proposalRepository.getProposalById(input.proposalId);
    if (!proposal) {
      throw new NotFoundError("Proposta não encontrada");
    }

    if (!input.reason.trim()) {
      throw new ValidationError("Motivo da revisão é obrigatório");
    }

    const nextRevision = await this.revisionRepository.getNextRevisionNumber(
      input.proposalId,
    );

    return this.revisionRepository.createRevision({
      proposalId: input.proposalId,
      revisionNumber: nextRevision,
      reason: input.reason,
      scopeChanges: input.scopeChanges,
      discountBrl: input.discountBrl,
      discountPercent: input.discountPercent,
      valueBeforeBrl: input.valueBeforeBrl,
      valueAfterBrl: input.valueAfterBrl,
      notes: input.notes,
      createdBy: input.createdBy,
    });
  }
}
