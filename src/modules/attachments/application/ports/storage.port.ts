export interface SignedUploadResult {
  path: string;
  token: string;
  signedUrl: string;
}

export interface StoragePort {
  createSignedUploadUrl(path: string): Promise<SignedUploadResult>;
  createSignedDownloadUrl(path: string, expiresInSeconds: number): Promise<string>;
  objectExists(path: string): Promise<boolean>;
}
