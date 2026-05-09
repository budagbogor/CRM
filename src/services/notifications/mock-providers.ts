import type {
  NotificationPayload,
  NotificationProvider,
  NotificationResult,
  NotificationTemplatePayload,
} from "./types";

function buildMockResult(
  channel: "whatsapp" | "email" | "sms",
  recipient: string
): NotificationResult {
  return {
    providerMessageId: `mock_${channel}_${Buffer.from(recipient).toString("hex").slice(0, 10)}`,
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

