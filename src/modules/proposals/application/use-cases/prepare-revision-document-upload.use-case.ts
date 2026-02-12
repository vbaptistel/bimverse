import { randomUUID } from "node:crypto";

import type { StoragePort } from "@/modules/attachments/application/ports/storage.port";
import type { ProposalRepositoryPort } from "@/modules/proposals/application/ports/proposal-repository.port";
import type { RevisionRepositoryPort } from "@/modules/proposals/application/ports/revision-repository.port";
import type { UseCase } from "@/shared/application/use-case";
import { NotFoundError, ValidationError } from "@/shared/domain/errors";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ALLOWED_EXTENSIONS = [".doc", ".docx", ".pdf"];

export interface PrepareRevisionDocumentUploadInput {
  proposalId: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
}

export interface PrepareRevisionDocumentUploadOutput {
  path: string;
  token: string;
  signedUrl: string;
  nextRevisionNumber: number;
}

function validateRevisionDocumentName(
  proposalCode: string,
  nextRevisionNumber: number,
  fileName: string,
) {
  const normalizedName = fileName.toLowerCase();
  const requiredRevisionToken = `r${nextRevisionNumber}`;

  if (
    !normalizedName.includes(proposalCode.toLowerCase()) ||
    !normalizedName.includes(requiredRevisionToken)
  ) {
    throw new ValidationError(
      `Nome do arquivo deve conter o código da proposta e a revisão R${nextRevisionNumber}`,
    );
  }
}

function hasAllowedExtension(fileName: string): boolean {
  const normalizedName = fileName.trim().toLowerCase();
  return ALLOWED_EXTENSIONS.some((extension) =>
    normalizedName.endsWith(extension),
  );
}

export class PrepareRevisionDocumentUploadUseCase
  implements
    UseCase<
      PrepareRevisionDocumentUploadInput,
      PrepareRevisionDocumentUploadOutput
    >
{
  constructor(
    private readonly proposalRepository: ProposalRepositoryPort,
    private readonly revisionRepository: RevisionRepositoryPort,
    private readonly storagePort: StoragePort,
  ) {}

  async execute(
    input: PrepareRevisionDocumentUploadInput,
  ): Promise<PrepareRevisionDocumentUploadOutput> {
    if (!hasAllowedExtension(input.fileName)) {
      throw new ValidationError(
        "Documento da revisão deve ter extensão DOC, DOCX ou PDF",
      );
    }

    if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
      throw new ValidationError("Tipo de arquivo não suportado para revisão");
    }

    if (input.fileSizeBytes <= 0 || input.fileSizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new ValidationError("Arquivo deve ter no máximo 50MB");
    }

    const [proposal, storageContext] = await Promise.all([
      this.proposalRepository.getProposalById(input.proposalId),
      this.proposalRepository.getProposalStorageContext(input.proposalId),
    ]);

    if (!proposal || !storageContext) {
      throw new NotFoundError("Proposta não encontrada");
    }

    if (proposal.status !== "em_revisao") {
      throw new ValidationError(
        "A proposta precisa estar em revisão para preparar documento",
      );
    }

    const nextRevisionNumber = await this.revisionRepository.getNextRevisionNumber(
      input.proposalId,
    );

    validateRevisionDocumentName(
      storageContext.proposalCode,
      nextRevisionNumber,
      input.fileName,
    );

    const safeFileName = input.fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_");

    const path = [
      storageContext.companySlug,
      String(storageContext.year),
      storageContext.proposalCode,
      "revisions",
      `R${nextRevisionNumber}`,
      "proposta_word",
      `${randomUUID()}_${safeFileName}`,
    ].join("/");

    const signed = await this.storagePort.createSignedUploadUrl(path);

    return {
      ...signed,
      nextRevisionNumber,
    };
  }
}
