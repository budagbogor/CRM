import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { Prisma } from "@/generated/prisma/client";

export async function auditLog(input: {
  action: string;
  entityType: string;
  entityId?: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        userId: input.userId,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
    logger.info("Audit event written", {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      userId: input.userId,
    });
  } catch (error) {
    logger.error("Failed to write audit log", {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
