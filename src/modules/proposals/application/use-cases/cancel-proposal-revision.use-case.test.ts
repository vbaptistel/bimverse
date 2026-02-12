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
import { CancelProposalRevisionUseCase } from "@/modules/proposals/application/use-cases/cancel-proposal-revision.use-case";
import type { Proposal } from "@/modules/proposals/domain/proposal";

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
  it("reverte snapshot crítico e retorna para enviada", async () => {
    const proposalRepository = new FakeProposalRepository(buildProposal("em_revisao"));
    const activityLogRepository = new FakeActivityLogRepository([
      buildOpenedCycleEvent(),
    ]);
    const useCase = new CancelProposalRevisionUseCase(
      proposalRepository,
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
    expect(activityLogRepository.created.map((event) => event.action)).toEqual([
      "revision_cycle_canceled",
      "status_changed",
    ]);
  });

  it("falha quando proposta não está em revisão", async () => {
    const proposalRepository = new FakeProposalRepository(buildProposal("enviada"));
    const activityLogRepository = new FakeActivityLogRepository([
      buildOpenedCycleEvent(),
    ]);
    const useCase = new CancelProposalRevisionUseCase(
      proposalRepository,
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
