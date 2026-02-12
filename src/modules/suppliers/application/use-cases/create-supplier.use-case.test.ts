import { describe, expect, it } from "vitest";

import type {
  CreateSupplierRecordInput,
  ListSuppliersFilters,
  Supplier,
  SupplierRepositoryPort,
  UpdateSupplierRecordInput,
} from "@/modules/suppliers/application/ports/supplier-repository.port";
import { CreateSupplierUseCase } from "@/modules/suppliers/application/use-cases/create-supplier.use-case";

class FakeSupplierRepository implements SupplierRepositoryPort {
  private readonly suppliers = new Map<string, Supplier>();

  constructor(seed: Supplier[] = []) {
    seed.forEach((supplier) => this.suppliers.set(supplier.id, supplier));
  }

  async create(input: CreateSupplierRecordInput): Promise<Supplier> {
    const created: Supplier = {
      id: `supplier-${this.suppliers.size + 1}`,
      legalName: input.legalName,
      cnpj: input.cnpj,
      specialty: input.specialty,
      hourlyCostBrl: input.hourlyCostBrl ?? null,
      contactName: input.contactName ?? null,
      contactEmail: input.contactEmail ?? null,
      contactPhone: input.contactPhone ?? null,
      active: input.active ?? true,
      createdAt: new Date("2026-02-01T10:00:00.000Z"),
      updatedAt: new Date("2026-02-01T10:00:00.000Z"),
    };

    this.suppliers.set(created.id, created);
    return created;
  }

  async update(input: UpdateSupplierRecordInput): Promise<Supplier> {
    const current = this.suppliers.get(input.id);
    if (!current) {
      throw new Error("supplier not found");
    }

    const updated: Supplier = {
      ...current,
      ...input,
      hourlyCostBrl: input.hourlyCostBrl ?? null,
      contactName: input.contactName ?? null,
      contactEmail: input.contactEmail ?? null,
      contactPhone: input.contactPhone ?? null,
      updatedAt: new Date("2026-02-02T10:00:00.000Z"),
    };

    this.suppliers.set(updated.id, updated);
    return updated;
  }

  async deleteById(supplierId: string): Promise<void> {
    this.suppliers.delete(supplierId);
  }

  async findById(supplierId: string): Promise<Supplier | null> {
    return this.suppliers.get(supplierId) ?? null;
  }

  async findByCnpj(cnpj: string): Promise<Supplier | null> {
    for (const supplier of this.suppliers.values()) {
      if (supplier.cnpj === cnpj) {
        return supplier;
      }
    }

    return null;
  }

  async findMany(filters?: ListSuppliersFilters): Promise<Supplier[]> {
    void filters;
    return [...this.suppliers.values()];
  }

  async hasLinkedProposals(): Promise<boolean> {
    return false;
  }
}

describe("CreateSupplierUseCase", () => {
  it("normaliza CNPJ e cria fornecedor", async () => {
    const useCase = new CreateSupplierUseCase(new FakeSupplierRepository());

    const supplier = await useCase.execute({
      legalName: "Fornecedor BIM",
      cnpj: "44.038.188/0001-32",
      specialty: "Compatibilização",
      hourlyCostBrl: 185.4,
      contactEmail: "contato@fornecedor.com",
    });

    expect(supplier.cnpj).toBe("44038188000132");
    expect(supplier.hourlyCostBrl).toBe(185.4);
    expect(supplier.active).toBe(true);
  });

  it("bloqueia criação com CNPJ duplicado", async () => {
    const useCase = new CreateSupplierUseCase(
      new FakeSupplierRepository([
        {
          id: "supplier-0",
          legalName: "Fornecedor Existente",
          cnpj: "44038188000132",
          specialty: "Modelagem",
          hourlyCostBrl: 150,
          contactName: null,
          contactEmail: null,
          contactPhone: null,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    );

    await expect(
      useCase.execute({
        legalName: "Outro Fornecedor",
        cnpj: "44.038.188/0001-32",
        specialty: "Coordenação BIM",
      }),
    ).rejects.toThrow("Já existe fornecedor cadastrado com este CNPJ");
  });

  it("rejeita CNPJ inválido", async () => {
    const useCase = new CreateSupplierUseCase(new FakeSupplierRepository());

    await expect(
      useCase.execute({
        legalName: "Fornecedor X",
        cnpj: "12.345.678/0001-99",
        specialty: "Especialidade",
      }),
    ).rejects.toThrow("CNPJ inválido");
  });
});
