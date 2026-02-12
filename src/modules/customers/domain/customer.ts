import type { CustomerStatus } from "@/shared/domain/types";

export interface Customer {
  id: string;
  name: string;
  slug: string;
  cnpj: string | null;
  notes: string | null;
  status: CustomerStatus;
  createdAt: Date;
  updatedAt: Date;
}
