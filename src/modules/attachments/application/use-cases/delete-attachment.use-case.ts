import type { AttachmentRepositoryPort } from "@/modules/attachments/application/ports/attachment-repository.port";
import type { StoragePort } from "@/modules/attachments/application/ports/storage.port";
import type { UseCase } from "@/shared/application/use-case";
import { NotFoundError, ValidationError } from "@/shared/domain/errors";

export interface DeleteAttachmentInput {
  attachmentId: string;
}

export interface DeleteAttachmentOutput {
  attachmentId: string;
  proposalId: string;
}

export class DeleteAttachmentUseCase
  implements UseCase<DeleteAttachmentInput, DeleteAttachmentOutput>
{
  constructor(
    private readonly attachmentRepository: AttachmentRepositoryPort,
    private readonly storagePort: StoragePort,
  ) {}

  async execute(input: DeleteAttachmentInput): Promise<DeleteAttachmentOutput> {
    const attachment = await this.attachmentRepository.findById(input.attachmentId);
    if (!attachment) {
      throw new NotFoundError("Anexo não encontrado");
    }

    if (attachment.category === "proposta_word") {
      throw new ValidationError(
        "Arquivo principal deve ser removido pelo fluxo de proposta",
      );
    }

    const objectExists = await this.storagePort.objectExists(attachment.storagePath);
    if (objectExists) {
      await this.storagePort.deleteObject(attachment.storagePath);
    }

    await this.attachmentRepository.deleteById(attachment.id);

    return {
      attachmentId: attachment.id,
      proposalId: attachment.proposalId,
    };
  }
}
