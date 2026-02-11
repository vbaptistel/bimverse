"use server";

import { buildCompaniesComposition } from "@/composition/companies.composition";
import {
  type DeleteCompanySchema,
  deleteCompanySchema,
} from "@/modules/companies/interface/schemas/company.schema";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

export async function deleteCompanyAction(
  rawInput: DeleteCompanySchema,
): Promise<ActionResult<{ companyId: string }>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    await authContext.getCurrentUser();

    const input = deleteCompanySchema.parse(rawInput);
    const { deleteCompanyUseCase } = buildCompaniesComposition();
    const output = await deleteCompanyUseCase.execute(input);

    return {
      success: true,
      data: output,
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
