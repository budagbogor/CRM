import { brandIdentity } from "@/lib/brand";
import { prisma } from "@/lib/prisma";
import { PreferredChannel, ReminderStatus, ServiceStatus, SurveyStatus } from "@/generated/prisma/enums";
import type {
  AiInsightProvider,
  CampaignRecommendation,
  ComplaintInsight,
  CustomerInsight,
  InsightConfidence,
} from "./types";

function daysBetween(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function toConfidence(score: number): InsightConfidence {
  if (score >= 80) return "HIGH";
  if (score >= 55) return "MEDIUM";
  return "LOW";
}

function normalizeChannel(channel: PreferredChannel, noResponseCount: number) {
  if (noResponseCount >= 2) return "PHONE";
  if (channel === PreferredChannel.WHATSAPP) return "WHATSAPP";
  if (channel === PreferredChannel.EMAIL) return "EMAIL";
  if (channel === PreferredChannel.SMS) return "SMS";
  return "PHONE";
}

function nextBestActionFromRules(input: {
  openComplaint: number;
  overdueService: boolean;
  noResponseReminders: number;
  isFleet: boolean;
}) {
  if (input.openComplaint > 0) return "Prioritaskan recovery complaint";
  if (input.overdueService) return "Tawarkan booking servis oli";
  if (input.noResponseReminders > 1) return "Hubungi via WhatsApp hari ini";
  if (input.isFleet) return "Follow up customer fleet";
  return "Kirim promo spooring balancing";
}

export class RuleBasedMockAiProvider implements AiInsightProvider {
  async generateCustomerInsight(customerId: string): Promise<CustomerInsight> {
    const now = new Date();
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        branch: true,
        vehicles: true,
        reminders: true,
        complaints: true,
        surveys: true,
        serviceTransactions: true,
      },
    });
    if (!customer) {
      throw new Error("Customer not found.");
    }

    const completedTransactions = customer.serviceTransactions
      .filter((transaction) => transaction.status === ServiceStatus.COMPLETED)
      .sort((a, b) => b.openedAt.getTime() - a.openedAt.getTime());
    const lastTransactionDate = completedTransactions[0]?.openedAt;
    const longGapSinceLastTransaction =
      !lastTransactionDate || daysBetween(lastTransactionDate, now) > 150;

    const overdueService = customer.vehicles.some(
      (vehicle) => vehicle.nextServiceDueDate && vehicle.nextServiceDueDate < now
    );
    const noResponseReminders = customer.reminders.filter(
      (reminder) => reminder.status === ReminderStatus.SNOOZED
    ).length;
    const openComplaint = customer.complaints.filter((complaint) =>
      ["OPEN", "INVESTIGATING", "WAITING_CUSTOMER"].includes(complaint.status)
    ).length;
    const lowSurveyRating = customer.surveys.some(
      (survey) =>
        survey.status === SurveyStatus.COMPLETED &&
        survey.score !== null &&
        survey.score <= 2
    );

    let churnRiskScore = 20;
    const reasons: string[] = [];

    if (overdueService) {
      churnRiskScore += 20;
      reasons.push("Servis kendaraan overdue");
    }
    if (noResponseReminders > 0) {
      churnRiskScore += Math.min(20, noResponseReminders * 8);
      reasons.push("Reminder tidak direspons");
    }
    if (openComplaint > 0) {
      churnRiskScore += 25;
      reasons.push("Masih ada komplain terbuka");
    }
    if (lowSurveyRating) {
      churnRiskScore += 20;
      reasons.push("Skor survey rendah");
    }
    if (longGapSinceLastTransaction) {
      churnRiskScore += 15;
      reasons.push("Jeda transaksi terlalu lama");
    }

    churnRiskScore = Math.min(100, churnRiskScore);
    const confidence = toConfidence(churnRiskScore);
    const nextBestAction = nextBestActionFromRules({
      openComplaint,
      overdueService,
      noResponseReminders,
      isFleet: customer.type === "FLEET",
    });
    const recommendedReminderChannel = normalizeChannel(
      customer.preferredChannel,
      noResponseReminders
    );
    const campaign = await this.generateCampaignRecommendation(customerId);

    return {
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`,
      churnRiskScore,
      churnRiskReason: reasons.join(", ") || "Profil pelanggan masih sehat",
      nextBestAction,
      recommendedReminderChannel,
      suggestedServiceCampaign: campaign.campaignName,
      complaintRiskFlag: openComplaint > 0 || lowSurveyRating,
      confidence,
      sourceData: [
        `${customer.vehicles.length} kendaraan`,
        `${customer.reminders.length} reminder`,
        `${openComplaint} komplain terbuka`,
        `${completedTransactions.length} transaksi selesai`,
      ],
    };
  }

  async generateComplaintSummary(complaintId: string): Promise<ComplaintInsight> {
    const complaint = await prisma.complaintTicket.findUnique({
      where: { id: complaintId },
      include: { customer: true, vehicle: true, recoveryActions: true },
    });
    if (!complaint) {
      throw new Error("Complaint not found.");
    }
    const hasRecovery = complaint.recoveryActions.length > 0;
    const summary = `${complaint.ticketNumber}: ${complaint.subject} (${complaint.priority})`;
    const recommendedAction = hasRecovery
      ? "Pantau SLA recovery dan konfirmasi pelanggan"
      : "Buat recovery task dan hubungi pelanggan";

    return {
      complaintId: complaint.id,
      summary,
      recommendedAction,
      confidence: hasRecovery ? "HIGH" : "MEDIUM",
      sourceData: [
        `Status ${complaint.status}`,
        `Kategori ${complaint.category}`,
        `Pelanggan ${complaint.customer.firstName} ${complaint.customer.lastName}`,
      ],
    };
  }

  async suggestNextBestAction(customerId: string): Promise<string> {
    const insight = await this.generateCustomerInsight(customerId);
    return insight.nextBestAction;
  }

  async generateCampaignRecommendation(customerId: string): Promise<CampaignRecommendation> {
    const now = new Date();
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        branch: true,
        vehicles: true,
        serviceTransactions: true,
      },
    });
    if (!customer) throw new Error("Customer not found.");

    const highestMileage = Math.max(0, ...customer.vehicles.map((vehicle) => vehicle.odometer));
    const oldestVehicleYear = Math.min(now.getFullYear(), ...customer.vehicles.map((vehicle) => vehicle.year));
    const isOverdue = customer.vehicles.some(
      (vehicle) => vehicle.nextServiceDueDate && vehicle.nextServiceDueDate < now
    );
    const totalCompleted = customer.serviceTransactions.filter(
      (service) => service.status === ServiceStatus.COMPLETED
    ).length;

    let campaignName = "Promo Spooring & Balancing";
    let reason = "Maintenance preventif untuk menjaga kenyamanan berkendara.";

    if (isOverdue) {
      campaignName = "Campaign Booking Servis Berkala";
      reason = "Kendaraan pelanggan melewati due service date.";
    } else if (highestMileage >= 80000) {
      campaignName = "Campaign Paket Suku Cadang + Additive";
      reason = "Odometer tinggi, risiko wear and tear meningkat.";
    } else if (now.getFullYear() - oldestVehicleYear >= 7) {
      campaignName = "Campaign Peremajaan Kendaraan";
      reason = "Usia kendaraan sudah matang dan butuh preventive replacement.";
    } else if (customer.type === "FLEET") {
      campaignName = "Campaign Fleet Service Contract";
      reason = "Pelanggan fleet cocok untuk kontrak servis berkala.";
    } else if (totalCompleted <= 1) {
      campaignName = `Welcome Back ${brandIdentity.appName}`;
      reason = "Riwayat servis masih minim, perlu aktivasi kunjungan ulang.";
    }

    return {
      customerId: customer.id,
      campaignName,
      reason: `${reason} Branch: ${customer.branch.name}.`,
      confidence: isOverdue || highestMileage >= 80000 ? "HIGH" : "MEDIUM",
      sourceData: [
        `Mileage tertinggi ${highestMileage} km`,
        `Usia kendaraan ${now.getFullYear() - oldestVehicleYear} tahun`,
        `Completed transaksi ${totalCompleted}`,
      ],
    };
  }
}

