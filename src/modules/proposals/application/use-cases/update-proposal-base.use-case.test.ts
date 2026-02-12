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
import { UpdateProposalBaseUseCase } from "@/modules/proposals/application/use-cases/update-proposal-base.use-case";
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
    return [];
  }
}

describe("UpdateProposalBaseUseCase", () => {
  it("atualiza campos não críticos sem abrir ciclo de revisão", async () => {
    const proposalRepository = new FakeProposalRepository(buildProposal("enviada"));
    const activityLogRepository = new FakeActivityLogRepository();
    const useCase = new UpdateProposalBaseUseCase(
      proposalRepository,
      activityLogRepository,
    );

    const output = await useCase.execute({
      proposalId: "proposal-1",
      projectName: "Projeto atualizado",
      invitationCode: "INV-02",
      scopeDescription: "Escopo original",
      dueDate: "2026-03-01",
      estimatedValueBrl: 1000,
      updatedBy: "user-2",
    });

    expect(output.proposal.status).toBe("enviada");
    expect(activityLogRepository.created.map((event) => event.action)).toEqual([
      "proposal_base_updated",
    ]);
  });

  it("bloqueia alteração crítica fora de revisão", async () => {
    const proposalRepository = new FakeProposalRepository(buildProposal("enviada"));
    const activityLogRepository = new FakeActivityLogRepository();
    const useCase = new UpdateProposalBaseUseCase(
      proposalRepository,
      activityLogRepository,
    );

    await expect(
      useCase.execute({
        proposalId: "proposal-1",
        projectName: "Projeto original",
        invitationCode: "INV-01",
        scopeDescription: "Escopo alterado",
        dueDate: "2026-03-01",
        estimatedValueBrl: 1250,
        updatedBy: "user-2",
      }),
    ).rejects.toThrow(
      "Para alterar escopo, prazo ou valor estimado, inicie uma nova revisão",
    );

    expect(activityLogRepository.created).toHaveLength(0);
  });

  it("permite alteração crítica quando proposta já está em revisão", async () => {
    const proposalRepository = new FakeProposalRepository(buildProposal("em_revisao"));
    const activityLogRepository = new FakeActivityLogRepository();
    const useCase = new UpdateProposalBaseUseCase(
      proposalRepository,
      activityLogRepository,
    );

    const output = await useCase.execute({
      proposalId: "proposal-1",
      projectName: "Projeto original",
      invitationCode: "INV-01",
      scopeDescription: "Escopo alterado",
      dueDate: "2026-03-08",
      estimatedValueBrl: 1250,
      updatedBy: "user-2",
    });

    expect(output.proposal.status).toBe("em_revisao");
    expect(activityLogRepository.created.map((event) => event.action)).toEqual([
      "proposal_base_updated",
    ]);
  });

  it("bloqueia edição de proposta em status final", async () => {
    const proposalRepository = new FakeProposalRepository(buildProposal("ganha"));
    const activityLogRepository = new FakeActivityLogRepository();
    const useCase = new UpdateProposalBaseUseCase(
      proposalRepository,
      activityLogRepository,
    );

    await expect(
      useCase.execute({
        proposalId: "proposal-1",
        projectName: "Projeto atualizado",
        invitationCode: "INV-02",
        scopeDescription: "Escopo alterado",
        dueDate: "2026-03-01",
        estimatedValueBrl: 1250,
        updatedBy: "user-2",
      }),
    ).rejects.toThrow("Propostas finalizadas não podem ter dados base alterados");
  });
});
