"use server";

import { buildAttachmentsComposition } from "@/composition/attachments.composition";
import {
  createAttachmentUploadSchema,
  type CreateAttachmentUploadSchema,
} from "@/modules/attachments/interface/schemas/attachment.schema";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

export interface CreateAttachmentUploadActionOutput {
  path: string;
  token: string;
  signedUrl: string;
}

export async function createAttachmentUploadAction(
  rawInput: CreateAttachmentUploadSchema,
): Promise<ActionResult<CreateAttachmentUploadActionOutput>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    await authContext.getCurrentUser();

    const input = createAttachmentUploadSchema.parse(rawInput);
    const { createAttachmentUploadUseCase } = buildAttachmentsComposition();
    const result = await createAttachmentUploadUseCase.execute(input);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
