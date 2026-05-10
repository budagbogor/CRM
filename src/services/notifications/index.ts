import { NotificationChannel } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import {
  MockEmailProvider,
  MockSmsProvider,
  MockWhatsappProvider,
  ResendEmailProvider,
  SmtpEmailProvider,
  WhatsAppCloudApiProvider,
} from "./providers";
import { renderNotificationTemplate } from "./templates";
import type {
  DeliveryLogInput,
  NotificationPayload,
  NotificationProvider,
  NotificationTemplatePayload,
} from "./types";

function selectWhatsappProvider(): NotificationProvider {
  if (env.NOTIFICATION_PROVIDER === "whatsapp_cloud_api") {
    return new WhatsAppCloudApiProvider();
  }
  return new MockWhatsappProvider();
}

function selectEmailProvider(): NotificationProvider {
  if (env.EMAIL_PROVIDER === "smtp") return new SmtpEmailProvider();
  if (env.EMAIL_PROVIDER === "resend") return new ResendEmailProvider();
  return new MockEmailProvider();
}

const whatsappProvider: NotificationProvider = selectWhatsappProvider();
const emailProvider: NotificationProvider = selectEmailProvider();
const smsProvider: NotificationProvider = new MockSmsProvider();

function providerFromChannel(channel: "WHATSAPP" | "EMAIL" | "SMS") {
  if (channel === "WHATSAPP") return whatsappProvider;
  if (channel === "EMAIL") return emailProvider;
  return smsProvider;
}

function maskSecret(value?: string) {
  if (!value) return "Not configured";
  if (value.length <= 8) return "********";
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
}

export function getNotificationProviderStatus() {
  return {
    selectedProvider: env.NOTIFICATION_PROVIDER,
    emailProvider: env.EMAIL_PROVIDER,
    whatsapp: {
      configured:
        !!env.WHATSAPP_ACCESS_TOKEN &&
        !!env.WHATSAPP_PHONE_NUMBER_ID &&
        !!env.WHATSAPP_BUSINESS_ACCOUNT_ID,
      apiVersion: env.WHATSAPP_API_VERSION,
      accessTokenMasked: maskSecret(env.WHATSAPP_ACCESS_TOKEN),
      phoneNumberIdMasked: maskSecret(env.WHATSAPP_PHONE_NUMBER_ID),
      businessAccountIdMasked: maskSecret(env.WHATSAPP_BUSINESS_ACCOUNT_ID),
    },
    email: {
      configuredMock: env.EMAIL_PROVIDER === "mock",
      configuredSmtp:
        env.EMAIL_PROVIDER === "smtp" &&
        !!env.SMTP_HOST &&
        !!env.SMTP_PORT &&
        !!env.SMTP_USER &&
        !!env.SMTP_PASS,
      configuredResend: env.EMAIL_PROVIDER === "resend" && !!env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
      smtpHostMasked: maskSecret(env.SMTP_HOST),
      smtpUserMasked: maskSecret(env.SMTP_USER),
      resendKeyMasked: maskSecret(env.RESEND_API_KEY),
    },
  };
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
        failureReason: "Delivery failed. Check provider logs.",
      });
      throw error;
    }
  },

  async sendTemplate(
    channel: "WHATSAPP" | "EMAIL" | "SMS",
    payload: NotificationTemplatePayload & { customerId?: string; userId?: string }
  ) {
    const provider = providerFromChannel(channel);
    const rendered = renderNotificationTemplate(payload);
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
        failureReason: "Template delivery failed. Check provider logs.",
      });
      throw error;
    }
  },
};

export * from "./types";
export * from "./providers";
export * from "./templates";
