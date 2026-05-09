import { NotificationChannel } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import {
  MockEmailProvider,
  MockSmsProvider,
  MockWhatsappProvider,
} from "./mock-providers";
import type {
  DeliveryLogInput,
  NotificationPayload,
  NotificationProvider,
  NotificationTemplatePayload,
} from "./types";

const whatsappProvider: NotificationProvider = new MockWhatsappProvider();
const emailProvider: NotificationProvider = new MockEmailProvider();
const smsProvider: NotificationProvider = new MockSmsProvider();

function providerFromChannel(channel: "WHATSAPP" | "EMAIL" | "SMS") {
  if (channel === "WHATSAPP") return whatsappProvider;
  if (channel === "EMAIL") return emailProvider;
  return smsProvider;
}

async function logDelivery(input: DeliveryLogInput) {
  await prisma.notificationLog.create({
    data: {
      channel: NotificationChannel[input.channel],
      status: input.status,
      recipient: input.recipient,
      subject: input.subject,
      message: input.message,
      providerMessageId: input.providerMessageId,
      failureReason: input.failureReason,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      customerId: input.customerId,
      userId: input.userId,
      sentAt: input.status === "SENT" ? new Date() : null,
      failedAt: input.status === "FAILED" ? new Date() : null,
    },
  });
}

function renderTemplate(payload: NotificationTemplatePayload) {
  const renderedVars = Object.entries(payload.variables ?? {})
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
  const message = renderedVars
    ? `Template ${payload.templateKey} - ${renderedVars}`
    : `Template ${payload.templateKey}`;

  return {
    subject: `Mobeng CRM: ${payload.templateKey}`,
    message,
  };
}

export const notificationService = {
  async sendMessage(
    channel: "WHATSAPP" | "EMAIL" | "SMS",
    payload: NotificationPayload & { customerId?: string; userId?: string }
  ) {
    const provider = providerFromChannel(channel);
    try {
      const result = await provider.sendMessage(payload);
      await logDelivery({
        channel,
        recipient: payload.to,
        subject: payload.subject,
        message: payload.message,
        providerMessageId: result.providerMessageId,
        metadata: {
          ...(payload.metadata ?? {}),
          appEnv: env.APP_ENV,
          provider: provider.channel,
        },
        customerId: payload.customerId,
        userId: payload.userId,
        status: result.status === "failed" ? "FAILED" : "QUEUED",
      });
      return result;
    } catch (error) {
      logger.error("Notification sendMessage failed", {
        channel,
        to: payload.to,
        error: error instanceof Error ? error.message : String(error),
      });
      await logDelivery({
        channel,
        recipient: payload.to,
        subject: payload.subject,
        message: payload.message,
        metadata: payload.metadata,
        customerId: payload.customerId,
        userId: payload.userId,
        status: "FAILED",
        failureReason: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },

  async sendTemplate(
    channel: "WHATSAPP" | "EMAIL" | "SMS",
    payload: NotificationTemplatePayload & { customerId?: string; userId?: string }
  ) {
    const provider = providerFromChannel(channel);
    const rendered = renderTemplate(payload);
    try {
      const result = await provider.sendTemplate(payload);
      await logDelivery({
        channel,
        recipient: payload.to,
        subject: rendered.subject,
        message: rendered.message,
        providerMessageId: result.providerMessageId,
        metadata: {
          templateKey: payload.templateKey,
          variables: payload.variables ?? {},
          ...(payload.metadata ?? {}),
          appEnv: env.APP_ENV,
          provider: provider.channel,
        },
        customerId: payload.customerId,
        userId: payload.userId,
        status: result.status === "failed" ? "FAILED" : "QUEUED",
      });
      return result;
    } catch (error) {
      logger.error("Notification sendTemplate failed", {
        channel,
        to: payload.to,
        templateKey: payload.templateKey,
        error: error instanceof Error ? error.message : String(error),
      });
      await logDelivery({
        channel,
        recipient: payload.to,
        subject: rendered.subject,
        message: rendered.message,
        metadata: payload.metadata,
        customerId: payload.customerId,
        userId: payload.userId,
        status: "FAILED",
        failureReason: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
};

export * from "./types";
export * from "./mock-providers";
