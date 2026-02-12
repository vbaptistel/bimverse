"use server";

import { buildSuppliersComposition } from "@/composition/suppliers.composition";
import { presentSupplier } from "@/modules/suppliers/interface/presenters/supplier.presenter";
import {
  type ListSuppliersSchema,
  listSuppliersSchema,
} from "@/modules/suppliers/interface/schemas/supplier.schema";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

function toActiveFilter(input: ListSuppliersSchema["status"]): boolean | null {
  if (input === "all") {
    return null;
  }

  return input === "active";
}

export async function listSuppliersAction(
  rawInput: Partial<ListSuppliersSchema> = {},
): Promise<ActionResult<ReturnType<typeof presentSupplier>[]>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    await authContext.getCurrentUser();

    const input = listSuppliersSchema.parse(rawInput);
    const { listSuppliersUseCase } = buildSuppliersComposition();

    const suppliers = await listSuppliersUseCase.execute({
      search: input.search,
      active: toActiveFilter(input.status),
    });

    return {
      success: true,
      data: suppliers.map(presentSupplier),
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
