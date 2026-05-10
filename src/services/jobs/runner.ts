import { AutomationJobStatus } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  checkComplaintSlaHandler,
  recalculateHealthScoreHandler,
  sendFollowUpH3Handler,
  sendOverdueReminderHandler,
  sendServiceReminderHandler,
  sendThankYouHandler,
} from "./handlers";
import type { JobHandler, JobPayload, JobProcessResult, JobType } from "./types";

const LOCK_TTL_MS = 5 * 60 * 1000;

const handlers: Record<JobType, JobHandler> = {
  SEND_THANK_YOU: sendThankYouHandler,
  SEND_FOLLOW_UP_H3: sendFollowUpH3Handler,
  SEND_SERVICE_REMINDER: sendServiceReminderHandler,
  SEND_OVERDUE_REMINDER: sendOverdueReminderHandler,
  CHECK_COMPLAINT_SLA: checkComplaintSlaHandler,
  RECALCULATE_HEALTH_SCORE: recalculateHealthScoreHandler,
};

type EnqueueParams = {
  type: JobType;
  payload: JobPayload;
  scheduledAt?: Date;
  maxAttempts?: number;
  name?: string;
  ownerId?: string | null;
};

export async function enqueueJob(params: EnqueueParams) {
  const scheduledAt = params.scheduledAt ?? new Date();
  return prisma.automationJob.create({
    data: {
      name: params.name ?? `[Job] ${params.type}`,
      jobType: params.type,
      status: AutomationJobStatus.ACTIVE,
      trigger: "SCHEDULED",
      payload: params.payload as Prisma.InputJsonValue,
      triggerConfig: params.payload as Prisma.InputJsonValue,
      scheduledAt,
      nextRunAt: scheduledAt,
      maxAttempts: params.maxAttempts ?? 3,
      ownerId: params.ownerId ?? null,
    },
  });
}

async function lockJob(jobId: string) {
  const now = new Date();
  const lockExpiredBefore = new Date(now.getTime() - LOCK_TTL_MS);

  const result = await prisma.automationJob.updateMany({
    where: {
      id: jobId,
      status: AutomationJobStatus.ACTIVE,
      OR: [{ lockedAt: null }, { lockedAt: { lt: lockExpiredBefore } }],
    },
    data: { lockedAt: now },
  });
  return result.count === 1;
}

function resolvePayload(job: { payload: Prisma.JsonValue | null; triggerConfig: Prisma.JsonValue | null }) {
  const raw = job.payload ?? job.triggerConfig ?? {};
  return (raw && typeof raw === "object" ? (raw as JobPayload) : {}) as JobPayload;
}

export async function runDueJobs(limit = 50): Promise<JobProcessResult> {
  const now = new Date();
  const dueJobs = await prisma.automationJob.findMany({
    where: {
      status: AutomationJobStatus.ACTIVE,
      nextRunAt: { lte: now },
    },
    orderBy: [{ nextRunAt: "asc" }, { createdAt: "asc" }],
    take: limit,
  });

  let processed = 0;
  let failed = 0;
  let skipped = 0;

  for (const job of dueJobs) {
    const locked = await lockJob(job.id);
    if (!locked) {
      skipped += 1;
      continue;
    }

    const handler = handlers[job.jobType as JobType];
    if (job.attempts >= job.maxAttempts) {
      skipped += 1;
      continue;
    }
    if (!handler) {
      await prisma.automationJob.update({
        where: { id: job.id },
        data: {
          status: AutomationJobStatus.FAILED,
          attempts: job.attempts + 1,
          lastError: `Unsupported job type: ${job.jobType}`,
          errorMessage: `Unsupported job type: ${job.jobType}`,
          lockedAt: null,
          processedAt: new Date(),
          lastRunAt: new Date(),
        },
      });
      failed += 1;
      continue;
    }

    try {
      await handler(resolvePayload(job));
      await prisma.automationJob.update({
        where: { id: job.id },
        data: {
          status: AutomationJobStatus.COMPLETED,
          attempts: job.attempts + 1,
          lastError: null,
          errorMessage: null,
          lockedAt: null,
          processedAt: new Date(),
          lastRunAt: new Date(),
        },
      });
      processed += 1;
      logger.info("Job processed", { jobId: job.id, jobType: job.jobType, attempts: job.attempts + 1 });
    } catch (error) {
      const nextAttempts = job.attempts + 1;
      const isFinal = nextAttempts >= job.maxAttempts;
      const lastError =
        error instanceof Error ? error.message : "Unknown job execution error";
      logger.error("Job execution failed", { jobId: job.id, jobType: job.jobType, lastError, nextAttempts, maxAttempts: job.maxAttempts });
      await prisma.automationJob.update({
        where: { id: job.id },
        data: {
          status: isFinal ? AutomationJobStatus.FAILED : AutomationJobStatus.ACTIVE,
          attempts: nextAttempts,
          lastError,
          errorMessage: lastError,
          lockedAt: null,
          nextRunAt: isFinal ? job.nextRunAt : new Date(Date.now() + 60_000),
          lastRunAt: new Date(),
          processedAt: isFinal ? new Date() : null,
        },
      });
      failed += 1;
    }
  }

  logger.info("Job runner cycle completed", { processed, failed, skipped, scanned: dueJobs.length });

  return { processed, failed, skipped };
}
