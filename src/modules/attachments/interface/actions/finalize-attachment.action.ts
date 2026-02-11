"use server";

import { buildAttachmentsComposition } from "@/composition/attachments.composition";
import {
  finalizeAttachmentSchema,
  type FinalizeAttachmentSchema,
} from "@/modules/attachments/interface/schemas/attachment.schema";
import { presentAttachment } from "@/modules/attachments/interface/presenters/attachment.presenter";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

export async function finalizeAttachmentAction(
  rawInput: FinalizeAttachmentSchema,
): Promise<ActionResult<ReturnType<typeof presentAttachment>>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    const user = await authContext.getCurrentUser();

    const input = finalizeAttachmentSchema.parse(rawInput);
    const { finalizeAttachmentUseCase } = buildAttachmentsComposition();
    const attachment = await finalizeAttachmentUseCase.execute({
      ...input,
      uploadedBy: user.userId,
    });

    return {
      success: true,
      data: presentAttachment(attachment),
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
