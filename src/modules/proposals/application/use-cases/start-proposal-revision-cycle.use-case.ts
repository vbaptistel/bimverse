import { randomUUID } from "node:crypto";

import type { ActivityLogRepositoryPort } from "@/modules/proposals/application/ports/activity-log-repository.port";
import type { ProposalRepositoryPort } from "@/modules/proposals/application/ports/proposal-repository.port";
import type { ProposalSupplierRepositoryPort } from "@/modules/proposals/application/ports/proposal-supplier-repository.port";
import type { RevisionRepositoryPort } from "@/modules/proposals/application/ports/revision-repository.port";
import { findPendingRevisionCycle } from "@/modules/proposals/application/use-cases/revision-cycle.utils";
import type { Proposal } from "@/modules/proposals/domain/proposal";
import type { UseCase } from "@/shared/application/use-case";
import { NotFoundError, ValidationError } from "@/shared/domain/errors";

export interface StartProposalRevisionCycleInput {
  proposalId: string;
  startedBy: string;
}

export interface StartProposalRevisionCycleOutput {
  proposal: Proposal;
  cycleId: string;
}

export class StartProposalRevisionCycleUseCase
  implements
    UseCase<StartProposalRevisionCycleInput, StartProposalRevisionCycleOutput>
{
  constructor(
    private readonly proposalRepository: ProposalRepositoryPort,
    private readonly revisionRepository: RevisionRepositoryPort,
    private readonly proposalSupplierRepository: ProposalSupplierRepositoryPort,
    private readonly activityLogRepository: ActivityLogRepositoryPort,
  ) {}

  async execute(
    input: StartProposalRevisionCycleInput,
  ): Promise<StartProposalRevisionCycleOutput> {
    const [proposal, events, revisions] = await Promise.all([
      this.proposalRepository.getProposalById(input.proposalId),
      this.activityLogRepository.findManyByEntity("proposal", input.proposalId),
      this.revisionRepository.findManyByProposalId(input.proposalId),
    ]);

    if (!proposal) {
      throw new NotFoundError("Proposta não encontrada");
    }

    if (proposal.status !== "enviada") {
      throw new ValidationError(
        "Só é possível iniciar nova revisão para propostas enviadas",
      );
    }

    const pendingCycle = findPendingRevisionCycle(events);
    if (pendingCycle) {
      throw new ValidationError("Já existe um ciclo de revisão pendente");
    }

    const sourceRevision = revisions[0];
    if (!sourceRevision) {
      throw new ValidationError("Proposta sem revisão base para iniciar novo ciclo");
    }

    const nextRevisionNumber = await this.revisionRepository.getNextRevisionNumber(
      proposal.id,
    );

    const revision = await this.revisionRepository.createRevision({
      proposalId: proposal.id,
      revisionNumber: nextRevisionNumber,
      reason: null,
      scopeChanges: null,
      discountBrl: null,
      discountPercent: null,
      valueBeforeBrl: null,
      valueAfterBrl: proposal.estimatedValueBrl,
      notes: null,
      createdBy: input.startedBy,
    });

    const copiedSuppliersCount = await this.proposalSupplierRepository.copyRevisionLinks(
      proposal.id,
      sourceRevision.id,
      revision.id,
    );

    const cycleId = randomUUID();
    await this.activityLogRepository.create({
      entityType: "proposal",
      entityId: proposal.id,
      action: "revision_cycle_opened",
      metadata: {
        cycleId,
        revisionId: revision.id,
        revisionNumber: revision.revisionNumber,
        copiedFromRevisionId: sourceRevision.id,
        copiedSuppliersCount,
        trigger: "manual_revision_cycle_start",
        before: {
          scopeDescription: proposal.scopeDescription,
          dueDate: proposal.dueDate,
          estimatedValueBrl: proposal.estimatedValueBrl,
        },
      },
      createdBy: input.startedBy,
    });

    const updatedProposal = await this.proposalRepository.updateProposalStatus({
      proposalId: proposal.id,
      status: "em_revisao",
    });

    await this.activityLogRepository.create({
      entityType: "proposal",
      entityId: proposal.id,
      action: "status_changed",
      metadata: {
        from: proposal.status,
        to: "em_revisao",
        source: "manual_revision_cycle_start",
      },
      createdBy: input.startedBy,
    });

    return {
      proposal: updatedProposal,
      cycleId,
    };
  }
}
