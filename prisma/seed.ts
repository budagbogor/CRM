import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  BlueprintStageCategory,
  BookingSource,
  BookingStatus,
  NotificationChannel,
  ReminderStatus,
  ReminderType,
  SurveyStatus,
} from "../src/generated/prisma/enums";
import {
  brandIdentity,
  buildBookingConfirmationMessage,
  buildComplaintRecoveryMessage,
  buildNextServiceReminderMessage,
  buildNoShowFollowUpMessage,
  buildPostServiceFollowUpMessage,
  buildThankYouVisitMessage,
  mobengOutlets,
  mobengServiceCategories,
} from "../src/lib/brand";
import { hashPassword } from "../src/lib/password";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const dayMs = 24 * 60 * 60 * 1000;

const daysAgo = (days: number) => new Date(Date.now() - days * dayMs);
const daysFromNow = (days: number) => new Date(Date.now() + days * dayMs);
const atHour = (daysOffset: number, hour: number) => {
  const date = daysFromNow(daysOffset);
  date.setHours(hour, 0, 0, 0);
  return date;
};

const customerSeeds = [
  ["Adit", "Saputra", "RETAIL", "WHATSAPP", "ACTIVE", "Google Maps"],
  ["Rina", "Maharani", "RETAIL", "PHONE", "ACTIVE", "Instagram"],
  ["Bambang", "Setiawan", "RETAIL", "WHATSAPP", "ACTIVE", "Walk-in"],
  ["Novi", "Lestari", "RETAIL", "EMAIL", "AT_RISK", "Referral"],
  ["Dimas", "Prakoso", "RETAIL", "WHATSAPP", "ACTIVE", "TikTok"],
  ["Sari", "Permata", "RETAIL", "SMS", "ACTIVE", "Website"],
  ["Rizky", "Ananda", "RETAIL", "WHATSAPP", "ACTIVE", "Google Maps"],
  ["Yuni", "Kartika", "RETAIL", "PHONE", "AT_RISK", "Walk-in"],
  ["Arif", "Nugraha", "RETAIL", "WHATSAPP", "ACTIVE", "Referral"],
  ["Fitri", "Wulandari", "RETAIL", "EMAIL", "ACTIVE", "Instagram"],
  ["Hendra", "Gunawan", "FLEET", "EMAIL", "ACTIVE", "Sales visit"],
  ["Lina", "Oktaviani", "RETAIL", "WHATSAPP", "ACTIVE", "Website"],
  ["Agus", "Susanto", "INSURANCE", "PHONE", "ACTIVE", "Insurance partner"],
  ["Maya", "Suryani", "RETAIL", "WHATSAPP", "AT_RISK", "Walk-in"],
  ["Budi", "Hartono", "RETAIL", "SMS", "ACTIVE", "Google Maps"],
  ["Tari", "Rahmawati", "RETAIL", "WHATSAPP", "ACTIVE", "Instagram"],
  ["Eko", "Prabowo", "FLEET", "EMAIL", "ACTIVE", "Referral"],
  ["Citra", "Anggraini", "RETAIL", "WHATSAPP", "ACTIVE", "Website"],
  ["Wawan", "Kusuma", "RETAIL", "PHONE", "LOST", "Old database"],
  ["Nadia", "Puspita", "RETAIL", "WHATSAPP", "ACTIVE", "TikTok"],
  ["Fajar", "Ramadhan", "RETAIL", "EMAIL", "ACTIVE", "Google Maps"],
  ["Dewi", "Mulyani", "RETAIL", "WHATSAPP", "ACTIVE", "Referral"],
  ["Slamet", "Widodo", "INSURANCE", "PHONE", "ACTIVE", "Insurance partner"],
  ["Indah", "Safitri", "RETAIL", "WHATSAPP", "ACTIVE", "Website"],
  ["Kevin", "Tan", "FLEET", "EMAIL", "ACTIVE", "Corporate referral"],
] as const;

const vehicleSeeds = [
  [0, "Toyota", "Avanza", 2021, "Silver", "B 2145 SRA", 46200, "Gasoline", "Automatic", 12],
  [0, "Honda", "Brio", 2020, "White", "B 1732 ADF", 31800, "Gasoline", "CVT", 5],
  [1, "Mitsubishi", "Xpander", 2022, "Black", "B 4512 RIN", 28600, "Gasoline", "Automatic", 18],
  [2, "Toyota", "Innova Zenix", 2023, "Grey", "B 8321 BGS", 18450, "Hybrid", "Automatic", 28],
  [3, "Suzuki", "Ertiga", 2019, "Red", "B 9113 NOV", 74500, "Gasoline", "Automatic", -9],
  [4, "Hyundai", "Stargazer", 2023, "Blue", "B 2451 DMP", 15200, "Gasoline", "IVT", 40],
  [5, "Daihatsu", "Sigra", 2021, "Bronze", "B 1288 SPM", 40750, "Gasoline", "Manual", 7],
  [5, "Toyota", "Calya", 2018, "Silver", "B 6007 SPM", 82600, "Gasoline", "Automatic", -2],
  [6, "Honda", "HR-V", 2022, "White", "B 5331 RZA", 27800, "Gasoline", "CVT", 21],
  [7, "Toyota", "Fortuner", 2020, "Black", "B 9087 YNK", 68200, "Diesel", "Automatic", -14],
  [8, "Daihatsu", "Terios", 2021, "Grey", "B 3678 ARF", 38950, "Gasoline", "Automatic", 16],
  [8, "Wuling", "Almaz", 2022, "White", "B 4310 ARF", 22400, "Gasoline", "CVT", 32],
  [9, "Mazda", "CX-5", 2021, "Red", "B 7506 FTR", 35500, "Gasoline", "Automatic", 11],
  [10, "Isuzu", "Traga", 2020, "White", "B 9128 HND", 93100, "Diesel", "Manual", 4],
  [10, "Toyota", "Hilux", 2022, "White", "B 7789 HND", 56200, "Diesel", "Manual", 15],
  [11, "Suzuki", "XL7", 2023, "Khaki", "B 3127 LNA", 19400, "Gasoline", "Automatic", 27],
  [12, "Nissan", "Livina", 2020, "Grey", "B 4802 AGS", 61750, "Gasoline", "Automatic", 10],
  [12, "Honda", "Mobilio", 2018, "Black", "B 5193 AGS", 88400, "Gasoline", "Manual", -12],
  [13, "Toyota", "Yaris Cross", 2024, "White", "B 7321 MYS", 8900, "Hybrid", "CVT", 35],
  [14, "Mitsubishi", "Pajero Sport", 2021, "Black", "B 6610 BDH", 43300, "Diesel", "Automatic", 9],
  [15, "Kia", "Sonet", 2023, "Red", "B 5408 TRI", 14100, "Gasoline", "Automatic", 22],
  [16, "Hino", "Dutro", 2019, "Green", "B 9021 EKO", 121500, "Diesel", "Manual", 5],
  [16, "Isuzu", "MU-X", 2022, "Grey", "B 6487 EKO", 27200, "Diesel", "Automatic", 19],
  [17, "Toyota", "Raize", 2022, "Yellow", "B 4061 CTR", 23900, "Gasoline", "CVT", 30],
  [18, "Suzuki", "Carry", 2017, "Black", "B 1138 WWN", 130400, "Gasoline", "Manual", -30],
  [18, "Daihatsu", "Gran Max", 2016, "Silver", "B 2297 WWN", 148800, "Gasoline", "Manual", -40],
  [19, "Hyundai", "Creta", 2024, "Blue", "B 8740 NDP", 6200, "Gasoline", "IVT", 44],
  [20, "Toyota", "Veloz", 2023, "White", "B 3487 FJR", 17850, "Gasoline", "CVT", 25],
  [21, "Honda", "BR-V", 2022, "Silver", "B 4812 DWI", 29300, "Gasoline", "CVT", 14],
  [21, "Toyota", "Agya", 2021, "Orange", "B 1206 DWI", 41700, "Gasoline", "Automatic", 3],
  [22, "Nissan", "Navara", 2021, "Grey", "B 7934 SLM", 50850, "Diesel", "Automatic", 8],
  [23, "Daihatsu", "Rocky", 2022, "Black", "B 8625 IND", 20100, "Gasoline", "CVT", 23],
  [23, "Wuling", "Confero", 2019, "White", "B 3370 IND", 74650, "Gasoline", "Manual", -6],
  [24, "Toyota", "Hiace", 2020, "Silver", "B 7008 KTN", 98600, "Diesel", "Manual", 6],
  [24, "DFSK", "Gelora", 2022, "White", "B 4120 KTN", 36450, "Electric", "Automatic", 17],
] as const;

const servicePackages = [
  { label: "Servis Mobil - Paket Ringan", labor: 220000, parts: 430000, discount: 0 },
  { label: "Oli Mobil - Ganti Oli + Filter", labor: 180000, parts: 520000, discount: 0 },
  { label: "Ban Mobil - Rotasi dan Nitrogen", labor: 210000, parts: 680000, discount: 0 },
  { label: "Aki - Pengecekan dan Penggantian", labor: 190000, parts: 760000, discount: 25000 },
  { label: "Suspensi - Shockbreaker Check", labor: 340000, parts: 1180000, discount: 50000 },
  { label: "Rem - Brake Service Package", labor: 390000, parts: 960000, discount: 50000 },
  { label: "Busi - Tune Up Package", labor: 250000, parts: 410000, discount: 0 },
  { label: "Radiator - Flush dan Coolant", labor: 280000, parts: 540000, discount: 0 },
  { label: "Spooring & Balancing", labor: 260000, parts: 340000, discount: 0 },
  { label: "Suku Cadang - Paket Peremajaan", labor: 430000, parts: 1350000, discount: 85000 },
  { label: "Additive - Fuel System Cleaning", labor: 170000, parts: 290000, discount: 0 },
];

const complaintPlans = [
  [3, 4, "Kualitas Servis", "Kualitas servis belum memuaskan", "OPEN", "HIGH", 5],
  [7, 9, "Keterlambatan", "Pengerjaan molor dari estimasi", "INVESTIGATING", "MEDIUM", 7],
  [13, 14, "Repeat Job", "Bunyi rem muncul kembali", "WAITING_CUSTOMER", "HIGH", 4],
  [16, 17, "Komunikasi", "Update pekerjaan kurang jelas", "RESOLVED", "MEDIUM", 16],
  [18, 18, "Kualitas Servis", "Kabin masih kotor setelah servis", "OPEN", "LOW", 3],
  [21, 21, "Ketersediaan Part", "Part lambat datang", "CLOSED", "MEDIUM", 32],
  [24, 24, "Klaim Garansi", "Klaim garansi belum selesai", "INVESTIGATING", "CRITICAL", 2],
  [30, 30, "Pengalaman Booking", "Kedatangan tidak langsung ditangani", "RESOLVED", "HIGH", 11],
] as const;

const [
  servisMobil,
  oliMobil,
  banMobil,
  aki,
  suspensi,
  remMobeng,
  busi,
  radiator,
  spooringBalancing,
  sukuCadang,
  additive,
] = mobengServiceCategories;

async function resetDatabase() {
  await prisma.auditLog.deleteMany();
  await prisma.fileUpload.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.automationJob.deleteMany();
  await prisma.customerJourneyEvent.deleteMany();
  await prisma.customerHealthScore.deleteMany();
  await prisma.task.deleteMany();
  await prisma.recoveryAction.deleteMany();
  await prisma.complaintTicket.deleteMany();
  await prisma.surveyResponse.deleteMany();
  await prisma.followUpSurvey.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.serviceItem.deleteMany();
  await prisma.serviceTransaction.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.branch.updateMany({ data: { managerId: null } });
  await prisma.user.updateMany({ data: { branchId: null } });
  await prisma.branch.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.serviceBlueprintStage.deleteMany();
}

async function main() {
  await resetDatabase();

  const [adminRole, ownerRole, managerRole, advisorRole, customerServiceRole, technicianRole, marketingRole] = await Promise.all([
    prisma.role.create({
      data: {
        name: "Admin",
        description: "Full access to CRM configuration and operations.",
      },
    }),
    prisma.role.create({
      data: {
        name: "Owner",
        description: "Executive owner view for dashboard, reports, and branch-wide read visibility.",
      },
    }),
    prisma.role.create({
      data: {
        name: "Manager",
        description: "Owns branch performance, recovery, and branch operations.",
      },
    }),
    prisma.role.create({
      data: {
        name: "Service Advisor",
        description: "Manages customer intake, follow-up, and retention tasks.",
      },
    }),
    prisma.role.create({
      data: {
        name: "Customer Service",
        description: "Handles reminders, follow-ups, and booking action center.",
      },
    }),
    prisma.role.create({
      data: {
        name: "Technician",
        description: "Executes workshop inspection and repair work.",
      },
    }),
    prisma.role.create({
      data: {
        name: "Marketing CRM",
        description: "Owns customer segmentation, campaign planning, and retention reports.",
      },
    }),
  ]);

  const branches = await Promise.all(
    mobengOutlets.map((outlet) =>
      prisma.branch.create({
        data: {
          code: outlet.code,
          name: outlet.name,
          area: outlet.area,
          phone: outlet.phone,
          email: brandIdentity.supportEmail,
          address: outlet.address,
          city: outlet.city,
          province: outlet.province,
          postalCode: outlet.postalCode,
          openingHour: outlet.openingHour,
          closingHour: outlet.closingHour,
          isActive: outlet.isActive,
        },
      })
    )
  );
  const branch = branches[0];

  const defaultPasswordHash = hashPassword("Mobeng123!");
  const [admin, , manager, advisorA, advisorB, advisorC, , technicianA, technicianB] =
    await Promise.all([
      prisma.user.create({
        data: {
          email: "admin@mobeng.co.id",
          name: "Nadia Putri",
          passwordHash: defaultPasswordHash,
          phone: "0812-1000-0001",
          roleId: adminRole.id,
          branchId: branch.id,
        },
      }),
      prisma.user.create({
        data: {
          email: "owner@mobeng.co.id",
          name: "Surya Mahendra",
          passwordHash: defaultPasswordHash,
          phone: "0812-1000-0090",
          roleId: ownerRole.id,
          branchId: branch.id,
        },
      }),
      prisma.user.create({
        data: {
          email: "manager@mobeng.co.id",
          name: "Rafi Pratama",
          passwordHash: defaultPasswordHash,
          phone: "0812-1000-0002",
          roleId: managerRole.id,
          branchId: branch.id,
        },
      }),
      prisma.user.create({
        data: {
          email: "advisor.ayu@mobeng.co.id",
          name: "Ayu Lestari",
          passwordHash: defaultPasswordHash,
          phone: "0812-1000-0003",
          roleId: advisorRole.id,
          branchId: branch.id,
        },
      }),
      prisma.user.create({
        data: {
          email: "advisor.bima@mobeng.co.id",
          name: "Bima Santoso",
          passwordHash: defaultPasswordHash,
          phone: "0812-1000-0004",
          roleId: advisorRole.id,
          branchId: branch.id,
        },
      }),
      prisma.user.create({
        data: {
          email: "advisor.citra@mobeng.co.id",
          name: "Citra Permata",
          passwordHash: defaultPasswordHash,
          phone: "0812-1000-0005",
          roleId: advisorRole.id,
          branchId: branch.id,
        },
      }),
      prisma.user.create({
        data: {
          email: "cs.intan@mobeng.co.id",
          name: "Intan Rahma",
          passwordHash: defaultPasswordHash,
          phone: "0812-1000-0010",
          roleId: customerServiceRole.id,
          branchId: branch.id,
        },
      }),
      prisma.user.create({
        data: {
          email: "tech.dimas@mobeng.co.id",
          name: "Dimas Wijaya",
          passwordHash: defaultPasswordHash,
          phone: "0812-1000-0006",
          roleId: technicianRole.id,
          branchId: branch.id,
        },
      }),
      prisma.user.create({
        data: {
          email: "tech.fajar@mobeng.co.id",
          name: "Fajar Hidayat",
          passwordHash: defaultPasswordHash,
          phone: "0812-1000-0007",
          roleId: technicianRole.id,
          branchId: branch.id,
        },
      }),
      prisma.user.create({
        data: {
          email: "marketing@mobeng.co.id",
          name: "Salsa Nirmala",
          passwordHash: defaultPasswordHash,
          phone: "0812-1000-0011",
          roleId: marketingRole.id,
          branchId: branch.id,
        },
      }),
    ]);

  await prisma.branch.updateMany({
    data: { managerId: manager.id },
  });

  const blueprintStages = await Promise.all(
    [
      {
        code: "LEAD_CAPTURE",
        name: "Lead Capture",
        description:
          "Tangkap kebutuhan pelanggan, keluhan kendaraan, sumber lead, dan slot booking yang diinginkan.",
        stageOrder: 10,
        category: BlueprintStageCategory.PRE_SERVICE,
        ownerRole: "Service Advisor",
        defaultSlaHours: 4,
      },
      {
        code: "BOOKING_CONFIRMATION",
        name: "Booking Confirmation",
        description:
          "Konfirmasi booking, kebutuhan layanan, kendaraan, dan ekspektasi waktu tunggu pelanggan.",
        stageOrder: 20,
        category: BlueprintStageCategory.PRE_SERVICE,
        ownerRole: "Service Advisor",
        defaultSlaHours: 2,
      },
      {
        code: "CHECK_IN",
        name: "Workshop Check-In",
        description:
          "Catat odometer, keluhan pelanggan, approval, dan catatan advisor saat kendaraan tiba.",
        stageOrder: 30,
        category: BlueprintStageCategory.SERVICE,
        ownerRole: "Service Advisor",
        defaultSlaHours: 1,
      },
      {
        code: "SERVICE_EXECUTION",
        name: "Service Execution",
        description:
          "Lacak pengerjaan teknisi, temuan inspeksi, keterlambatan, parts, dan nilai invoice.",
        stageOrder: 40,
        category: BlueprintStageCategory.SERVICE,
        ownerRole: "Technician",
        defaultSlaHours: 24,
      },
      {
        code: "POST_SERVICE_SURVEY",
        name: "Post-Service Survey",
        description:
          "Kirim survey CSAT dan NPS setelah transaksi servis dinyatakan selesai.",
        stageOrder: 50,
        category: BlueprintStageCategory.POST_SERVICE,
        ownerRole: "Service Advisor",
        defaultSlaHours: 24,
      },
      {
        code: "RETENTION_REMINDER",
        name: "Retention Reminder",
        description:
          "Jalankan reminder servis, callback, dan dokumen berdasarkan next best action pelanggan.",
        stageOrder: 60,
        category: BlueprintStageCategory.RETENTION,
        ownerRole: "Service Advisor",
        defaultSlaHours: 72,
      },
      {
        code: "COMPLAINT_RECOVERY",
        name: "Complaint Recovery",
        description:
          "Eskalasi komplain, tetapkan SLA recovery, dan pantau komitmen penyelesaian.",
        stageOrder: 70,
        category: BlueprintStageCategory.RECOVERY,
        ownerRole: "Branch Manager",
        defaultSlaHours: 8,
      },
    ].map((stage) => prisma.serviceBlueprintStage.create({ data: stage }))
  );

  const advisors = [advisorA, advisorB, advisorC];
  const technicians = [technicianA, technicianB];

  const customers = await Promise.all(
    customerSeeds.map(async (seed, index) =>
      prisma.customer.create({
        data: {
          customerNumber: `CUST-${String(index + 1).padStart(4, "0")}`,
          branchId: branches[index % branches.length].id,
          assignedAdvisorId: advisors[index % advisors.length].id,
          firstName: seed[0],
          lastName: seed[1],
          email: `${seed[0].toLowerCase()}.${seed[1].toLowerCase()}@mobeng-demo.co.id`,
          phone: `0812${String(90699681 + index).padStart(8, "0")}`,
          type: seed[2],
          status: seed[4],
          preferredChannel: seed[3],
          acquisitionSource: seed[5],
          companyName:
            seed[2] === "FLEET"
              ? `PT ${seed[1]} Armada Nusantara`
              : seed[2] === "INSURANCE"
                ? `Asuransi ${seed[1]} Proteksi`
                : null,
          consentMarketing: index % 4 !== 0,
          lastContactedAt: daysAgo((index % 11) + 1),
          notes:
            index % 5 === 0
              ? "Sering meminta simulasi biaya servis sebelum approval."
              : index % 7 === 0
                ? "Lebih nyaman dihubungi pagi hari melalui WhatsApp."
                : null,
        },
      })
    )
  );

  const vehicles = await Promise.all(
    vehicleSeeds.map(async (seed, index) =>
      prisma.vehicle.create({
        data: {
          customerId: customers[seed[0]].id,
          branchId: customers[seed[0]].branchId,
          vin: `ARCRM${String(index + 1).padStart(11, "0")}`,
          licensePlate: seed[5],
          make: seed[1],
          model: seed[2],
          year: seed[3],
          color: seed[4],
          odometer: seed[6],
          fuelType: seed[7],
          transmission: seed[8],
          lastServiceDate: daysAgo(Math.max(2, 30 - seed[9])),
          nextServiceDueDate: daysFromNow(seed[9]),
          nextServiceOdometer: seed[6] + 5000,
        },
      })
    )
  );

  const transactionPlans = buildTransactionPlans(vehicles.length);
  const services = await Promise.all(
    transactionPlans.map((plan, index) => {
      const vehicle = vehicles[plan.vehicleIndex];
      const customer = customers[vehicleSeeds[plan.vehicleIndex][0]];
      const packageSeed = servicePackages[index % servicePackages.length];
      const subtotal = packageSeed.labor + packageSeed.parts - packageSeed.discount;
      const tax = Math.round(subtotal * 0.11);
      const total = subtotal + tax;

      return prisma.serviceTransaction.create({
        data: {
          serviceNumber: `SVC-2026-${String(index + 1).padStart(4, "0")}`,
          customerId: customer.id,
          vehicleId: vehicle.id,
          branchId: vehicle.branchId,
          advisorId: advisors[index % advisors.length].id,
          technicianName: technicians[index % technicians.length].name,
          openedAt: daysAgo(plan.openedDaysAgo),
          closedAt:
            plan.status === "COMPLETED"
              ? daysAgo(Math.max(plan.openedDaysAgo - 1, 0))
              : null,
          odometerIn: Math.max(1000, vehicleSeeds[plan.vehicleIndex][6] - plan.odometerOffset),
          status: plan.status,
          totalLaborAmount: String(packageSeed.labor),
          totalPartsAmount: String(packageSeed.parts),
          discountAmount: String(packageSeed.discount),
          taxAmount: String(tax),
          totalAmount: String(total),
          paymentMethod: plan.status === "COMPLETED" ? "QRIS" : null,
          notes: `${packageSeed.label} - dataset demo ${brandIdentity.appName}.`,
          items: {
            create: [
              {
                type: "LABOR",
                name: packageSeed.label,
                quantity: 1,
                unitPrice: String(packageSeed.labor),
                lineTotal: String(packageSeed.labor),
                laborHours: String((1.4 + (index % 4) * 0.6).toFixed(2)),
                technicianName: technicians[index % technicians.length].name,
              },
              {
                type: "PART",
                name: "Oli, filter, dan consumables",
                sku: `PART-${String(index + 1).padStart(4, "0")}`,
                quantity: 1,
                unitPrice: String(packageSeed.parts),
                lineTotal: String(packageSeed.parts),
                technicianName: technicians[index % technicians.length].name,
              },
            ],
          },
        },
      });
    })
  );

  const surveys = await Promise.all(
    buildSurveyPlans().map((plan, index) => {
      const transaction = services[plan.transactionIndex];
      const customer = customers[plan.customerIndex];
      const sentBy = advisors[index % advisors.length];
      return prisma.followUpSurvey.create({
        data: {
          customerId: customer.id,
          serviceTransactionId: transaction.id,
          sentById: sentBy.id,
          status: plan.status,
          channel: plan.channel,
          sentAt: daysAgo(plan.sentDaysAgo),
          completedAt:
            plan.status === "COMPLETED" ? daysAgo(Math.max(plan.sentDaysAgo - 1, 0)) : null,
          score: plan.status === "COMPLETED" ? plan.score : null,
          npsScore: plan.status === "COMPLETED" ? plan.npsScore : null,
          comments: plan.comments,
          responses:
            plan.status === "COMPLETED"
              ? {
                  create: [
                    {
                      questionKey: "overall_satisfaction",
                      questionText: "Bagaimana kualitas servis hari ini?",
                      questionType: "RATING",
                      ratingValue: plan.score,
                    },
                    {
                      questionKey: "staff_service",
                      questionText: "Bagaimana pelayanan service advisor?",
                      questionType: "RATING",
                      ratingValue: Math.min(5, plan.score + 1),
                    },
                    {
                      questionKey: "facility_rating",
                      questionText: "Bagaimana kenyamanan ruang tunggu?",
                      questionType: "RATING",
                      ratingValue: Math.max(2, Math.min(5, plan.score + (index % 2))),
                    },
                    {
                      questionKey: "notes",
                      questionText: "Catatan pelanggan",
                      questionType: "TEXT",
                      textValue: plan.comments,
                    },
                  ],
                }
              : undefined,
        },
      });
    })
  );

  const complaints = await Promise.all(
    complaintPlans.map(async (plan, index) => {
      const transaction = services[plan[0]];
      const vehicle = vehicles[plan[1]];
      const customer = customers[vehicleSeeds[plan[1]][0]];
      return prisma.complaintTicket.create({
        data: {
          ticketNumber: `CMP-2026-${String(index + 1).padStart(4, "0")}`,
          customerId: customer.id,
          vehicleId: vehicle.id,
          serviceTransactionId: transaction.id,
          branchId: vehicle.branchId,
          assignedToId:
            plan[5] === "CRITICAL"
              ? manager.id
              : advisors[index % advisors.length].id,
          status: plan[4],
          priority: plan[5],
          category: plan[2],
          subject: plan[3],
          description: `${plan[3]} pada ${vehicle.make} ${vehicle.model}. Customer meminta tindak lanjut cepat.`,
          openedAt: daysAgo(plan[6]),
          resolvedAt:
            plan[4] === "RESOLVED" || plan[4] === "CLOSED"
              ? daysAgo(Math.max(plan[6] - 3, 0))
              : null,
          resolutionSummary:
            plan[4] === "RESOLVED" || plan[4] === "CLOSED"
              ? "Recovery call selesai dan customer menyetujui solusi."
              : null,
        },
      });
    })
  );

  await Promise.all(
    complaints.map((complaint, index) =>
      prisma.recoveryAction.create({
        data: {
          complaintTicketId: complaint.id,
          ownerId: complaint.assignedToId ?? manager.id,
          actionType: index % 2 === 0 ? "Customer callback" : "Reinspection",
          status:
            complaint.status === "RESOLVED" || complaint.status === "CLOSED"
              ? "COMPLETED"
              : index % 3 === 0
                ? "IN_PROGRESS"
                : "PLANNED",
          description:
            complaint.status === "RESOLVED" || complaint.status === "CLOSED"
              ? "Customer sudah menerima penyelesaian dan monitoring ditutup."
              : "Hubungi customer, siapkan tindakan recovery, dan konfirmasi booking ulang jika dibutuhkan.",
          promisedAt: daysFromNow(index % 3 === 0 ? -1 : 1 + (index % 2)),
          completedAt:
            complaint.status === "RESOLVED" || complaint.status === "CLOSED"
              ? daysAgo(Math.max((index + 1) * 2, 1))
              : null,
          outcome:
            complaint.status === "RESOLVED" || complaint.status === "CLOSED"
              ? "Customer menerima recovery dan bersedia kembali servis."
              : null,
          followUpRequired: complaint.status !== "CLOSED",
        },
      })
    )
  );

  await Promise.all(
    complaints
      .filter(
        (complaint) =>
          complaint.status === "OPEN" ||
          complaint.status === "INVESTIGATING" ||
          complaint.status === "WAITING_CUSTOMER"
      )
      .map((complaint, index) =>
        prisma.task.create({
          data: {
            title: `Follow-up ${complaint.ticketNumber}`,
            description: complaint.subject,
            priority: index % 2 === 0 ? "HIGH" : "MEDIUM",
            dueAt: daysFromNow((index % 3) + 1),
            customerId: complaint.customerId,
            vehicleId: complaint.vehicleId,
            complaintTicketId: complaint.id,
            assignedToId: complaint.assignedToId ?? advisorA.id,
            createdById: manager.id,
          },
        })
      )
  );

  const reminderPlans = buildReminderPlans();
  const reminders = await Promise.all(
    reminderPlans.map((plan, index) =>
      prisma.reminder.create({
        data: {
          customerId: customers[plan.customerIndex].id,
          vehicleId: plan.vehicleIndex === null ? null : vehicles[plan.vehicleIndex].id,
          branchId:
            plan.vehicleIndex === null
              ? customers[plan.customerIndex].branchId
              : vehicles[plan.vehicleIndex].branchId,
          assignedToId: advisors[index % advisors.length].id,
          type: plan.type,
          status: plan.status,
          title: plan.title,
          notes: plan.notes,
          dueAt: atHour(plan.daysOffset, 10 + (index % 5)),
          completedAt: plan.status === "COMPLETED" ? daysAgo(1 + (index % 4)) : null,
        },
      })
    )
  );

  const bookingPlans = buildBookingPlans();
  const bookings = await Promise.all(
    bookingPlans.map((plan, index) => {
      const start = atHour(plan.daysOffset, plan.hour);
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

      return prisma.booking.create({
        data: {
          bookingNumber: `BKG-2026-${String(index + 1).padStart(4, "0")}`,
          customerId: customers[plan.customerIndex].id,
          vehicleId: vehicles[plan.vehicleIndex].id,
          branchId: vehicles[plan.vehicleIndex].branchId,
          advisorId: advisors[index % advisors.length].id,
          status: plan.status,
          source: plan.source,
          scheduledStart: start,
          scheduledEnd: end,
          requestedServices: [plan.requestedService],
          notes: plan.notes,
          checkedInAt:
            plan.status === "ARRIVED" || plan.status === "IN_SERVICE" || plan.status === "COMPLETED"
              ? new Date(start.getTime() + 10 * 60 * 1000)
              : null,
          cancellationReason:
            plan.status === "CANCELLED" ? "Pelanggan menjadwalkan ulang." : null,
        },
      });
    })
  );

  await Promise.all(
    customers.map((customer, index) =>
      prisma.customerJourneyEvent.create({
        data: {
          customerId: customer.id,
          eventType: "LEAD_CREATED",
          eventAt: daysAgo(210 - index * 3),
          title: "Lead customer tercatat",
          description: `Customer masuk dari kanal ${customer.acquisitionSource ?? "manual"}.`,
          source: "seed",
          createdById: customer.assignedAdvisorId,
        },
      })
    )
  );

  await Promise.all(
    bookings.map((booking) =>
      prisma.customerJourneyEvent.create({
        data: {
          customerId: booking.customerId,
          vehicleId: booking.vehicleId,
          eventType: "BOOKING_CREATED",
          eventAt: booking.createdAt,
          title: "Booking dibuat",
          description: `Booking ${booking.bookingNumber} dibuat melalui ${booking.source.toLowerCase()}.`,
          source: "seed",
          createdById: booking.advisorId,
        },
      })
    )
  );

  const latestCompletedByCustomer = new Map<string, (typeof services)[number]>();
  services
    .filter((service) => service.status === "COMPLETED")
    .forEach((service) => {
      const existing = latestCompletedByCustomer.get(service.customerId);
      if (!existing || existing.openedAt < service.openedAt) {
        latestCompletedByCustomer.set(service.customerId, service);
      }
    });

  await Promise.all(
    [...latestCompletedByCustomer.values()].map((service) =>
      prisma.customerJourneyEvent.create({
        data: {
          customerId: service.customerId,
          vehicleId: service.vehicleId,
          serviceTransactionId: service.id,
          eventType: "SERVICE_COMPLETED",
          eventAt: service.closedAt ?? service.openedAt,
          title: "Servis selesai",
          description: `${service.serviceNumber} sudah closed dan siap follow-up retention.`,
          source: "seed",
          createdById: service.advisorId,
        },
      })
    )
  );

  await Promise.all(
    surveys.map((survey) =>
      prisma.customerJourneyEvent.create({
        data: {
          customerId: survey.customerId,
          serviceTransactionId: survey.serviceTransactionId,
          eventType:
            survey.status === "COMPLETED" ? "SURVEY_COMPLETED" : "SURVEY_SENT",
          eventAt: survey.completedAt ?? survey.sentAt ?? survey.createdAt,
          title:
            survey.status === "COMPLETED"
              ? "Survey follow-up selesai"
              : "Survey follow-up dikirim",
          description:
            survey.status === "COMPLETED"
              ? `Skor survey ${survey.score ?? "-"} dengan NPS ${survey.npsScore ?? "-"}`
              : "Survey menunggu respon customer.",
          source: "seed",
          createdById: survey.sentById,
        },
      })
    )
  );

  await Promise.all(
    complaints.map((complaint) =>
      prisma.customerJourneyEvent.create({
        data: {
          customerId: complaint.customerId,
          vehicleId: complaint.vehicleId,
          serviceTransactionId: complaint.serviceTransactionId,
          eventType: "COMPLAINT_OPENED",
          eventAt: complaint.openedAt,
          title: "Complaint dibuka",
          description: complaint.subject,
          source: "seed",
          createdById: complaint.assignedToId ?? manager.id,
        },
      })
    )
  );

  await Promise.all(
    reminders.slice(0, 25).map((reminder) =>
      prisma.customerJourneyEvent.create({
        data: {
          customerId: reminder.customerId,
          vehicleId: reminder.vehicleId,
          eventType: "REMINDER_CREATED",
          eventAt: reminder.createdAt,
          title: "Reminder retention dibuat",
          description: reminder.title,
          source: "seed",
          createdById: reminder.assignedToId,
        },
      })
    )
  );

  const thankYouVisit = buildThankYouVisitMessage({
    customerName: `${customers[0].firstName} ${customers[0].lastName}`,
    vehicleLabel: `${vehicles[0].make} ${vehicles[0].model}`,
    branchName: branches.find((item) => item.id === vehicles[0].branchId)?.name ?? branch.name,
  });
  const postServiceFollowUp = buildPostServiceFollowUpMessage({
    customerName: `${customers[0].firstName} ${customers[0].lastName}`,
    vehicleLabel: `${vehicles[0].make} ${vehicles[0].model}`,
    branchName: branches.find((item) => item.id === vehicles[0].branchId)?.name ?? branch.name,
  });
  const complaintRecovery = buildComplaintRecoveryMessage({
    customerName: `${customers[3].firstName} ${customers[3].lastName}`,
    ticketNumber: complaints[0].ticketNumber,
    branchName: branches.find((item) => item.id === complaints[0].branchId)?.name ?? branch.name,
  });
  const nextServiceReminder = buildNextServiceReminderMessage({
    customerName: `${customers[0].firstName} ${customers[0].lastName}`,
    vehicleLabel: `${vehicles[0].make} ${vehicles[0].model}`,
    branchName: branches.find((item) => item.id === reminders[0].branchId)?.name ?? branch.name,
    dueLabel: reminders[0].dueAt.toLocaleDateString("id-ID"),
  });
  const bookingConfirmation = buildBookingConfirmationMessage({
    customerName: `${customers[0].firstName} ${customers[0].lastName}`,
    bookingNumber: bookings[0].bookingNumber,
    branchName: branches.find((item) => item.id === bookings[0].branchId)?.name ?? branch.name,
    scheduledStart: bookings[0].scheduledStart,
    requestedServices: bookings[0].requestedServices,
  });
  const noShowBooking =
    bookings.find((item) => item.status === BookingStatus.NO_SHOW) ?? bookings[0];
  const noShowFollowUp = buildNoShowFollowUpMessage({
    customerName: `${customers.find((item) => item.id === noShowBooking.customerId)?.firstName ?? "Pelanggan"} ${customers.find((item) => item.id === noShowBooking.customerId)?.lastName ?? ""}`.trim(),
    bookingNumber: noShowBooking.bookingNumber,
    branchName: branches.find((item) => item.id === noShowBooking.branchId)?.name ?? branch.name,
  });

  await Promise.all([
    prisma.notificationLog.create({
      data: {
        customerId: customers[0].id,
        userId: advisorA.id,
        channel: "WHATSAPP",
        status: "DELIVERED",
        recipient: customers[0].phone,
        subject: thankYouVisit.subject,
        message: thankYouVisit.message,
        sentAt: daysAgo(5),
        deliveredAt: daysAgo(5),
        metadata: { serviceTransactionId: services[0].id, template: "thank_you_visit" },
      },
    }),
    prisma.notificationLog.create({
      data: {
        customerId: customers[0].id,
        userId: advisorA.id,
        channel: "WHATSAPP",
        status: "QUEUED",
        recipient: customers[0].phone,
        subject: postServiceFollowUp.subject,
        message: postServiceFollowUp.message,
        metadata: { surveyId: surveys[0].id, template: "h_plus_3_post_service_follow_up" },
      },
    }),
    prisma.notificationLog.create({
      data: {
        customerId: complaints[0].customerId,
        userId: complaints[0].assignedToId ?? manager.id,
        channel: "WHATSAPP",
        status: "QUEUED",
        recipient: customers[3].phone,
        subject: complaintRecovery.subject,
        message: complaintRecovery.message,
        metadata: { ticketId: complaints[0].id, template: "complaint_recovery" },
      },
    }),
    prisma.notificationLog.create({
      data: {
        customerId: reminders[0].customerId,
        userId: reminders[0].assignedToId,
        channel: "WHATSAPP",
        status: "QUEUED",
        recipient: customers[0].phone,
        subject: nextServiceReminder.subject,
        message: nextServiceReminder.message,
        metadata: { reminderId: reminders[0].id, template: "next_service_reminder" },
      },
    }),
    prisma.notificationLog.create({
      data: {
        customerId: bookings[0].customerId,
        userId: bookings[0].advisorId,
        channel: "WHATSAPP",
        status: "DELIVERED",
        recipient: customers[0].phone,
        subject: bookingConfirmation.subject,
        message: bookingConfirmation.message,
        sentAt: daysAgo(1),
        deliveredAt: daysAgo(1),
        metadata: { bookingId: bookings[0].id, template: "booking_confirmation" },
      },
    }),
    prisma.notificationLog.create({
      data: {
        customerId: noShowBooking.customerId,
        userId: noShowBooking.advisorId,
        channel: "WHATSAPP",
        status: "QUEUED",
        recipient:
          customers.find((item) => item.id === noShowBooking.customerId)?.phone ??
          customers[0].phone,
        subject: noShowFollowUp.subject,
        message: noShowFollowUp.message,
        metadata: { bookingId: noShowBooking.id, template: "no_show_follow_up" },
      },
    }),
  ]);

  await createHealthScores(customers, services, complaints, bookings, reminders);

  await Promise.all([
    prisma.automationJob.create({
      data: {
        name: "Pengirim survey pasca servis Mobeng",
        jobType: "send_post_service_survey",
        status: "ACTIVE",
        trigger: "EVENT_BASED",
        triggerConfig: { eventType: "SERVICE_COMPLETED", delayHours: 24 },
        blueprintStageId: blueprintStages[4].id,
        ownerId: admin.id,
        nextRunAt: atHour(1, 9),
      },
    }),
    prisma.automationJob.create({
      data: {
        name: "Antrian reminder servis Mobeng",
        jobType: "next_service_due_reminder",
        status: "ACTIVE",
        trigger: "SCHEDULED",
        triggerConfig: { cadence: "daily", rule: "due_date_14_days" },
        blueprintStageId: blueprintStages[5].id,
        ownerId: advisorB.id,
        nextRunAt: atHour(0, 18),
      },
    }),
    prisma.automationJob.create({
      data: {
        name: "Monitor SLA komplain Mobeng",
        jobType: "complaint_sla_watchdog",
        status: "ACTIVE",
        trigger: "SCHEDULED",
        triggerConfig: { cadence: "hourly", thresholdHours: 8 },
        blueprintStageId: blueprintStages[6].id,
        ownerId: manager.id,
        nextRunAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    }),
  ]);

  console.log("Seed completed:");
  console.log("- 25 customers");
  console.log("- 35 vehicles");
  console.log("- 40 service transactions");
  console.log("- 10 follow-up surveys");
  console.log("- 8 complaint tickets");
  console.log("- 20 reminders");
  console.log("- 12 bookings");
  console.log("- customer journey events for each customer");
  console.log("- service blueprint stages");
}

function buildTransactionPlans(vehicleCount: number) {
  const plans: Array<{
    vehicleIndex: number;
    status: "OPEN" | "IN_PROGRESS" | "COMPLETED";
    openedDaysAgo: number;
    odometerOffset: number;
  }> = [];

  for (let index = 0; index < vehicleCount; index += 1) {
    plans.push({
      vehicleIndex: index,
      status:
        index < 28 ? "COMPLETED" : index < 32 ? "IN_PROGRESS" : "OPEN",
      openedDaysAgo: index < 28 ? 6 + index * 4 : 1 + (index % 5),
      odometerOffset: 350 + (index % 5) * 180,
    });
  }

  for (let index = 0; index < 5; index += 1) {
    plans.push({
      vehicleIndex: index,
      status: "COMPLETED",
      openedDaysAgo: 170 + index * 15,
      odometerOffset: 6200 + index * 900,
    });
  }

  return plans;
}

function buildSurveyPlans() {
  return [
    {
      transactionIndex: 0,
      customerIndex: 0,
      status: SurveyStatus.COMPLETED,
      channel: NotificationChannel.WHATSAPP,
      sentDaysAgo: 5,
      score: 5,
      npsScore: 10,
      comments: "Servis cepat, advisor komunikatif, ruang tunggu bersih.",
    },
    {
      transactionIndex: 1,
      customerIndex: 0,
      status: SurveyStatus.COMPLETED,
      channel: NotificationChannel.WHATSAPP,
      sentDaysAgo: 8,
      score: 4,
      npsScore: 8,
      comments: "Pengerjaan rapi, hanya spare part sedikit lama.",
    },
    {
      transactionIndex: 2,
      customerIndex: 1,
      status: SurveyStatus.COMPLETED,
      channel: NotificationChannel.EMAIL,
      sentDaysAgo: 10,
      score: 5,
      npsScore: 9,
      comments: "Estimasi biaya dan waktu jelas sejak awal.",
    },
    {
      transactionIndex: 4,
      customerIndex: 3,
      status: SurveyStatus.COMPLETED,
      channel: NotificationChannel.WHATSAPP,
      sentDaysAgo: 12,
      score: 2,
      npsScore: 3,
      comments: "Masih ada suara di rem belakang setelah kendaraan diambil.",
    },
    {
      transactionIndex: 6,
      customerIndex: 5,
      status: SurveyStatus.COMPLETED,
      channel: NotificationChannel.SMS,
      sentDaysAgo: 15,
      score: 4,
      npsScore: 8,
      comments: "Overall bagus, hanya antrean kasir sedikit panjang.",
    },
    {
      transactionIndex: 9,
      customerIndex: 7,
      status: SurveyStatus.COMPLETED,
      channel: NotificationChannel.WHATSAPP,
      sentDaysAgo: 18,
      score: 3,
      npsScore: 6,
      comments: "Mobil selesai sesuai janji, tapi update progres kurang sering.",
    },
    {
      transactionIndex: 12,
      customerIndex: 10,
      status: SurveyStatus.COMPLETED,
      channel: NotificationChannel.EMAIL,
      sentDaysAgo: 20,
      score: 5,
      npsScore: 9,
      comments: "Fleet report lengkap dan mudah dipahami.",
    },
    {
      transactionIndex: 16,
      customerIndex: 12,
      status: SurveyStatus.COMPLETED,
      channel: NotificationChannel.SMS,
      sentDaysAgo: 23,
      score: 2,
      npsScore: 2,
      comments: "Masih menunggu update klaim dan kendaraan belum benar-benar tuntas.",
    },
    {
      transactionIndex: 19,
      customerIndex: 15,
      status: SurveyStatus.SENT,
      channel: NotificationChannel.WHATSAPP,
      sentDaysAgo: 2,
      score: 0,
      npsScore: 0,
      comments: "Survey menunggu jawaban customer.",
    },
    {
      transactionIndex: 23,
      customerIndex: 18,
      status: SurveyStatus.SENT,
      channel: NotificationChannel.EMAIL,
      sentDaysAgo: 1,
      score: 0,
      npsScore: 0,
      comments: "Reminder survey kedua dijadwalkan.",
    },
  ] as const;
}

function buildReminderPlans() {
  return [
    {
      customerIndex: 0,
      vehicleIndex: 0,
      type: ReminderType.SERVICE_DUE,
      title: `Panggil Avanza untuk ${servisMobil} 50.000 km`,
      daysOffset: -5,
      status: ReminderStatus.PENDING,
      notes: "Tawarkan slot Sabtu pagi.",
    },
    {
      customerIndex: 0,
      vehicleIndex: 1,
      type: ReminderType.FOLLOW_UP,
      title: `Follow-up ${oliMobil} Brio`,
      daysOffset: 2,
      status: ReminderStatus.PENDING,
      notes: "Pastikan hasil cleaning dan balancing sesuai harapan.",
    },
    {
      customerIndex: 1,
      vehicleIndex: 2,
      type: ReminderType.SERVICE_DUE,
      title: `Xpander due ${servisMobil} 30.000 km`,
      daysOffset: 6,
      status: ReminderStatus.PENDING,
      notes: "Arahkan ke paket servis berkala plus spooring.",
    },
    {
      customerIndex: 3,
      vehicleIndex: 4,
      type: ReminderType.CALLBACK,
      title: `Callback komplain ${remMobeng} Ertiga`,
      daysOffset: 1,
      status: ReminderStatus.PENDING,
      notes: "Konfirmasi noise rem setelah recheck.",
    },
    {
      customerIndex: 5,
      vehicleIndex: 6,
      type: ReminderType.DOCUMENT_RENEWAL,
      title: "Pengingat STNK Sigra",
      daysOffset: 19,
      status: ReminderStatus.PENDING,
      notes: "Sisipkan penawaran servis ringan.",
    },
    {
      customerIndex: 5,
      vehicleIndex: 7,
      type: ReminderType.SERVICE_DUE,
      title: `Calya overdue ${servisMobil}`,
      daysOffset: -2,
      status: ReminderStatus.PENDING,
      notes: "Prioritaskan karena sudah lewat due date.",
    },
    {
      customerIndex: 7,
      vehicleIndex: 9,
      type: ReminderType.FOLLOW_UP,
      title: "Minta update customer Fortuner",
      daysOffset: 3,
      status: ReminderStatus.SNOOZED,
      notes: "Tunggu hasil approval suku cadang.",
    },
    {
      customerIndex: 8,
      vehicleIndex: 10,
      type: ReminderType.SERVICE_DUE,
      title: `Terios 40.000 km ${spooringBalancing}`,
      daysOffset: 8,
      status: ReminderStatus.PENDING,
      notes: "Coba tawarkan booking siang hari.",
    },
    {
      customerIndex: 8,
      vehicleIndex: 11,
      type: ReminderType.PAYMENT,
      title: `Invoice Almaz ${sukuCadang} belum lunas`,
      daysOffset: 4,
      status: ReminderStatus.PENDING,
      notes: "Hubungi bagian finance customer.",
    },
    {
      customerIndex: 10,
      vehicleIndex: 13,
      type: ReminderType.CALLBACK,
      title: "Fleet Traga inspection recap",
      daysOffset: 2,
      status: ReminderStatus.PENDING,
      notes: "Jadwalkan review maintenance fleet.",
    },
    {
      customerIndex: 10,
      vehicleIndex: 14,
      type: ReminderType.SERVICE_DUE,
      title: `Hilux due ${servisMobil}`,
      daysOffset: 12,
      status: ReminderStatus.PENDING,
      notes: "Tawarkan paket fleet inspection.",
    },
    {
      customerIndex: 12,
      vehicleIndex: 16,
      type: ReminderType.FOLLOW_UP,
      title: `Follow-up ${busi} Livina insurance claim`,
      daysOffset: 1,
      status: ReminderStatus.PENDING,
      notes: "Cek kelengkapan dokumen customer.",
    },
    {
      customerIndex: 12,
      vehicleIndex: 17,
      type: ReminderType.SERVICE_DUE,
      title: `Mobilio overdue ${servisMobil}`,
      daysOffset: -7,
      status: ReminderStatus.PENDING,
      notes: "Customer sensitif pada biaya, siapkan promo.",
    },
    {
      customerIndex: 13,
      vehicleIndex: 18,
      type: ReminderType.FOLLOW_UP,
      title: "Survey Maya perlu review",
      daysOffset: 0,
      status: ReminderStatus.PENDING,
      notes: "Jika skor rendah, arahkan ke complaint recovery.",
    },
    {
      customerIndex: 14,
      vehicleIndex: 19,
      type: ReminderType.SERVICE_DUE,
      title: "Pajero Sport after-service callback",
      daysOffset: 9,
      status: ReminderStatus.COMPLETED,
      notes: "Callback sudah dilakukan dan customer puas.",
    },
    {
      customerIndex: 15,
      vehicleIndex: 20,
      type: ReminderType.SERVICE_DUE,
      title: `Kia Sonet next ${servisMobil}`,
      daysOffset: 14,
      status: ReminderStatus.PENDING,
      notes: "Tawarkan pick-up drop jika weekday.",
    },
    {
      customerIndex: 16,
      vehicleIndex: 21,
      type: ReminderType.CALLBACK,
      title: "Fleet Dutro complaint callback",
      daysOffset: 1,
      status: ReminderStatus.PENDING,
      notes: "Manager ikut dalam panggilan.",
    },
    {
      customerIndex: 18,
      vehicleIndex: 24,
      type: ReminderType.FOLLOW_UP,
      title: "Carry comeback offer",
      daysOffset: 5,
      status: ReminderStatus.PENDING,
      notes: "Customer lost, coba win-back service voucher.",
    },
    {
      customerIndex: 20,
      vehicleIndex: 27,
      type: ReminderType.SERVICE_DUE,
      title: `Veloz 20.000 km ${oliMobil}`,
      daysOffset: 11,
      status: ReminderStatus.COMPLETED,
      notes: "Sudah berhasil dikonversi ke booking.",
    },
    {
      customerIndex: 23,
      vehicleIndex: 32,
      type: ReminderType.SERVICE_DUE,
      title: `Confero overdue ${servisMobil}`,
      daysOffset: -3,
      status: ReminderStatus.PENDING,
      notes: "Hubungi melalui WhatsApp dan telepon.",
    },
  ];
}

function buildBookingPlans() {
  return [
    {
      customerIndex: 0,
      vehicleIndex: 0,
      status: BookingStatus.CONFIRMED,
      source: BookingSource.WEBSITE,
      daysOffset: 0,
      hour: 9,
      requestedService: servisMobil,
      notes: "Customer menunggu di lounge.",
    },
    {
      customerIndex: 1,
      vehicleIndex: 2,
      status: BookingStatus.REQUESTED,
      source: BookingSource.WHATSAPP,
      daysOffset: 0,
      hour: 11,
      requestedService: suspensi,
      notes: "Masih menunggu konfirmasi advisor.",
    },
    {
      customerIndex: 3,
      vehicleIndex: 4,
      status: BookingStatus.ARRIVED,
      source: BookingSource.PHONE,
      daysOffset: 0,
      hour: 13,
      requestedService: remMobeng,
      notes: "Complaint follow-up booking.",
    },
    {
      customerIndex: 5,
      vehicleIndex: 6,
      status: BookingStatus.IN_SERVICE,
      source: BookingSource.WALK_IN,
      daysOffset: 0,
      hour: 15,
      requestedService: spooringBalancing,
      notes: "Walk-in dari customer existing.",
    },
    {
      customerIndex: 7,
      vehicleIndex: 9,
      status: BookingStatus.CONFIRMED,
      source: BookingSource.PHONE,
      daysOffset: 1,
      hour: 10,
      requestedService: servisMobil,
      notes: "Customer minta estimasi selesai sebelum jam 4.",
    },
    {
      customerIndex: 8,
      vehicleIndex: 11,
      status: BookingStatus.REQUESTED,
      source: BookingSource.WEBSITE,
      daysOffset: 2,
      hour: 9,
      requestedService: oliMobil,
      notes: "Lead baru dari website.",
    },
    {
      customerIndex: 10,
      vehicleIndex: 13,
      status: BookingStatus.COMPLETED,
      source: BookingSource.PHONE,
      daysOffset: -1,
      hour: 10,
      requestedService: sukuCadang,
      notes: "Pekerjaan selesai kemarin.",
    },
    {
      customerIndex: 12,
      vehicleIndex: 16,
      status: BookingStatus.CANCELLED,
      source: BookingSource.PHONE,
      daysOffset: 3,
      hour: 14,
      requestedService: radiator,
      notes: "Customer jadwalkan ulang minggu depan.",
    },
    {
      customerIndex: 14,
      vehicleIndex: 19,
      status: BookingStatus.NO_SHOW,
      source: BookingSource.WHATSAPP,
      daysOffset: -2,
      hour: 8,
      requestedService: servisMobil,
      notes: "No show tanpa konfirmasi.",
    },
    {
      customerIndex: 16,
      vehicleIndex: 21,
      status: BookingStatus.CONFIRMED,
      source: BookingSource.MOBILE_APP,
      daysOffset: 4,
      hour: 10,
      requestedService: additive,
      notes: "Corporate appointment.",
    },
    {
      customerIndex: 20,
      vehicleIndex: 27,
      status: BookingStatus.REQUESTED,
      source: BookingSource.WHATSAPP,
      daysOffset: 5,
      hour: 13,
      requestedService: banMobil,
      notes: "Converted from reminder flow.",
    },
    {
      customerIndex: 23,
      vehicleIndex: 31,
      status: BookingStatus.CONFIRMED,
      source: BookingSource.WEBSITE,
      daysOffset: 6,
      hour: 9,
      requestedService: aki,
      notes: "Customer baru pertama kali ke cabang ini.",
    },
  ];
}

async function createHealthScores(
  customers: Array<{ id: string; status: string }>,
  services: Array<{
    customerId: string;
    status: string;
    totalAmount: unknown;
  }>,
  complaints: Array<{
    customerId: string;
    status: string;
  }>,
  bookings: Array<{
    customerId: string;
    status: string;
  }>,
  reminders: Array<{
    customerId: string;
    status: string;
  }>
) {
  await Promise.all(
    customers.map((customer, index) => {
      const customerServices = services.filter(
        (service) =>
          service.customerId === customer.id && service.status === "COMPLETED"
      );
      const customerComplaints = complaints.filter(
        (complaint) => complaint.customerId === customer.id
      );
      const customerBookings = bookings.filter(
        (booking) => booking.customerId === customer.id
      );
      const customerReminders = reminders.filter(
        (reminder) =>
          reminder.customerId === customer.id && reminder.status === "PENDING"
      );
      const lifetimeValue = customerServices.reduce(
        (sum, service) => sum + Number(service.totalAmount),
        0
      );
      const openComplaints = customerComplaints.filter((complaint) =>
        ["OPEN", "INVESTIGATING", "WAITING_CUSTOMER"].includes(complaint.status)
      ).length;
      const missedBookings = customerBookings.filter(
        (booking) => booking.status === "NO_SHOW"
      ).length;
      const totalVisits = customerServices.length;

      let score =
        82 +
        totalVisits * 4 +
        Math.min(6, customerReminders.length * 2) -
        openComplaints * 18 -
        missedBookings * 12 -
        (customer.status === "AT_RISK" ? 16 : 0) -
        (customer.status === "LOST" ? 34 : 0) -
        (index % 5 === 0 ? 4 : 0);

      score = Math.max(18, Math.min(96, Math.round(score)));

      const band =
        score >= 85
          ? "EXCELLENT"
          : score >= 70
            ? "HEALTHY"
            : score >= 55
              ? "WATCH"
              : score >= 35
                ? "AT_RISK"
                : "LOST";

      const nextBestAction =
        openComplaints > 0
          ? "Selesaikan complaint aktif dan konfirmasi kepuasan customer."
          : band === "AT_RISK" || band === "LOST"
            ? "Jadwalkan callback advisor dan tawarkan booking recovery."
            : band === "WATCH"
              ? "Kirim reminder servis berikutnya dengan penawaran booking."
              : "Pertahankan cadence servis berkala dan follow-up loyalitas.";

      return prisma.customerHealthScore.create({
        data: {
          customerId: customer.id,
          score,
          band,
          lifetimeValue: String(lifetimeValue),
          totalVisits,
          missedBookings,
          openComplaints,
          churnRiskPercent: String(Math.max(4, 100 - score)),
          nextBestAction,
        },
      });
    })
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
