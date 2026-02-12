import { describe, expect, it } from "vitest";

import type {
  CustomerLookup,
  CreateProposalRecordInput,
  ListProposalsFilters,
  ProposalRepositoryPort,
  ProposalStorageContext,
  UpdateProposalStatusInput,
} from "@/modules/proposals/application/ports/proposal-repository.port";
import { ListProposalsUseCase } from "@/modules/proposals/application/use-cases/list-proposals.use-case";
import type { Proposal } from "@/modules/proposals/domain/proposal";

class FakeProposalRepository implements ProposalRepositoryPort {
  async getCustomerById(): Promise<CustomerLookup | null> {
    return null;
  }

  async getDetailById() {
    return null;
  }

  async findMany(filters?: ListProposalsFilters): Promise<Proposal[]> {
    const status = filters?.status ?? "recebida";

    return [
      {
        id: "proposal-1",
        customerId: "customer-1",
        code: "BV-TEST-2026-BIM-001",
        seqNumber: 1,
        year: 2026,
        invitationCode: null,
        projectName: "Projeto teste",
        scopeDescription: "Escopo teste",
        status,
        dueDate: null,
        estimatedValueBrl: 100,
        finalValueBrl: null,
        outcomeReason: null,
        createdBy: "user-1",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ];
  }

  async allocateNextSequence(): Promise<number> {
    return 1;
  }

  async createProposal(input: CreateProposalRecordInput): Promise<Proposal> {
    void input;
    throw new Error("not implemented");
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

  async updateProposalStatus(input: UpdateProposalStatusInput): Promise<Proposal> {
    void input;
    throw new Error("not implemented");
  }
}

describe("ListProposalsUseCase", () => {
  it("lista propostas com filtros informados", async () => {
    const useCase = new ListProposalsUseCase(new FakeProposalRepository());

    const proposals = await useCase.execute({
      search: "teste",
      status: "enviada",
    });

    expect(proposals).toHaveLength(1);
    expect(proposals[0]?.status).toBe("enviada");
  });
});
