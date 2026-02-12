"use server";

import { buildProposalsComposition } from "@/composition/proposals.composition";
import {
  type UnlinkProposalSupplierSchema,
  unlinkProposalSupplierSchema,
} from "@/modules/proposals/interface/schemas/proposal.schema";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

export async function unlinkProposalSupplierAction(
  rawInput: UnlinkProposalSupplierSchema,
): Promise<ActionResult<{ linkId: string }>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    const user = await authContext.getCurrentUser();

    const input = unlinkProposalSupplierSchema.parse(rawInput);
    const { unlinkProposalSupplierUseCase } = buildProposalsComposition();
    const output = await unlinkProposalSupplierUseCase.execute({
      linkId: input.linkId,
      unlinkedBy: user.userId,
    });

    return {
      success: true,
      data: output,
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
