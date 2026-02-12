"use server";

import { buildCustomersComposition } from "@/composition/customers.composition";
import { presentCustomer } from "@/modules/customers/interface/presenters/customer.presenter";
import {
  type ListCustomersSchema,
  listCustomersSchema,
} from "@/modules/customers/interface/schemas/customer.schema";
import type { CustomerStatus } from "@/shared/domain/types";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

function toStatusFilter(
  input: ListCustomersSchema["status"],
): CustomerStatus | null {
  return input === "all" ? null : input;
}

export async function listCustomersAction(
  rawInput: Partial<ListCustomersSchema> = {},
): Promise<ActionResult<ReturnType<typeof presentCustomer>[]>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    await authContext.getCurrentUser();

    const input = listCustomersSchema.parse(rawInput);
    const { listCustomersUseCase } = buildCustomersComposition();

    const customers = await listCustomersUseCase.execute({
      search: input.search,
      status: toStatusFilter(input.status),
    });

    return {
      success: true,
      data: customers.map(presentCustomer),
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
