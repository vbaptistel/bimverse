"use server";

import { buildCustomersComposition } from "@/composition/customers.composition";
import { presentCustomer } from "@/modules/customers/interface/presenters/customer.presenter";
import {
  type UpdateCustomerSchema,
  updateCustomerSchema,
} from "@/modules/customers/interface/schemas/customer.schema";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

export async function updateCustomerAction(
  rawInput: UpdateCustomerSchema,
): Promise<ActionResult<ReturnType<typeof presentCustomer>>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    await authContext.getCurrentUser();

    const input = updateCustomerSchema.parse(rawInput);
    const { updateCustomerUseCase } = buildCustomersComposition();
    const customer = await updateCustomerUseCase.execute(input);

    return {
      success: true,
      data: presentCustomer(customer),
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
