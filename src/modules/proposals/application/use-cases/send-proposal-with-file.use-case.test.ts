import { describe, expect, it } from "vitest";

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
import type {
  AttachmentRepositoryPort,
  CreateAttachmentRecordInput,
} from "@/modules/attachments/application/ports/attachment-repository.port";
import type { Attachment } from "@/modules/attachments/domain/attachment";
import type { StoragePort } from "@/modules/attachments/application/ports/storage.port";
import type {
  ActivityLogEntry,
  ActivityLogRepositoryPort,
  CreateActivityLogEntryInput,
} from "@/modules/proposals/application/ports/activity-log-repository.port";
import { SendProposalWithFileUseCase } from "@/modules/proposals/application/use-cases/send-proposal-with-file.use-case";
import type { Proposal, ProposalRevision } from "@/modules/proposals/domain/proposal";

class FakeProposalRepository implements ProposalRepositoryPort {
  constructor(private readonly proposalStatus: Proposal["status"]) {}

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
    return {
      proposalId: "proposal-1",
      customerSlug: "egis",
      proposalCode: "BV-EGIS-2026-BIM-001",
      year: 2026,
    };
  }

  async updateProposalStatus(input: UpdateProposalStatusInput): Promise<Proposal> {
    return {
      id: input.proposalId,
      customerId: "customer-1",
      code: "BV-EGIS-2026-BIM-001",
      seqNumber: 1,
      year: 2026,
      invitationCode: null,
      projectName: "Projeto",
      scopeDescription: "Escopo",
      status: input.status,
      dueDate: null,
      estimatedValueBrl: 1000,
      finalValueBrl: null,
      outcomeReason: null,
      createdBy: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
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

class FakeAttachmentRepository implements AttachmentRepositoryPort {
  createdInput: CreateAttachmentRecordInput | null = null;

  async createAttachment(input: CreateAttachmentRecordInput): Promise<Attachment> {
    this.createdInput = input;
    return {
      id: "attachment-1",
      proposalId: input.proposalId,
      revisionId: input.revisionId ?? null,
      category: input.category,
      fileName: input.fileName,
      storagePath: input.storagePath,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      uploadedBy: input.uploadedBy,
      createdAt: new Date(),
    };
  }

  async findById(): Promise<Attachment | null> {
    return null;
  }

  async findManyByProposalId(): Promise<Attachment[]> {
    return [];
  }

  async deleteById(): Promise<void> {}

  async deleteManyByRevisionId(): Promise<void> {}
}

class FakeStoragePort implements StoragePort {
  constructor(private readonly objectExistsResult: boolean) {}

  async createSignedUploadUrl() {
    return {
      path: "path",
      token: "token",
      signedUrl: "https://signed-upload",
    };
  }

  async createSignedDownloadUrl(): Promise<string> {
    return "https://signed-download";
  }

  async objectExists(): Promise<boolean> {
    return this.objectExistsResult;
  }

  async deleteObject(): Promise<void> {}
}

class FakeActivityLogRepository implements ActivityLogRepositoryPort {
  createdEntries: CreateActivityLogEntryInput[] = [];

  async create(input: CreateActivityLogEntryInput): Promise<ActivityLogEntry> {
    this.createdEntries.push(input);
    return {
      id: "activity-1",
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      metadata: input.metadata ?? {},
      createdBy: input.createdBy,
      createdAt: new Date(),
    };
  }

  async findManyByEntity(): Promise<ActivityLogEntry[]> {
    return [];
  }
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
    valueAfterBrl: null,
    notes: null,
    createdBy: "user-1",
    createdAt: new Date(),
  };
}

describe("SendProposalWithFileUseCase", () => {
  it("envia proposta com arquivo principal e registra status", async () => {
    const attachmentRepository = new FakeAttachmentRepository();
    const activityLogRepository = new FakeActivityLogRepository();
    const useCase = new SendProposalWithFileUseCase(
      new FakeProposalRepository("em_elaboracao"),
      new FakeRevisionRepository([buildRevision(1)]),
      attachmentRepository,
      new FakeStoragePort(true),
      activityLogRepository,
    );

    const output = await useCase.execute({
      proposalId: "proposal-1",
      fileName: "BV-EGIS-2026-BIM-001-R1.docx",
      storagePath: "egis/2026/BV-EGIS-2026-BIM-001/revisions/R1/proposta_word/doc.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSizeBytes: 2048,
      statusDate: "2026-02-10",
      sentBy: "user-2",
    });

    expect(output.proposal.status).toBe("enviada");
    expect(output.attachment.category).toBe("proposta_word");
    expect(attachmentRepository.createdInput?.revisionId).toBe("revision-1");
    expect(activityLogRepository.createdEntries[0]?.action).toBe("status_changed");
    expect(activityLogRepository.createdEntries[0]?.metadata?.source).toBe(
      "manual_send_with_file",
    );
  });

  it("rejeita quando arquivo não existe no storage", async () => {
    const useCase = new SendProposalWithFileUseCase(
      new FakeProposalRepository("em_elaboracao"),
      new FakeRevisionRepository([buildRevision(1)]),
      new FakeAttachmentRepository(),
      new FakeStoragePort(false),
      new FakeActivityLogRepository(),
    );

    await expect(
      useCase.execute({
        proposalId: "proposal-1",
        fileName: "BV-EGIS-2026-BIM-001-R1.docx",
        storagePath: "path/doc.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileSizeBytes: 2048,
        sentBy: "user-2",
      }),
    ).rejects.toThrow("Arquivo da proposta não encontrado no storage");
  });

  it("rejeita transição inválida para enviada", async () => {
    const useCase = new SendProposalWithFileUseCase(
      new FakeProposalRepository("ganha"),
      new FakeRevisionRepository([buildRevision(1)]),
      new FakeAttachmentRepository(),
      new FakeStoragePort(true),
      new FakeActivityLogRepository(),
    );

    await expect(
      useCase.execute({
        proposalId: "proposal-1",
        fileName: "BV-EGIS-2026-BIM-001-R1.docx",
        storagePath: "path/doc.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileSizeBytes: 2048,
        sentBy: "user-2",
      }),
    ).rejects.toThrow("Transição inválida de status");
  });

  it("rejeita proposta em revisão", async () => {
    const useCase = new SendProposalWithFileUseCase(
      new FakeProposalRepository("em_revisao"),
      new FakeRevisionRepository([buildRevision(1)]),
      new FakeAttachmentRepository(),
      new FakeStoragePort(true),
      new FakeActivityLogRepository(),
    );

    await expect(
      useCase.execute({
        proposalId: "proposal-1",
        fileName: "BV-EGIS-2026-BIM-001-R1.docx",
        storagePath: "path/doc.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileSizeBytes: 2048,
        sentBy: "user-2",
      }),
    ).rejects.toThrow(
      "Enquanto a proposta estiver em revisão, use fechar ou cancelar revisão",
    );
  });
});
