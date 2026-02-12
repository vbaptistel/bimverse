import { describe, expect, it } from "vitest";

import type {
  CreateSupplierRecordInput,
  ListSuppliersFilters,
  Supplier,
  SupplierRepositoryPort,
  UpdateSupplierRecordInput,
} from "@/modules/suppliers/application/ports/supplier-repository.port";
import { DeleteSupplierUseCase } from "@/modules/suppliers/application/use-cases/delete-supplier.use-case";

class FakeSupplierRepository implements SupplierRepositoryPort {
  constructor(
    private readonly supplier: Supplier | null,
    private readonly linkedProposals: boolean,
  ) {}

  async create(input: CreateSupplierRecordInput): Promise<Supplier> {
    return {
      id: "supplier-1",
      legalName: input.legalName,
      cnpj: input.cnpj,
      specialty: input.specialty,
      hourlyCostBrl: input.hourlyCostBrl ?? null,
      contactName: input.contactName ?? null,
      contactEmail: input.contactEmail ?? null,
      contactPhone: input.contactPhone ?? null,
      active: input.active ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async update(input: UpdateSupplierRecordInput): Promise<Supplier> {
    return {
      id: input.id,
      legalName: input.legalName,
      cnpj: input.cnpj,
      specialty: input.specialty,
      hourlyCostBrl: input.hourlyCostBrl ?? null,
      contactName: input.contactName ?? null,
      contactEmail: input.contactEmail ?? null,
      contactPhone: input.contactPhone ?? null,
      active: input.active,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async deleteById(): Promise<void> {}

  async findById(): Promise<Supplier | null> {
    return this.supplier;
  }

  async findByCnpj(): Promise<Supplier | null> {
    return null;
  }

  async findMany(filters?: ListSuppliersFilters): Promise<Supplier[]> {
    void filters;
    return this.supplier ? [this.supplier] : [];
  }

  async hasLinkedProposals(): Promise<boolean> {
    return this.linkedProposals;
  }
}

describe("DeleteSupplierUseCase", () => {
  it("remove fornecedor sem propostas vinculadas", async () => {
    const supplier: Supplier = {
      id: "supplier-1",
      legalName: "Fornecedor",
      cnpj: "44038188000132",
      specialty: "BIM",
      hourlyCostBrl: null,
      contactName: null,
      contactEmail: null,
      contactPhone: null,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const useCase = new DeleteSupplierUseCase(
      new FakeSupplierRepository(supplier, false),
    );

    const output = await useCase.execute({ supplierId: "supplier-1" });
    expect(output.supplierId).toBe("supplier-1");
  });

  it("bloqueia exclusão com propostas vinculadas", async () => {
    const supplier: Supplier = {
      id: "supplier-1",
      legalName: "Fornecedor",
      cnpj: "44038188000132",
      specialty: "BIM",
      hourlyCostBrl: null,
      contactName: null,
      contactEmail: null,
      contactPhone: null,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const useCase = new DeleteSupplierUseCase(
      new FakeSupplierRepository(supplier, true),
    );

    await expect(
      useCase.execute({ supplierId: "supplier-1" }),
    ).rejects.toThrow("propostas vinculadas");
  });
});
