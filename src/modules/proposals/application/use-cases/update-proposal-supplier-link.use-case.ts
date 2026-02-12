import type { ActivityLogRepositoryPort } from "@/modules/proposals/application/ports/activity-log-repository.port";
import type { ProposalRepositoryPort } from "@/modules/proposals/application/ports/proposal-repository.port";
import type {
  ProposalSupplierLink,
  ProposalSupplierRepositoryPort,
} from "@/modules/proposals/application/ports/proposal-supplier-repository.port";
import type { RevisionRepositoryPort } from "@/modules/proposals/application/ports/revision-repository.port";
import { findPendingRevisionCycle } from "@/modules/proposals/application/use-cases/revision-cycle.utils";
import type { UseCase } from "@/shared/application/use-case";
import { NotFoundError, ValidationError } from "@/shared/domain/errors";

export interface UpdateProposalSupplierLinkUseCaseInput {
  linkId: string;
  roleDescription?: string | null;
  quotedHourlyCostBrl?: number | null;
  estimatedHours?: number | null;
  quotedTotalBrl?: number | null;
  updatedBy: string;
}

export type UpdateProposalSupplierLinkOutput = ProposalSupplierLink;

export class UpdateProposalSupplierLinkUseCase
  implements
    UseCase<
      UpdateProposalSupplierLinkUseCaseInput,
      UpdateProposalSupplierLinkOutput
    >
{
  constructor(
    private readonly proposalRepository: ProposalRepositoryPort,
    private readonly revisionRepository: RevisionRepositoryPort,
    private readonly proposalSupplierRepository: ProposalSupplierRepositoryPort,
    private readonly activityLogRepository: ActivityLogRepositoryPort,
  ) {}

  async execute(
    input: UpdateProposalSupplierLinkUseCaseInput,
  ): Promise<UpdateProposalSupplierLinkOutput> {
    const link = await this.proposalSupplierRepository.findById(input.linkId);
    if (!link) {
      throw new NotFoundError("Vínculo de fornecedor não encontrado");
    }

    const proposal = await this.proposalRepository.getProposalById(link.proposalId);
    if (!proposal) {
      throw new NotFoundError("Proposta não encontrada");
    }

    if (proposal.status !== "em_elaboracao" && proposal.status !== "em_revisao") {
      throw new ValidationError(
        "Fornecedor só pode ser editado em proposta em elaboração ou em revisão",
      );
    }

    if (proposal.status === "em_revisao") {
      const events = await this.activityLogRepository.findManyByEntity(
        "proposal",
        proposal.id,
      );
      const pendingCycle = findPendingRevisionCycle(events);
      if (!pendingCycle || pendingCycle.revisionId !== link.revisionId) {
        throw new ValidationError(
          "Só é possível editar fornecedor da revisão atual em andamento",
        );
      }
    } else {
      const linkRevision = await this.revisionRepository.findById(link.revisionId ?? "");
      if (!linkRevision || linkRevision.revisionNumber !== 0) {
        throw new ValidationError(
          "Só é possível editar fornecedor da revisão R0 em elaboração",
        );
      }
    }

    const quotedHourlyCostBrl = input.quotedHourlyCostBrl ?? null;
    const estimatedHours = input.estimatedHours ?? null;
    const calculatedQuotedTotal =
      quotedHourlyCostBrl !== null && estimatedHours !== null
        ? Number((quotedHourlyCostBrl * estimatedHours).toFixed(2))
        : null;

    const updatedLink = await this.proposalSupplierRepository.updateLinkValues({
      linkId: input.linkId,
      roleDescription: input.roleDescription?.trim() || null,
      quotedHourlyCostBrl,
      estimatedHours,
      quotedTotalBrl: input.quotedTotalBrl ?? calculatedQuotedTotal,
    });

    await this.activityLogRepository.create({
      entityType: "proposal",
      entityId: link.proposalId,
      action: "supplier_link_updated",
      metadata: {
        linkId: updatedLink.id,
        supplierId: updatedLink.supplierId,
        supplierLegalName: updatedLink.supplierLegalName,
        revisionId: updatedLink.revisionId,
      },
      createdBy: input.updatedBy,
    });

    return updatedLink;
  }
}
