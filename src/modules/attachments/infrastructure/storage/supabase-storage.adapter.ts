import type {
  SignedUploadResult,
  StoragePort,
} from "@/modules/attachments/application/ports/storage.port";
import { ValidationError } from "@/shared/domain/errors";
import { createSupabaseAdminClient } from "@/shared/infrastructure/supabase/admin-client";

const BUCKET_NAME = "proposal-attachments";

export class SupabaseStorageAdapter implements StoragePort {
  private readonly supabase = createSupabaseAdminClient();

  async createSignedUploadUrl(path: string): Promise<SignedUploadResult> {
    const { data, error } = await this.supabase.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(path);

    if (error || !data) {
      throw new ValidationError("Não foi possível gerar upload assinado");
    }

    return {
      path: data.path,
      token: data.token,
      signedUrl: data.signedUrl,
    };
  }

  async createSignedDownloadUrl(
    path: string,
    expiresInSeconds: number,
  ): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, expiresInSeconds);

    if (error || !data?.signedUrl) {
      throw new ValidationError("Não foi possível gerar link de download");
    }

    return data.signedUrl;
  }

  async objectExists(path: string): Promise<boolean> {
    const lastSlashIndex = path.lastIndexOf("/");
    if (lastSlashIndex <= 0) {
      return false;
    }

    const folder = path.slice(0, lastSlashIndex);
    const fileName = path.slice(lastSlashIndex + 1);

    const { data, error } = await this.supabase.storage
      .from(BUCKET_NAME)
      .list(folder, {
        search: fileName,
        limit: 1,
      });

    if (error) {
      return false;
    }

    return !!data?.some((file) => file.name === fileName);
  }
}
