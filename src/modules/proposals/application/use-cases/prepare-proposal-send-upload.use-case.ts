import { randomUUID } from "node:crypto";

import type { StoragePort } from "@/modules/attachments/application/ports/storage.port";
import type { ProposalRepositoryPort } from "@/modules/proposals/application/ports/proposal-repository.port";
import type { RevisionRepositoryPort } from "@/modules/proposals/application/ports/revision-repository.port";
import { isValidProposalStatusTransition } from "@/modules/proposals/domain/proposal-status-transition";
import type { UseCase } from "@/shared/application/use-case";
import { NotFoundError, ValidationError } from "@/shared/domain/errors";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ALLOWED_EXTENSIONS = [".doc", ".docx", ".pdf"];

export interface PrepareProposalSendUploadInput {
  proposalId: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
}

export interface PrepareProposalSendUploadOutput {
  path: string;
  token: string;
  signedUrl: string;
  currentRevisionNumber: number;
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

export class PrepareProposalSendUploadUseCase
  implements
    UseCase<PrepareProposalSendUploadInput, PrepareProposalSendUploadOutput>
{
  constructor(
    private readonly proposalRepository: ProposalRepositoryPort,
    private readonly revisionRepository: RevisionRepositoryPort,
    private readonly storagePort: StoragePort,
  ) {}

  async execute(
    input: PrepareProposalSendUploadInput,
  ): Promise<PrepareProposalSendUploadOutput> {
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

    const safeFileName = input.fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_");

    const path = [
      storageContext.customerSlug,
      String(storageContext.year),
      storageContext.proposalCode,
      "revisions",
      `R${latestRevision.revisionNumber}`,
      "proposta_word",
      `${randomUUID()}_${safeFileName}`,
    ].join("/");

    const signed = await this.storagePort.createSignedUploadUrl(path);

    return {
      ...signed,
      currentRevisionNumber: latestRevision.revisionNumber,
    };
  }
}
