import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { AutomationJobStatus } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import {
  complaintSlaCheckHandler,
  overdueReminderHandler,
  scheduledFollowUpHandler,
  serviceReminderHandler,
} from "./handlers";
import type { JobHandler, JobPayload, JobType } from "./types";

const handlers: Record<JobType, JobHandler> = {
  scheduled_follow_up: scheduledFollowUpHandler,
  service_reminder: serviceReminderHandler,
  overdue_reminder: overdueReminderHandler,
  complaint_sla_check: complaintSlaCheckHandler,
};

const memoryQueue: Array<{ type: JobType; payload: JobPayload }> = [];

export async function enqueueJob(type: JobType, payload: JobPayload, runAt?: Date) {
  if (env.JOB_RUNNER_MODE === "memory") {
    memoryQueue.push({ type, payload });
    return;
  }

  await prisma.automationJob.create({
    data: {
      name: `[Foundation] ${type}`,
      jobType: type,
      trigger: "SCHEDULED",
      status: AutomationJobStatus.ACTIVE,
      triggerConfig: payload as Prisma.InputJsonValue,
      nextRunAt: runAt ?? new Date(),
    },
  });
}

export async function runDueJobs() {
  if (env.JOB_RUNNER_MODE === "memory") {
    while (memoryQueue.length > 0) {
      const job = memoryQueue.shift();
      if (!job) continue;
      await handlers[job.type](job.payload);
    }
    return;
  }

  const jobs = await prisma.automationJob.findMany({
    where: { status: AutomationJobStatus.ACTIVE, nextRunAt: { lte: new Date() } },
    orderBy: { nextRunAt: "asc" },
    take: 50,
  });

  for (const job of jobs) {
    try {
      const jobType = job.jobType as JobType;
      if (!handlers[jobType]) {
        throw new Error(`Unsupported job type: ${job.jobType}`);
      }
      await handlers[jobType]((job.triggerConfig ?? {}) as JobPayload);
      await prisma.automationJob.update({
        where: { id: job.id },
        data: {
          lastRunAt: new Date(),
          status: AutomationJobStatus.COMPLETED,
          errorMessage: null,
        },
      });
    } catch (error) {
      logger.error("Background job execution failed", {
        jobId: job.id,
        jobType: job.jobType,
        error: error instanceof Error ? error.message : String(error),
      });
      await prisma.automationJob.update({
        where: { id: job.id },
        data: {
          status: AutomationJobStatus.FAILED,
          retryCount: job.retryCount + 1,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }
}
