import { describe, expect, it } from "vitest";

import type {
  ActivityLogEntry,
  ActivityLogRepositoryPort,
  CreateActivityLogEntryInput,
} from "@/modules/proposals/application/ports/activity-log-repository.port";
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
import { UpdateProposalSupplierLinkUseCase } from "@/modules/proposals/application/use-cases/update-proposal-supplier-link.use-case";
import type { Proposal, ProposalRevision } from "@/modules/proposals/domain/proposal";

function buildProposal(status: Proposal["status"]): Proposal {
  return {
    id: "proposal-1",
    customerId: "customer-1",
    code: "BV-EGIS-2026-BIM-001",
    seqNumber: 1,
    year: 2026,
    invitationCode: null,
    projectName: "Projeto",
    scopeDescription: "Escopo",
    status,
    dueDate: null,
    estimatedValueBrl: 1000,
    finalValueBrl: null,
    outcomeReason: null,
    createdBy: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function buildRevision(revisionNumber: number, id: string): ProposalRevision {
  return {
    id,
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

class FakeProposalRepository implements ProposalRepositoryPort {
  constructor(private readonly proposal: Proposal | null) {}

  async getCustomerById(): Promise<CustomerLookup | null> {
    return null;
  }

  async findMany(_filters?: ListProposalsFilters): Promise<Proposal[]> {
    void _filters;
    return this.proposal ? [this.proposal] : [];
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
    return null;
  }

  async updateProposalStatus(_input: UpdateProposalStatusInput): Promise<Proposal> {
    void _input;
    throw new Error("not implemented");
  }
}

class FakeRevisionRepository implements RevisionRepositoryPort {
  constructor(private readonly revisions: ProposalRevision[]) {}

  async getNextRevisionNumber(): Promise<number> {
    return 1;
  }

  async findById(revisionId: string): Promise<ProposalRevision | null> {
    return this.revisions.find((revision) => revision.id === revisionId) ?? null;
  }

  async findManyByProposalId(): Promise<ProposalRevision[]> {
    return [...this.revisions];
  }

  async createRevision(_input: CreateRevisionRecordInput): Promise<ProposalRevision> {
    void _input;
    throw new Error("not implemented");
  }

  async updateRevision(_input: UpdateRevisionRecordInput): Promise<ProposalRevision> {
    void _input;
    throw new Error("not implemented");
  }

  async deleteById(_revisionId: string): Promise<void> {
    void _revisionId;
  }
}

class FakeProposalSupplierRepository implements ProposalSupplierRepositoryPort {
  lastUpdatedInput: UpdateProposalSupplierLinkInput | null = null;

  constructor(private readonly links: ProposalSupplierLink[]) {}

  async findById(linkId: string): Promise<ProposalSupplierLink | null> {
    return this.links.find((link) => link.id === linkId) ?? null;
  }

  async findManyByProposalId(): Promise<ProposalSupplierLink[]> {
    return this.links;
  }

  async findManyByProposalAndRevision(): Promise<ProposalSupplierLink[]> {
    return this.links;
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
    input: UpdateProposalSupplierLinkInput,
  ): Promise<ProposalSupplierLink> {
    this.lastUpdatedInput = input;

    const current = this.links.find((link) => link.id === input.linkId)!;
    return {
      ...current,
      roleDescription: input.roleDescription ?? null,
      quotedHourlyCostBrl: input.quotedHourlyCostBrl ?? null,
      estimatedHours: input.estimatedHours ?? null,
      quotedTotalBrl: input.quotedTotalBrl ?? null,
    };
  }

  async deleteById(_linkId: string): Promise<void> {
    void _linkId;
  }

  async deleteManyByRevisionId(_revisionId: string): Promise<void> {
    void _revisionId;
  }
}

class FakeActivityLogRepository implements ActivityLogRepositoryPort {
  readonly created: CreateActivityLogEntryInput[] = [];

  constructor(private readonly events: ActivityLogEntry[] = []) {}

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
    return this.events;
  }
}

function buildLink(revisionId: string, revisionNumber: number): ProposalSupplierLink {
  return {
    id: "link-1",
    proposalId: "proposal-1",
    revisionId,
    revisionNumber,
    supplierId: "supplier-1",
    supplierLegalName: "Fornecedor 1",
    supplierSpecialty: "BIM",
    roleDescription: "Coordenação",
    quotedHourlyCostBrl: 120,
    estimatedHours: 10,
    quotedTotalBrl: 1200,
    createdAt: new Date(),
  };
}

describe("UpdateProposalSupplierLinkUseCase", () => {
  it("atualiza vínculo da revisão atual em em_revisao", async () => {
    const proposalSupplierRepository = new FakeProposalSupplierRepository([
      buildLink("revision-2", 2),
    ]);
    const useCase = new UpdateProposalSupplierLinkUseCase(
      new FakeProposalRepository(buildProposal("em_revisao")),
      new FakeRevisionRepository([buildRevision(2, "revision-2")]),
      proposalSupplierRepository,
      new FakeActivityLogRepository([
        {
          id: "activity-1",
          entityType: "proposal",
          entityId: "proposal-1",
          action: "revision_cycle_opened",
          metadata: {
            cycleId: "cycle-1",
            revisionId: "revision-2",
            revisionNumber: 2,
            before: {
              scopeDescription: "Escopo",
              dueDate: null,
              estimatedValueBrl: 1000,
            },
          },
          createdBy: "user-1",
          createdAt: new Date(),
        },
      ]),
    );

    const updated = await useCase.execute({
      linkId: "link-1",
      roleDescription: "Modelagem",
      quotedHourlyCostBrl: 150,
      estimatedHours: 12,
      updatedBy: "user-2",
    });

    expect(updated.roleDescription).toBe("Modelagem");
    expect(updated.quotedTotalBrl).toBe(1800);
    expect(proposalSupplierRepository.lastUpdatedInput?.linkId).toBe("link-1");
  });

  it("bloqueia atualização quando vínculo não pertence à revisão atual", async () => {
    const useCase = new UpdateProposalSupplierLinkUseCase(
      new FakeProposalRepository(buildProposal("em_revisao")),
      new FakeRevisionRepository([buildRevision(1, "revision-1")]),
      new FakeProposalSupplierRepository([buildLink("revision-1", 1)]),
      new FakeActivityLogRepository([
        {
          id: "activity-1",
          entityType: "proposal",
          entityId: "proposal-1",
          action: "revision_cycle_opened",
          metadata: {
            cycleId: "cycle-1",
            revisionId: "revision-2",
            revisionNumber: 2,
            before: {
              scopeDescription: "Escopo",
              dueDate: null,
              estimatedValueBrl: 1000,
            },
          },
          createdBy: "user-1",
          createdAt: new Date(),
        },
      ]),
    );

    await expect(
      useCase.execute({
        linkId: "link-1",
        roleDescription: "Modelagem",
        updatedBy: "user-2",
      }),
    ).rejects.toThrow("Só é possível editar fornecedor da revisão atual em andamento");
  });

  it("atualiza vínculo da R0 em em_elaboracao", async () => {
    const useCase = new UpdateProposalSupplierLinkUseCase(
      new FakeProposalRepository(buildProposal("em_elaboracao")),
      new FakeRevisionRepository([buildRevision(0, "revision-0")]),
      new FakeProposalSupplierRepository([buildLink("revision-0", 0)]),
      new FakeActivityLogRepository(),
    );

    const updated = await useCase.execute({
      linkId: "link-1",
      quotedHourlyCostBrl: 100,
      estimatedHours: 20,
      updatedBy: "user-2",
    });

    expect(updated.quotedTotalBrl).toBe(2000);
  });

  it("bloqueia atualização fora de em_elaboracao/em_revisao", async () => {
    const useCase = new UpdateProposalSupplierLinkUseCase(
      new FakeProposalRepository(buildProposal("enviada")),
      new FakeRevisionRepository([buildRevision(0, "revision-0")]),
      new FakeProposalSupplierRepository([buildLink("revision-0", 0)]),
      new FakeActivityLogRepository(),
    );

    await expect(
      useCase.execute({
        linkId: "link-1",
        roleDescription: "Modelagem",
        updatedBy: "user-2",
      }),
    ).rejects.toThrow(
      "Fornecedor só pode ser editado em proposta em elaboração ou em revisão",
    );
  });
});
