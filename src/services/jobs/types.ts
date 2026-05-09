export type JobType =
  | "scheduled_follow_up"
  | "service_reminder"
  | "overdue_reminder"
  | "complaint_sla_check";

export type JobPayload = Record<string, unknown>;

export type JobHandler = (payload: JobPayload) => Promise<void>;

