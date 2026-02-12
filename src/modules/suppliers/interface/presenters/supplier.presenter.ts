import type { Supplier } from "@/modules/suppliers/application/ports/supplier-repository.port";

export interface SupplierPresenter {
  id: string;
  legalName: string;
  cnpj: string;
  specialty: string;
  hourlyCostBrl: number | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export function presentSupplier(supplier: Supplier): SupplierPresenter {
  return {
    id: supplier.id,
    legalName: supplier.legalName,
    cnpj: supplier.cnpj,
    specialty: supplier.specialty,
    hourlyCostBrl: supplier.hourlyCostBrl,
    contactName: supplier.contactName,
    contactEmail: supplier.contactEmail,
    contactPhone: supplier.contactPhone,
    active: supplier.active,
    createdAt: supplier.createdAt.toISOString(),
    updatedAt: supplier.updatedAt.toISOString(),
  };
}
