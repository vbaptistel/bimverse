import {
  isFinalStatus,
  isValidProposalStatusTransition,
} from "@/modules/proposals/domain/proposal-status-transition";
import type { Proposal } from "@/modules/proposals/domain/proposal";
import type {
  ProposalRepositoryPort,
  UpdateProposalStatusInput,
} from "@/modules/proposals/application/ports/proposal-repository.port";
import type { UseCase } from "@/shared/application/use-case";
import { NotFoundError, ValidationError } from "@/shared/domain/errors";
import type { ProposalStatus } from "@/shared/domain/types";

export interface UpdateProposalStatusUseCaseInput {
  proposalId: string;
  status: ProposalStatus;
  outcomeReason?: string | null;
  finalValueBrl?: number | null;
}

export type UpdateProposalStatusUseCaseOutput = Proposal;

export class UpdateProposalStatusUseCase
  implements
    UseCase<UpdateProposalStatusUseCaseInput, UpdateProposalStatusUseCaseOutput>
{
  constructor(private readonly proposalRepository: ProposalRepositoryPort) {}

  async execute(
    input: UpdateProposalStatusUseCaseInput,
  ): Promise<UpdateProposalStatusUseCaseOutput> {
    const current = await this.proposalRepository.getProposalById(input.proposalId);
    if (!current) {
      throw new NotFoundError("Proposta não encontrada");
    }

    if (
      !isValidProposalStatusTransition(current.status, input.status) &&
      current.status !== input.status
    ) {
      throw new ValidationError(
        `Transição inválida de status (${current.status} -> ${input.status})`,
      );
    }

    if (
      isFinalStatus(input.status) &&
      input.status !== "ganha" &&
      !input.outcomeReason
    ) {
      throw new ValidationError(
        "Motivo é obrigatório para propostas perdidas ou canceladas",
      );
    }

    const updateInput: UpdateProposalStatusInput = {
      proposalId: input.proposalId,
      status: input.status,
      outcomeReason: input.outcomeReason,
      finalValueBrl: input.finalValueBrl,
    };

    return this.proposalRepository.updateProposalStatus(updateInput);
  }
}
