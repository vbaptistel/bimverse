import { describe, expect, it } from "vitest";

import type {
  ProposalRepositoryPort,
  ProposalStorageContext,
  UpdateProposalStatusInput,
} from "@/modules/proposals/application/ports/proposal-repository.port";
import { UpdateProposalStatusUseCase } from "@/modules/proposals/application/use-cases/update-proposal-status.use-case";
import type { Proposal } from "@/modules/proposals/domain/proposal";

class FakeProposalRepository implements ProposalRepositoryPort {
  constructor(private readonly status: Proposal["status"]) {}

  async getCompanyById() {
    return null;
  }

  async allocateNextSequence() {
    return 1;
  }

  async createProposal(): Promise<Proposal> {
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

describe("UpdateProposalStatusUseCase", () => {
  it("permite transição válida", async () => {
    const useCase = new UpdateProposalStatusUseCase(
      new FakeProposalRepository("enviada"),
    );

    const updated = await useCase.execute({
      proposalId: "proposal-1",
      status: "ganha",
      finalValueBrl: 1000,
    });

    expect(updated.status).toBe("ganha");
    expect(updated.finalValueBrl).toBe(1000);
  });

  it("bloqueia transição inválida", async () => {
    const useCase = new UpdateProposalStatusUseCase(
      new FakeProposalRepository("ganha"),
    );

    await expect(
      useCase.execute({
        proposalId: "proposal-1",
        status: "enviada",
      }),
    ).rejects.toThrow("Transição inválida");
  });
});
