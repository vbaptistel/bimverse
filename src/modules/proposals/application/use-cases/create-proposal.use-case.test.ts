import { describe, expect, it } from "vitest";

import type {
  ProposalRepositoryPort,
  ProposalStorageContext,
} from "@/modules/proposals/application/ports/proposal-repository.port";
import type { RevisionRepositoryPort } from "@/modules/proposals/application/ports/revision-repository.port";
import { CreateProposalUseCase } from "@/modules/proposals/application/use-cases/create-proposal.use-case";
import type { Proposal, ProposalRevision } from "@/modules/proposals/domain/proposal";

class FakeProposalRepository implements ProposalRepositoryPort {
  async findMany(): Promise<Proposal[]> {
    return [];
  }

  async getDetailById() {
    return null;
  }

  async getCustomerById() {
    return { id: "customer-1", slug: "EGIS" };
  }

  async allocateNextSequence() {
    return 12;
  }

  async createProposal(): Promise<Proposal> {
    return {
      id: "proposal-1",
      customerId: "customer-1",
      code: "BV-EGIS-2026-BIM-012",
      seqNumber: 12,
      year: 2026,
      invitationCode: null,
      projectName: "Projeto teste",
      scopeDescription: "Escopo teste",
      status: "recebida",
      dueDate: null,
      estimatedValueBrl: 1000,
      finalValueBrl: null,
      outcomeReason: null,
      createdBy: "user-1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    };
  }

  async updateBaseFields(): Promise<Proposal> {
    throw new Error("not implemented");
  }

  async getProposalById(): Promise<Proposal | null> {
    return null;
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
    return 1;
  }

  async findById() {
    return null;
  }

  async findManyByProposalId() {
    return [];
  }

  async createRevision(): Promise<ProposalRevision> {
    return {
      id: "rev-1",
      proposalId: "proposal-1",
      revisionNumber: 0,
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
}

describe("CreateProposalUseCase", () => {
  it("cria proposta e revisão inicial R0", async () => {
    const useCase = new CreateProposalUseCase(
      new FakeProposalRepository(),
      new FakeRevisionRepository(),
    );

    const output = await useCase.execute({
      customerId: "customer-1",
      year: 2026,
      projectName: "Projeto teste",
      scopeDescription: "Escopo teste",
      estimatedValueBrl: 1000,
      createdBy: "user-1",
    });

    expect(output.proposal.code).toBe("BV-EGIS-2026-BIM-012");
    expect(output.initialRevision.revisionNumber).toBe(0);
  });
});
