export type StatusTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple";

export function toneForStatus(status: string): StatusTone {
  const normalized = status.toLowerCase().replaceAll("_", " ");

  if (
    ["active", "completed", "confirmed", "resolved", "excellent", "healthy", "delivered", "arrived"].includes(
      normalized
    )
  ) {
    return "success";
  }

  if (
    ["pending", "requested", "watch", "in progress", "investigating", "snoozed", "in service", "partial"].includes(
      normalized
    )
  ) {
    return "warning";
  }

  if (
    ["at risk", "open", "high", "critical", "failed", "cancelled", "no show", "lost"].includes(
      normalized
    )
  ) {
    return "danger";
  }

  if (["fleet", "website", "phone", "whatsapp", "email", "sms"].includes(normalized)) {
    return "info";
  }

  return "neutral";
}
