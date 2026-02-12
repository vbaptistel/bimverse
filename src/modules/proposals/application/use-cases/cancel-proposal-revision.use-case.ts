import type { Proposal } from "@/modules/proposals/domain/proposal";
import type { ActivityLogRepositoryPort } from "@/modules/proposals/application/ports/activity-log-repository.port";
import type { ProposalRepositoryPort } from "@/modules/proposals/application/ports/proposal-repository.port";
import { findPendingRevisionCycle } from "@/modules/proposals/application/use-cases/revision-cycle.utils";
import type { UseCase } from "@/shared/application/use-case";
import { NotFoundError, ValidationError } from "@/shared/domain/errors";

export interface CancelProposalRevisionInput {
  proposalId: string;
  canceledBy: string;
}

export type CancelProposalRevisionOutput = Proposal;

export class CancelProposalRevisionUseCase
  implements UseCase<CancelProposalRevisionInput, CancelProposalRevisionOutput>
{
  constructor(
    private readonly proposalRepository: ProposalRepositoryPort,
    private readonly activityLogRepository: ActivityLogRepositoryPort,
  ) {}

  async execute(
    input: CancelProposalRevisionInput,
  ): Promise<CancelProposalRevisionOutput> {
    const [proposal, activityEvents] = await Promise.all([
      this.proposalRepository.getProposalById(input.proposalId),
      this.activityLogRepository.findManyByEntity("proposal", input.proposalId),
    ]);

    if (!proposal) {
      throw new NotFoundError("Proposta não encontrada");
    }

    if (proposal.status !== "em_revisao") {
      throw new ValidationError("A proposta não está em revisão para cancelamento");
    }

    const pendingCycle = findPendingRevisionCycle(activityEvents);
    if (!pendingCycle) {
      throw new ValidationError("Não há ciclo de revisão pendente para cancelar");
    }

    await this.proposalRepository.updateBaseFields({
      proposalId: proposal.id,
      projectName: proposal.projectName,
      invitationCode: proposal.invitationCode,
      scopeDescription: pendingCycle.snapshot.scopeDescription,
      dueDate: pendingCycle.snapshot.dueDate,
      estimatedValueBrl: pendingCycle.snapshot.estimatedValueBrl,
    });

    const updatedProposal = await this.proposalRepository.updateProposalStatus({
      proposalId: proposal.id,
      status: "enviada",
    });

    await this.activityLogRepository.create({
      entityType: "proposal",
      entityId: proposal.id,
      action: "revision_cycle_canceled",
      metadata: {
        cycleId: pendingCycle.cycleId,
      },
      createdBy: input.canceledBy,
    });

    await this.activityLogRepository.create({
      entityType: "proposal",
      entityId: proposal.id,
      action: "status_changed",
      metadata: {
        from: "em_revisao",
        to: "enviada",
        source: "revision_cycle_cancel",
      },
      createdBy: input.canceledBy,
    });

    return updatedProposal;
  }
}
