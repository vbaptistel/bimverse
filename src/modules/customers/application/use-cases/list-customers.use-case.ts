import type {
  CustomerRepositoryPort,
  ListCustomersFilters,
} from "@/modules/customers/application/ports/customer-repository.port";
import type { Customer } from "@/modules/customers/domain/customer";
import type { UseCase } from "@/shared/application/use-case";

export type ListCustomersInput = ListCustomersFilters;

export class ListCustomersUseCase
  implements UseCase<ListCustomersInput | void, Customer[]>
{
  constructor(private readonly customerRepository: CustomerRepositoryPort) {}

  async execute(input?: ListCustomersInput): Promise<Customer[]> {
    return this.customerRepository.findMany(input ?? {});
  }
}
