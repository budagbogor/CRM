"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  buildBookingConfirmationMessage,
  buildNextServiceReminderMessage,
  brandIdentity,
  formatMobengDateTime,
} from "@/lib/brand";
import { actionError, actionOk, formDataToObject } from "@/lib/form-data";
import {
  bookingSchema,
  complaintSchema,
  customerSchema,
  reminderSchema,
  transactionSchema,
  vehicleSchema,
} from "@/lib/validations/crm";
import { auditLog } from "@/services/audit";
import {
  calculateCustomerHealthScore,
  createComplaintRecoveryFlow,
  createPostTransactionRetentionFlow,
} from "@/services/retention";
import { assertPermission } from "@/lib/auth";
import { assertBranchAccess } from "@/lib/auth";
import {
  BookingStatus,
  NotificationChannel,
  PreferredChannel,
  ReminderStatus,
  ServiceStatus,
} from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";

function parseForm<T extends z.ZodTypeAny>(schema: T, formData: FormData) {
  const parsed = schema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return {
      ok: false as const,
      result: actionError(
        "Mohon periksa kembali field yang ditandai.",
        Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).filter(
            (entry): entry is [string, string[]] => Array.isArray(entry[1])
          )
        )
      ),
    };
  }

  return { ok: true as const, data: parsed.data as z.infer<T> };
}

function normalizeId(value?: string) {
  return value && value.trim().length > 0 ? value : null;
}

async function assertBranchAccessByEntity(
  entity:
    | "customer"
    | "vehicle"
    | "transaction"
    | "complaint"
    | "reminder"
    | "booking",
  id: string
) {
  if (entity === "customer") {
    const row = await prisma.customer.findUnique({ where: { id }, select: { branchId: true } });
    return assertBranchAccess(row?.branchId);
  }
  if (entity === "vehicle") {
    const row = await prisma.vehicle.findUnique({ where: { id }, select: { branchId: true } });
    return assertBranchAccess(row?.branchId);
  }
  if (entity === "transaction") {
    const row = await prisma.serviceTransaction.findUnique({ where: { id }, select: { branchId: true } });
    return assertBranchAccess(row?.branchId);
  }
  if (entity === "complaint") {
    const row = await prisma.complaintTicket.findUnique({ where: { id }, select: { branchId: true } });
    return assertBranchAccess(row?.branchId);
  }
  if (entity === "reminder") {
    const row = await prisma.reminder.findUnique({ where: { id }, select: { branchId: true, customer: { select: { branchId: true } } } });
    return assertBranchAccess(row?.branchId ?? row?.customer.branchId);
  }
  const row = await prisma.booking.findUnique({ where: { id }, select: { branchId: true } });
  return assertBranchAccess(row?.branchId);
}

async function deleteWithConstraintMessage(
  entityName: string,
  operation: () => Promise<unknown>
) {
  try {
    await operation();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new Error(
        `Data ${entityName} tidak bisa dihapus karena masih terhubung ke riwayat servis atau workflow CRM.`
      );
    }

    throw error;
  }
}

export async function saveCustomerAction(_prev: unknown, formData: FormData) {
  await assertPermission("customers", "write");
  const parsed = parseForm(customerSchema, formData);
  if (!parsed.ok) return parsed.result;
  const { id, email, assignedAdvisorId, ...data } = parsed.data;
  await assertBranchAccess(data.branchId);
  const customerNumber =
    data.customerNumber ?? `CUST-${String((await prisma.customer.count()) + 1).padStart(4, "0")}`;

  const customer = id
    ? await prisma.customer.update({
        where: { id },
        data: { ...data, customerNumber, email: email || null, assignedAdvisorId: normalizeId(assignedAdvisorId) },
      })
    : await prisma.customer.create({
        data: { ...data, customerNumber, email: email || null, assignedAdvisorId: normalizeId(assignedAdvisorId) },
      });

  await auditLog({ action: id ? "customer.updated" : "customer.created", entityType: "Customer", entityId: customer.id });
  revalidatePath("/customers");
  revalidatePath("/dashboard");
  return actionOk(id ? "Data pelanggan diperbarui." : "Pelanggan baru berhasil dibuat.");
}

export async function deleteCustomerAction(id: string) {
  await assertPermission("customers", "write");
  await assertBranchAccessByEntity("customer", id);
  await deleteWithConstraintMessage("customer", () =>
    prisma.customer.delete({ where: { id } })
  );
  await auditLog({ action: "customer.deleted", entityType: "Customer", entityId: id });
  revalidatePath("/customers");
  revalidatePath("/dashboard");
}

export async function saveVehicleAction(_prev: unknown, formData: FormData) {
  await assertPermission("vehicles", "write");
  const parsed = parseForm(vehicleSchema, formData);
  if (!parsed.ok) return parsed.result;
  const { id, nextServiceOdometer, ...data } = parsed.data;
  await assertBranchAccess(data.branchId);

  const vehicle = id
    ? await prisma.vehicle.update({
        where: { id },
        data: { ...data, nextServiceOdometer: nextServiceOdometer || null },
      })
    : await prisma.vehicle.create({
        data: { ...data, nextServiceOdometer: nextServiceOdometer || null },
      });

  await auditLog({ action: id ? "vehicle.updated" : "vehicle.created", entityType: "Vehicle", entityId: vehicle.id });
  revalidatePath("/vehicles");
  return actionOk(id ? "Data kendaraan diperbarui." : "Kendaraan baru berhasil dibuat.");
}

export async function deleteVehicleAction(id: string) {
  await assertPermission("vehicles", "write");
  await assertBranchAccessByEntity("vehicle", id);
  await deleteWithConstraintMessage("vehicle", () =>
    prisma.vehicle.delete({ where: { id } })
  );
  await auditLog({ action: "vehicle.deleted", entityType: "Vehicle", entityId: id });
  revalidatePath("/vehicles");
}

export async function saveTransactionAction(_prev: unknown, formData: FormData) {
  await assertPermission("transactions", "write");
  const parsed = parseForm(transactionSchema, formData);
  if (!parsed.ok) return parsed.result;
  const { id, advisorId, closedAt, ...data } = parsed.data;
  await assertBranchAccess(data.branchId);
  const serviceNumber =
    data.serviceNumber ??
    `SVC-${new Date().getFullYear()}-${String((await prisma.serviceTransaction.count()) + 1).padStart(4, "0")}`;
  const totalAmount =
    data.totalAmount ||
    data.totalLaborAmount + data.totalPartsAmount - data.discountAmount + data.taxAmount;

  const before = id
    ? await prisma.serviceTransaction.findUnique({ where: { id }, select: { status: true } })
    : null;
  const transaction = id
    ? await prisma.serviceTransaction.update({
        where: { id },
        data: {
          ...data,
          serviceNumber,
          totalAmount,
          advisorId: normalizeId(advisorId),
          closedAt: data.status === ServiceStatus.COMPLETED ? closedAt ?? new Date() : closedAt,
        },
      })
    : await prisma.serviceTransaction.create({
        data: {
          ...data,
          serviceNumber,
          totalAmount,
          advisorId: normalizeId(advisorId),
          closedAt: data.status === ServiceStatus.COMPLETED ? closedAt ?? new Date() : closedAt,
        },
      });

  if (transaction.status === ServiceStatus.COMPLETED && before?.status !== ServiceStatus.COMPLETED) {
    await createPostTransactionRetentionFlow(transaction.id);
    await calculateCustomerHealthScore(transaction.customerId);
    await auditLog({ action: "transaction.completed", entityType: "ServiceTransaction", entityId: transaction.id });
  }

  await auditLog({ action: id ? "transaction.updated" : "transaction.created", entityType: "ServiceTransaction", entityId: transaction.id });
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/follow-ups");
  revalidatePath("/reminders");
  return actionOk(id ? "Transaksi servis diperbarui." : "Transaksi servis berhasil dibuat.");
}

export async function deleteTransactionAction(id: string) {
  await assertPermission("transactions", "write");
  await assertBranchAccessByEntity("transaction", id);
  await deleteWithConstraintMessage("transaction", () =>
    prisma.serviceTransaction.delete({ where: { id } })
  );
  await auditLog({ action: "transaction.deleted", entityType: "ServiceTransaction", entityId: id });
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

export async function saveComplaintAction(_prev: unknown, formData: FormData) {
  await assertPermission("complaints", "write");
  const parsed = parseForm(complaintSchema, formData);
  if (!parsed.ok) return parsed.result;
  const { id, assignedToId, vehicleId, serviceTransactionId, ...data } = parsed.data;
  await assertBranchAccess(data.branchId);
  const ticketNumber =
    data.ticketNumber ??
    `CMP-${new Date().getFullYear()}-${String((await prisma.complaintTicket.count()) + 1).padStart(4, "0")}`;

  const before = id
    ? await prisma.complaintTicket.findUnique({ where: { id }, select: { status: true } })
    : null;
  const complaint = id
    ? await prisma.complaintTicket.update({
        where: { id },
        data: {
          ...data,
          ticketNumber,
          assignedToId: normalizeId(assignedToId),
          vehicleId: normalizeId(vehicleId),
          serviceTransactionId: normalizeId(serviceTransactionId),
        },
      })
    : await prisma.complaintTicket.create({
        data: {
          ...data,
          ticketNumber,
          assignedToId: normalizeId(assignedToId),
          vehicleId: normalizeId(vehicleId),
          serviceTransactionId: normalizeId(serviceTransactionId),
        },
      });

  if (!id) await createComplaintRecoveryFlow(complaint.id);
  if (
    complaint.status === "RESOLVED" &&
    before?.status !== "RESOLVED"
  ) {
    await auditLog({ action: "complaint.resolved", entityType: "ComplaintTicket", entityId: complaint.id });
  }
  await calculateCustomerHealthScore(complaint.customerId);
  await auditLog({ action: id ? "complaint.updated" : "complaint.created", entityType: "ComplaintTicket", entityId: complaint.id });
  revalidatePath("/complaints");
  revalidatePath("/dashboard");
  return actionOk(id ? "Tiket komplain diperbarui." : "Tiket komplain berhasil dibuat.");
}

export async function deleteComplaintAction(id: string) {
  await assertPermission("complaints", "write");
  await assertBranchAccessByEntity("complaint", id);
  await deleteWithConstraintMessage("complaint", () =>
    prisma.complaintTicket.delete({ where: { id } })
  );
  await auditLog({ action: "complaint.deleted", entityType: "ComplaintTicket", entityId: id });
  revalidatePath("/complaints");
  revalidatePath("/dashboard");
}

export async function saveReminderAction(_prev: unknown, formData: FormData) {
  await assertPermission("reminders", "write");
  const parsed = parseForm(reminderSchema, formData);
  if (!parsed.ok) return parsed.result;
  const { id, assignedToId, vehicleId, branchId, ...data } = parsed.data;
  if (branchId) {
    await assertBranchAccess(branchId);
  } else if (id) {
    await assertBranchAccessByEntity("reminder", id);
  }

  const reminder = id
    ? await prisma.reminder.update({
        where: { id },
        data: {
          ...data,
          assignedToId: normalizeId(assignedToId),
          vehicleId: normalizeId(vehicleId),
          branchId: normalizeId(branchId),
        },
      })
    : await prisma.reminder.create({
        data: {
          ...data,
          assignedToId: normalizeId(assignedToId),
          vehicleId: normalizeId(vehicleId),
          branchId: normalizeId(branchId),
        },
      });

  await auditLog({ action: id ? "reminder.updated" : "reminder.created", entityType: "Reminder", entityId: reminder.id });
  revalidatePath("/reminders");
  revalidatePath("/dashboard");
  return actionOk(id ? "Reminder diperbarui." : "Reminder baru berhasil dibuat.");
}

export async function updateReminderStatusAction(id: string, status: ReminderStatus) {
  await assertPermission("reminders", "write");
  await assertBranchAccessByEntity("reminder", id);
  await prisma.reminder.update({
    where: { id },
    data: {
      status,
      completedAt: status === ReminderStatus.COMPLETED ? new Date() : null,
    },
  });
  await auditLog({ action: `reminder.${status.toLowerCase()}`, entityType: "Reminder", entityId: id });
  revalidatePath("/reminders");
  revalidatePath("/dashboard");
}

export async function markReminderSentAction(id: string) {
  await assertPermission("reminders", "write");
  await assertBranchAccessByEntity("reminder", id);
  const reminder = await prisma.reminder.findUnique({
    where: { id },
    include: { customer: true, branch: true },
  });
  if (!reminder) throw new Error("Reminder tidak ditemukan.");

  const channel =
    reminder.customer.preferredChannel === PreferredChannel.EMAIL
      ? NotificationChannel.EMAIL
      : reminder.customer.preferredChannel === PreferredChannel.SMS
        ? NotificationChannel.SMS
        : NotificationChannel.WHATSAPP;
  const recipient =
    channel === NotificationChannel.EMAIL
      ? reminder.customer.email ?? reminder.customer.phone
      : reminder.customer.phone;
  const reminderMessage = buildNextServiceReminderMessage({
    customerName: `${reminder.customer.firstName} ${reminder.customer.lastName}`,
    vehicleLabel: reminder.title,
    branchName: reminder.branch?.name ?? brandIdentity.appName,
    dueLabel: formatMobengDateTime(reminder.dueAt),
  });

  const existingNotification = await prisma.notificationLog.findFirst({
    where: {
      customerId: reminder.customerId,
      recipient,
      subject: reminderMessage.subject,
    },
  });

  if (!existingNotification) {
    await prisma.notificationLog.create({
      data: {
        customerId: reminder.customerId,
        userId: reminder.assignedToId,
        channel,
        status: "QUEUED",
        recipient,
        subject: reminderMessage.subject,
        message: reminder.notes ?? reminderMessage.message,
        metadata: { reminderId: id },
      },
    });
  }
  await auditLog({ action: "reminder.sent", entityType: "Reminder", entityId: id });
  revalidatePath("/reminders");
  revalidatePath("/dashboard");
}

export async function markReminderRespondedAction(id: string) {
  await updateReminderStatusAction(id, ReminderStatus.COMPLETED);
}

export async function markReminderNoResponseAction(id: string) {
  await updateReminderStatusAction(id, ReminderStatus.SNOOZED);
}

export async function convertReminderToBookingAction(id: string) {
  await assertPermission("reminders", "write");
  await assertBranchAccessByEntity("reminder", id);
  const reminder = await prisma.reminder.findUnique({
    where: { id },
    include: { customer: true, vehicle: true, branch: true },
  });
  if (!reminder?.vehicleId || !reminder.branchId) {
    throw new Error("Reminder harus punya kendaraan dan outlet sebelum diubah menjadi booking.");
  }

  const scheduledStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const scheduledEnd = new Date(scheduledStart.getTime() + 2 * 60 * 60 * 1000);
  const count = await prisma.booking.count();
  let booking = await prisma.booking.findFirst({
    where: { notes: { contains: `Dibuat dari reminder ${reminder.id}` } },
  });

  if (!booking) {
    booking = await prisma.booking.create({
      data: {
        bookingNumber: `BKG-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`,
        customerId: reminder.customerId,
        vehicleId: reminder.vehicleId,
        branchId: reminder.branchId,
        advisorId: reminder.assignedToId,
        status: BookingStatus.REQUESTED,
        source: "PHONE",
        scheduledStart,
        scheduledEnd,
        requestedServices: [reminder.title],
        notes: `Dibuat dari reminder ${reminder.id}.`,
      },
    });

    const bookingMessage = buildBookingConfirmationMessage({
      customerName: `${reminder.customer.firstName} ${reminder.customer.lastName}`,
      bookingNumber: booking.bookingNumber,
      branchName: reminder.branch?.name ?? brandIdentity.appName,
      scheduledStart,
      requestedServices: booking.requestedServices,
    });

    await prisma.notificationLog.create({
      data: {
        customerId: reminder.customerId,
        userId: reminder.assignedToId,
        channel: NotificationChannel.WHATSAPP,
        status: "QUEUED",
        recipient: reminder.customer.phone,
        subject: bookingMessage.subject,
        message: bookingMessage.message,
        metadata: { reminderId: id, bookingId: booking.id },
      },
    });
  }

  await prisma.reminder.update({
    where: { id },
    data: { status: ReminderStatus.COMPLETED, completedAt: new Date() },
  });
  await auditLog({ action: "reminder.converted_to_booking", entityType: "Reminder", entityId: id, metadata: { bookingId: booking.id } });
  revalidatePath("/reminders");
  revalidatePath("/bookings");
  revalidatePath("/dashboard");
}

export async function deleteReminderAction(id: string) {
  await assertPermission("reminders", "write");
  await assertBranchAccessByEntity("reminder", id);
  await deleteWithConstraintMessage("reminder", () =>
    prisma.reminder.delete({ where: { id } })
  );
  await auditLog({ action: "reminder.deleted", entityType: "Reminder", entityId: id });
  revalidatePath("/reminders");
}

export async function saveBookingAction(_prev: unknown, formData: FormData) {
  await assertPermission("bookings", "write");
  const parsed = parseForm(bookingSchema, formData);
  if (!parsed.ok) return parsed.result;
  const { id, advisorId, requestedServices, ...data } = parsed.data;
  await assertBranchAccess(data.branchId);
  const bookingNumber =
    data.bookingNumber ??
    `BKG-${new Date().getFullYear()}-${String((await prisma.booking.count()) + 1).padStart(4, "0")}`;
  const requestedServicesList = requestedServices.split(",").map((item) => item.trim()).filter(Boolean);

  const booking = id
    ? await prisma.booking.update({
        where: { id },
        data: { ...data, bookingNumber, advisorId: normalizeId(advisorId), requestedServices: requestedServicesList },
      })
    : await prisma.booking.create({
        data: { ...data, bookingNumber, advisorId: normalizeId(advisorId), requestedServices: requestedServicesList },
      });

  await auditLog({ action: id ? "booking.updated" : "booking.created", entityType: "Booking", entityId: booking.id });
  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  return actionOk(id ? "Booking diperbarui." : "Booking baru berhasil dibuat.");
}

export async function updateBookingStatusAction(id: string, status: BookingStatus) {
  await assertPermission("bookings", "write");
  await assertBranchAccessByEntity("booking", id);
  await prisma.booking.update({ where: { id }, data: { status } });
  await auditLog({ action: `booking.${status.toLowerCase()}`, entityType: "Booking", entityId: id });
  revalidatePath("/bookings");
  revalidatePath("/dashboard");
}

export async function deleteBookingAction(id: string) {
  await assertPermission("bookings", "write");
  await assertBranchAccessByEntity("booking", id);
  await deleteWithConstraintMessage("booking", () =>
    prisma.booking.delete({ where: { id } })
  );
  await auditLog({ action: "booking.deleted", entityType: "Booking", entityId: id });
  revalidatePath("/bookings");
  revalidatePath("/dashboard");
}
