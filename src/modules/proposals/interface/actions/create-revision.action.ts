"use server";

import { buildProposalsComposition } from "@/composition/proposals.composition";
import {
  createRevisionSchema,
  type CreateRevisionSchema,
} from "@/modules/proposals/interface/schemas/proposal.schema";
import { presentRevision } from "@/modules/proposals/interface/presenters/proposal.presenter";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

export async function createRevisionAction(
  rawInput: CreateRevisionSchema,
): Promise<ActionResult<ReturnType<typeof presentRevision>>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    const user = await authContext.getCurrentUser();

    const input = createRevisionSchema.parse(rawInput);
    const { createRevisionUseCase } = buildProposalsComposition();
    const revision = await createRevisionUseCase.execute({
      ...input,
      createdBy: user.userId,
    });

    return {
      success: true,
      data: presentRevision(revision),
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
