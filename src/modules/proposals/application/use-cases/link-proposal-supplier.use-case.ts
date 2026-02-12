import type { ActivityLogRepositoryPort } from "@/modules/proposals/application/ports/activity-log-repository.port";
import type { ProposalRepositoryPort } from "@/modules/proposals/application/ports/proposal-repository.port";
import type {
  ProposalSupplierLink,
  ProposalSupplierRepositoryPort,
} from "@/modules/proposals/application/ports/proposal-supplier-repository.port";
import type { RevisionRepositoryPort } from "@/modules/proposals/application/ports/revision-repository.port";
import type { SupplierRepositoryPort } from "@/modules/suppliers/application/ports/supplier-repository.port";
import type { UseCase } from "@/shared/application/use-case";
import { NotFoundError, ValidationError } from "@/shared/domain/errors";
import { findPendingRevisionCycle } from "@/modules/proposals/application/use-cases/revision-cycle.utils";

export interface LinkProposalSupplierInput {
  proposalId: string;
  supplierId: string;
  roleDescription?: string | null;
  quotedHourlyCostBrl?: number | null;
  estimatedHours?: number | null;
  quotedTotalBrl?: number | null;
  linkedBy: string;
}

export type LinkProposalSupplierOutput = ProposalSupplierLink;

export class LinkProposalSupplierUseCase
  implements UseCase<LinkProposalSupplierInput, LinkProposalSupplierOutput>
{
  constructor(
    private readonly proposalRepository: ProposalRepositoryPort,
    private readonly revisionRepository: RevisionRepositoryPort,
    private readonly supplierRepository: SupplierRepositoryPort,
    private readonly proposalSupplierRepository: ProposalSupplierRepositoryPort,
    private readonly activityLogRepository: ActivityLogRepositoryPort,
  ) {}

  async execute(
    input: LinkProposalSupplierInput,
  ): Promise<LinkProposalSupplierOutput> {
    const [proposal, supplier] = await Promise.all([
      this.proposalRepository.getProposalById(input.proposalId),
      this.supplierRepository.findById(input.supplierId),
    ]);

    if (!proposal) {
      throw new NotFoundError("Proposta não encontrada");
    }

    if (!supplier) {
      throw new NotFoundError("Fornecedor não encontrado");
    }

    if (proposal.status !== "em_elaboracao" && proposal.status !== "em_revisao") {
      throw new ValidationError(
        "Fornecedor só pode ser vinculado em proposta em elaboração ou em revisão",
      );
    }

    let targetRevisionId: string;

    if (proposal.status === "em_revisao") {
      const events = await this.activityLogRepository.findManyByEntity(
        "proposal",
        proposal.id,
      );
      const pendingCycle = findPendingRevisionCycle(events);
      if (!pendingCycle) {
        throw new ValidationError("Não há revisão pendente para vincular fornecedor");
      }

      const revision = await this.revisionRepository.findById(pendingCycle.revisionId);
      if (!revision || revision.proposalId !== proposal.id) {
        throw new ValidationError("Revisão pendente inválida para vincular fornecedor");
      }

      targetRevisionId = revision.id;
    } else {
      const revisions = await this.revisionRepository.findManyByProposalId(
        proposal.id,
      );
      const baseRevision = revisions.find((revision) => revision.revisionNumber === 0);
      if (!baseRevision) {
        throw new ValidationError("Revisão R0 não encontrada para vincular fornecedor");
      }

      targetRevisionId = baseRevision.id;
    }

    const alreadyLinked = await this.proposalSupplierRepository.existsLink(
      input.proposalId,
      input.supplierId,
      targetRevisionId,
    );

    if (alreadyLinked) {
      throw new ValidationError("Fornecedor já vinculado nesta revisão");
    }

    const link = await this.proposalSupplierRepository.createLink({
      proposalId: input.proposalId,
      revisionId: targetRevisionId,
      supplierId: input.supplierId,
      roleDescription: input.roleDescription?.trim() || null,
      quotedHourlyCostBrl: input.quotedHourlyCostBrl ?? null,
      estimatedHours: input.estimatedHours ?? null,
      quotedTotalBrl: input.quotedTotalBrl ?? null,
    });

    await this.activityLogRepository.create({
      entityType: "proposal",
      entityId: proposal.id,
      action: "supplier_linked",
      metadata: {
        linkId: link.id,
        supplierId: supplier.id,
        supplierLegalName: supplier.legalName,
        revisionId: link.revisionId,
      },
      createdBy: input.linkedBy,
    });

    return link;
  }
}
