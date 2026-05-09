import { z } from "zod";
import { env } from "@/lib/env";

export const complaintUploadSchema = z.object({
  complaintTicketId: z.string().trim().min(1, "Complaint ticket is required"),
  fileName: z.string().trim().min(1, "File name is required"),
  mimeType: z
    .string()
    .regex(/^(image\/(jpeg|png|webp)|application\/pdf)$/i, "Unsupported file type"),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(env.UPLOAD_MAX_MB * 1024 * 1024, `Max upload is ${env.UPLOAD_MAX_MB}MB`),
});

export type ComplaintUploadInput = z.infer<typeof complaintUploadSchema>;

