import { describe, expect, it } from "vitest";

import type { StoragePort } from "@/modules/attachments/application/ports/storage.port";
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
import type {
  CreateRevisionRecordInput,
  RevisionRepositoryPort,
  UpdateRevisionRecordInput,
} from "@/modules/proposals/application/ports/revision-repository.port";
import { PrepareProposalSendUploadUseCase } from "@/modules/proposals/application/use-cases/prepare-proposal-send-upload.use-case";
import type { Proposal, ProposalRevision } from "@/modules/proposals/domain/proposal";

class FakeProposalRepository implements ProposalRepositoryPort {
  constructor(
    private readonly proposalStatus: Proposal["status"],
    private readonly storageContext: ProposalStorageContext | null = {
      proposalId: "proposal-1",
      customerSlug: "egis",
      proposalCode: "BV-EGIS-2026-BIM-001",
      year: 2026,
    },
  ) {}

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
    return {
      id: "proposal-1",
      customerId: "customer-1",
      code: "BV-EGIS-2026-BIM-001",
      seqNumber: 1,
      year: 2026,
      invitationCode: null,
      projectName: "Projeto",
      scopeDescription: "Escopo",
      status: this.proposalStatus,
      dueDate: null,
      estimatedValueBrl: 1000,
      finalValueBrl: null,
      outcomeReason: null,
      createdBy: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }


  async deleteById(): Promise<void> {}

  async getProposalStorageContext(): Promise<ProposalStorageContext | null> {
    return this.storageContext;
  }

  async updateProposalStatus(_input: UpdateProposalStatusInput): Promise<Proposal> {
    void _input;
    throw new Error("not implemented");
  }
}

class FakeRevisionRepository implements RevisionRepositoryPort {
  constructor(private readonly revisions: ProposalRevision[]) {}

  async getNextRevisionNumber(): Promise<number> {
    return 0;
  }

  async findById(): Promise<ProposalRevision | null> {
    return null;
  }

  async findManyByProposalId(): Promise<ProposalRevision[]> {
    return this.revisions;
  }

  async createRevision(_input: CreateRevisionRecordInput): Promise<ProposalRevision> {
    void _input;
    throw new Error("not implemented");
  }

  async updateRevision(_input: UpdateRevisionRecordInput): Promise<ProposalRevision> {
    void _input;
    throw new Error("not implemented");
  }

  async deleteById(): Promise<void> {}
}

class FakeStoragePort implements StoragePort {
  async createSignedUploadUrl(path: string) {
    return {
      path,
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

  async deleteObject(): Promise<void> {}
}

function buildRevision(revisionNumber: number): ProposalRevision {
  return {
    id: `revision-${revisionNumber}`,
    proposalId: "proposal-1",
    revisionNumber,
    reason: null,
    scopeChanges: null,
    discountBrl: null,
    discountPercent: null,
    valueBeforeBrl: null,
    valueAfterBrl: 1000,
    notes: null,
    createdBy: "user-1",
    createdAt: new Date(),
  };
}

describe("PrepareProposalSendUploadUseCase", () => {
  it("gera upload assinado para envio manual com revisão atual", async () => {
    const useCase = new PrepareProposalSendUploadUseCase(
      new FakeProposalRepository("em_elaboracao"),
      new FakeRevisionRepository([buildRevision(3)]),
      new FakeStoragePort(),
    );

    const output = await useCase.execute({
      proposalId: "proposal-1",
      fileName: "BV-EGIS-2026-BIM-001-R3.docx",
      fileSizeBytes: 1024,
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    expect(output.currentRevisionNumber).toBe(3);
    expect(output.path).toContain("/revisions/R3/proposta_word/");
  });

  it("rejeita extensão inválida", async () => {
    const useCase = new PrepareProposalSendUploadUseCase(
      new FakeProposalRepository("em_elaboracao"),
      new FakeRevisionRepository([buildRevision(1)]),
      new FakeStoragePort(),
    );

    await expect(
      useCase.execute({
        proposalId: "proposal-1",
        fileName: "BV-EGIS-2026-BIM-001-R1.zip",
        fileSizeBytes: 1024,
        mimeType: "application/zip",
      }),
    ).rejects.toThrow("Documento da proposta deve ter extensão DOC, DOCX ou PDF");
  });

  it("rejeita transição quando proposta não pode ir para enviada", async () => {
    const useCase = new PrepareProposalSendUploadUseCase(
      new FakeProposalRepository("ganha"),
      new FakeRevisionRepository([buildRevision(1)]),
      new FakeStoragePort(),
    );

    await expect(
      useCase.execute({
        proposalId: "proposal-1",
        fileName: "BV-EGIS-2026-BIM-001-R1.docx",
        fileSizeBytes: 1024,
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    ).rejects.toThrow("Transição inválida de status");
  });

  it("rejeita proposta em revisão", async () => {
    const useCase = new PrepareProposalSendUploadUseCase(
      new FakeProposalRepository("em_revisao"),
      new FakeRevisionRepository([buildRevision(1)]),
      new FakeStoragePort(),
    );

    await expect(
      useCase.execute({
        proposalId: "proposal-1",
        fileName: "BV-EGIS-2026-BIM-001-R1.docx",
        fileSizeBytes: 1024,
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    ).rejects.toThrow(
      "Enquanto a proposta estiver em revisão, use fechar ou cancelar revisão",
    );
  });
});
