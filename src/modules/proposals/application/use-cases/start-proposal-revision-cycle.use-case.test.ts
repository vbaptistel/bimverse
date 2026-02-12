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
import { StartProposalRevisionCycleUseCase } from "@/modules/proposals/application/use-cases/start-proposal-revision-cycle.use-case";
import type { Proposal, ProposalRevision } from "@/modules/proposals/domain/proposal";

function buildProposal(status: Proposal["status"] = "enviada"): Proposal {
  return {
    id: "proposal-1",
    customerId: "customer-1",
    code: "BV-EGIS-2026-BIM-001",
    seqNumber: 1,
    year: 2026,
    invitationCode: "INV-01",
    projectName: "Projeto original",
    scopeDescription: "Escopo original",
    status,
    dueDate: "2026-03-01",
    estimatedValueBrl: 1000,
    finalValueBrl: null,
    outcomeReason: null,
    createdBy: "user-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

function buildRevision(
  revisionNumber: number,
  id = `revision-${revisionNumber}`,
): ProposalRevision {
  return {
    id,
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
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
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
  createdRevision: ProposalRevision | null = null;

  constructor(private revisions: ProposalRevision[]) {}

  async getNextRevisionNumber(): Promise<number> {
    return this.revisions.reduce((max, revision) => {
      return Math.max(max, revision.revisionNumber);
    }, -1) + 1;
  }

  async findById(revisionId: string): Promise<ProposalRevision | null> {
    return this.revisions.find((revision) => revision.id === revisionId) ?? null;
  }

  async findManyByProposalId(): Promise<ProposalRevision[]> {
    return [...this.revisions].sort(
      (a, b) => b.revisionNumber - a.revisionNumber,
    );
  }

  async createRevision(input: CreateRevisionRecordInput): Promise<ProposalRevision> {
    const revision: ProposalRevision = {
      id: `revision-${input.revisionNumber}`,
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

    this.revisions.push(revision);
    this.createdRevision = revision;

    return revision;
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
  readonly copyCalls: Array<{
    proposalId: string;
    sourceRevisionId: string;
    targetRevisionId: string;
  }> = [];

  constructor(private links: ProposalSupplierLink[]) {}

  async findById(linkId: string): Promise<ProposalSupplierLink | null> {
    return this.links.find((link) => link.id === linkId) ?? null;
  }

  async findManyByProposalId(proposalId: string): Promise<ProposalSupplierLink[]> {
    return this.links.filter((link) => link.proposalId === proposalId);
  }

  async findManyByProposalAndRevision(
    proposalId: string,
    revisionId: string,
  ): Promise<ProposalSupplierLink[]> {
    return this.links.filter(
      (link) => link.proposalId === proposalId && link.revisionId === revisionId,
    );
  }

  async existsLink(
    proposalId: string,
    supplierId: string,
    revisionId: string,
  ): Promise<boolean> {
    return this.links.some(
      (link) =>
        link.proposalId === proposalId &&
        link.supplierId === supplierId &&
        link.revisionId === revisionId,
    );
  }

  async createLink(input: CreateProposalSupplierLinkInput): Promise<ProposalSupplierLink> {
    const link: ProposalSupplierLink = {
      id: `link-${this.links.length + 1}`,
      proposalId: input.proposalId,
      revisionId: input.revisionId,
      revisionNumber: null,
      supplierId: input.supplierId,
      supplierLegalName: "Fornecedor",
      supplierSpecialty: "BIM",
      roleDescription: input.roleDescription ?? null,
      quotedHourlyCostBrl: input.quotedHourlyCostBrl ?? null,
      estimatedHours: input.estimatedHours ?? null,
      quotedTotalBrl: input.quotedTotalBrl ?? null,
      createdAt: new Date(),
    };

    this.links.push(link);
    return link;
  }

  async copyRevisionLinks(
    proposalId: string,
    sourceRevisionId: string,
    targetRevisionId: string,
  ): Promise<number> {
    this.copyCalls.push({ proposalId, sourceRevisionId, targetRevisionId });

    const sourceLinks = this.links.filter(
      (link) =>
        link.proposalId === proposalId && link.revisionId === sourceRevisionId,
    );

    for (const sourceLink of sourceLinks) {
      this.links.push({
        ...sourceLink,
        id: `link-${this.links.length + 1}`,
        revisionId: targetRevisionId,
        revisionNumber: null,
        createdAt: new Date(),
      });
    }

    return sourceLinks.length;
  }

  async updateLinkValues(
    _input: UpdateProposalSupplierLinkInput,
  ): Promise<ProposalSupplierLink> {
    void _input;
    throw new Error("not implemented");
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

describe("StartProposalRevisionCycleUseCase", () => {
  it("inicia revisão manual para proposta enviada com cópia de fornecedores", async () => {
    const proposalRepository = new FakeProposalRepository(buildProposal("enviada"));
    const revisionRepository = new FakeRevisionRepository([buildRevision(0, "revision-0")]);
    const proposalSupplierRepository = new FakeProposalSupplierRepository([
      {
        id: "link-1",
        proposalId: "proposal-1",
        revisionId: "revision-0",
        revisionNumber: 0,
        supplierId: "supplier-1",
        supplierLegalName: "Fornecedor 1",
        supplierSpecialty: "BIM",
        roleDescription: "Coordenação",
        quotedHourlyCostBrl: 100,
        estimatedHours: 10,
        quotedTotalBrl: 1000,
        createdAt: new Date(),
      },
    ]);
    const activityLogRepository = new FakeActivityLogRepository();
    const useCase = new StartProposalRevisionCycleUseCase(
      proposalRepository,
      revisionRepository,
      proposalSupplierRepository,
      activityLogRepository,
    );

    const output = await useCase.execute({
      proposalId: "proposal-1",
      startedBy: "user-2",
    });

    expect(output.proposal.status).toBe("em_revisao");
    expect(output.cycleId).toBeTruthy();
    expect(revisionRepository.createdRevision?.revisionNumber).toBe(1);
    expect(proposalSupplierRepository.copyCalls).toHaveLength(1);
    expect(activityLogRepository.created.map((event) => event.action)).toEqual([
      "revision_cycle_opened",
      "status_changed",
    ]);

    const openedMetadata = activityLogRepository.created[0]?.metadata;
    expect(openedMetadata?.revisionId).toBe("revision-1");
    expect(openedMetadata?.revisionNumber).toBe(1);
    expect(openedMetadata?.copiedSuppliersCount).toBe(1);
  });

  it("bloqueia início de revisão quando status não é enviada", async () => {
    const proposalRepository = new FakeProposalRepository(buildProposal("em_elaboracao"));
    const revisionRepository = new FakeRevisionRepository([buildRevision(0, "revision-0")]);
    const proposalSupplierRepository = new FakeProposalSupplierRepository([]);
    const activityLogRepository = new FakeActivityLogRepository();
    const useCase = new StartProposalRevisionCycleUseCase(
      proposalRepository,
      revisionRepository,
      proposalSupplierRepository,
      activityLogRepository,
    );

    await expect(
      useCase.execute({
        proposalId: "proposal-1",
        startedBy: "user-2",
      }),
    ).rejects.toThrow("Só é possível iniciar nova revisão para propostas enviadas");
  });

  it("bloqueia início de revisão quando já existe ciclo pendente", async () => {
    const proposalRepository = new FakeProposalRepository(buildProposal("enviada"));
    const revisionRepository = new FakeRevisionRepository([buildRevision(0, "revision-0")]);
    const proposalSupplierRepository = new FakeProposalSupplierRepository([]);
    const activityLogRepository = new FakeActivityLogRepository([
      {
        id: "activity-1",
        entityType: "proposal",
        entityId: "proposal-1",
        action: "revision_cycle_opened",
        metadata: {
          cycleId: "cycle-1",
          revisionId: "revision-1",
          revisionNumber: 1,
          before: {
            scopeDescription: "Escopo original",
            dueDate: "2026-03-01",
            estimatedValueBrl: 1000,
          },
        },
        createdBy: "user-1",
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    ]);
    const useCase = new StartProposalRevisionCycleUseCase(
      proposalRepository,
      revisionRepository,
      proposalSupplierRepository,
      activityLogRepository,
    );

    await expect(
      useCase.execute({
        proposalId: "proposal-1",
        startedBy: "user-2",
      }),
    ).rejects.toThrow("Já existe um ciclo de revisão pendente");
  });
});
