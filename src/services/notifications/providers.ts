import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { renderNotificationTemplate } from "./templates";
import type {
  NotificationPayload,
  NotificationProvider,
  NotificationResult,
  NotificationTemplatePayload,
} from "./types";

function buildMockResult(channel: "whatsapp" | "email" | "sms", recipient: string): NotificationResult {
  return {
    providerMessageId: `mock_${channel}_${Buffer.from(recipient).toString("hex").slice(0, 12)}`,
    status: "queued",
    raw: { provider: "mock" },
  };
}

class BaseMockProvider implements NotificationProvider {
  channel: "whatsapp" | "email" | "sms";
  constructor(channel: "whatsapp" | "email" | "sms") {
    this.channel = channel;
  }
  async sendMessage(payload: NotificationPayload): Promise<NotificationResult> {
    return buildMockResult(this.channel, payload.to);
  }
  async sendTemplate(payload: NotificationTemplatePayload): Promise<NotificationResult> {
    return buildMockResult(this.channel, payload.to);
  }
}

export class MockWhatsappProvider extends BaseMockProvider {
  constructor() {
    super("whatsapp");
  }
}

export class MockEmailProvider extends BaseMockProvider {
  constructor() {
    super("email");
  }
}

export class MockSmsProvider extends BaseMockProvider {
  constructor() {
    super("sms");
  }
}

export class WhatsAppCloudApiProvider implements NotificationProvider {
  channel = "whatsapp" as const;

  private getConfig() {
    const { WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_BUSINESS_ACCOUNT_ID, WHATSAPP_API_VERSION } = env;
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_BUSINESS_ACCOUNT_ID) {
      throw new Error("WhatsApp Cloud API is not fully configured.");
    }
    return { WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_API_VERSION };
  }

  async sendTextMessage(payload: NotificationPayload): Promise<NotificationResult> {
    const cfg = this.getConfig();
    const requestId = `wa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const endpoint = `https://graph.facebook.com/${cfg.WHATSAPP_API_VERSION}/${cfg.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const body = {
      messaging_product: "whatsapp",
      to: payload.to,
      type: "text",
      text: { body: payload.message },
    };
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
      },
      body: JSON.stringify(body),
    });
    const raw = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      const errorMessage = String((raw.error as { message?: string } | undefined)?.message ?? "WhatsApp request failed.");
      const retrySafe = response.status === 409 || errorMessage.toLowerCase().includes("duplicate");
      if (retrySafe) {
        return { providerMessageId: requestId, status: "queued", raw };
      }
      throw new Error(errorMessage);
    }
    const providerMessageId =
      (raw.messages as Array<{ id?: string }> | undefined)?.[0]?.id ?? requestId;
    return { providerMessageId, status: "queued", raw };
  }

  async sendTemplateMessage(payload: NotificationTemplatePayload): Promise<NotificationResult> {
    const cfg = this.getConfig();
    const requestId = `wa_tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const endpoint = `https://graph.facebook.com/${cfg.WHATSAPP_API_VERSION}/${cfg.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const rendered = renderNotificationTemplate(payload);
    const body = {
      messaging_product: "whatsapp",
      to: payload.to,
      type: "text",
      text: { body: rendered.message },
    };
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
      },
      body: JSON.stringify(body),
    });
    const raw = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      const errorMessage = String((raw.error as { message?: string } | undefined)?.message ?? "WhatsApp template request failed.");
      const retrySafe = response.status === 409 || errorMessage.toLowerCase().includes("duplicate");
      if (retrySafe) {
        return { providerMessageId: requestId, status: "queued", raw };
      }
      throw new Error(errorMessage);
    }
    const providerMessageId =
      (raw.messages as Array<{ id?: string }> | undefined)?.[0]?.id ?? requestId;
    return { providerMessageId, status: "queued", raw };
  }

  async sendMessage(payload: NotificationPayload): Promise<NotificationResult> {
    return this.sendTextMessage(payload);
  }

  async sendTemplate(payload: NotificationTemplatePayload): Promise<NotificationResult> {
    return this.sendTemplateMessage(payload);
  }
}

export class SmtpEmailProvider implements NotificationProvider {
  channel = "email" as const;
  async sendMessage(payload: NotificationPayload): Promise<NotificationResult> {
    if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASS) {
      throw new Error("SMTP provider is not fully configured.");
    }
    logger.info("SMTP placeholder send", { to: payload.to, subject: payload.subject ?? "No subject" });
    return { providerMessageId: `smtp_${Date.now()}`, status: "queued", raw: { provider: "smtp_placeholder" } };
  }
  async sendTemplate(payload: NotificationTemplatePayload): Promise<NotificationResult> {
    const rendered = renderNotificationTemplate(payload);
    return this.sendMessage({ to: payload.to, subject: rendered.subject, message: rendered.message, metadata: payload.metadata });
  }
}

export class ResendEmailProvider implements NotificationProvider {
  channel = "email" as const;
  async sendMessage(payload: NotificationPayload): Promise<NotificationResult> {
    if (!env.RESEND_API_KEY) {
      throw new Error("Resend provider is not configured.");
    }
    logger.info("Resend placeholder send", { to: payload.to, subject: payload.subject ?? "No subject" });
    return { providerMessageId: `resend_${Date.now()}`, status: "queued", raw: { provider: "resend_placeholder" } };
  }
  async sendTemplate(payload: NotificationTemplatePayload): Promise<NotificationResult> {
    const rendered = renderNotificationTemplate(payload);
    return this.sendMessage({ to: payload.to, subject: rendered.subject, message: rendered.message, metadata: payload.metadata });
  }
}
