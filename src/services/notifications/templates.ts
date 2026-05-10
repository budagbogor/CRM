import { brandIdentity } from "@/lib/brand";
import type { NotificationTemplateKey, NotificationTemplatePayload } from "./types";

type TemplateRenderer = (variables?: Record<string, string | number>) => {
  subject: string;
  message: string;
};

const templates: Record<NotificationTemplateKey, TemplateRenderer> = {
  thank_you_visit: (v) => ({
    subject: "Terima kasih sudah servis di Mobeng",
    message: `Halo ${v?.customerName ?? "Pelanggan"}, terima kasih telah servis di ${v?.branchName ?? brandIdentity.appName}.`,
  }),
  h_plus_3_follow_up: (v) => ({
    subject: "Follow-up H+3 Servis Mobil Anda",
    message: `Halo ${v?.customerName ?? "Pelanggan"}, bagaimana performa kendaraan setelah servis ${v?.serviceName ?? ""}?`,
  }),
  complaint_recovery: (v) => ({
    subject: "Update Penanganan Komplain Anda",
    message: `Halo ${v?.customerName ?? "Pelanggan"}, komplain Anda (${v?.ticketNumber ?? "-"}) sedang kami prioritaskan.`,
  }),
  next_service_reminder: (v) => ({
    subject: "Pengingat Servis Berikutnya",
    message: `Halo ${v?.customerName ?? "Pelanggan"}, kendaraan Anda dijadwalkan servis pada ${v?.dueDate ?? "jadwal berikutnya"}.`,
  }),
  booking_confirmation: (v) => ({
    subject: "Konfirmasi Booking Servis",
    message: `Booking Anda untuk ${v?.serviceDate ?? "-"} telah kami terima. Sampai jumpa di ${v?.branchName ?? brandIdentity.appName}.`,
  }),
  overdue_service: (v) => ({
    subject: "Servis Kendaraan Anda Sudah Overdue",
    message: `Halo ${v?.customerName ?? "Pelanggan"}, kendaraan ${v?.vehicle ?? ""} sudah melewati jadwal servis. Yuk booking sekarang.`,
  }),
};

export function renderNotificationTemplate(payload: NotificationTemplatePayload) {
  const renderer = templates[payload.templateKey];
  if (!renderer) {
    return {
      subject: `Mobeng CRM: ${payload.templateKey}`,
      message: `Template ${payload.templateKey}`,
    };
  }
  return renderer(payload.variables);
}

