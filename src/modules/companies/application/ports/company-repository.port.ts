import type { Company } from "@/modules/companies/domain/company";
import type { CompanyStatus } from "@/shared/domain/types";

export interface ListCompaniesFilters {
  search?: string | null;
  status?: CompanyStatus | null;
}

export interface CreateCompanyRecordInput {
  name: string;
  slug: string;
  cnpj?: string | null;
  notes?: string | null;
  status: CompanyStatus;
}

export interface UpdateCompanyRecordInput {
  id: string;
  name: string;
  slug: string;
  cnpj?: string | null;
  notes?: string | null;
  status: CompanyStatus;
}

export interface CompanyRepositoryPort {
  create(input: CreateCompanyRecordInput): Promise<Company>;
  update(input: UpdateCompanyRecordInput): Promise<Company>;
  deleteById(companyId: string): Promise<void>;
  findById(companyId: string): Promise<Company | null>;
  findBySlug(slug: string): Promise<Company | null>;
  findMany(filters?: ListCompaniesFilters): Promise<Company[]>;
  hasLinkedProposals(companyId: string): Promise<boolean>;
}
