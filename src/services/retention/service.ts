import { prisma } from "@/lib/prisma";
import {
  AutomationJobStatus,
  AutomationTrigger,
  ComplaintPriority,
  ComplaintStatus,
  CustomerStatus,
  JourneyEventType,
  NotificationChannel,
  NotificationStatus,
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
import { assertFound, assertValid } from "./errors";
import {
  addDays,
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
    const automationName = `Follow-up H+3 ${transaction.serviceNumber}`;
    const existingAutomationJob = await tx.automationJob.findFirst({
      where: {
        jobType: "h_plus_3_post_service_follow_up",
        name: automationName,
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

    const notification = await tx.notificationLog.create({
      data: {
        customerId: transaction.customerId,
        userId: transaction.advisorId,
        channel: NotificationChannel.WHATSAPP,
        status: NotificationStatus.QUEUED,
        recipient: transaction.customer.phone,
        subject: thankYouMessage.subject,
        message: thankYouMessage.message,
        metadata: { serviceTransactionId: transaction.id },
      },
    });

    const automationJob = await tx.automationJob.create({
      data: {
        name: automationName,
        jobType: "h_plus_3_post_service_follow_up",
        status: AutomationJobStatus.ACTIVE,
        trigger: AutomationTrigger.SCHEDULED,
        triggerConfig: {
          serviceTransactionId: transaction.id,
          customerId: transaction.customerId,
          vehicleId: transaction.vehicleId,
          channel: "WHATSAPP",
        },
        ownerId: transaction.advisorId,
        nextRunAt: followUpAt,
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
        metadata: { reminderId: reminder.id, automationJobId: automationJob.id },
        createdById: transaction.advisorId,
      },
    });

    return { journeyEvent, notification, automationJob, reminder };
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
