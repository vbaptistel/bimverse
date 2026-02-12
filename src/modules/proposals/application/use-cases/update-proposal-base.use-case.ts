import type { Proposal } from "@/modules/proposals/domain/proposal";
import { isFinalStatus } from "@/modules/proposals/domain/proposal-status-transition";
import type { ActivityLogRepositoryPort } from "@/modules/proposals/application/ports/activity-log-repository.port";
import type { ProposalRepositoryPort } from "@/modules/proposals/application/ports/proposal-repository.port";
import type { UseCase } from "@/shared/application/use-case";
import { NotFoundError, ValidationError } from "@/shared/domain/errors";

export interface UpdateProposalBaseInput {
  proposalId: string;
  projectName: string;
  invitationCode?: string | null;
  scopeDescription: string;
  dueDate?: string | null;
  estimatedValueBrl?: number | null;
  updatedBy: string;
}

export interface UpdateProposalBaseOutput {
  proposal: Proposal;
}

function normalizeText(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function hasCriticalChange(
  before: Proposal,
  next: Pick<
    UpdateProposalBaseInput,
    "scopeDescription" | "dueDate" | "estimatedValueBrl"
  >,
) {
  return (
    before.scopeDescription !== next.scopeDescription ||
    before.dueDate !== (next.dueDate ?? null) ||
    before.estimatedValueBrl !== (next.estimatedValueBrl ?? null)
  );
}

export class UpdateProposalBaseUseCase
  implements UseCase<UpdateProposalBaseInput, UpdateProposalBaseOutput>
{
  constructor(
    private readonly proposalRepository: ProposalRepositoryPort,
    private readonly activityLogRepository: ActivityLogRepositoryPort,
  ) {}

  async execute(input: UpdateProposalBaseInput): Promise<UpdateProposalBaseOutput> {
    const current = await this.proposalRepository.getProposalById(input.proposalId);
    if (!current) {
      throw new NotFoundError("Proposta não encontrada");
    }

    if (isFinalStatus(current.status)) {
      throw new ValidationError(
        "Propostas finalizadas não podem ter dados base alterados",
      );
    }

    const normalizedInput = {
      projectName: input.projectName.trim(),
      invitationCode: normalizeText(input.invitationCode),
      scopeDescription: input.scopeDescription.trim(),
      dueDate: input.dueDate ?? null,
      estimatedValueBrl: input.estimatedValueBrl ?? null,
    };

    const changedFields: string[] = [];
    if (current.projectName !== normalizedInput.projectName) {
      changedFields.push("projectName");
    }
    if (current.invitationCode !== normalizedInput.invitationCode) {
      changedFields.push("invitationCode");
    }
    if (current.scopeDescription !== normalizedInput.scopeDescription) {
      changedFields.push("scopeDescription");
    }
    if (current.dueDate !== normalizedInput.dueDate) {
      changedFields.push("dueDate");
    }
    if (current.estimatedValueBrl !== normalizedInput.estimatedValueBrl) {
      changedFields.push("estimatedValueBrl");
    }

    const criticalChanged = hasCriticalChange(current, normalizedInput);
    if (criticalChanged && current.status !== "em_revisao") {
      throw new ValidationError(
        "Para alterar escopo, prazo ou valor estimado, inicie uma nova revisão",
      );
    }

    const updated = await this.proposalRepository.updateBaseFields({
      proposalId: current.id,
      projectName: normalizedInput.projectName,
      invitationCode: normalizedInput.invitationCode,
      scopeDescription: normalizedInput.scopeDescription,
      dueDate: normalizedInput.dueDate,
      estimatedValueBrl: normalizedInput.estimatedValueBrl,
    });

    await this.activityLogRepository.create({
      entityType: "proposal",
      entityId: current.id,
      action: "proposal_base_updated",
      metadata: {
        changedFields,
        criticalChanged,
        before: {
          projectName: current.projectName,
          invitationCode: current.invitationCode,
          scopeDescription: current.scopeDescription,
          dueDate: current.dueDate,
          estimatedValueBrl: current.estimatedValueBrl,
        },
        after: {
          projectName: updated.projectName,
          invitationCode: updated.invitationCode,
          scopeDescription: updated.scopeDescription,
          dueDate: updated.dueDate,
          estimatedValueBrl: updated.estimatedValueBrl,
        },
      },
      createdBy: input.updatedBy,
    });

    return {
      proposal: updated,
    };
  }
}
