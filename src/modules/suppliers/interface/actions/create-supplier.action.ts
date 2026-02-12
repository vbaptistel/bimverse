"use server";

import { buildSuppliersComposition } from "@/composition/suppliers.composition";
import { presentSupplier } from "@/modules/suppliers/interface/presenters/supplier.presenter";
import {
  type CreateSupplierSchema,
  createSupplierSchema,
} from "@/modules/suppliers/interface/schemas/supplier.schema";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

export async function createSupplierAction(
  rawInput: CreateSupplierSchema,
): Promise<ActionResult<ReturnType<typeof presentSupplier>>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    await authContext.getCurrentUser();

    const input = createSupplierSchema.parse(rawInput);
    const { createSupplierUseCase } = buildSuppliersComposition();
    const supplier = await createSupplierUseCase.execute(input);

    return {
      success: true,
      data: presentSupplier(supplier),
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
