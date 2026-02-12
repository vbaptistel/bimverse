import type { ProposalStatus } from "@/shared/domain/types";
import type { AttachmentRepositoryPort } from "@/modules/attachments/application/ports/attachment-repository.port";
import type { StoragePort } from "@/modules/attachments/application/ports/storage.port";
import type { ProposalRepositoryPort } from "@/modules/proposals/application/ports/proposal-repository.port";
import type { UseCase } from "@/shared/application/use-case";
import { NotFoundError, ValidationError } from "@/shared/domain/errors";

const DELETABLE_STATUSES: ProposalStatus[] = ["recebida", "em_elaboracao"];

export interface DeleteProposalInput {
  proposalId: string;
}

export interface DeleteProposalOutput {
  proposalId: string;
}

export class DeleteProposalUseCase
  implements UseCase<DeleteProposalInput, DeleteProposalOutput>
{
  constructor(
    private readonly proposalRepository: ProposalRepositoryPort,
    private readonly attachmentRepository: AttachmentRepositoryPort,
    private readonly storagePort: StoragePort,
  ) {}

  async execute(input: DeleteProposalInput): Promise<DeleteProposalOutput> {
    const proposal = await this.proposalRepository.getProposalById(input.proposalId);
    if (!proposal) {
      throw new NotFoundError("Proposta não encontrada");
    }

    if (!DELETABLE_STATUSES.includes(proposal.status)) {
      throw new ValidationError(
        "Só é possível excluir propostas recebidas ou em elaboração",
      );
    }

    const attachments = await this.attachmentRepository.findManyByProposalId(
      proposal.id,
    );

    for (const attachment of attachments) {
      const objectExists = await this.storagePort.objectExists(
        attachment.storagePath,
      );

      if (!objectExists) {
        continue;
      }

      await this.storagePort.deleteObject(attachment.storagePath);
    }

    await this.proposalRepository.deleteById(input.proposalId);

    return {
      proposalId: input.proposalId,
    };
  }
}
