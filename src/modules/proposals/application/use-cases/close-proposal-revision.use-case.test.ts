import { describe, expect, it } from "vitest";

import type {
  AttachmentRepositoryPort,
  CreateAttachmentRecordInput,
} from "@/modules/attachments/application/ports/attachment-repository.port";
import type { StoragePort } from "@/modules/attachments/application/ports/storage.port";
import type { Attachment } from "@/modules/attachments/domain/attachment";
import type {
  CustomerLookup,
  CreateProposalRecordInput,
  ListProposalsFilters,
  ProposalDetailRecord,
  ProposalRepositoryPort,
  ProposalStorageContext,
  UpdateProposalBaseFieldsInput,
  UpdateProposalStatusInput,
} from "@/modules/proposals/application/ports/proposal-repository.port";
import type {
  ActivityLogEntry,
  ActivityLogRepositoryPort,
  CreateActivityLogEntryInput,
} from "@/modules/proposals/application/ports/activity-log-repository.port";
import type {
  CreateRevisionRecordInput,
  RevisionRepositoryPort,
} from "@/modules/proposals/application/ports/revision-repository.port";
import { CloseProposalRevisionUseCase } from "@/modules/proposals/application/use-cases/close-proposal-revision.use-case";
import type { Proposal, ProposalRevision } from "@/modules/proposals/domain/proposal";

function buildProposal(status: Proposal["status"] = "em_revisao"): Proposal {
  return {
    id: "proposal-1",
    customerId: "customer-1",
    code: "BV-EGIS-2026-BIM-001",
    seqNumber: 1,
    year: 2026,
    invitationCode: null,
    projectName: "Projeto",
    scopeDescription: "Escopo atualizado",
    status,
    dueDate: "2026-04-01",
    estimatedValueBrl: 1200,
    finalValueBrl: null,
    outcomeReason: null,
    createdBy: "user-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

class FakeProposalRepository implements ProposalRepositoryPort {
  constructor(private proposal: Proposal) {}

  async getCustomerById(): Promise<CustomerLookup | null> {
    return null;
  }

  async findMany(_filters?: ListProposalsFilters): Promise<Proposal[]> {
    void _filters;
    return [this.proposal];
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

  async getProposalStorageContext(): Promise<ProposalStorageContext | null> {
    return {
      proposalId: "proposal-1",
      proposalCode: "BV-EGIS-2026-BIM-001",
      year: 2026,
      customerSlug: "egis",
    };
  }

  async updateProposalStatus(input: UpdateProposalStatusInput): Promise<Proposal> {
    this.proposal = {
      ...this.proposal,
      status: input.status,
      outcomeReason: input.outcomeReason ?? null,
      finalValueBrl: input.finalValueBrl ?? null,
      updatedAt: new Date(),
    };

    return this.proposal;
  }
}

class FakeRevisionRepository implements RevisionRepositoryPort {
  lastCreatedInput: CreateRevisionRecordInput | null = null;

  async getNextRevisionNumber(): Promise<number> {
    return 2;
  }

  async findById(): Promise<ProposalRevision | null> {
    return null;
  }

  async findManyByProposalId(): Promise<ProposalRevision[]> {
    return [];
  }

  async createRevision(input: CreateRevisionRecordInput): Promise<ProposalRevision> {
    this.lastCreatedInput = input;

    return {
      id: "revision-2",
      proposalId: input.proposalId,
      revisionNumber: input.revisionNumber,
      reason: input.reason ?? null,
      scopeChanges: input.scopeChanges ?? null,
      discountBrl: input.discountBrl ?? null,
      discountPercent: input.discountPercent ?? null,
      valueBeforeBrl: input.valueBeforeBrl ?? null,
      valueAfterBrl: input.valueAfterBrl ?? null,
      notes: input.notes ?? null,
      createdBy: input.createdBy,
      createdAt: new Date(),
    };
  }
}

class FakeAttachmentRepository implements AttachmentRepositoryPort {
  async createAttachment(input: CreateAttachmentRecordInput): Promise<Attachment> {
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
}

class FakeStoragePort implements StoragePort {
  constructor(private readonly exists: boolean) {}

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
    return this.exists;
  }
}

class FakeActivityLogRepository implements ActivityLogRepositoryPort {
  readonly created: CreateActivityLogEntryInput[] = [];

  constructor(private readonly existing: ActivityLogEntry[]) {}

  async create(input: CreateActivityLogEntryInput): Promise<ActivityLogEntry> {
    this.created.push(input);
    return {
      id: `activity-${this.created.length}`,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      metadata: input.metadata ?? {},
      createdBy: input.createdBy,
      createdAt: new Date(),
    };
  }

  async findManyByEntity(): Promise<ActivityLogEntry[]> {
    return this.existing;
  }
}

function buildOpenedCycleEvent(): ActivityLogEntry {
  return {
    id: "activity-open-cycle",
    entityType: "proposal",
    entityId: "proposal-1",
    action: "revision_cycle_opened",
    metadata: {
      cycleId: "cycle-1",
      before: {
        scopeDescription: "Escopo original",
        dueDate: "2026-03-01",
        estimatedValueBrl: 1000,
      },
      after: {
        scopeDescription: "Escopo atualizado",
        dueDate: "2026-04-01",
        estimatedValueBrl: 1200,
      },
    },
    createdBy: "user-1",
    createdAt: new Date("2026-01-15T00:00:00.000Z"),
  };
}

describe("CloseProposalRevisionUseCase", () => {
  it("fecha revisão pendente com criação de revisão, anexo e retorno para enviada", async () => {
    const proposalRepository = new FakeProposalRepository(buildProposal("em_revisao"));
    const revisionRepository = new FakeRevisionRepository();
    const attachmentRepository = new FakeAttachmentRepository();
    const storagePort = new FakeStoragePort(true);
    const activityLogRepository = new FakeActivityLogRepository([
      buildOpenedCycleEvent(),
    ]);

    const useCase = new CloseProposalRevisionUseCase(
      proposalRepository,
      revisionRepository,
      attachmentRepository,
      storagePort,
      activityLogRepository,
    );

    const output = await useCase.execute({
      proposalId: "proposal-1",
      reason: "Solicitação do cliente",
      scopeChanges: "Ajustes no escopo executivo",
      notes: "Ajuste final",
      fileName: "BV-EGIS-2026-BIM-001-R2.pdf",
      storagePath: "egis/2026/BV-EGIS-2026-BIM-001/revisions/R2/proposta_word/doc.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 1024,
      closedBy: "user-2",
    });

    expect(output.proposal.status).toBe("enviada");
    expect(output.revision.revisionNumber).toBe(2);
    expect(output.attachment.category).toBe("proposta_word");
    expect(activityLogRepository.created.map((event) => event.action)).toEqual([
      "revision_cycle_closed",
      "status_changed",
    ]);
  });

  it("calcula desconto automaticamente quando o valor da proposta reduz", async () => {
    const proposalRepository = new FakeProposalRepository({
      ...buildProposal("em_revisao"),
      estimatedValueBrl: 900,
    });
    const revisionRepository = new FakeRevisionRepository();
    const attachmentRepository = new FakeAttachmentRepository();
    const storagePort = new FakeStoragePort(true);
    const activityLogRepository = new FakeActivityLogRepository([
      buildOpenedCycleEvent(),
    ]);

    const useCase = new CloseProposalRevisionUseCase(
      proposalRepository,
      revisionRepository,
      attachmentRepository,
      storagePort,
      activityLogRepository,
    );

    const output = await useCase.execute({
      proposalId: "proposal-1",
      reason: "Ajuste comercial",
      fileName: "BV-EGIS-2026-BIM-001-R2.pdf",
      storagePath: "egis/2026/BV-EGIS-2026-BIM-001/revisions/R2/proposta_word/doc.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 1024,
      closedBy: "user-2",
    });

    expect(output.revision.discountBrl).toBe(100);
    expect(output.revision.discountPercent).toBe(10);
    expect(revisionRepository.lastCreatedInput?.valueBeforeBrl).toBe(1000);
    expect(revisionRepository.lastCreatedInput?.valueAfterBrl).toBe(900);
  });

  it("bloqueia fechamento quando proposta não está em revisão", async () => {
    const proposalRepository = new FakeProposalRepository(buildProposal("enviada"));
    const revisionRepository = new FakeRevisionRepository();
    const attachmentRepository = new FakeAttachmentRepository();
    const storagePort = new FakeStoragePort(true);
    const activityLogRepository = new FakeActivityLogRepository([
      buildOpenedCycleEvent(),
    ]);

    const useCase = new CloseProposalRevisionUseCase(
      proposalRepository,
      revisionRepository,
      attachmentRepository,
      storagePort,
      activityLogRepository,
    );

    await expect(
      useCase.execute({
        proposalId: "proposal-1",
        reason: "Solicitação do cliente",
        fileName: "BV-EGIS-2026-BIM-001-R2.pdf",
        storagePath: "path/doc.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 1024,
        closedBy: "user-2",
      }),
    ).rejects.toThrow("A proposta não está em revisão");
  });

  it("valida extensão do documento de fechamento", async () => {
    const proposalRepository = new FakeProposalRepository(buildProposal("em_revisao"));
    const revisionRepository = new FakeRevisionRepository();
    const attachmentRepository = new FakeAttachmentRepository();
    const storagePort = new FakeStoragePort(true);
    const activityLogRepository = new FakeActivityLogRepository([
      buildOpenedCycleEvent(),
    ]);

    const useCase = new CloseProposalRevisionUseCase(
      proposalRepository,
      revisionRepository,
      attachmentRepository,
      storagePort,
      activityLogRepository,
    );

    await expect(
      useCase.execute({
        proposalId: "proposal-1",
        reason: "Solicitação do cliente",
        fileName: "BV-EGIS-2026-BIM-001-R2.xlsx",
        storagePath: "path/doc.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        fileSizeBytes: 1024,
        closedBy: "user-2",
      }),
    ).rejects.toThrow("Documento da revisão deve ter extensão DOC, DOCX ou PDF");
  });
});
