import { describe, expect, it } from "vitest";

import type { AttachmentRepositoryPort } from "@/modules/attachments/application/ports/attachment-repository.port";
import type { StoragePort } from "@/modules/attachments/application/ports/storage.port";
import type { Attachment } from "@/modules/attachments/domain/attachment";
import type {
  CustomerLookup,
  CreateProposalRecordInput,
  ListProposalsFilters,
  ProposalDetailRecord,
  ProposalListRecord,
  ProposalRepositoryPort,
  ProposalStorageContext,
  UpdateProposalBaseFieldsInput,
  UpdateProposalStatusInput,
} from "@/modules/proposals/application/ports/proposal-repository.port";
import { DeleteProposalUseCase } from "@/modules/proposals/application/use-cases/delete-proposal.use-case";
import type { Proposal } from "@/modules/proposals/domain/proposal";

function buildProposal(status: Proposal["status"]): Proposal {
  return {
    id: "proposal-1",
    customerId: "customer-1",
    code: "BV-EGIS-2026-BIM-001",
    seqNumber: 1,
    year: 2026,
    invitationCode: null,
    projectName: "Projeto teste",
    scopeDescription: "Escopo teste",
    status,
    dueDate: null,
    estimatedValueBrl: 1000,
    finalValueBrl: null,
    outcomeReason: null,
    createdBy: "user-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

class FakeProposalRepository implements ProposalRepositoryPort {
  deletedProposalId: string | null = null;

  constructor(private readonly proposal: Proposal | null) {}

  async getCustomerById(): Promise<CustomerLookup | null> {
    return null;
  }

  async findMany(_filters?: ListProposalsFilters): Promise<ProposalListRecord[]> {
    void _filters;
    return [];
  }

  async getDetailById(): Promise<ProposalDetailRecord | null> {
    return null;
  }

  async allocateNextSequence(): Promise<number> {
    return 1;
  }

  async createProposal(_input: CreateProposalRecordInput): Promise<Proposal> {
    void _input;
    throw new Error("not implemented");
  }

  async updateBaseFields(_input: UpdateProposalBaseFieldsInput): Promise<Proposal> {
    void _input;
    throw new Error("not implemented");
  }

  async getProposalById(): Promise<Proposal | null> {
    return this.proposal;
  }

  async deleteById(proposalId: string): Promise<void> {
    this.deletedProposalId = proposalId;
  }

  async getProposalStorageContext(): Promise<ProposalStorageContext | null> {
    return null;
  }

  async updateProposalStatus(_input: UpdateProposalStatusInput): Promise<Proposal> {
    void _input;
    throw new Error("not implemented");
  }
}

class FakeAttachmentRepository implements AttachmentRepositoryPort {
  findManyByProposalIdCalledWith: string | null = null;

  constructor(private readonly attachments: Attachment[]) {}

  async createAttachment(): Promise<Attachment> {
    throw new Error("not implemented");
  }

  async findById(): Promise<Attachment | null> {
    return null;
  }

  async findManyByProposalId(proposalId: string): Promise<Attachment[]> {
    this.findManyByProposalIdCalledWith = proposalId;
    return this.attachments;
  }

  async deleteById(): Promise<void> {}

  async deleteManyByRevisionId(): Promise<void> {}
}

class FakeStoragePort implements StoragePort {
  deletedPaths: string[] = [];
  checkedPaths: string[] = [];

  constructor(private readonly existingPaths: Set<string>) {}

  async createSignedUploadUrl() {
    return {
      path: "unused",
      token: "unused",
      signedUrl: "unused",
    };
  }

  async createSignedDownloadUrl(): Promise<string> {
    return "unused";
  }

  async objectExists(path: string): Promise<boolean> {
    this.checkedPaths.push(path);
    return this.existingPaths.has(path);
  }

  async deleteObject(path: string): Promise<void> {
    this.deletedPaths.push(path);
  }
}

function buildAttachment(storagePath: string): Attachment {
  return {
    id: `att-${storagePath}`,
    proposalId: "proposal-1",
    revisionId: null,
    category: "referencia",
    fileName: "arquivo.pdf",
    storagePath,
    mimeType: "application/pdf",
    fileSizeBytes: 1000,
    uploadedBy: "user-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

describe("DeleteProposalUseCase", () => {
  it.each(["recebida", "em_elaboracao"] as const)(
    "remove proposta em status %s",
    async (status) => {
      const repository = new FakeProposalRepository(buildProposal(status));
      const attachmentRepository = new FakeAttachmentRepository([
        buildAttachment("path/existente-1.pdf"),
        buildAttachment("path/inexistente-2.pdf"),
        buildAttachment("path/existente-3.pdf"),
      ]);
      const storagePort = new FakeStoragePort(
        new Set(["path/existente-1.pdf", "path/existente-3.pdf"]),
      );
      const useCase = new DeleteProposalUseCase(
        repository,
        attachmentRepository,
        storagePort,
      );

      const output = await useCase.execute({ proposalId: "proposal-1" });

      expect(output.proposalId).toBe("proposal-1");
      expect(repository.deletedProposalId).toBe("proposal-1");
      expect(attachmentRepository.findManyByProposalIdCalledWith).toBe("proposal-1");
      expect(storagePort.checkedPaths).toEqual([
        "path/existente-1.pdf",
        "path/inexistente-2.pdf",
        "path/existente-3.pdf",
      ]);
      expect(storagePort.deletedPaths).toEqual([
        "path/existente-1.pdf",
        "path/existente-3.pdf",
      ]);
    },
  );

  it.each(["enviada", "em_revisao", "ganha", "perdida", "cancelada"] as const)(
    "bloqueia exclusão para status %s",
    async (status) => {
      const repository = new FakeProposalRepository(buildProposal(status));
      const attachmentRepository = new FakeAttachmentRepository([
        buildAttachment("path/existente-1.pdf"),
      ]);
      const storagePort = new FakeStoragePort(new Set(["path/existente-1.pdf"]));
      const useCase = new DeleteProposalUseCase(
        repository,
        attachmentRepository,
        storagePort,
      );

      await expect(
        useCase.execute({ proposalId: "proposal-1" }),
      ).rejects.toThrow("Só é possível excluir propostas recebidas ou em elaboração");
      expect(repository.deletedProposalId).toBeNull();
      expect(attachmentRepository.findManyByProposalIdCalledWith).toBeNull();
      expect(storagePort.checkedPaths).toEqual([]);
      expect(storagePort.deletedPaths).toEqual([]);
    },
  );

  it("retorna erro quando proposta não existe", async () => {
    const repository = new FakeProposalRepository(null);
    const attachmentRepository = new FakeAttachmentRepository([
      buildAttachment("path/existente-1.pdf"),
    ]);
    const storagePort = new FakeStoragePort(new Set(["path/existente-1.pdf"]));
    const useCase = new DeleteProposalUseCase(
      repository,
      attachmentRepository,
      storagePort,
    );

    await expect(useCase.execute({ proposalId: "proposal-1" })).rejects.toThrow(
      "Proposta não encontrada",
    );
    expect(attachmentRepository.findManyByProposalIdCalledWith).toBeNull();
    expect(storagePort.checkedPaths).toEqual([]);
    expect(storagePort.deletedPaths).toEqual([]);
  });
});
