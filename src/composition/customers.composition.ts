import { CreateCustomerUseCase } from "@/modules/customers/application/use-cases/create-customer.use-case";
import { DeleteCustomerUseCase } from "@/modules/customers/application/use-cases/delete-customer.use-case";
import { ListCustomersUseCase } from "@/modules/customers/application/use-cases/list-customers.use-case";
import { UpdateCustomerUseCase } from "@/modules/customers/application/use-cases/update-customer.use-case";
import { DrizzleCustomerRepository } from "@/modules/customers/infrastructure/repositories/drizzle-customer.repository";
import { db } from "@/shared/infrastructure/db/client";

export function buildCustomersComposition() {
  const customerRepository = new DrizzleCustomerRepository(db);

  return {
    listCustomersUseCase: new ListCustomersUseCase(customerRepository),
    createCustomerUseCase: new CreateCustomerUseCase(customerRepository),
    updateCustomerUseCase: new UpdateCustomerUseCase(customerRepository),
    deleteCustomerUseCase: new DeleteCustomerUseCase(customerRepository),
    customerRepository,
  };
}
