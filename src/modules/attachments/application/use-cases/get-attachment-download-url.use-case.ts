import type { AttachmentRepositoryPort } from "@/modules/attachments/application/ports/attachment-repository.port";
import type { StoragePort } from "@/modules/attachments/application/ports/storage.port";
import type { UseCase } from "@/shared/application/use-case";
import { NotFoundError } from "@/shared/domain/errors";

export interface GetAttachmentDownloadUrlInput {
  attachmentId: string;
}

export interface GetAttachmentDownloadUrlOutput {
  signedUrl: string;
  expiresInSeconds: number;
}

export class GetAttachmentDownloadUrlUseCase
  implements UseCase<GetAttachmentDownloadUrlInput, GetAttachmentDownloadUrlOutput>
{
  constructor(
    private readonly attachmentRepository: AttachmentRepositoryPort,
    private readonly storagePort: StoragePort,
  ) {}

  async execute(
    input: GetAttachmentDownloadUrlInput,
  ): Promise<GetAttachmentDownloadUrlOutput> {
    const attachment = await this.attachmentRepository.findById(input.attachmentId);
    if (!attachment) {
      throw new NotFoundError("Anexo não encontrado");
    }

    const expiresInSeconds = 300;
    const signedUrl = await this.storagePort.createSignedDownloadUrl(
      attachment.storagePath,
      expiresInSeconds,
    );

    return {
      signedUrl,
      expiresInSeconds,
    };
  }
}
