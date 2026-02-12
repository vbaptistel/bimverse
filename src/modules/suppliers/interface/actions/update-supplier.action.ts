"use server";

import { buildSuppliersComposition } from "@/composition/suppliers.composition";
import { presentSupplier } from "@/modules/suppliers/interface/presenters/supplier.presenter";
import {
  type UpdateSupplierSchema,
  updateSupplierSchema,
} from "@/modules/suppliers/interface/schemas/supplier.schema";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

export async function updateSupplierAction(
  rawInput: UpdateSupplierSchema,
): Promise<ActionResult<ReturnType<typeof presentSupplier>>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    await authContext.getCurrentUser();

    const input = updateSupplierSchema.parse(rawInput);
    const { updateSupplierUseCase } = buildSuppliersComposition();
    const supplier = await updateSupplierUseCase.execute(input);

    return {
      success: true,
      data: presentSupplier(supplier),
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
