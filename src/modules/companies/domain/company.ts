import type { CompanyStatus } from "@/shared/domain/types";

export interface Company {
  id: string;
  name: string;
  slug: string;
  cnpj: string | null;
  notes: string | null;
  status: CompanyStatus;
  createdAt: Date;
  updatedAt: Date;
}
