import { describe, expect, it } from "vitest";

import type { StoragePort } from "@/modules/attachments/application/ports/storage.port";
import { CreateAttachmentUploadUseCase } from "@/modules/attachments/application/use-cases/create-attachment-upload.use-case";
import type {
  ProposalRepositoryPort,
  ProposalStorageContext,
} from "@/modules/proposals/application/ports/proposal-repository.port";
import type { Proposal } from "@/modules/proposals/domain/proposal";

class FakeProposalRepository implements ProposalRepositoryPort {
  async findMany(): Promise<Proposal[]> {
    return [];
  }

  async getDetailById(): Promise<null> {
    return null;
  }

  async getCustomerById() {
    return null;
  }

  async allocateNextSequence() {
    return 1;
  }

  async createProposal(): Promise<Proposal> {
    throw new Error("not implemented");
  }

  async updateBaseFields(): Promise<Proposal> {
    throw new Error("not implemented");
  }

  async getProposalById(): Promise<Proposal | null> {
    return null;
  }

  async getProposalStorageContext(): Promise<ProposalStorageContext | null> {
    return {
      proposalId: "proposal-1",
      proposalCode: "BV-EGIS-2026-BIM-001",
      year: 2026,
      customerSlug: "EGIS",
    };
  }

  async updateProposalStatus(): Promise<Proposal> {
    throw new Error("not implemented");
  }
}

class FakeStoragePort implements StoragePort {
  async createSignedUploadUrl(path: string) {
    return {
      path,
      token: "token",
      signedUrl: "https://signed-url",
    };
  }

  async createSignedDownloadUrl(): Promise<string> {
    return "https://download-url";
  }

  async objectExists(): Promise<boolean> {
    return true;
  }
}

describe("CreateAttachmentUploadUseCase", () => {
  it("gera upload assinado para arquivo válido", async () => {
    const useCase = new CreateAttachmentUploadUseCase(
      new FakeProposalRepository(),
      new FakeStoragePort(),
    );

    const output = await useCase.execute({
      proposalId: "proposal-1",
      category: "tr",
      fileName: "termo-referencia.pdf",
      fileSizeBytes: 1024,
      mimeType: "application/pdf",
    });

    expect(output.path).toContain("BV-EGIS-2026-BIM-001");
    expect(output.token).toBe("token");
  });

  it("rejeita arquivo acima de 50MB", async () => {
    const useCase = new CreateAttachmentUploadUseCase(
      new FakeProposalRepository(),
      new FakeStoragePort(),
    );

    await expect(
      useCase.execute({
        proposalId: "proposal-1",
        category: "tr",
        fileName: "grande.zip",
        fileSizeBytes: 60 * 1024 * 1024,
        mimeType: "application/zip",
      }),
    ).rejects.toThrow("Arquivo deve ter no máximo 50MB");
  });
});
