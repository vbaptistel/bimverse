import type {
  ListSuppliersFilters,
  Supplier,
  SupplierRepositoryPort,
} from "@/modules/suppliers/application/ports/supplier-repository.port";
import type { UseCase } from "@/shared/application/use-case";

export type ListSuppliersInput = ListSuppliersFilters;

export class ListSuppliersUseCase
  implements UseCase<ListSuppliersInput | void, Supplier[]>
{
  constructor(private readonly supplierRepository: SupplierRepositoryPort) {}

  async execute(input?: ListSuppliersInput): Promise<Supplier[]> {
    return this.supplierRepository.findMany(input ?? {});
  }
}
