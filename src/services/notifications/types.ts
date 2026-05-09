export type NotificationPayload = {
  to: string;
  subject?: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export type NotificationTemplatePayload = {
  to: string;
  templateKey: string;
  variables?: Record<string, string | number>;
  metadata?: Record<string, unknown>;
};

export type NotificationResult = {
  providerMessageId: string;
  status: "queued" | "sent" | "failed";
  raw?: Record<string, unknown>;
};

export type NotificationProviderName = "whatsapp" | "email" | "sms";

export interface NotificationProvider {
  channel: NotificationProviderName;
  sendMessage(payload: NotificationPayload): Promise<NotificationResult>;
  sendTemplate(payload: NotificationTemplatePayload): Promise<NotificationResult>;
}

export type DeliveryLogInput = {
  channel: "WHATSAPP" | "EMAIL" | "SMS";
  recipient: string;
  subject?: string;
  message: string;
  providerMessageId?: string;
  metadata?: Record<string, unknown>;
  customerId?: string;
  userId?: string;
  status: "QUEUED" | "SENT" | "FAILED";
  failureReason?: string;
};

