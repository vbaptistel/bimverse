import { randomUUID } from "node:crypto";

import type { ProposalRepositoryPort } from "@/modules/proposals/application/ports/proposal-repository.port";
import type { StoragePort } from "@/modules/attachments/application/ports/storage.port";
import type { UseCase } from "@/shared/application/use-case";
import { NotFoundError, ValidationError } from "@/shared/domain/errors";
import type { AttachmentCategory } from "@/shared/domain/types";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "application/zip",
  "application/acad",
  "application/x-acad",
  "application/x-autocad",
  "image/vnd.dwg",
  "application/dxf",
  "application/x-dxf",
  "image/vnd.dxf",
  "model/ifc",
]);

const ALLOWED_FILE_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "png",
  "jpg",
  "jpeg",
  "zip",
  "dwg",
  "dxf",
  "rvt",
  "rfa",
  "rte",
  "rft",
  "ifc",
  "ifczip",
  "nwc",
  "nwd",
  "bcf",
  "bcfzip",
]);

interface CreateAttachmentUploadInput {
  proposalId: string;
  revisionId?: string | null;
  category: AttachmentCategory;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
}

export interface CreateAttachmentUploadOutput {
  path: string;
  token: string;
  signedUrl: string;
}

export class CreateAttachmentUploadUseCase
  implements UseCase<CreateAttachmentUploadInput, CreateAttachmentUploadOutput>
{
  constructor(
    private readonly proposalRepository: ProposalRepositoryPort,
    private readonly storagePort: StoragePort,
  ) {}

  async execute(
    input: CreateAttachmentUploadInput,
  ): Promise<CreateAttachmentUploadOutput> {
    if (input.category === "proposta_word") {
      throw new ValidationError(
        "Use o fluxo de envio da proposta para arquivo principal",
      );
    }

    const normalizedMimeType = input.mimeType.trim().toLowerCase();
    const fileExtension = input.fileName.split(".").pop()?.toLowerCase() ?? "";
    const isMimeTypeAllowed =
      normalizedMimeType.length > 0 && ALLOWED_MIME_TYPES.has(normalizedMimeType);
    const isFileExtensionAllowed = ALLOWED_FILE_EXTENSIONS.has(fileExtension);

    if (!isMimeTypeAllowed && !isFileExtensionAllowed) {
      throw new ValidationError("Tipo de arquivo não suportado");
    }

    if (input.fileSizeBytes <= 0 || input.fileSizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new ValidationError("Arquivo deve ter no máximo 50MB");
    }

    const proposalContext = await this.proposalRepository.getProposalStorageContext(
      input.proposalId,
    );

    if (!proposalContext) {
      throw new NotFoundError("Proposta não encontrada");
    }

    const safeFileName = input.fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_");

    const revisionFolder = input.revisionId ? `R${input.revisionId}` : "R0";
    const uniquePrefix = randomUUID();
    const path = [
      proposalContext.customerSlug,
      String(proposalContext.year),
      proposalContext.proposalCode,
      "revisions",
      revisionFolder,
      input.category,
      `${uniquePrefix}_${safeFileName}`,
    ].join("/");

    return this.storagePort.createSignedUploadUrl(path);
  }
}
