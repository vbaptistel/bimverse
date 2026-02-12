import type { Attachment } from "@/modules/attachments/domain/attachment";
import type { AttachmentRepositoryPort } from "@/modules/attachments/application/ports/attachment-repository.port";
import type { StoragePort } from "@/modules/attachments/application/ports/storage.port";
import type { ActivityLogRepositoryPort } from "@/modules/proposals/application/ports/activity-log-repository.port";
import type { ProposalRepositoryPort } from "@/modules/proposals/application/ports/proposal-repository.port";
import type { RevisionRepositoryPort } from "@/modules/proposals/application/ports/revision-repository.port";
import { findPendingRevisionCycle } from "@/modules/proposals/application/use-cases/revision-cycle.utils";
import type { Proposal, ProposalRevision } from "@/modules/proposals/domain/proposal";
import type { UseCase } from "@/shared/application/use-case";
import { NotFoundError, ValidationError } from "@/shared/domain/errors";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ALLOWED_EXTENSIONS = [".doc", ".docx", ".pdf"];

export interface CloseProposalRevisionInput {
  proposalId: string;
  reason: string;
  scopeChanges?: string | null;
  discountBrl?: number | null;
  discountPercent?: number | null;
  notes?: string | null;
  fileName: string;
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
  closedBy: string;
}

export interface CloseProposalRevisionOutput {
  proposal: Proposal;
  revision: ProposalRevision;
  attachment: Attachment;
}

function validateRevisionDocumentName(
  proposalCode: string,
  revisionNumber: number,
  fileName: string,
) {
  const normalizedName = fileName.toLowerCase();
  if (
    !normalizedName.includes(proposalCode.toLowerCase()) ||
    !normalizedName.includes(`r${revisionNumber}`)
  ) {
    throw new ValidationError(
      `Nome do arquivo deve conter o código da proposta e a revisão R${revisionNumber}`,
    );
  }
}

function hasAllowedExtension(fileName: string): boolean {
  const normalizedName = fileName.trim().toLowerCase();
  return ALLOWED_EXTENSIONS.some((extension) =>
    normalizedName.endsWith(extension),
  );
}

export class CloseProposalRevisionUseCase
  implements UseCase<CloseProposalRevisionInput, CloseProposalRevisionOutput>
{
  constructor(
    private readonly proposalRepository: ProposalRepositoryPort,
    private readonly revisionRepository: RevisionRepositoryPort,
    private readonly attachmentRepository: AttachmentRepositoryPort,
    private readonly storagePort: StoragePort,
    private readonly activityLogRepository: ActivityLogRepositoryPort,
  ) {}

  async execute(
    input: CloseProposalRevisionInput,
  ): Promise<CloseProposalRevisionOutput> {
    if (!input.reason.trim()) {
      throw new ValidationError("Motivo da revisão é obrigatório");
    }

    if (!hasAllowedExtension(input.fileName)) {
      throw new ValidationError(
        "Documento da revisão deve ter extensão DOC, DOCX ou PDF",
      );
    }

    if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
      throw new ValidationError(
        "Documento da revisão deve ser DOC, DOCX ou PDF",
      );
    }

    const [proposal, storageContext, activityEvents] = await Promise.all([
      this.proposalRepository.getProposalById(input.proposalId),
      this.proposalRepository.getProposalStorageContext(input.proposalId),
      this.activityLogRepository.findManyByEntity("proposal", input.proposalId),
    ]);

    if (!proposal || !storageContext) {
      throw new NotFoundError("Proposta não encontrada");
    }

    if (proposal.status !== "em_revisao") {
      throw new ValidationError("A proposta não está em revisão");
    }

    const pendingCycle = findPendingRevisionCycle(activityEvents);
    if (!pendingCycle) {
      throw new ValidationError("Não há ciclo de revisão pendente para fechar");
    }

    const nextRevisionNumber = await this.revisionRepository.getNextRevisionNumber(
      proposal.id,
    );

    validateRevisionDocumentName(
      storageContext.proposalCode,
      nextRevisionNumber,
      input.fileName,
    );

    const objectExists = await this.storagePort.objectExists(input.storagePath);
    if (!objectExists) {
      throw new ValidationError("Arquivo da revisão não encontrado no storage");
    }

    const revision = await this.revisionRepository.createRevision({
      proposalId: proposal.id,
      revisionNumber: nextRevisionNumber,
      reason: input.reason.trim(),
      scopeChanges: input.scopeChanges?.trim() || null,
      discountBrl: input.discountBrl ?? null,
      discountPercent: input.discountPercent ?? null,
      valueBeforeBrl: pendingCycle.snapshot.estimatedValueBrl,
      valueAfterBrl: proposal.estimatedValueBrl,
      notes: input.notes?.trim() || null,
      createdBy: input.closedBy,
    });

    const attachment = await this.attachmentRepository.createAttachment({
      proposalId: proposal.id,
      revisionId: revision.id,
      category: "proposta_word",
      fileName: input.fileName,
      storagePath: input.storagePath,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      uploadedBy: input.closedBy,
    });

    const updatedProposal = await this.proposalRepository.updateProposalStatus({
      proposalId: proposal.id,
      status: "enviada",
    });

    await this.activityLogRepository.create({
      entityType: "proposal",
      entityId: proposal.id,
      action: "revision_cycle_closed",
      metadata: {
        cycleId: pendingCycle.cycleId,
        revisionId: revision.id,
        revisionNumber: revision.revisionNumber,
        reason: revision.reason,
      },
      createdBy: input.closedBy,
    });

    await this.activityLogRepository.create({
      entityType: "proposal",
      entityId: proposal.id,
      action: "status_changed",
      metadata: {
        from: proposal.status,
        to: "enviada",
        source: "revision_cycle_close",
      },
      createdBy: input.closedBy,
    });

    return {
      proposal: updatedProposal,
      revision,
      attachment,
    };
  }
}
