import {
  isFinalStatus,
  isValidProposalStatusTransition,
} from "@/modules/proposals/domain/proposal-status-transition";
import type { Proposal } from "@/modules/proposals/domain/proposal";
import type { ActivityLogRepositoryPort } from "@/modules/proposals/application/ports/activity-log-repository.port";
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
  statusDate?: string | null;
  changedBy: string;
}

export type UpdateProposalStatusUseCaseOutput = Proposal;

export class UpdateProposalStatusUseCase
  implements
    UseCase<UpdateProposalStatusUseCaseInput, UpdateProposalStatusUseCaseOutput>
{
  constructor(
    private readonly proposalRepository: ProposalRepositoryPort,
    private readonly activityLogRepository: ActivityLogRepositoryPort,
  ) {}

  async execute(
    input: UpdateProposalStatusUseCaseInput,
  ): Promise<UpdateProposalStatusUseCaseOutput> {
    if (input.status === "em_revisao") {
      throw new ValidationError(
        "Status em revisão só pode ser iniciado pelo botão Criar nova revisão",
      );
    }

    const current = await this.proposalRepository.getProposalById(input.proposalId);
    if (!current) {
      throw new NotFoundError("Proposta não encontrada");
    }

    const normalizedOutcomeReason = input.outcomeReason?.trim() || null;
    const normalizedStatusDate = input.statusDate?.trim() || null;
    const statusSupportsDate = input.status === "enviada" || input.status === "ganha";

    if (!statusSupportsDate && normalizedStatusDate) {
      throw new ValidationError(
        "Data de evento só pode ser informada para status enviada ou ganha",
      );
    }

    const statusDate = statusSupportsDate ? normalizedStatusDate : null;

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
      !normalizedOutcomeReason
    ) {
      throw new ValidationError(
        "Motivo é obrigatório para propostas perdidas ou canceladas",
      );
    }

    const outcomeReason =
      isFinalStatus(input.status) && input.status !== "ganha"
        ? normalizedOutcomeReason
        : null;

    const updateInput: UpdateProposalStatusInput = {
      proposalId: input.proposalId,
      status: input.status,
      outcomeReason,
      finalValueBrl: input.finalValueBrl,
    };

    if (current.status === "em_revisao") {
      throw new ValidationError(
        "Enquanto a proposta estiver em revisão, use fechar ou cancelar revisão",
      );
    }

    const updatedProposal = await this.proposalRepository.updateProposalStatus(
      updateInput,
    );

    if (current.status !== input.status) {
      await this.activityLogRepository.create({
        entityType: "proposal",
        entityId: current.id,
        action: "status_changed",
        metadata: {
          from: current.status,
          to: input.status,
          source: "manual",
          outcomeReason,
          finalValueBrl: input.finalValueBrl ?? null,
          statusDate,
        },
        createdBy: input.changedBy,
      });
    }

    return updatedProposal;
  }
}
