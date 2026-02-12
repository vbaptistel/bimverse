import { describe, expect, it } from "vitest";

import type {
  CustomerRepositoryPort,
  CreateCustomerRecordInput,
  ListCustomersFilters,
  UpdateCustomerRecordInput,
} from "@/modules/customers/application/ports/customer-repository.port";
import { DeleteCustomerUseCase } from "@/modules/customers/application/use-cases/delete-customer.use-case";
import type { Customer } from "@/modules/customers/domain/customer";

class FakeCustomerRepository implements CustomerRepositoryPort {
  constructor(
    private readonly customer: Customer | null,
    private readonly linkedProposals: boolean,
  ) {}

  async create(input: CreateCustomerRecordInput): Promise<Customer> {
    return {
      id: "customer-1",
      name: input.name,
      slug: input.slug,
      cnpj: input.cnpj ?? null,
      notes: input.notes ?? null,
      status: input.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async update(input: UpdateCustomerRecordInput): Promise<Customer> {
    return {
      id: input.id,
      name: input.name,
      slug: input.slug,
      cnpj: input.cnpj ?? null,
      notes: input.notes ?? null,
      status: input.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async deleteById(): Promise<void> {}

  async findById(): Promise<Customer | null> {
    return this.customer;
  }

  async findBySlug(): Promise<Customer | null> {
    return null;
  }

  async findMany(filters?: ListCustomersFilters): Promise<Customer[]> {
    void filters;
    return this.customer ? [this.customer] : [];
  }

  async hasLinkedProposals(): Promise<boolean> {
    return this.linkedProposals;
  }
}

describe("DeleteCustomerUseCase", () => {
  it("remove cliente sem propostas vinculadas", async () => {
    const customer: Customer = {
      id: "customer-1",
      name: "Cliente",
      slug: "cliente",
      cnpj: null,
      notes: null,
      status: "ativa",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const useCase = new DeleteCustomerUseCase(
      new FakeCustomerRepository(customer, false),
    );

    const output = await useCase.execute({ customerId: "customer-1" });
    expect(output.customerId).toBe("customer-1");
  });

  it("bloqueia exclusão com propostas vinculadas", async () => {
    const customer: Customer = {
      id: "customer-1",
      name: "Cliente",
      slug: "cliente",
      cnpj: null,
      notes: null,
      status: "ativa",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const useCase = new DeleteCustomerUseCase(
      new FakeCustomerRepository(customer, true),
    );

    await expect(
      useCase.execute({ customerId: "customer-1" }),
    ).rejects.toThrow("propostas vinculadas");
  });
});
