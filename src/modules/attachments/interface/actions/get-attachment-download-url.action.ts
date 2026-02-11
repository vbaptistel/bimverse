"use server";

import { buildAttachmentsComposition } from "@/composition/attachments.composition";
import {
  getAttachmentDownloadSchema,
  type GetAttachmentDownloadSchema,
} from "@/modules/attachments/interface/schemas/attachment.schema";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

export async function getAttachmentDownloadUrlAction(
  rawInput: GetAttachmentDownloadSchema,
): Promise<ActionResult<{ signedUrl: string; expiresInSeconds: number }>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    await authContext.getCurrentUser();

    const input = getAttachmentDownloadSchema.parse(rawInput);
    const { getAttachmentDownloadUrlUseCase } = buildAttachmentsComposition();
    const result = await getAttachmentDownloadUrlUseCase.execute(input);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
