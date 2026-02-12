import { describe, expect, it } from "vitest";

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
  CreateProposalSupplierLinkInput,
  ProposalSupplierLink,
  ProposalSupplierRepositoryPort,
  UpdateProposalSupplierLinkInput,
} from "@/modules/proposals/application/ports/proposal-supplier-repository.port";
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
import { CancelProposalRevisionUseCase } from "@/modules/proposals/application/use-cases/cancel-proposal-revision.use-case";
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
    scopeDescription: "Escopo alterado",
    status,
    dueDate: "2026-04-01",
    estimatedValueBrl: 1500,
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

  async updateBaseFields(input: UpdateProposalBaseFieldsInput): Promise<Proposal> {
    this.proposal = {
      ...this.proposal,
      projectName: input.projectName,
      invitationCode: input.invitationCode ?? null,
      scopeDescription: input.scopeDescription,
      dueDate: input.dueDate ?? null,
      estimatedValueBrl: input.estimatedValueBrl ?? null,
      updatedAt: new Date(),
    };

    return this.proposal;
  }

  async getProposalById(): Promise<Proposal | null> {
    return this.proposal;
  }


  async deleteById(): Promise<void> {}

  async getProposalStorageContext(): Promise<ProposalStorageContext | null> {
    return null;
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
  deletedRevisionId: string | null = null;

  private revision: ProposalRevision | null = {
    id: "revision-2",
    proposalId: "proposal-1",
    revisionNumber: 2,
    reason: null,
    scopeChanges: null,
    discountBrl: null,
    discountPercent: null,
    valueBeforeBrl: null,
    valueAfterBrl: null,
    notes: null,
    createdBy: "user-1",
    createdAt: new Date("2026-01-10T00:00:00.000Z"),
  };

  async getNextRevisionNumber(): Promise<number> {
    return 3;
  }

  async findById(revisionId: string): Promise<ProposalRevision | null> {
    if (this.revision?.id !== revisionId) {
      return null;
    }

    return this.revision;
  }

  async findManyByProposalId(): Promise<ProposalRevision[]> {
    return this.revision ? [this.revision] : [];
  }

  async createRevision(_input: CreateRevisionRecordInput): Promise<ProposalRevision> {
    void _input;
    throw new Error("not implemented");
  }

  async updateRevision(_input: UpdateRevisionRecordInput): Promise<ProposalRevision> {
    void _input;
    throw new Error("not implemented");
  }

  async deleteById(revisionId: string): Promise<void> {
    this.deletedRevisionId = revisionId;
    if (this.revision?.id === revisionId) {
      this.revision = null;
    }
  }
}

class FakeProposalSupplierRepository implements ProposalSupplierRepositoryPort {
  deletedRevisionId: string | null = null;

  async findById(): Promise<ProposalSupplierLink | null> {
    return null;
  }

  async findManyByProposalId(): Promise<ProposalSupplierLink[]> {
    return [];
  }

  async findManyByProposalAndRevision(): Promise<ProposalSupplierLink[]> {
    return [];
  }

  async existsLink(): Promise<boolean> {
    return false;
  }

  async createLink(
    _input: CreateProposalSupplierLinkInput,
  ): Promise<ProposalSupplierLink> {
    void _input;
    throw new Error("not implemented");
  }

  async copyRevisionLinks(): Promise<number> {
    return 0;
  }

  async updateLinkValues(
    _input: UpdateProposalSupplierLinkInput,
  ): Promise<ProposalSupplierLink> {
    void _input;
    throw new Error("not implemented");
  }

  async deleteById(): Promise<void> {}

  async deleteManyByRevisionId(revisionId: string): Promise<void> {
    this.deletedRevisionId = revisionId;
  }
}

class FakeAttachmentRepository implements AttachmentRepositoryPort {
  deletedRevisionId: string | null = null;

  async createAttachment(_input: CreateAttachmentRecordInput): Promise<Attachment> {
    void _input;
    throw new Error("not implemented");
  }

  async findById(): Promise<Attachment | null> {
    return null;
  }

  async findManyByProposalId(): Promise<Attachment[]> {
    return [];
  }

  async deleteById(): Promise<void> {}

  async deleteManyByRevisionId(revisionId: string): Promise<void> {
    this.deletedRevisionId = revisionId;
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
      revisionId: "revision-2",
      revisionNumber: 2,
      before: {
        scopeDescription: "Escopo original",
        dueDate: "2026-03-01",
        estimatedValueBrl: 1000,
      },
      after: {
        scopeDescription: "Escopo alterado",
        dueDate: "2026-04-01",
        estimatedValueBrl: 1500,
      },
    },
    createdBy: "user-1",
    createdAt: new Date("2026-01-15T00:00:00.000Z"),
  };
}

describe("CancelProposalRevisionUseCase", () => {
  it("reverte snapshot crítico, remove revisão corrente e retorna para enviada", async () => {
    const proposalRepository = new FakeProposalRepository(buildProposal("em_revisao"));
    const revisionRepository = new FakeRevisionRepository();
    const proposalSupplierRepository = new FakeProposalSupplierRepository();
    const attachmentRepository = new FakeAttachmentRepository();
    const activityLogRepository = new FakeActivityLogRepository([
      buildOpenedCycleEvent(),
    ]);
    const useCase = new CancelProposalRevisionUseCase(
      proposalRepository,
      revisionRepository,
      proposalSupplierRepository,
      attachmentRepository,
      activityLogRepository,
    );

    const updated = await useCase.execute({
      proposalId: "proposal-1",
      canceledBy: "user-2",
    });

    expect(updated.status).toBe("enviada");
    expect(updated.scopeDescription).toBe("Escopo original");
    expect(updated.dueDate).toBe("2026-03-01");
    expect(updated.estimatedValueBrl).toBe(1000);
    expect(revisionRepository.deletedRevisionId).toBe("revision-2");
    expect(proposalSupplierRepository.deletedRevisionId).toBe("revision-2");
    expect(attachmentRepository.deletedRevisionId).toBe("revision-2");
    expect(activityLogRepository.created.map((event) => event.action)).toEqual([
      "revision_cycle_canceled",
      "status_changed",
    ]);
  });

  it("falha quando proposta não está em revisão", async () => {
    const proposalRepository = new FakeProposalRepository(buildProposal("enviada"));
    const revisionRepository = new FakeRevisionRepository();
    const proposalSupplierRepository = new FakeProposalSupplierRepository();
    const attachmentRepository = new FakeAttachmentRepository();
    const activityLogRepository = new FakeActivityLogRepository([
      buildOpenedCycleEvent(),
    ]);
    const useCase = new CancelProposalRevisionUseCase(
      proposalRepository,
      revisionRepository,
      proposalSupplierRepository,
      attachmentRepository,
      activityLogRepository,
    );

    await expect(
      useCase.execute({
        proposalId: "proposal-1",
        canceledBy: "user-2",
      }),
    ).rejects.toThrow("A proposta não está em revisão para cancelamento");
  });
});
