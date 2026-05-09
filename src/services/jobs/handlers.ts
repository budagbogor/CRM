import { logger } from "@/lib/logger";
import type { JobHandler } from "./types";

function logRun(jobType: string, payload: Record<string, unknown>) {
  logger.info("Job handler executed", { jobType, payload });
}

export const scheduledFollowUpHandler: JobHandler = async (payload) => {
  logRun("scheduled_follow_up", payload);
};

export const serviceReminderHandler: JobHandler = async (payload) => {
  logRun("service_reminder", payload);
};

export const overdueReminderHandler: JobHandler = async (payload) => {
  logRun("overdue_reminder", payload);
};

export const complaintSlaCheckHandler: JobHandler = async (payload) => {
  logRun("complaint_sla_check", payload);
};

