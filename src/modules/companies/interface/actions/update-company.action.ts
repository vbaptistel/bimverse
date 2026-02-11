"use server";

import { buildCompaniesComposition } from "@/composition/companies.composition";
import { presentCompany } from "@/modules/companies/interface/presenters/company.presenter";
import {
  type UpdateCompanySchema,
  updateCompanySchema,
} from "@/modules/companies/interface/schemas/company.schema";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

export async function updateCompanyAction(
  rawInput: UpdateCompanySchema,
): Promise<ActionResult<ReturnType<typeof presentCompany>>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    await authContext.getCurrentUser();

    const input = updateCompanySchema.parse(rawInput);
    const { updateCompanyUseCase } = buildCompaniesComposition();
    const company = await updateCompanyUseCase.execute(input);

    return {
      success: true,
      data: presentCompany(company),
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
