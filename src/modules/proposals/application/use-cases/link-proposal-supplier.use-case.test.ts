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
import { LinkProposalSupplierUseCase } from "@/modules/proposals/application/use-cases/link-proposal-supplier.use-case";
import type { Proposal, ProposalRevision } from "@/modules/proposals/domain/proposal";
import type {
  CreateSupplierRecordInput,
  ListSuppliersFilters,
  Supplier,
  SupplierRepositoryPort,
  UpdateSupplierRecordInput,
} from "@/modules/suppliers/application/ports/supplier-repository.port";

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

function buildSupplier(): Supplier {
  return {
    id: "supplier-1",
    legalName: "Fornecedor 1",
    cnpj: "00000000000000",
    specialty: "BIM",
    hourlyCostBrl: 120,
    contactName: null,
    contactEmail: null,
    contactPhone: null,
    active: true,
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
    valueAfterBrl: 1000,
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


  async deleteById(): Promise<void> {}

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
    return [...this.revisions].sort((a, b) => b.revisionNumber - a.revisionNumber);
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

class FakeSupplierRepository implements SupplierRepositoryPort {
  constructor(private readonly supplier: Supplier | null) {}

  async create(_input: CreateSupplierRecordInput): Promise<Supplier> {
    void _input;
    throw new Error("not implemented");
  }

  async update(_input: UpdateSupplierRecordInput): Promise<Supplier> {
    void _input;
    throw new Error("not implemented");
  }

  async deleteById(_supplierId: string): Promise<void> {
    void _supplierId;
  }

  async findById(): Promise<Supplier | null> {
    return this.supplier;
  }

  async findByCnpj(): Promise<Supplier | null> {
    return null;
  }

  async findMany(_filters?: ListSuppliersFilters): Promise<Supplier[]> {
    void _filters;
    return this.supplier ? [this.supplier] : [];
  }

  async hasLinkedProposals(): Promise<boolean> {
    return false;
  }
}

class FakeProposalSupplierRepository implements ProposalSupplierRepositoryPort {
  readonly links: ProposalSupplierLink[] = [];

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
      supplierLegalName: "Fornecedor 1",
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

  async copyRevisionLinks(): Promise<number> {
    return 0;
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

describe("LinkProposalSupplierUseCase", () => {
  it("vincula fornecedor automaticamente na revisão R0 em elaboração", async () => {
    const useCase = new LinkProposalSupplierUseCase(
      new FakeProposalRepository(buildProposal("em_elaboracao")),
      new FakeRevisionRepository([buildRevision(0, "revision-0")]),
      new FakeSupplierRepository(buildSupplier()),
      new FakeProposalSupplierRepository(),
      new FakeActivityLogRepository(),
    );

    const link = await useCase.execute({
      proposalId: "proposal-1",
      supplierId: "supplier-1",
      roleDescription: "Coordenação",
      quotedHourlyCostBrl: 120,
      estimatedHours: 10,
      linkedBy: "user-2",
    });

    expect(link.revisionId).toBe("revision-0");
  });

  it("vincula fornecedor automaticamente na revisão pendente em em_revisao", async () => {
    const useCase = new LinkProposalSupplierUseCase(
      new FakeProposalRepository(buildProposal("em_revisao")),
      new FakeRevisionRepository([
        buildRevision(2, "revision-2"),
        buildRevision(0, "revision-0"),
      ]),
      new FakeSupplierRepository(buildSupplier()),
      new FakeProposalSupplierRepository(),
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

    const link = await useCase.execute({
      proposalId: "proposal-1",
      supplierId: "supplier-1",
      linkedBy: "user-2",
    });

    expect(link.revisionId).toBe("revision-2");
  });

  it("bloqueia vínculo fora de em_elaboracao/em_revisao", async () => {
    const useCase = new LinkProposalSupplierUseCase(
      new FakeProposalRepository(buildProposal("enviada")),
      new FakeRevisionRepository([buildRevision(0, "revision-0")]),
      new FakeSupplierRepository(buildSupplier()),
      new FakeProposalSupplierRepository(),
      new FakeActivityLogRepository(),
    );

    await expect(
      useCase.execute({
        proposalId: "proposal-1",
        supplierId: "supplier-1",
        linkedBy: "user-2",
      }),
    ).rejects.toThrow(
      "Fornecedor só pode ser vinculado em proposta em elaboração ou em revisão",
    );
  });

  it("bloqueia vínculo duplicado na mesma revisão", async () => {
    const proposalSupplierRepository = new FakeProposalSupplierRepository();
    proposalSupplierRepository.links.push({
      id: "link-1",
      proposalId: "proposal-1",
      revisionId: "revision-0",
      revisionNumber: 0,
      supplierId: "supplier-1",
      supplierLegalName: "Fornecedor 1",
      supplierSpecialty: "BIM",
      roleDescription: null,
      quotedHourlyCostBrl: null,
      estimatedHours: null,
      quotedTotalBrl: null,
      createdAt: new Date(),
    });

    const useCase = new LinkProposalSupplierUseCase(
      new FakeProposalRepository(buildProposal("em_elaboracao")),
      new FakeRevisionRepository([buildRevision(0, "revision-0")]),
      new FakeSupplierRepository(buildSupplier()),
      proposalSupplierRepository,
      new FakeActivityLogRepository(),
    );

    await expect(
      useCase.execute({
        proposalId: "proposal-1",
        supplierId: "supplier-1",
        linkedBy: "user-2",
      }),
    ).rejects.toThrow("Fornecedor já vinculado nesta revisão");
  });
});
