import type { CustomerRepositoryPort } from "@/modules/customers/application/ports/customer-repository.port";
import type { UseCase } from "@/shared/application/use-case";
import { NotFoundError, ValidationError } from "@/shared/domain/errors";

export interface DeleteCustomerInput {
  customerId: string;
}

export interface DeleteCustomerOutput {
  customerId: string;
}

export class DeleteCustomerUseCase
  implements UseCase<DeleteCustomerInput, DeleteCustomerOutput>
{
  constructor(private readonly customerRepository: CustomerRepositoryPort) {}

  async execute(input: DeleteCustomerInput): Promise<DeleteCustomerOutput> {
    const customer = await this.customerRepository.findById(input.customerId);
    if (!customer) {
      throw new NotFoundError("Cliente não encontrado");
    }

    const hasLinkedProposals = await this.customerRepository.hasLinkedProposals(
      input.customerId,
    );
    if (hasLinkedProposals) {
      throw new ValidationError(
        "Não é possível excluir cliente com propostas vinculadas",
      );
    }

    await this.customerRepository.deleteById(input.customerId);

    return {
      customerId: input.customerId,
    };
  }
}
