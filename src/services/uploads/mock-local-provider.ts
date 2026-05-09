import { createHash } from "node:crypto";
import type { StorageProvider, UploadFileInput, UploadResult } from "./types";

export class MockLocalStorageProvider implements StorageProvider {
  async upload(file: UploadFileInput): Promise<UploadResult> {
    const checksum = createHash("sha256")
      .update(Buffer.from(file.bytes))
      .digest("hex");
    const storageKey = `mock/${Date.now()}-${file.fileName.replace(/\s+/g, "-").toLowerCase()}`;
    return {
      storageProvider: "mock-local",
      storageKey,
      url: `/mock-uploads/${encodeURIComponent(storageKey)}`,
      checksum,
    };
  }
}

