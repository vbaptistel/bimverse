"use server";

import { buildSuppliersComposition } from "@/composition/suppliers.composition";
import {
  type DeleteSupplierSchema,
  deleteSupplierSchema,
} from "@/modules/suppliers/interface/schemas/supplier.schema";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

export async function deleteSupplierAction(
  rawInput: DeleteSupplierSchema,
): Promise<ActionResult<{ supplierId: string }>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    await authContext.getCurrentUser();

    const input = deleteSupplierSchema.parse(rawInput);
    const { deleteSupplierUseCase } = buildSuppliersComposition();
    const output = await deleteSupplierUseCase.execute(input);

    return {
      success: true,
      data: output,
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
