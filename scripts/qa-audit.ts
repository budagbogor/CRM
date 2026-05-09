import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { ReminderType, ServiceStatus, SurveyStatus } from "../src/generated/prisma/enums";
import { createPostTransactionRetentionFlow, handleSurveyResponse } from "../src/services/retention";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  const requiredOutlets = [
    "Mobeng A.Yani Malang",
    "Mobeng BSD",
    "Mobeng Cilengsi",
    "Mobeng Cinere",
    "Mobeng Cipondoh",
    "Mobeng Citraland",
    "Mobeng Duren Sawit",
    "Mobeng Gading Serpong",
    "Mobeng Galuh Mas",
    "Mobeng Hankam",
    "Mobeng Harapan Indah",
    "Mobeng Jababeka",
    "Mobeng Jati Asih",
    "Mobeng Jatibening",
    "Mobeng Jemursari",
    "Mobeng Karawaci",
    "Mobeng Katamso",
    "Mobeng Kopo Bandung",
    "Mobeng Kupang",
    "Mobeng Lenteng Agung",
    "Mobeng Merr",
    "Mobeng Mulyosari",
    "Mobeng Mustika Jaya",
    "Mobeng Pondok Betung",
    "Mobeng Sunter",
    "Mobeng Tole Iskandar",
  ];

  const [outlets, counts] = await Promise.all([
    prisma.branch.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    Promise.all([
      prisma.customer.count(),
      prisma.vehicle.count(),
      prisma.serviceTransaction.count(),
      prisma.followUpSurvey.count(),
      prisma.complaintTicket.count(),
      prisma.reminder.count(),
      prisma.booking.count(),
    ]),
  ]);

  const outletNames = outlets.map((item) => item.name);
  const missingOutlets = requiredOutlets.filter((name) => !outletNames.includes(name));
  const extraOutlets = outletNames.filter((name) => !requiredOutlets.includes(name));

  const [orphanVehicles, orphanTransactions, orphanComplaints, orphanBookings, noBranchReminders] =
    await Promise.all([
      prisma.vehicle.count({ where: { branchId: { notIn: outlets.map((item) => item.id) } } }),
      prisma.serviceTransaction.count({
        where: { branchId: { notIn: outlets.map((item) => item.id) } },
      }),
      prisma.complaintTicket.count({
        where: { branchId: { notIn: outlets.map((item) => item.id) } },
      }),
      prisma.booking.count({ where: { branchId: { notIn: outlets.map((item) => item.id) } } }),
      prisma.reminder.count({ where: { branchId: null } }),
    ]);

  const completedTransaction = await prisma.serviceTransaction.findFirst({
    where: { status: ServiceStatus.COMPLETED },
    orderBy: { updatedAt: "desc" },
  });

  if (!completedTransaction) {
    throw new Error("No completed transaction found for retention flow check.");
  }

  const flowResult = await createPostTransactionRetentionFlow(completedTransaction.id, {
    db: prisma,
    now: new Date(),
  });

  const hPlus3Reminder = await prisma.reminder.findFirst({
    where: {
      customerId: completedTransaction.customerId,
      type: ReminderType.FOLLOW_UP,
      title: { contains: "H+3" },
    },
  });

  const pendingSurvey = await prisma.followUpSurvey.findFirst({
    where: { status: SurveyStatus.SENT },
    orderBy: { createdAt: "asc" },
  });

  let badSurveyOutcome: string | null = null;
  if (pendingSurvey) {
    const surveyResult = await handleSurveyResponse(
      pendingSurvey.id,
      {
        npsScore: 1,
        comments: "Audit QA: trigger complaint from low quality score.",
        responses: [
          {
            questionKey: "overall_satisfaction",
            questionText: "Kualitas servis",
            questionType: "RATING",
            ratingValue: 1,
          },
          {
            questionKey: "staff_service",
            questionText: "Pelayanan service advisor",
            questionType: "RATING",
            ratingValue: 2,
          },
        ],
      },
      { db: prisma, now: new Date() }
    );
    badSurveyOutcome = surveyResult.outcome;
  }

  const reminderForConversion = await prisma.reminder.findFirst({
    where: { vehicleId: { not: null }, branchId: { not: null } },
    orderBy: { createdAt: "desc" },
  });

  const report = {
    outlets: {
      total: outlets.length,
      missing: missingOutlets,
      extra: extraOutlets,
    },
    demoCounts: {
      customers: counts[0],
      vehicles: counts[1],
      transactions: counts[2],
      surveys: counts[3],
      complaints: counts[4],
      reminders: counts[5],
      bookings: counts[6],
    },
    dataIntegrity: {
      orphanVehicles,
      orphanTransactions,
      orphanComplaints,
      orphanBookings,
      noBranchReminders,
    },
    flowChecks: {
      transactionFlowResult:
        "alreadyExists" in flowResult ? "already_exists" : "created",
      hasFollowUpReminder: Boolean(hPlus3Reminder),
      badSurveyOutcome,
      hasReminderConvertibleToBooking: Boolean(reminderForConversion),
    },
  };

  console.log(JSON.stringify(report, null, 2));
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
