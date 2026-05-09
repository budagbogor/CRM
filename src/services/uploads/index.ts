import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { complaintUploadSchema } from "@/lib/validations/upload";
import { MockLocalStorageProvider } from "./mock-local-provider";

const provider = new MockLocalStorageProvider();

type CreateComplaintUploadInput = {
  complaintTicketId: string;
  uploadedById?: string;
  fileName: string;
  mimeType: string;
  bytes: ArrayBuffer;
};

export async function createComplaintUpload(input: CreateComplaintUploadInput) {
  const parsed = complaintUploadSchema.parse({
    complaintTicketId: input.complaintTicketId,
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeBytes: input.bytes.byteLength,
  });
  const uploaded = await provider.upload({
    fileName: parsed.fileName,
    mimeType: parsed.mimeType,
    bytes: input.bytes,
  });

  return prisma.fileUpload.create({
    data: {
      complaintTicketId: parsed.complaintTicketId,
      uploadedById: input.uploadedById,
      storageProvider: uploaded.storageProvider || env.FILE_STORAGE_PROVIDER,
      storageKey: uploaded.storageKey,
      fileName: parsed.fileName,
      mimeType: parsed.mimeType,
      sizeBytes: input.bytes.byteLength,
      checksum: uploaded.checksum,
      url: uploaded.url,
    },
  });
}

export * from "./types";

