"use server";

import { buildProposalsComposition } from "@/composition/proposals.composition";
import {
  prepareProposalSendUploadSchema,
  type PrepareProposalSendUploadSchema,
} from "@/modules/proposals/interface/schemas/proposal.schema";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

export interface PrepareProposalSendUploadActionOutput {
  path: string;
  token: string;
  signedUrl: string;
  currentRevisionNumber: number;
}

export async function prepareProposalSendUploadAction(
  rawInput: PrepareProposalSendUploadSchema,
): Promise<ActionResult<PrepareProposalSendUploadActionOutput>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    await authContext.getCurrentUser();

    const input = prepareProposalSendUploadSchema.parse(rawInput);
    const { prepareProposalSendUploadUseCase } = buildProposalsComposition();
    const output = await prepareProposalSendUploadUseCase.execute(input);

    return {
      success: true,
      data: output,
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
