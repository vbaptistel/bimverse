"use server";

import { buildDashboardComposition } from "@/composition/dashboard.composition";
import type { DashboardSummary } from "@/modules/dashboard/application/ports/dashboard-repository.port";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

export async function getDashboardSummaryAction(): Promise<
  ActionResult<DashboardSummary>
> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    await authContext.getCurrentUser();

    const { getDashboardSummaryUseCase } = buildDashboardComposition();
    const summary = await getDashboardSummaryUseCase.execute();

    return {
      success: true,
      data: summary,
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
