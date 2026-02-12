import type { CustomerStatus } from "@/shared/domain/types";
import type { Customer } from "@/modules/customers/domain/customer";

export interface CustomerPresenter {
  id: string;
  name: string;
  slug: string;
  cnpj: string | null;
  notes: string | null;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
}

export function presentCustomer(customer: Customer): CustomerPresenter {
  return {
    id: customer.id,
    name: customer.name,
    slug: customer.slug,
    cnpj: customer.cnpj,
    notes: customer.notes,
    status: customer.status,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  };
}
