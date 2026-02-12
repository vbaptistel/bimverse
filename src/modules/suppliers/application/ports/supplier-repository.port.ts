export interface Supplier {
  id: string;
  legalName: string;
  cnpj: string;
  specialty: string;
  hourlyCostBrl: number | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListSuppliersFilters {
  search?: string | null;
  active?: boolean | null;
}

export interface CreateSupplierRecordInput {
  legalName: string;
  cnpj: string;
  specialty: string;
  hourlyCostBrl: number | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  active?: boolean;
}

export interface UpdateSupplierRecordInput {
  id: string;
  legalName: string;
  cnpj: string;
  specialty: string;
  hourlyCostBrl: number | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  active: boolean;
}

export interface SupplierRepositoryPort {
  create(input: CreateSupplierRecordInput): Promise<Supplier>;
  update(input: UpdateSupplierRecordInput): Promise<Supplier>;
  deleteById(supplierId: string): Promise<void>;
  findById(id: string): Promise<Supplier | null>;
  findByCnpj(cnpj: string): Promise<Supplier | null>;
  findMany(filters?: ListSuppliersFilters): Promise<Supplier[]>;
  hasLinkedProposals(supplierId: string): Promise<boolean>;
}
