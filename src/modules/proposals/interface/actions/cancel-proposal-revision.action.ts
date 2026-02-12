"use server";

import { buildProposalsComposition } from "@/composition/proposals.composition";
import { presentProposal } from "@/modules/proposals/interface/presenters/proposal.presenter";
import {
  cancelProposalRevisionSchema,
  type CancelProposalRevisionSchema,
} from "@/modules/proposals/interface/schemas/proposal.schema";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

export async function cancelProposalRevisionAction(
  rawInput: CancelProposalRevisionSchema,
): Promise<ActionResult<ReturnType<typeof presentProposal>>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    const user = await authContext.getCurrentUser();

    const input = cancelProposalRevisionSchema.parse(rawInput);
    const { cancelProposalRevisionUseCase } = buildProposalsComposition();
    const proposal = await cancelProposalRevisionUseCase.execute({
      proposalId: input.proposalId,
      canceledBy: user.userId,
    });

    return {
      success: true,
      data: presentProposal(proposal),
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
