"use server";

import { buildCustomersComposition } from "@/composition/customers.composition";
import {
  type DeleteCustomerSchema,
  deleteCustomerSchema,
} from "@/modules/customers/interface/schemas/customer.schema";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

export async function deleteCustomerAction(
  rawInput: DeleteCustomerSchema,
): Promise<ActionResult<{ customerId: string }>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    await authContext.getCurrentUser();

    const input = deleteCustomerSchema.parse(rawInput);
    const { deleteCustomerUseCase } = buildCustomersComposition();
    const output = await deleteCustomerUseCase.execute(input);

    return {
      success: true,
      data: output,
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
