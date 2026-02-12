import { describe, expect, it } from "vitest";

import type {
  ProposalRepositoryPort,
  ProposalStorageContext,
  UpdateProposalStatusInput,
} from "@/modules/proposals/application/ports/proposal-repository.port";
import type { ActivityLogRepositoryPort } from "@/modules/proposals/application/ports/activity-log-repository.port";
import { UpdateProposalStatusUseCase } from "@/modules/proposals/application/use-cases/update-proposal-status.use-case";
import type { Proposal } from "@/modules/proposals/domain/proposal";

class FakeProposalRepository implements ProposalRepositoryPort {
  constructor(private readonly status: Proposal["status"]) {}

  async findMany(): Promise<Proposal[]> {
    return [];
  }

  async getDetailById() {
    return null;
  }

  async getCompanyById() {
    return null;
  }

  async allocateNextSequence() {
    return 1;
  }

  async createProposal(): Promise<Proposal> {
    throw new Error("not implemented");
  }

  async updateBaseFields(): Promise<Proposal> {
    throw new Error("not implemented");
  }

  async getProposalById(): Promise<Proposal | null> {
    return {
      id: "proposal-1",
      companyId: "company-1",
      code: "BV-EGIS-2026-BIM-001",
      seqNumber: 1,
      year: 2026,
      invitationCode: null,
      projectName: "Projeto",
      scopeDescription: "Escopo",
      status: this.status,
      dueDate: null,
      estimatedValueBrl: 100,
      finalValueBrl: null,
      outcomeReason: null,
      createdBy: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getProposalStorageContext(): Promise<ProposalStorageContext | null> {
    return null;
  }

  async updateProposalStatus(input: UpdateProposalStatusInput): Promise<Proposal> {
    return {
      id: input.proposalId,
      companyId: "company-1",
      code: "BV-EGIS-2026-BIM-001",
      seqNumber: 1,
      year: 2026,
      invitationCode: null,
      projectName: "Projeto",
      scopeDescription: "Escopo",
      status: input.status,
      dueDate: null,
      estimatedValueBrl: 100,
      finalValueBrl: input.finalValueBrl ?? null,
      outcomeReason: input.outcomeReason ?? null,
      createdBy: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

class FakeActivityLogRepository implements ActivityLogRepositoryPort {
  async create() {
    return {
      id: "activity-1",
      entityType: "proposal" as const,
      entityId: "proposal-1",
      action: "status_changed",
      metadata: {},
      createdBy: "user-1",
      createdAt: new Date(),
    };
  }

  async findManyByEntity() {
    return [];
  }
}

describe("UpdateProposalStatusUseCase", () => {
  it("permite transição válida", async () => {
    const useCase = new UpdateProposalStatusUseCase(
      new FakeProposalRepository("enviada"),
      new FakeActivityLogRepository(),
    );

    const updated = await useCase.execute({
      proposalId: "proposal-1",
      status: "ganha",
      finalValueBrl: 1000,
      changedBy: "user-1",
    });

    expect(updated.status).toBe("ganha");
    expect(updated.finalValueBrl).toBe(1000);
  });

  it("bloqueia transição inválida", async () => {
    const useCase = new UpdateProposalStatusUseCase(
      new FakeProposalRepository("ganha"),
      new FakeActivityLogRepository(),
    );

    await expect(
      useCase.execute({
        proposalId: "proposal-1",
        status: "enviada",
        changedBy: "user-1",
      }),
    ).rejects.toThrow("Transição inválida");
  });

  it("bloqueia mudança manual enquanto proposta está em revisão", async () => {
    const useCase = new UpdateProposalStatusUseCase(
      new FakeProposalRepository("em_revisao"),
      new FakeActivityLogRepository(),
    );

    await expect(
      useCase.execute({
        proposalId: "proposal-1",
        status: "ganha",
        changedBy: "user-1",
      }),
    ).rejects.toThrow(
      "Enquanto a proposta estiver em revisão, use fechar ou cancelar revisão",
    );
  });

  it("exige motivo ao definir status perdida", async () => {
    const useCase = new UpdateProposalStatusUseCase(
      new FakeProposalRepository("enviada"),
      new FakeActivityLogRepository(),
    );

    await expect(
      useCase.execute({
        proposalId: "proposal-1",
        status: "perdida",
        changedBy: "user-1",
      }),
    ).rejects.toThrow(
      "Motivo é obrigatório para propostas perdidas ou canceladas",
    );
  });

  it("rejeita alteração manual para em_revisao", async () => {
    const useCase = new UpdateProposalStatusUseCase(
      new FakeProposalRepository("enviada"),
      new FakeActivityLogRepository(),
    );

    await expect(
      useCase.execute({
        proposalId: "proposal-1",
        status: "em_revisao",
        changedBy: "user-1",
      }),
    ).rejects.toThrow(
      "Status em revisão só pode ser iniciado pelo botão Criar nova revisão",
    );
  });
});
