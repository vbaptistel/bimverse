"use server";

import { buildProposalsComposition } from "@/composition/proposals.composition";
import {
  prepareRevisionDocumentUploadSchema,
  type PrepareRevisionDocumentUploadSchema,
} from "@/modules/proposals/interface/schemas/proposal.schema";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

export interface PrepareRevisionDocumentUploadActionOutput {
  path: string;
  token: string;
  signedUrl: string;
  nextRevisionNumber: number;
}

export async function prepareRevisionDocumentUploadAction(
  rawInput: PrepareRevisionDocumentUploadSchema,
): Promise<ActionResult<PrepareRevisionDocumentUploadActionOutput>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    await authContext.getCurrentUser();

    const input = prepareRevisionDocumentUploadSchema.parse(rawInput);
    const { prepareRevisionDocumentUploadUseCase } = buildProposalsComposition();
    const output = await prepareRevisionDocumentUploadUseCase.execute(input);

    return {
      success: true,
      data: output,
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
