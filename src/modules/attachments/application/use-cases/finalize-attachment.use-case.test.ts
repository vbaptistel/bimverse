import { describe, expect, it } from "vitest";

import type { AttachmentRepositoryPort } from "@/modules/attachments/application/ports/attachment-repository.port";
import type { StoragePort } from "@/modules/attachments/application/ports/storage.port";
import { FinalizeAttachmentUseCase } from "@/modules/attachments/application/use-cases/finalize-attachment.use-case";
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
    return {
      id: "proposal-1",
      customerId: "customer-1",
      code: "BV-EGIS-2026-BIM-001",
      seqNumber: 1,
      year: 2026,
      invitationCode: null,
      projectName: "Projeto",
      scopeDescription: "Escopo",
      status: "enviada",
      dueDate: null,
      estimatedValueBrl: 100,
      finalValueBrl: null,
      outcomeReason: null,
      createdBy: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async deleteById(): Promise<void> {}

  async getProposalStorageContext(): Promise<ProposalStorageContext | null> {
    return null;
  }

  async updateProposalStatus(): Promise<Proposal> {
    throw new Error("not implemented");
  }
}

class FakeAttachmentRepository implements AttachmentRepositoryPort {
  async createAttachment() {
    return {
      id: "att-1",
      proposalId: "proposal-1",
      revisionId: null,
      category: "tr" as const,
      fileName: "arquivo.pdf",
      storagePath: "path/arquivo.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 1000,
      uploadedBy: "user-1",
      createdAt: new Date(),
    };
  }

  async findById() {
    return null;
  }

  async findManyByProposalId() {
    return [];
  }

  async deleteById() {}

  async deleteManyByRevisionId() {}
}

class FakeStoragePort implements StoragePort {
  constructor(private readonly exists: boolean) {}

  async createSignedUploadUrl() {
    return {
      path: "path/arquivo.pdf",
      token: "token",
      signedUrl: "https://signed-upload",
    };
  }

  async createSignedDownloadUrl(): Promise<string> {
    return "https://download";
  }

  async objectExists(): Promise<boolean> {
    return this.exists;
  }

  async deleteObject(): Promise<void> {}
}

describe("FinalizeAttachmentUseCase", () => {
  it("persist metadata quando objeto existe no storage", async () => {
    const useCase = new FinalizeAttachmentUseCase(
      new FakeProposalRepository(),
      new FakeAttachmentRepository(),
      new FakeStoragePort(true),
    );

    const attachment = await useCase.execute({
      proposalId: "proposal-1",
      category: "tr",
      fileName: "arquivo.pdf",
      storagePath: "path/arquivo.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 1000,
      uploadedBy: "user-1",
    });

    expect(attachment.id).toBe("att-1");
  });

  it("falha quando objeto não existe no storage", async () => {
    const useCase = new FinalizeAttachmentUseCase(
      new FakeProposalRepository(),
      new FakeAttachmentRepository(),
      new FakeStoragePort(false),
    );

    await expect(
      useCase.execute({
        proposalId: "proposal-1",
        category: "tr",
        fileName: "arquivo.pdf",
        storagePath: "path/arquivo.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 1000,
        uploadedBy: "user-1",
      }),
    ).rejects.toThrow("Arquivo não encontrado no storage");
  });

  it("rejeita categoria de arquivo principal no fluxo de anexos", async () => {
    const useCase = new FinalizeAttachmentUseCase(
      new FakeProposalRepository(),
      new FakeAttachmentRepository(),
      new FakeStoragePort(true),
    );

    await expect(
      useCase.execute({
        proposalId: "proposal-1",
        category: "proposta_word",
        fileName: "BV-EGIS-2026-BIM-001-R1.docx",
        storagePath: "path/doc.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileSizeBytes: 1000,
        uploadedBy: "user-1",
      }),
    ).rejects.toThrow("Use o fluxo de envio da proposta para arquivo principal");
  });
});
