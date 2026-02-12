import { describe, expect, it } from "vitest";

import type {
  ProposalRepositoryPort,
  ProposalStorageContext,
} from "@/modules/proposals/application/ports/proposal-repository.port";
import type { RevisionRepositoryPort } from "@/modules/proposals/application/ports/revision-repository.port";
import { CreateRevisionUseCase } from "@/modules/proposals/application/use-cases/create-revision.use-case";
import type { Proposal, ProposalRevision } from "@/modules/proposals/domain/proposal";

class FakeProposalRepository implements ProposalRepositoryPort {
  async findMany(): Promise<Proposal[]> {
    return [];
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
      status: "em_revisao",
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

  async updateProposalStatus(): Promise<Proposal> {
    throw new Error("not implemented");
  }
}

class FakeRevisionRepository implements RevisionRepositoryPort {
  async getNextRevisionNumber(): Promise<number> {
    return 3;
  }

  async createRevision(): Promise<ProposalRevision> {
    return {
      id: "revision-3",
      proposalId: "proposal-1",
      revisionNumber: 3,
      reason: "Ajuste de escopo",
      scopeChanges: "Retirar item X",
      discountBrl: 10,
      discountPercent: 5,
      valueBeforeBrl: 200,
      valueAfterBrl: 190,
      notes: null,
      createdBy: "user-1",
      createdAt: new Date(),
    };
  }
}

describe("CreateRevisionUseCase", () => {
  it("cria revisão com incremento automático", async () => {
    const useCase = new CreateRevisionUseCase(
      new FakeProposalRepository(),
      new FakeRevisionRepository(),
    );

    const revision = await useCase.execute({
      proposalId: "proposal-1",
      reason: "Ajuste de escopo",
      createdBy: "user-1",
    });

    expect(revision.revisionNumber).toBe(3);
  });

  it("exige motivo obrigatório", async () => {
    const useCase = new CreateRevisionUseCase(
      new FakeProposalRepository(),
      new FakeRevisionRepository(),
    );

    await expect(
      useCase.execute({
        proposalId: "proposal-1",
        reason: " ",
        createdBy: "user-1",
      }),
    ).rejects.toThrow("Motivo da revisão é obrigatório");
  });
});
