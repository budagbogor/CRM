"use server";

import { actionError, actionOk } from "@/lib/form-data";
import { assertPermission, requireSessionUser } from "@/lib/auth";
import { notificationService } from "@/services/notifications";

export async function sendTestNotificationAction() {
  await assertPermission("settings", "write");
  const user = await requireSessionUser();
  const recipient = user.email ?? "test@mobeng.local";

  try {
    await notificationService.sendMessage("EMAIL", {
      to: recipient,
      subject: "Mobeng CRM Test Notification",
      message: "Ini adalah test notification dari halaman Settings Mobeng CRM.",
      userId: user.id,
      metadata: { test: true, source: "settings" },
    });
    return actionOk(`Test notification queued ke ${recipient}.`);
  } catch (error) {
    return actionError(
      error instanceof Error ? error.message : "Gagal mengirim test notification."
    );
  }
}

