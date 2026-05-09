export type UploadFileInput = {
  fileName: string;
  mimeType: string;
  bytes: ArrayBuffer;
};

export type UploadResult = {
  storageProvider: string;
  storageKey: string;
  url?: string;
  checksum?: string;
};

export interface StorageProvider {
  upload(file: UploadFileInput): Promise<UploadResult>;
}

