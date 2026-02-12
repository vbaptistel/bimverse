"use server";

import { buildProposalsComposition } from "@/composition/proposals.composition";
import { presentProposal } from "@/modules/proposals/interface/presenters/proposal.presenter";
import {
  startProposalRevisionCycleSchema,
  type StartProposalRevisionCycleSchema,
} from "@/modules/proposals/interface/schemas/proposal.schema";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

export interface StartProposalRevisionCycleActionOutput {
  proposal: ReturnType<typeof presentProposal>;
  cycleId: string;
}

export async function startProposalRevisionCycleAction(
  rawInput: StartProposalRevisionCycleSchema,
): Promise<ActionResult<StartProposalRevisionCycleActionOutput>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    const user = await authContext.getCurrentUser();

    const input = startProposalRevisionCycleSchema.parse(rawInput);
    const { startProposalRevisionCycleUseCase } = buildProposalsComposition();
    const output = await startProposalRevisionCycleUseCase.execute({
      ...input,
      startedBy: user.userId,
    });

    return {
      success: true,
      data: {
        proposal: presentProposal(output.proposal),
        cycleId: output.cycleId,
      },
    };
  } catch (error) {
    return toActionFailure(error);
  }
}

