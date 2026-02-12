import type { Attachment } from "@/modules/attachments/domain/attachment";
import type { AttachmentRepositoryPort } from "@/modules/attachments/application/ports/attachment-repository.port";
import type { StoragePort } from "@/modules/attachments/application/ports/storage.port";
import type { ProposalRepositoryPort } from "@/modules/proposals/application/ports/proposal-repository.port";
import type { UseCase } from "@/shared/application/use-case";
import { NotFoundError, ValidationError } from "@/shared/domain/errors";
import type { AttachmentCategory } from "@/shared/domain/types";

export interface FinalizeAttachmentInput {
  proposalId: string;
  revisionId?: string | null;
  category: AttachmentCategory;
  fileName: string;
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadedBy: string;
}

export type FinalizeAttachmentOutput = Attachment;

export class FinalizeAttachmentUseCase
  implements UseCase<FinalizeAttachmentInput, FinalizeAttachmentOutput>
{
  constructor(
    private readonly proposalRepository: ProposalRepositoryPort,
    private readonly attachmentRepository: AttachmentRepositoryPort,
    private readonly storagePort: StoragePort,
  ) {}

  async execute(input: FinalizeAttachmentInput): Promise<FinalizeAttachmentOutput> {
    if (input.category === "proposta_word") {
      throw new ValidationError(
        "Use o fluxo de envio da proposta para arquivo principal",
      );
    }

    const proposal = await this.proposalRepository.getProposalById(input.proposalId);
    if (!proposal) {
      throw new NotFoundError("Proposta não encontrada");
    }

    const objectExists = await this.storagePort.objectExists(input.storagePath);
    if (!objectExists) {
      throw new ValidationError("Arquivo não encontrado no storage");
    }

    return this.attachmentRepository.createAttachment({
      proposalId: input.proposalId,
      revisionId: input.revisionId,
      category: input.category,
      fileName: input.fileName,
      storagePath: input.storagePath,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      uploadedBy: input.uploadedBy,
    });
  }
}
