import { prisma } from "@/lib/prisma";
import {
  AutomationJobStatus,
  ComplaintPriority,
  ComplaintStatus,
  CustomerStatus,
  JourneyEventType,
  RecoveryStatus,
  ReminderStatus,
  ReminderType,
  ServiceStatus,
  SurveyStatus,
  TaskPriority,
  TaskStatus,
} from "@/generated/prisma/enums";
import {
  buildComplaintRecoveryMessage,
  buildPostServiceFollowUpMessage,
  buildThankYouVisitMessage,
} from "@/lib/brand";
import { enqueueJob } from "@/services/jobs";
import { assertFound, assertValid } from "./errors";
import {
  addDays,
  subDays,
  calculateHealthScoreFromRules,
  calculateNextServiceProjection,
  daysBetween,
  getQualityRating,
  isBadSurveyResponse,
} from "./rules";
import type {
  HandleSurveyResponseInput,
  NextServiceProjection,
  RetentionDb,
} from "./types";
import type { PrismaClient } from "@/generated/prisma/client";

type RetentionServiceOptions = {
  db?: PrismaClient;
  now?: Date;
};

function getDb(options?: RetentionServiceOptions) {
  return options?.db ?? prisma;
}

function getNow(options?: RetentionServiceOptions) {
  return options?.now ?? new Date();
}

async function nextTicketNumber(db: RetentionDb) {
  const count = await db.complaintTicket.count();
  return `CMP-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
}

export async function calculateNextService(
  vehicleId: string,
  options?: RetentionServiceOptions
): Promise<NextServiceProjection> {
  assertValid(vehicleId.trim().length > 0, "vehicleId is required.");

  const db = getDb(options);
  const now = getNow(options);
  const vehicle = assertFound(
    await db.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        serviceTransactions: {
          orderBy: { openedAt: "asc" },
          select: { openedAt: true, odometerIn: true },
        },
      },
    }),
    `Vehicle ${vehicleId} was not found.`
  );

  const projection = calculateNextServiceProjection({
    currentOdometer: vehicle.odometer,
    nextServiceOdometer: vehicle.nextServiceOdometer,
    lastServiceDate: vehicle.lastServiceDate,
    serviceHistory: vehicle.serviceTransactions,
    now,
  });

  await db.vehicle.update({
    where: { id: vehicle.id },
    data: {
      nextServiceDueDate: projection.estimatedNextServiceDate,
      nextServiceOdometer: projection.nextServiceOdometer,
    },
  });

  return projection;
}

export async function createPostTransactionRetentionFlow(
  transactionId: string,
  options?: RetentionServiceOptions
) {
  assertValid(transactionId.trim().length > 0, "transactionId is required.");

  const db = getDb(options);
  const now = getNow(options);

  return db.$transaction(async (tx) => {
    const transaction = assertFound(
      await tx.serviceTransaction.findUnique({
        where: { id: transactionId },
        include: { customer: true, vehicle: true, advisor: true, branch: true },
      }),
      `Service transaction ${transactionId} was not found.`
    );

    assertValid(
      transaction.status === ServiceStatus.COMPLETED,
      "Retention flow can only be created after a completed transaction."
    );

    const followUpAt = addDays(transaction.closedAt ?? now, 3);
    const vehicleLabel = `${transaction.vehicle.make} ${transaction.vehicle.model}`;
    const thankYouMessage = buildThankYouVisitMessage({
      customerName: transaction.customer.firstName,
      vehicleLabel,
      branchName: transaction.branch.name,
    });
    const followUpMessage = buildPostServiceFollowUpMessage({
      customerName: transaction.customer.firstName,
      vehicleLabel,
      branchName: transaction.branch.name,
    });
    const existingAutomationJob = await tx.automationJob.findFirst({
      where: {
        jobType: "SEND_FOLLOW_UP_H3",
        status: AutomationJobStatus.ACTIVE,
        payload: {
          path: ["serviceTransactionId"],
          equals: transaction.id,
        },
      },
    });

    if (existingAutomationJob) {
      return {
        alreadyExists: true as const,
        automationJob: existingAutomationJob,
      };
    }

    const journeyEvent = await tx.customerJourneyEvent.create({
      data: {
        customerId: transaction.customerId,
        vehicleId: transaction.vehicleId,
        serviceTransactionId: transaction.id,
        eventType: JourneyEventType.SERVICE_COMPLETED,
        eventAt: transaction.closedAt ?? now,
        title: "Transaksi servis selesai",
        description: `Workflow retention Mobeng dimulai untuk ${transaction.serviceNumber}.`,
        source: "retention_service",
        createdById: transaction.advisorId,
      },
    });

    const reminder = await tx.reminder.create({
      data: {
        customerId: transaction.customerId,
        vehicleId: transaction.vehicleId,
        branchId: transaction.branchId,
        assignedToId: transaction.advisorId,
        type: ReminderType.FOLLOW_UP,
        status: ReminderStatus.PENDING,
        title: `Follow-up H+3 ${transaction.customer.firstName} ${transaction.customer.lastName}`,
        notes: followUpMessage.message,
        dueAt: followUpAt,
      },
    });

    await tx.customerJourneyEvent.create({
      data: {
        customerId: transaction.customerId,
        vehicleId: transaction.vehicleId,
        serviceTransactionId: transaction.id,
        eventType: JourneyEventType.REMINDER_CREATED,
        eventAt: now,
        title: "Reminder follow-up H+3 dibuat",
        source: "retention_service",
        metadata: { reminderId: reminder.id },
        createdById: transaction.advisorId,
      },
    });

    await enqueueJob({
      type: "SEND_THANK_YOU",
      payload: {
        serviceTransactionId: transaction.id,
        customerId: transaction.customerId,
        userId: transaction.advisorId,
        to: transaction.customer.phone,
        subject: thankYouMessage.subject,
        message: thankYouMessage.message,
      },
      scheduledAt: now,
      ownerId: transaction.advisorId,
      name: `Thank You ${transaction.serviceNumber}`,
      maxAttempts: 3,
    });

    const followUpJob = await enqueueJob({
      type: "SEND_FOLLOW_UP_H3",
      payload: {
        serviceTransactionId: transaction.id,
        customerId: transaction.customerId,
        vehicleId: transaction.vehicleId,
        userId: transaction.advisorId,
        to: transaction.customer.phone,
        subject: followUpMessage.subject,
        message: followUpMessage.message,
      },
      scheduledAt: followUpAt,
      ownerId: transaction.advisorId,
      name: `H+3 ${transaction.serviceNumber}`,
      maxAttempts: 3,
    });

    const dueDate = transaction.vehicle.nextServiceDueDate ?? addDays(now, 180);

    // Cadence H-30
    const h30Date = subDays(dueDate, 30);
    if (h30Date > now) {
      await enqueueJob({
        type: "SEND_SERVICE_REMINDER",
        payload: {
          serviceTransactionId: transaction.id,
          customerId: transaction.customerId,
          vehicleId: transaction.vehicleId,
          userId: transaction.advisorId,
          to: transaction.customer.phone,
          subject: "Persiapan Servis 1 Bulan Lagi",
          message: `Halo ${transaction.customer.firstName}, ${vehicleLabel} akan memasuki jadwal servis dalam 30 hari lagi. Silakan booking jadwal Anda di Mobeng.`,
          cadenceLabel: "H-30",
        },
        scheduledAt: h30Date,
        ownerId: transaction.advisorId,
        name: `Service Reminder H-30 ${transaction.serviceNumber}`,
        maxAttempts: 3,
      });
    }

    // Cadence H-14
    const h14Date = subDays(dueDate, 14);
    if (h14Date > now) {
      await enqueueJob({
        type: "SEND_SERVICE_REMINDER",
        payload: {
          serviceTransactionId: transaction.id,
          customerId: transaction.customerId,
          vehicleId: transaction.vehicleId,
          userId: transaction.advisorId,
          to: transaction.customer.phone,
          subject: "Persiapan Servis 2 Minggu Lagi",
          message: `Halo ${transaction.customer.firstName}, mengingatkan kembali bahwa ${vehicleLabel} dijadwalkan servis dalam 14 hari ke depan.`,
          cadenceLabel: "H-14",
        },
        scheduledAt: h14Date,
        ownerId: transaction.advisorId,
        name: `Service Reminder H-14 ${transaction.serviceNumber}`,
        maxAttempts: 3,
      });
    }

    // Cadence H-7
    const h7Date = subDays(dueDate, 7);
    if (h7Date > now) {
      await enqueueJob({
        type: "SEND_SERVICE_REMINDER",
        payload: {
          serviceTransactionId: transaction.id,
          customerId: transaction.customerId,
          vehicleId: transaction.vehicleId,
          userId: transaction.advisorId,
          to: transaction.customer.phone,
          subject: "Persiapan Servis 1 Minggu Lagi",
          message: `Halo ${transaction.customer.firstName}, ${vehicleLabel} dijadwalkan servis dalam 7 hari lagi. Jangan lupa booking jadwal Anda di Mobeng.`,
          cadenceLabel: "H-7",
        },
        scheduledAt: h7Date,
        ownerId: transaction.advisorId,
        name: `Service Reminder H-7 ${transaction.serviceNumber}`,
        maxAttempts: 3,
      });
    }

    // Cadence H-1
    const h1Date = subDays(dueDate, 1);
    if (h1Date > now) {
      await enqueueJob({
        type: "SEND_SERVICE_REMINDER",
        payload: {
          serviceTransactionId: transaction.id,
          customerId: transaction.customerId,
          vehicleId: transaction.vehicleId,
          userId: transaction.advisorId,
          to: transaction.customer.phone,
          subject: "Besok Jadwal Servis Anda",
          message: `Halo ${transaction.customer.firstName}, besok adalah jadwal ideal untuk servis ${vehicleLabel} di Mobeng. Kami tunggu kedatangannya.`,
          cadenceLabel: "H-1",
        },
        scheduledAt: h1Date,
        ownerId: transaction.advisorId,
        name: `Service Reminder H-1 ${transaction.serviceNumber}`,
        maxAttempts: 3,
      });
    }

    // Exact Due Date (H-0)
    await enqueueJob({
      type: "SEND_SERVICE_REMINDER",
      payload: {
        serviceTransactionId: transaction.id,
        customerId: transaction.customerId,
        vehicleId: transaction.vehicleId,
        userId: transaction.advisorId,
        to: transaction.customer.phone,
        subject: "Waktunya Servis Berkala",
        message: `Hari ini adalah jadwal servis ${vehicleLabel}. Pastikan performa tetap optimal dengan servis di Mobeng.`,
        cadenceLabel: "H-0",
      },
      scheduledAt: dueDate,
      ownerId: transaction.advisorId,
      name: `Service Reminder H-0 ${transaction.serviceNumber}`,
      maxAttempts: 3,
    });

    // Overdue H+7
    await enqueueJob({
      type: "SEND_OVERDUE_REMINDER",
      payload: {
        serviceTransactionId: transaction.id,
        customerId: transaction.customerId,
        vehicleId: transaction.vehicleId,
        userId: transaction.advisorId,
        to: transaction.customer.phone,
        subject: "Jadwal Servis Terlewati",
        message: `Servis ${vehicleLabel} sudah melewati jadwal lebih dari seminggu. Segera hubungi Mobeng untuk menjaga garansi dan performa.`,
        cadenceLabel: "H+7",
      },
      scheduledAt: addDays(dueDate, 7),
      ownerId: transaction.advisorId,
      name: `Overdue Reminder H+7 ${transaction.serviceNumber}`,
      maxAttempts: 3,
    });

    await enqueueJob({
      type: "RECALCULATE_HEALTH_SCORE",
      payload: {
        customerId: transaction.customerId,
      },
      scheduledAt: now,
      ownerId: transaction.advisorId,
      name: `Recalculate Health ${transaction.customerId}`,
      maxAttempts: 3,
    });

    return { journeyEvent, followUpJob, reminder };
  });
}

export async function handleSurveyResponse(
  surveyId: string,
  responseData: HandleSurveyResponseInput,
  options?: RetentionServiceOptions
) {
  assertValid(surveyId.trim().length > 0, "surveyId is required.");
  assertValid(
    responseData.responses.length > 0,
    "At least one survey response is required."
  );
  responseData.responses.forEach((response) => {
    assertValid(response.questionKey.trim().length > 0, "questionKey is required.");
    assertValid(
      response.questionText.trim().length > 0,
      "questionText is required."
    );
    if (response.ratingValue !== undefined) {
      assertValid(
        response.ratingValue >= 0 && response.ratingValue <= 10,
        "ratingValue must be between 0 and 10."
      );
    }
  });

  const db = getDb(options);
  const now = getNow(options);

  return db.$transaction(async (tx) => {
    const survey = assertFound(
      await tx.followUpSurvey.findUnique({
        where: { id: surveyId },
        include: { customer: true, serviceTransaction: true },
      }),
      `Survey ${surveyId} was not found.`
    );
    assertValid(
      survey.status !== SurveyStatus.COMPLETED,
      "Survey has already been completed."
    );

    const qualityRating = getQualityRating(responseData.responses);
    const badSurvey = isBadSurveyResponse(responseData.responses);

    await tx.surveyResponse.createMany({
      data: responseData.responses.map((response) => ({
        surveyId,
        questionKey: response.questionKey,
        questionText: response.questionText,
        questionType: response.questionType,
        ratingValue: response.ratingValue,
        textValue: response.textValue,
        booleanValue: response.booleanValue,
      })),
    });

    const updatedSurvey = await tx.followUpSurvey.update({
      where: { id: surveyId },
      data: {
        status: SurveyStatus.COMPLETED,
        completedAt: now,
        score: qualityRating,
        npsScore: responseData.npsScore,
        comments: responseData.comments,
      },
    });

    if (badSurvey) {
      const ticket = await tx.complaintTicket.create({
        data: {
          ticketNumber: await nextTicketNumber(tx),
          customerId: survey.customerId,
          vehicleId: survey.serviceTransaction?.vehicleId,
          serviceTransactionId: survey.serviceTransactionId,
          branchId: survey.serviceTransaction?.branchId ?? survey.customer.branchId,
          assignedToId: survey.customer.assignedAdvisorId,
          status: ComplaintStatus.OPEN,
          priority: ComplaintPriority.HIGH,
          category: "Kualitas Servis",
          subject: "Skor survey pasca servis rendah",
          description:
            responseData.comments ??
            "Pelanggan memberikan nilai kualitas servis rendah setelah kunjungan ke outlet Mobeng.",
          openedAt: now,
        },
      });

      const task = await tx.task.create({
        data: {
          title: "Tindak lanjut survey rendah",
          description: "Hubungi pelanggan, pastikan akar masalah, lalu sepakati recovery action.",
          status: TaskStatus.TODO,
          priority: TaskPriority.HIGH,
          dueAt: addDays(now, 1),
          customerId: survey.customerId,
          vehicleId: survey.serviceTransaction?.vehicleId,
          complaintTicketId: ticket.id,
          assignedToId: survey.customer.assignedAdvisorId,
          createdById: survey.sentById,
        },
      });

      await tx.customer.update({
        where: { id: survey.customerId },
        data: { status: CustomerStatus.AT_RISK },
      });

      const journeyEvent = await tx.customerJourneyEvent.create({
        data: {
          customerId: survey.customerId,
          vehicleId: survey.serviceTransaction?.vehicleId,
          serviceTransactionId: survey.serviceTransactionId,
          eventType: JourneyEventType.COMPLAINT_OPENED,
          eventAt: now,
          title: "Komplain dibuat dari survey rendah",
          description: `Skor kualitas ${qualityRating ?? "tidak diketahui"} memicu recovery Mobeng.`,
          source: "retention_service",
          metadata: { surveyId, ticketId: ticket.id, taskId: task.id },
          createdById: survey.sentById,
        },
      });

      return {
        outcome: "complaint_created" as const,
        survey: updatedSurvey,
        ticket,
        task,
        journeyEvent,
      };
    }

    await tx.reminder.updateMany({
      where: {
        customerId: survey.customerId,
        type: ReminderType.FOLLOW_UP,
        status: ReminderStatus.PENDING,
      },
      data: {
        status: ReminderStatus.COMPLETED,
        completedAt: now,
      },
    });

    const journeyEvent = await tx.customerJourneyEvent.create({
      data: {
        customerId: survey.customerId,
        vehicleId: survey.serviceTransaction?.vehicleId,
        serviceTransactionId: survey.serviceTransactionId,
        eventType: JourneyEventType.SURVEY_COMPLETED,
        eventAt: now,
        title: "Survey pasca servis selesai",
        source: "retention_service",
        metadata: { surveyId, qualityRating, npsScore: responseData.npsScore },
        createdById: survey.sentById,
      },
    });

    return {
      outcome: "survey_completed" as const,
      survey: updatedSurvey,
      journeyEvent,
    };
  });
}

export async function createComplaintRecoveryFlow(
  ticketId: string,
  options?: RetentionServiceOptions
) {
  assertValid(ticketId.trim().length > 0, "ticketId is required.");

  const db = getDb(options);
  const now = getNow(options);

  return db.$transaction(async (tx) => {
    const ticket = assertFound(
      await tx.complaintTicket.findUnique({
        where: { id: ticketId },
        include: {
          branch: { include: { manager: true } },
          customer: true,
        },
      }),
      `Complaint ticket ${ticketId} was not found.`
    );
    const existingRecoveryAction = await tx.recoveryAction.findFirst({
      where: {
        complaintTicketId: ticket.id,
        actionType: { in: ["Customer Recovery SLA", "Mobeng Recovery SLA"] },
        status: { in: [RecoveryStatus.PLANNED, RecoveryStatus.IN_PROGRESS] },
      },
    });

    if (existingRecoveryAction) {
      return {
        alreadyExists: true as const,
        ticket,
        recoveryAction: existingRecoveryAction,
      };
    }

    const ownerId =
      ticket.assignedToId ??
      ticket.branch.managerId ??
      ticket.customer.assignedAdvisorId ??
      null;
    const slaHours =
      ticket.priority === ComplaintPriority.CRITICAL
        ? 4
        : ticket.priority === ComplaintPriority.HIGH
          ? 8
          : ticket.priority === ComplaintPriority.MEDIUM
            ? 24
            : 48;
    const promisedAt = new Date(now.getTime() + slaHours * 60 * 60 * 1000);
    const complaintMessage = buildComplaintRecoveryMessage({
      customerName: ticket.customer.firstName,
      ticketNumber: ticket.ticketNumber,
      branchName: ticket.branch.name,
    });

    const updatedTicket = await tx.complaintTicket.update({
      where: { id: ticket.id },
      data: {
        assignedToId: ownerId,
        status:
          ticket.status === ComplaintStatus.OPEN
            ? ComplaintStatus.INVESTIGATING
            : ticket.status,
      },
    });

    const recoveryAction = await tx.recoveryAction.create({
      data: {
        complaintTicketId: ticket.id,
        ownerId,
        actionType: "Mobeng Recovery SLA",
        status: RecoveryStatus.PLANNED,
        description: `Owner recovery wajib menghubungi pelanggan dalam ${slaHours} jam dan mengonfirmasi tindak lanjut.`,
        promisedAt,
        followUpRequired: true,
      },
    });

    const task = await tx.task.create({
      data: {
        title: `Recovery komplain ${ticket.ticketNumber}`,
        description: `${ticket.subject}. ${complaintMessage.message}`,
        status: TaskStatus.TODO,
        priority:
          ticket.priority === ComplaintPriority.CRITICAL
            ? TaskPriority.URGENT
            : ticket.priority === ComplaintPriority.HIGH
              ? TaskPriority.HIGH
              : TaskPriority.MEDIUM,
        dueAt: promisedAt,
        customerId: ticket.customerId,
        vehicleId: ticket.vehicleId,
        complaintTicketId: ticket.id,
        assignedToId: ownerId,
        createdById: ownerId,
      },
    });

    await tx.customer.update({
      where: { id: ticket.customerId },
      data: { status: CustomerStatus.AT_RISK },
    });

    const journeyEvent = await tx.customerJourneyEvent.create({
      data: {
        customerId: ticket.customerId,
        vehicleId: ticket.vehicleId,
        serviceTransactionId: ticket.serviceTransactionId,
        eventType: JourneyEventType.COMPLAINT_OPENED,
        eventAt: now,
        title: "Flow recovery komplain dimulai",
        description: `SLA recovery diset ${slaHours} jam.`,
        source: "retention_service",
        metadata: {
          ticketId: ticket.id,
          recoveryActionId: recoveryAction.id,
          taskId: task.id,
          slaHours,
        },
        createdById: ownerId,
      },
    });

    await enqueueJob({
      type: "CHECK_COMPLAINT_SLA",
      payload: {
        ticketId: ticket.id,
        customerId: ticket.customerId,
      },
      scheduledAt: promisedAt,
      ownerId,
      name: `Complaint SLA ${ticket.ticketNumber}`,
      maxAttempts: 5,
    });

    return {
      ticket: updatedTicket,
      recoveryAction,
      task,
      journeyEvent,
      slaHours,
    };
  });
}

export async function calculateCustomerHealthScore(
  customerId: string,
  options?: RetentionServiceOptions
) {
  assertValid(customerId.trim().length > 0, "customerId is required.");

  const db = getDb(options);
  const now = getNow(options);
  const customer = assertFound(
    await db.customer.findUnique({
      where: { id: customerId },
      include: {
        serviceTransactions: {
          orderBy: { openedAt: "desc" },
          select: {
            openedAt: true,
            status: true,
            totalAmount: true,
          },
        },
        surveys: {
          where: { status: SurveyStatus.COMPLETED, score: { not: null } },
          select: { score: true },
        },
        complaints: {
          select: { status: true, recoveryActions: { select: { status: true } } },
        },
        bookings: { select: { status: true } },
        reminders: {
          where: { status: ReminderStatus.PENDING, dueAt: { gte: now } },
          select: { id: true },
        },
      },
    }),
    `Customer ${customerId} was not found.`
  );

  const completedTransactions = customer.serviceTransactions.filter(
    (transaction) => transaction.status === ServiceStatus.COMPLETED
  );
  const latestCompleted = completedTransactions[0];
  const totalVisits = completedTransactions.length;
  const lifetimeValue = completedTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.totalAmount),
    0
  );
  const averageSurveyScore =
    customer.surveys.length > 0
      ? customer.surveys.reduce((sum, survey) => sum + (survey.score ?? 0), 0) /
        customer.surveys.length
      : null;
  const activeComplaintStatuses: readonly ComplaintStatus[] = [
      ComplaintStatus.OPEN,
      ComplaintStatus.INVESTIGATING,
      ComplaintStatus.WAITING_CUSTOMER,
    ];
  const openComplaints = customer.complaints.filter((complaint) =>
    activeComplaintStatuses.includes(complaint.status)
  ).length;
  const missedBookings = customer.bookings.filter(
    (booking) => booking.status === "NO_SHOW"
  ).length;
  const completedRecoveryActions = customer.complaints.flatMap(
    (complaint) => complaint.recoveryActions
  ).filter((action) => action.status === RecoveryStatus.COMPLETED).length;

  const result = calculateHealthScoreFromRules({
    totalVisits,
    lifetimeValue,
    daysSinceLastService: latestCompleted
      ? daysBetween(latestCompleted.openedAt, now)
      : null,
    averageSurveyScore,
    openComplaints,
    missedBookings,
    completedRecoveryActions,
    hasUpcomingReminder: customer.reminders.length > 0,
  });

  const healthScore = await db.customerHealthScore.upsert({
    where: { customerId },
    create: {
      customerId,
      score: result.score,
      band: result.band,
      lifetimeValue: String(lifetimeValue),
      totalVisits,
      missedBookings,
      openComplaints,
      churnRiskPercent: String(result.churnRiskPercent),
      nextBestAction: result.nextBestAction,
      lastCalculatedAt: now,
    },
    update: {
      score: result.score,
      band: result.band,
      lifetimeValue: String(lifetimeValue),
      totalVisits,
      missedBookings,
      openComplaints,
      churnRiskPercent: String(result.churnRiskPercent),
      nextBestAction: result.nextBestAction,
      lastCalculatedAt: now,
    },
  });

  return { ...result, healthScore };
}
