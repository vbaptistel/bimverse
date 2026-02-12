import { describe, expect, it } from "vitest";

import type { AttachmentRepositoryPort } from "@/modules/attachments/application/ports/attachment-repository.port";
import type { StoragePort } from "@/modules/attachments/application/ports/storage.port";
import { DeleteAttachmentUseCase } from "@/modules/attachments/application/use-cases/delete-attachment.use-case";
import type { Attachment } from "@/modules/attachments/domain/attachment";

class FakeAttachmentRepository implements AttachmentRepositoryPort {
  deletedAttachmentId: string | null = null;

  constructor(private readonly attachment: Attachment | null) {}

  async createAttachment(): Promise<Attachment> {
    throw new Error("not implemented");
  }

  async findById(): Promise<Attachment | null> {
    return this.attachment;
  }

  async findManyByProposalId(): Promise<Attachment[]> {
    return [];
  }

  async deleteById(attachmentId: string): Promise<void> {
    this.deletedAttachmentId = attachmentId;
  }

  async deleteManyByRevisionId(): Promise<void> {}
}

class FakeStoragePort implements StoragePort {
  deletedPaths: string[] = [];

  constructor(private readonly exists: boolean) {}

  async createSignedUploadUrl() {
    return {
      path: "path/arquivo.pdf",
      token: "token",
      signedUrl: "https://signed-upload",
    };
  }

  async createSignedDownloadUrl(): Promise<string> {
    return "https://signed-download";
  }

  async objectExists(): Promise<boolean> {
    return this.exists;
  }

  async deleteObject(path: string): Promise<void> {
    this.deletedPaths.push(path);
  }
}

function buildAttachment(
  overrides?: Partial<Attachment>,
): Attachment {
  return {
    id: "att-1",
    proposalId: "proposal-1",
    revisionId: "revision-1",
    category: "referencia",
    fileName: "escopo.pdf",
    storagePath: "path/escopo.pdf",
    mimeType: "application/pdf",
    fileSizeBytes: 1200,
    uploadedBy: "user-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("DeleteAttachmentUseCase", () => {
  it("exclui anexo do storage e do banco quando o arquivo existe", async () => {
    const repository = new FakeAttachmentRepository(buildAttachment());
    const storage = new FakeStoragePort(true);
    const useCase = new DeleteAttachmentUseCase(repository, storage);

    const output = await useCase.execute({ attachmentId: "att-1" });

    expect(output).toEqual({
      attachmentId: "att-1",
      proposalId: "proposal-1",
    });
    expect(storage.deletedPaths).toEqual(["path/escopo.pdf"]);
    expect(repository.deletedAttachmentId).toBe("att-1");
  });

  it("exclui metadados mesmo quando arquivo não existe no storage", async () => {
    const repository = new FakeAttachmentRepository(buildAttachment());
    const storage = new FakeStoragePort(false);
    const useCase = new DeleteAttachmentUseCase(repository, storage);

    await useCase.execute({ attachmentId: "att-1" });

    expect(storage.deletedPaths).toEqual([]);
    expect(repository.deletedAttachmentId).toBe("att-1");
  });

  it("retorna erro quando anexo não existe", async () => {
    const useCase = new DeleteAttachmentUseCase(
      new FakeAttachmentRepository(null),
      new FakeStoragePort(true),
    );

    await expect(useCase.execute({ attachmentId: "att-1" })).rejects.toThrow(
      "Anexo não encontrado",
    );
  });

  it("bloqueia exclusão do arquivo principal da proposta", async () => {
    const useCase = new DeleteAttachmentUseCase(
      new FakeAttachmentRepository(
        buildAttachment({ category: "proposta_word" }),
      ),
      new FakeStoragePort(true),
    );

    await expect(useCase.execute({ attachmentId: "att-1" })).rejects.toThrow(
      "Arquivo principal deve ser removido pelo fluxo de proposta",
    );
  });
});
