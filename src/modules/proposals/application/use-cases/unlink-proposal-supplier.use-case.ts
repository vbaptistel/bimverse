import type { ActivityLogRepositoryPort } from "@/modules/proposals/application/ports/activity-log-repository.port";
import type { ProposalSupplierRepositoryPort } from "@/modules/proposals/application/ports/proposal-supplier-repository.port";
import type { UseCase } from "@/shared/application/use-case";
import { NotFoundError } from "@/shared/domain/errors";

export interface UnlinkProposalSupplierInput {
  linkId: string;
  unlinkedBy: string;
}

export interface UnlinkProposalSupplierOutput {
  linkId: string;
}

export class UnlinkProposalSupplierUseCase
  implements UseCase<UnlinkProposalSupplierInput, UnlinkProposalSupplierOutput>
{
  constructor(
    private readonly proposalSupplierRepository: ProposalSupplierRepositoryPort,
    private readonly activityLogRepository: ActivityLogRepositoryPort,
  ) {}

  async execute(
    input: UnlinkProposalSupplierInput,
  ): Promise<UnlinkProposalSupplierOutput> {
    const link = await this.proposalSupplierRepository.findById(input.linkId);
    if (!link) {
      throw new NotFoundError("Vínculo de fornecedor não encontrado");
    }

    await this.proposalSupplierRepository.deleteById(input.linkId);

    await this.activityLogRepository.create({
      entityType: "proposal",
      entityId: link.proposalId,
      action: "supplier_unlinked",
      metadata: {
        linkId: link.id,
        supplierId: link.supplierId,
        supplierLegalName: link.supplierLegalName,
        revisionId: link.revisionId,
      },
      createdBy: input.unlinkedBy,
    });

    return {
      linkId: input.linkId,
    };
  }
}
