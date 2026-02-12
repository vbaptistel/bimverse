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

  async deleteManyByRevisionId() {}
}

class FakeStoragePort implements StoragePort {
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
    return true;
  }
}

describe("GetAttachmentDownloadUrlUseCase", () => {
  it("gera link assinado de download", async () => {
    const useCase = new GetAttachmentDownloadUrlUseCase(
      new FakeAttachmentRepository(),
      new FakeStoragePort(),
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
  });
});
