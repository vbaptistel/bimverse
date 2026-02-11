import type { CompanyStatus } from "@/shared/domain/types";
import type { Company } from "@/modules/companies/domain/company";

export interface CompanyPresenter {
  id: string;
  name: string;
  slug: string;
  cnpj: string | null;
  notes: string | null;
  status: CompanyStatus;
  createdAt: string;
  updatedAt: string;
}

export function presentCompany(company: Company): CompanyPresenter {
  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    cnpj: company.cnpj,
    notes: company.notes,
    status: company.status,
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
  };
}
