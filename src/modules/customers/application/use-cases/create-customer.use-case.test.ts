import { describe, expect, it } from "vitest";

import type {
  CustomerRepositoryPort,
  CreateCustomerRecordInput,
  ListCustomersFilters,
  UpdateCustomerRecordInput,
} from "@/modules/customers/application/ports/customer-repository.port";
import { CreateCustomerUseCase } from "@/modules/customers/application/use-cases/create-customer.use-case";
import type { Customer } from "@/modules/customers/domain/customer";

class FakeCustomerRepository implements CustomerRepositoryPort {
  private readonly customers = new Map<string, Customer>();

  constructor(seed: Customer[] = []) {
    seed.forEach((customer) => this.customers.set(customer.id, customer));
  }

  async create(input: CreateCustomerRecordInput): Promise<Customer> {
    const created: Customer = {
      id: `customer-${this.customers.size + 1}`,
      name: input.name,
      slug: input.slug,
      cnpj: input.cnpj ?? null,
      notes: input.notes ?? null,
      status: input.status,
      createdAt: new Date("2026-02-01T10:00:00.000Z"),
      updatedAt: new Date("2026-02-01T10:00:00.000Z"),
    };

    this.customers.set(created.id, created);
    return created;
  }

  async update(input: UpdateCustomerRecordInput): Promise<Customer> {
    const current = this.customers.get(input.id);
    if (!current) {
      throw new Error("customer not found");
    }

    const updated: Customer = {
      ...current,
      ...input,
      cnpj: input.cnpj ?? null,
      notes: input.notes ?? null,
      updatedAt: new Date("2026-02-02T10:00:00.000Z"),
    };

    this.customers.set(updated.id, updated);
    return updated;
  }

  async deleteById(customerId: string): Promise<void> {
    this.customers.delete(customerId);
  }

  async findById(customerId: string): Promise<Customer | null> {
    return this.customers.get(customerId) ?? null;
  }

  async findBySlug(slug: string): Promise<Customer | null> {
    for (const customer of this.customers.values()) {
      if (customer.slug === slug) {
        return customer;
      }
    }

    return null;
  }

  async findMany(filters?: ListCustomersFilters): Promise<Customer[]> {
    void filters;
    return [...this.customers.values()];
  }

  async hasLinkedProposals(): Promise<boolean> {
    return false;
  }
}

describe("CreateCustomerUseCase", () => {
  it("normaliza nome/cnpj e cria slug único", async () => {
    const useCase = new CreateCustomerUseCase(
      new FakeCustomerRepository([
        {
          id: "customer-0",
          name: "Bimverse",
          slug: "bimverse",
          cnpj: null,
          notes: null,
          status: "ativa",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    );

    const customer = await useCase.execute({
      name: "Bimverse",
      cnpj: "44.038.188/0001-32",
      notes: "Cliente estratégico",
    });

    expect(customer.slug).toBe("bimverse-2");
    expect(customer.cnpj).toBe("44038188000132");
    expect(customer.status).toBe("ativa");
  });

  it("rejeita cnpj com menos de 14 dígitos", async () => {
    const useCase = new CreateCustomerUseCase(new FakeCustomerRepository());

    await expect(
      useCase.execute({
        name: "Cliente X",
        cnpj: "123",
      }),
    ).rejects.toThrow("CNPJ deve conter 14 dígitos");
  });

  it("rejeita cnpj com dígitos verificadores inválidos", async () => {
    const useCase = new CreateCustomerUseCase(new FakeCustomerRepository());

    await expect(
      useCase.execute({
        name: "Cliente X",
        cnpj: "12.345.678/0001-99",
      }),
    ).rejects.toThrow("CNPJ inválido");
  });
});
