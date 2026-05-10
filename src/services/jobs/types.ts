export type JobType =
  | "SEND_THANK_YOU"
  | "SEND_FOLLOW_UP_H3"
  | "SEND_SERVICE_REMINDER"
  | "SEND_OVERDUE_REMINDER"
  | "CHECK_COMPLAINT_SLA"
  | "RECALCULATE_HEALTH_SCORE";

export type JobPayload = Record<string, unknown>;

export type JobHandler = (payload: JobPayload) => Promise<void>;

export type JobProcessResult = {
  processed: number;
  failed: number;
  skipped: number;
};
