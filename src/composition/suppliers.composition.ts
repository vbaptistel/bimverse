import { DrizzleSupplierRepository } from "@/modules/suppliers/infrastructure/repositories/drizzle-supplier.repository";
import { CreateSupplierUseCase } from "@/modules/suppliers/application/use-cases/create-supplier.use-case";
import { DeleteSupplierUseCase } from "@/modules/suppliers/application/use-cases/delete-supplier.use-case";
import { ListSuppliersUseCase } from "@/modules/suppliers/application/use-cases/list-suppliers.use-case";
import { UpdateSupplierUseCase } from "@/modules/suppliers/application/use-cases/update-supplier.use-case";
import { db } from "@/shared/infrastructure/db/client";

export function buildSuppliersComposition() {
  const supplierRepository = new DrizzleSupplierRepository(db);

  return {
    listSuppliersUseCase: new ListSuppliersUseCase(supplierRepository),
    createSupplierUseCase: new CreateSupplierUseCase(supplierRepository),
    updateSupplierUseCase: new UpdateSupplierUseCase(supplierRepository),
    deleteSupplierUseCase: new DeleteSupplierUseCase(supplierRepository),
    supplierRepository,
  };
}
