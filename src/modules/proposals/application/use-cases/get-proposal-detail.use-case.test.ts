import { describe, expect, it } from "vitest";

import type {
  CustomerLookup,
  CreateProposalRecordInput,
  ListProposalsFilters,
  ProposalDetailRecord,
  ProposalListRecord,
  ProposalRepositoryPort,
  ProposalStorageContext,
  UpdateProposalBaseFieldsInput,
  UpdateProposalStatusInput,
} from "@/modules/proposals/application/ports/proposal-repository.port";
import type {
  CreateRevisionRecordInput,
  RevisionRepositoryPort,
  UpdateRevisionRecordInput,
} from "@/modules/proposals/application/ports/revision-repository.port";
import type {
  AttachmentRepositoryPort,
  CreateAttachmentRecordInput,
} from "@/modules/attachments/application/ports/attachment-repository.port";
import type { Attachment } from "@/modules/attachments/domain/attachment";
import type {
  CreateProposalSupplierLinkInput,
  ProposalSupplierLink,
  ProposalSupplierRepositoryPort,
  UpdateProposalSupplierLinkInput,
} from "@/modules/proposals/application/ports/proposal-supplier-repository.port";
import type {
  Supplier,
  SupplierRepositoryPort,
  CreateSupplierRecordInput,
  UpdateSupplierRecordInput,
  ListSuppliersFilters,
} from "@/modules/suppliers/application/ports/supplier-repository.port";
import type {
  ActivityLogEntry,
  ActivityLogRepositoryPort,
  CreateActivityLogEntryInput,
} from "@/modules/proposals/application/ports/activity-log-repository.port";
import { GetProposalDetailUseCase } from "@/modules/proposals/application/use-cases/get-proposal-detail.use-case";
import type { Proposal, ProposalRevision } from "@/modules/proposals/domain/proposal";

function buildProposalDetail(status: Proposal["status"] = "enviada"): ProposalDetailRecord {
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
    dueDate: "2026-03-01",
    estimatedValueBrl: 1000,
    finalValueBrl: null,
    outcomeReason: null,
    createdBy: "user-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    customerName: "Cliente",
    customerSlug: "cliente",
  };
}

class FakeProposalRepository implements ProposalRepositoryPort {
  constructor(private readonly proposal: ProposalDetailRecord) {}

  async getCustomerById(): Promise<CustomerLookup | null> {
    return null;
  }

  async findMany(_filters?: ListProposalsFilters): Promise<ProposalListRecord[]> {
    void _filters;
    return [];
  }

  async getDetailById(): Promise<ProposalDetailRecord | null> {
    return this.proposal;
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
  async getNextRevisionNumber(): Promise<number> {
    return 2;
  }

  async findById(): Promise<ProposalRevision | null> {
    return null;
  }

  async findManyByProposalId(): Promise<ProposalRevision[]> {
    return [
      {
        id: "revision-1",
        proposalId: "proposal-1",
        revisionNumber: 1,
        reason: "Ajuste",
        scopeChanges: null,
        discountBrl: null,
        discountPercent: null,
        valueBeforeBrl: 1000,
        valueAfterBrl: 900,
        notes: null,
        createdBy: "user-1",
        createdAt: new Date("2026-01-03T00:00:00.000Z"),
      },
    ];
  }

  async createRevision(_input: CreateRevisionRecordInput): Promise<ProposalRevision> {
    void _input;
    throw new Error("not implemented");
  }

  async updateRevision(_input: UpdateRevisionRecordInput): Promise<ProposalRevision> {
    void _input;
    throw new Error("not implemented");
  }

  async deleteById(): Promise<void> {}
}

class FakeAttachmentRepository implements AttachmentRepositoryPort {
  async createAttachment(_input: CreateAttachmentRecordInput): Promise<Attachment> {
    void _input;
    throw new Error("not implemented");
  }

  async findById(): Promise<Attachment | null> {
    return null;
  }

  async findManyByProposalId(): Promise<Attachment[]> {
    return [
      {
        id: "attachment-proposal-file",
        proposalId: "proposal-1",
        revisionId: "revision-1",
        category: "proposta_word",
        fileName: "BV-EGIS-2026-BIM-001-R1.docx",
        storagePath: "path/proposta.docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileSizeBytes: 1024,
        uploadedBy: "user-1",
        createdAt: new Date("2026-01-04T00:00:00.000Z"),
      },
      {
        id: "attachment-reference",
        proposalId: "proposal-1",
        revisionId: "revision-1",
        category: "referencia",
        fileName: "escopo.pdf",
        storagePath: "path/escopo.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 2048,
        uploadedBy: "user-1",
        createdAt: new Date("2026-01-05T00:00:00.000Z"),
      },
    ];
  }

  async deleteById(): Promise<void> {}

  async deleteManyByRevisionId(): Promise<void> {}
}

class FakeProposalSupplierRepository implements ProposalSupplierRepositoryPort {
  async findById(): Promise<ProposalSupplierLink | null> {
    return null;
  }

  async findManyByProposalId(): Promise<ProposalSupplierLink[]> {
    return [];
  }

  async findManyByProposalAndRevision(): Promise<ProposalSupplierLink[]> {
    return [];
  }

  async existsLink(): Promise<boolean> {
    return false;
  }

  async createLink(
    _input: CreateProposalSupplierLinkInput,
  ): Promise<ProposalSupplierLink> {
    void _input;
    throw new Error("not implemented");
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

  async deleteById(): Promise<void> {}

  async deleteManyByRevisionId(): Promise<void> {}
}

class FakeSupplierRepository implements SupplierRepositoryPort {
  async create(_input: CreateSupplierRecordInput): Promise<Supplier> {
    void _input;
    throw new Error("not implemented");
  }

  async update(_input: UpdateSupplierRecordInput): Promise<Supplier> {
    void _input;
    throw new Error("not implemented");
  }

  async deleteById(): Promise<void> {}

  async findById(): Promise<Supplier | null> {
    return null;
  }

  async findByCnpj(): Promise<Supplier | null> {
    return null;
  }

  async findMany(_filters?: ListSuppliersFilters): Promise<Supplier[]> {
    void _filters;
    return [];
  }

  async hasLinkedProposals(): Promise<boolean> {
    return false;
  }
}

class FakeActivityLogRepository implements ActivityLogRepositoryPort {
  async create(_input: CreateActivityLogEntryInput): Promise<ActivityLogEntry> {
    void _input;
    throw new Error("not implemented");
  }

  async findManyByEntity(): Promise<ActivityLogEntry[]> {
    return [];
  }
}

describe("GetProposalDetailUseCase", () => {
  it("separa arquivo principal da proposta dos anexos gerais", async () => {
    const useCase = new GetProposalDetailUseCase(
      new FakeProposalRepository(buildProposalDetail()),
      new FakeRevisionRepository(),
      new FakeAttachmentRepository(),
      new FakeProposalSupplierRepository(),
      new FakeSupplierRepository(),
      new FakeActivityLogRepository(),
    );

    const output = await useCase.execute({ proposalId: "proposal-1" });

    expect(output.proposalFiles).toHaveLength(1);
    expect(output.proposalFiles[0]?.category).toBe("proposta_word");
    expect(output.attachments).toHaveLength(1);
    expect(output.attachments[0]?.category).toBe("referencia");

    expect(output.history.some((item) => item.title === "Arquivo da proposta atualizado")).toBe(
      true,
    );
    expect(output.history.some((item) => item.title.includes("Anexo enviado"))).toBe(
      true,
    );
    expect(output.timeline.some((item) => item.title === "Arquivo da proposta atualizado")).toBe(
      true,
    );
  });
});
