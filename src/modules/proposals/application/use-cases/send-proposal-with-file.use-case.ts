import type { Attachment } from "@/modules/attachments/domain/attachment";
import type { AttachmentRepositoryPort } from "@/modules/attachments/application/ports/attachment-repository.port";
import type { StoragePort } from "@/modules/attachments/application/ports/storage.port";
import type { ActivityLogRepositoryPort } from "@/modules/proposals/application/ports/activity-log-repository.port";
import type { ProposalRepositoryPort } from "@/modules/proposals/application/ports/proposal-repository.port";
import type { RevisionRepositoryPort } from "@/modules/proposals/application/ports/revision-repository.port";
import { isValidProposalStatusTransition } from "@/modules/proposals/domain/proposal-status-transition";
import type { Proposal } from "@/modules/proposals/domain/proposal";
import type { UseCase } from "@/shared/application/use-case";
import { NotFoundError, ValidationError } from "@/shared/domain/errors";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ALLOWED_EXTENSIONS = [".doc", ".docx", ".pdf"];

export interface SendProposalWithFileInput {
  proposalId: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
  statusDate?: string | null;
  sentBy: string;
}

export interface SendProposalWithFileOutput {
  proposal: Proposal;
  attachment: Attachment;
}

function validateProposalDocumentName(
  proposalCode: string,
  revisionNumber: number,
  fileName: string,
) {
  const normalizedName = fileName.toLowerCase();
  const requiredRevisionToken = `r${revisionNumber}`;

  if (
    !normalizedName.includes(proposalCode.toLowerCase()) ||
    !normalizedName.includes(requiredRevisionToken)
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

export class SendProposalWithFileUseCase
  implements UseCase<SendProposalWithFileInput, SendProposalWithFileOutput>
{
  constructor(
    private readonly proposalRepository: ProposalRepositoryPort,
    private readonly revisionRepository: RevisionRepositoryPort,
    private readonly attachmentRepository: AttachmentRepositoryPort,
    private readonly storagePort: StoragePort,
    private readonly activityLogRepository: ActivityLogRepositoryPort,
  ) {}

  async execute(
    input: SendProposalWithFileInput,
  ): Promise<SendProposalWithFileOutput> {
    if (!hasAllowedExtension(input.fileName)) {
      throw new ValidationError(
        "Documento da proposta deve ter extensão DOC, DOCX ou PDF",
      );
    }

    if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
      throw new ValidationError("Documento da proposta deve ser DOC, DOCX ou PDF");
    }

    if (input.fileSizeBytes <= 0 || input.fileSizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new ValidationError("Arquivo deve ter no máximo 50MB");
    }

    const [proposal, storageContext, revisions] = await Promise.all([
      this.proposalRepository.getProposalById(input.proposalId),
      this.proposalRepository.getProposalStorageContext(input.proposalId),
      this.revisionRepository.findManyByProposalId(input.proposalId),
    ]);

    if (!proposal || !storageContext) {
      throw new NotFoundError("Proposta não encontrada");
    }

    if (proposal.status === "em_revisao") {
      throw new ValidationError(
        "Enquanto a proposta estiver em revisão, use fechar ou cancelar revisão",
      );
    }

    if (!isValidProposalStatusTransition(proposal.status, "enviada")) {
      throw new ValidationError(
        `Transição inválida de status (${proposal.status} -> enviada)`,
      );
    }

    const latestRevision = revisions[0];
    if (!latestRevision) {
      throw new ValidationError("Proposta sem revisão para associar arquivo principal");
    }

    validateProposalDocumentName(
      storageContext.proposalCode,
      latestRevision.revisionNumber,
      input.fileName,
    );

    const objectExists = await this.storagePort.objectExists(input.storagePath);
    if (!objectExists) {
      throw new ValidationError("Arquivo da proposta não encontrado no storage");
    }

    const attachment = await this.attachmentRepository.createAttachment({
      proposalId: proposal.id,
      revisionId: latestRevision.id,
      category: "proposta_word",
      fileName: input.fileName,
      storagePath: input.storagePath,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      uploadedBy: input.sentBy,
    });

    const updatedProposal = await this.proposalRepository.updateProposalStatus({
      proposalId: proposal.id,
      status: "enviada",
    });

    await this.activityLogRepository.create({
      entityType: "proposal",
      entityId: proposal.id,
      action: "status_changed",
      metadata: {
        from: proposal.status,
        to: "enviada",
        source: "manual_send_with_file",
        statusDate: input.statusDate?.trim() || null,
      },
      createdBy: input.sentBy,
    });

    return {
      proposal: updatedProposal,
      attachment,
    };
  }
}
