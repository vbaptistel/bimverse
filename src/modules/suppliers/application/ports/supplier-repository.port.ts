export interface Supplier {
  id: string;
  legalName: string;
  cnpj: string;
  specialty: string;
  hourlyCostBrl: number | null;
  active: boolean;
}

export interface CreateSupplierInput {
  legalName: string;
  cnpj: string;
  specialty: string;
  hourlyCostBrl?: number | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

export interface SupplierRepositoryPort {
  create(input: CreateSupplierInput): Promise<Supplier>;
  findById(id: string): Promise<Supplier | null>;
  findMany(): Promise<Supplier[]>;
}
