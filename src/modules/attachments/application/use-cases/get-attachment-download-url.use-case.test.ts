import { describe, expect, it } from "vitest";

import type { AttachmentRepositoryPort } from "@/modules/attachments/application/ports/attachment-repository.port";
import type { StoragePort } from "@/modules/attachments/application/ports/storage.port";
import { GetAttachmentDownloadUrlUseCase } from "@/modules/attachments/application/use-cases/get-attachment-download-url.use-case";

class FakeAttachmentRepository implements AttachmentRepositoryPort {
  async createAttachment() {
    return {
      id: "att-created",
      proposalId: "proposal-1",
      revisionId: null,
      category: "tr" as const,
      fileName: "arquivo.pdf",
      storagePath: "path/arquivo.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 1200,
      uploadedBy: "user-1",
      createdAt: new Date(),
    };
  }

  async findById() {
    return {
      id: "att-1",
      proposalId: "proposal-1",
      revisionId: null,
      category: "tr" as const,
      fileName: "arquivo.pdf",
      storagePath: "path/arquivo.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 1200,
      uploadedBy: "user-1",
      createdAt: new Date(),
    };
  }

  async findManyByProposalId() {
    return [];
  }

  async deleteById() {}

  async deleteManyByRevisionId() {}
}

class FakeStoragePort implements StoragePort {
  lastDownloadName: string | boolean | undefined;

  async createSignedUploadUrl() {
    return {
      path: "path/arquivo.pdf",
      token: "token",
      signedUrl: "https://signed-upload",
    };
  }

  async createSignedDownloadUrl(
    _path: string,
    _expiresInSeconds: number,
    download?: string | boolean,
  ): Promise<string> {
    this.lastDownloadName = download;
    return "https://signed-download";
  }

  async objectExists(): Promise<boolean> {
    return true;
  }

  async deleteObject(): Promise<void> {}
}

describe("GetAttachmentDownloadUrlUseCase", () => {
  it("gera link assinado de download", async () => {
    const storage = new FakeStoragePort();
    const useCase = new GetAttachmentDownloadUrlUseCase(
      new FakeAttachmentRepository(),
      storage,
    );

    const output = await useCase.execute({ attachmentId: "att-1" });

    expect(output.signedUrl).toBe("https://signed-download");
    expect(output.expiresInSeconds).toBe(300);
    expect(output.attachment).toEqual({
      id: "att-1",
      proposalId: "proposal-1",
      fileName: "arquivo.pdf",
      mimeType: "application/pdf",
    });
    expect(storage.lastDownloadName).toBeUndefined();
  });

  it("gera link com nome original quando for download direto", async () => {
    const storage = new FakeStoragePort();
    const useCase = new GetAttachmentDownloadUrlUseCase(
      new FakeAttachmentRepository(),
      storage,
    );

    await useCase.execute({ attachmentId: "att-1", download: true });

    expect(storage.lastDownloadName).toBe("arquivo.pdf");
  });
});
