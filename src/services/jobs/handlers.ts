import { logger } from "@/lib/logger";
import { notificationService } from "@/services/notifications";
import { prisma } from "@/lib/prisma";
import { calculateCustomerHealthScore } from "@/services/retention";
import type { JobHandler } from "./types";

function logRun(jobType: string, payload: Record<string, unknown>) {
  logger.info("Job handler executed", { jobType, payload });
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export const sendThankYouHandler: JobHandler = async (payload) => {
  logRun("SEND_THANK_YOU", payload);
  const to = asString(payload.to);
  const message = asString(payload.message);
  if (!to || !message) return;
  await notificationService.sendMessage("WHATSAPP", {
    to,
    message,
    subject: asString(payload.subject) || "Terima kasih dari Mobeng",
    customerId: asString(payload.customerId) || undefined,
    userId: asString(payload.userId) || undefined,
    metadata: { source: "job_runner", jobType: "SEND_THANK_YOU" },
  });
};

export const sendFollowUpH3Handler: JobHandler = async (payload) => {
  logRun("SEND_FOLLOW_UP_H3", payload);
  const to = asString(payload.to);
  if (!to) return;
  await notificationService.sendMessage("WHATSAPP", {
    to,
    message:
      asString(payload.message) ||
      "Halo, bagaimana kondisi kendaraan Anda 3 hari setelah servis di Mobeng?",
    subject: asString(payload.subject) || "Follow-up H+3 Mobeng",
    customerId: asString(payload.customerId) || undefined,
    userId: asString(payload.userId) || undefined,
    metadata: { source: "job_runner", jobType: "SEND_FOLLOW_UP_H3" },
  });
};

export const sendServiceReminderHandler: JobHandler = async (payload) => {
  logRun("SEND_SERVICE_REMINDER", payload);
  const to = asString(payload.to);
  if (!to) return;
  await notificationService.sendMessage("WHATSAPP", {
    to,
    message: asString(payload.message) || "Pengingat servis berkala kendaraan Anda dari Mobeng.",
    subject: asString(payload.subject) || "Pengingat Servis Mobeng",
    customerId: asString(payload.customerId) || undefined,
    userId: asString(payload.userId) || undefined,
    metadata: {
      source: "job_runner",
      jobType: "SEND_SERVICE_REMINDER",
      cadence: asString(payload.cadenceLabel) || undefined,
    },
  });
};

export const sendOverdueReminderHandler: JobHandler = async (payload) => {
  logRun("SEND_OVERDUE_REMINDER", payload);
  const to = asString(payload.to);
  if (!to) return;
  await notificationService.sendMessage("WHATSAPP", {
    to,
    message: asString(payload.message) || "Servis kendaraan Anda sudah overdue. Segera booking ke Mobeng.",
    subject: asString(payload.subject) || "Servis Overdue Mobeng",
    customerId: asString(payload.customerId) || undefined,
    userId: asString(payload.userId) || undefined,
    metadata: {
      source: "job_runner",
      jobType: "SEND_OVERDUE_REMINDER",
      cadence: asString(payload.cadenceLabel) || undefined,
    },
  });
};

export const checkComplaintSlaHandler: JobHandler = async (payload) => {
  logRun("CHECK_COMPLAINT_SLA", payload);
  const ticketId = asString(payload.ticketId);
  if (!ticketId) return;
  await prisma.complaintTicket.findUnique({ where: { id: ticketId }, select: { id: true } });
};

export const recalculateHealthScoreHandler: JobHandler = async (payload) => {
  logRun("RECALCULATE_HEALTH_SCORE", payload);
  const customerId = asString(payload.customerId);
  if (!customerId) return;
  await calculateCustomerHealthScore(customerId);
};
