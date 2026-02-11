"use server";

import { buildProposalsComposition } from "@/composition/proposals.composition";
import type { CreateProposalSchema } from "@/modules/proposals/interface/schemas/proposal.schema";
import { createProposalSchema } from "@/modules/proposals/interface/schemas/proposal.schema";
import {
  presentProposal,
  presentRevision,
} from "@/modules/proposals/interface/presenters/proposal.presenter";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

export interface CreateProposalActionOutput {
  proposal: ReturnType<typeof presentProposal>;
  initialRevision: ReturnType<typeof presentRevision>;
}

export async function createProposalAction(
  rawInput: CreateProposalSchema,
): Promise<ActionResult<CreateProposalActionOutput>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    const user = await authContext.getCurrentUser();

    const input = createProposalSchema.parse(rawInput);
    const { createProposalUseCase } = buildProposalsComposition();
    const output = await createProposalUseCase.execute({
      ...input,
      createdBy: user.userId,
    });

    return {
      success: true,
      data: {
        proposal: presentProposal(output.proposal),
        initialRevision: presentRevision(output.initialRevision),
      },
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
