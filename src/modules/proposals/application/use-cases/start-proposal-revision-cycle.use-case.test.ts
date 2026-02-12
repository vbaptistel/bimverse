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
import { StartProposalRevisionCycleUseCase } from "@/modules/proposals/application/use-cases/start-proposal-revision-cycle.use-case";
import type { Proposal } from "@/modules/proposals/domain/proposal";

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
  it("inicia revisão manual para proposta enviada", async () => {
    const proposalRepository = new FakeProposalRepository(buildProposal("enviada"));
    const activityLogRepository = new FakeActivityLogRepository();
    const useCase = new StartProposalRevisionCycleUseCase(
      proposalRepository,
      activityLogRepository,
    );

    const output = await useCase.execute({
      proposalId: "proposal-1",
      startedBy: "user-2",
    });

    expect(output.proposal.status).toBe("em_revisao");
    expect(output.cycleId).toBeTruthy();
    expect(activityLogRepository.created.map((event) => event.action)).toEqual([
      "revision_cycle_opened",
      "status_changed",
    ]);
  });

  it("bloqueia início de revisão quando status não é enviada", async () => {
    const proposalRepository = new FakeProposalRepository(buildProposal("em_elaboracao"));
    const activityLogRepository = new FakeActivityLogRepository();
    const useCase = new StartProposalRevisionCycleUseCase(
      proposalRepository,
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
    const activityLogRepository = new FakeActivityLogRepository([
      {
        id: "activity-1",
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
        },
        createdBy: "user-1",
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    ]);
    const useCase = new StartProposalRevisionCycleUseCase(
      proposalRepository,
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

