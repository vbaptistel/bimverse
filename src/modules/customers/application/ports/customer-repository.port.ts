import type { Customer } from "@/modules/customers/domain/customer";
import type { CustomerStatus } from "@/shared/domain/types";

export interface ListCustomersFilters {
  search?: string | null;
  status?: CustomerStatus | null;
}

export interface CreateCustomerRecordInput {
  name: string;
  slug: string;
  cnpj?: string | null;
  notes?: string | null;
  status: CustomerStatus;
}

export interface UpdateCustomerRecordInput {
  id: string;
  name: string;
  slug: string;
  cnpj?: string | null;
  notes?: string | null;
  status: CustomerStatus;
}

export interface CustomerRepositoryPort {
  create(input: CreateCustomerRecordInput): Promise<Customer>;
  update(input: UpdateCustomerRecordInput): Promise<Customer>;
  deleteById(customerId: string): Promise<void>;
  findById(customerId: string): Promise<Customer | null>;
  findBySlug(slug: string): Promise<Customer | null>;
  findMany(filters?: ListCustomersFilters): Promise<Customer[]>;
  hasLinkedProposals(customerId: string): Promise<boolean>;
}
