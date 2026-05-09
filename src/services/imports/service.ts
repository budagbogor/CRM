import { Prisma } from "@/generated/prisma/client";
import {
  ImportDuplicateMode,
  ImportSource,
  ImportStatus,
  JourneyEventType,
  NotificationChannel,
  NotificationStatus,
  ServiceItemType,
  ServiceStatus,
} from "@/generated/prisma/enums";
import { buildThankYouVisitMessage } from "@/lib/brand";
import { prisma } from "@/lib/prisma";
import {
  transactionImportRowSchema,
  type TransactionImportRow,
} from "@/lib/validations/transaction-import";
import { calculateCustomerHealthScore, createPostTransactionRetentionFlow } from "@/services/retention";

type ImportErrorItem = { row: number; invoiceNumber?: string; error: string };

type RunImportParams = {
  rows: unknown[];
  duplicateMode: ImportDuplicateMode;
  source: ImportSource;
  fileName: string;
  importedById?: string;
};

function splitName(fullName: string) {
  const cleaned = fullName.trim().replace(/\s+/g, " ");
  if (!cleaned) return { firstName: "Pelanggan", lastName: "Mobeng" };
  const parts = cleaned.split(" ");
  if (parts.length === 1) return { firstName: parts[0], lastName: "-" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts.at(-1) ?? "-" };
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "").trim();
}

function parseTransactionDate(raw: string) {
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toPaymentStatus(raw: string) {
  const normalized = raw.trim().toUpperCase();
  return ["PAID", "LUNAS", "SETTLED", "SUCCESS"].includes(normalized)
    ? ServiceStatus.COMPLETED
    : ServiceStatus.OPEN;
}

function toImportStatus(successRows: number, failedRows: number) {
  if (successRows === 0 && failedRows > 0) return ImportStatus.FAILED;
  if (successRows > 0 && failedRows > 0) return ImportStatus.PARTIAL;
  return ImportStatus.SUCCESS;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function normalizeRowInput(value: unknown) {
  const row = asRecord(value);
  return {
    invoice_number: String(row.invoice_number ?? row.invoiceNumber ?? "").trim(),
    transaction_date: String(row.transaction_date ?? row.transactionDate ?? "").trim(),
    branch_name: String(row.branch_name ?? row.branchName ?? "").trim(),
    customer_name: String(row.customer_name ?? row.customerName ?? "").trim(),
    customer_phone: String(row.customer_phone ?? row.customerPhone ?? "").trim(),
    customer_email: String(row.customer_email ?? row.customerEmail ?? "").trim(),
    vehicle_plate: String(row.vehicle_plate ?? row.vehiclePlate ?? "").trim(),
    vehicle_brand: String(row.vehicle_brand ?? row.vehicleBrand ?? "").trim(),
    vehicle_model: String(row.vehicle_model ?? row.vehicleModel ?? "").trim(),
    vehicle_year: row.vehicle_year ?? row.vehicleYear ?? "",
    mileage: row.mileage ?? "",
    service_category: String(row.service_category ?? row.serviceCategory ?? "").trim(),
    service_description: String(row.service_description ?? row.serviceDescription ?? "").trim(),
    parts_replaced: String(row.parts_replaced ?? row.partsReplaced ?? "").trim(),
    total_amount: row.total_amount ?? row.totalAmount ?? 0,
    service_advisor: String(row.service_advisor ?? row.serviceAdvisor ?? "").trim(),
    technician_name: String(row.technician_name ?? row.technicianName ?? "").trim(),
    payment_status: String(row.payment_status ?? row.paymentStatus ?? "").trim(),
  };
}

export function validateImportRows(rows: unknown[]) {
  const validRows: TransactionImportRow[] = [];
  const errors: ImportErrorItem[] = [];

  rows.forEach((rawRow, index) => {
    const parsed = transactionImportRowSchema.safeParse(normalizeRowInput(rawRow));
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      errors.push({
        row: index + 1,
        invoiceNumber: String(asRecord(rawRow).invoice_number ?? ""),
        error: firstIssue?.message ?? "Data row tidak valid.",
      });
      return;
    }

    const row = parsed.data;
    const txDate = parseTransactionDate(row.transaction_date);
    if (!txDate) {
      errors.push({
        row: index + 1,
        invoiceNumber: row.invoice_number,
        error: "transaction_date tidak valid.",
      });
      return;
    }

    validRows.push(row);
  });

  return { validRows, errors };
}

export async function runTransactionImport({
  rows,
  duplicateMode,
  source,
  fileName,
  importedById,
}: RunImportParams) {
  const { validRows, errors: validationErrors } = validateImportRows(rows);
  let successRows = 0;
  let failedRows = validationErrors.length;
  let skippedRows = 0;
  const rowErrors: ImportErrorItem[] = [...validationErrors];
  let firstBranchId: string | undefined;

  for (let i = 0; i < validRows.length; i += 1) {
    const row = validRows[i];
    try {
      const parsedDate = parseTransactionDate(row.transaction_date);
      if (!parsedDate) throw new Error("Tanggal transaksi tidak valid.");

      const branch = await prisma.branch.findFirst({
        where: {
          name: { equals: row.branch_name, mode: "insensitive" },
        },
        select: { id: true, name: true },
      });
      if (!branch) {
        throw new Error(`Cabang "${row.branch_name}" tidak ditemukan.`);
      }
      if (!firstBranchId) firstBranchId = branch.id;

      const existingTx = await prisma.serviceTransaction.findUnique({
        where: { serviceNumber: row.invoice_number },
        select: { id: true, status: true, customerId: true },
      });
      if (existingTx && duplicateMode === ImportDuplicateMode.SKIP) {
        skippedRows += 1;
        continue;
      }

      const { firstName, lastName } = splitName(row.customer_name);
      const phone = normalizePhone(row.customer_phone);
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          OR: [
            { phone },
            ...(row.customer_email ? [{ email: row.customer_email }] : []),
          ],
        },
        select: { id: true },
      });
      const customer = existingCustomer
        ? await prisma.customer.update({
            where: { id: existingCustomer.id },
            data: {
              branchId: branch.id,
              firstName,
              lastName,
              phone,
              email: row.customer_email || null,
              lastContactedAt: new Date(),
            },
          })
        : await prisma.customer.create({
            data: {
              customerNumber: `CUST-IMP-${Date.now()}-${i + 1}`,
              branchId: branch.id,
              firstName,
              lastName,
              phone,
              email: row.customer_email || null,
              acquisitionSource: "POS Import",
              consentMarketing: true,
            },
          });

      const plate = row.vehicle_plate.toUpperCase().replace(/\s+/g, "");
      const vehicle = await prisma.vehicle.upsert({
        where: { licensePlate: plate },
        create: {
          customerId: customer.id,
          branchId: branch.id,
          licensePlate: plate,
          make: row.vehicle_brand,
          model: row.vehicle_model,
          year: row.vehicle_year,
          odometer: row.mileage,
          lastServiceDate: parsedDate,
        },
        update: {
          customerId: customer.id,
          branchId: branch.id,
          make: row.vehicle_brand,
          model: row.vehicle_model,
          year: row.vehicle_year,
          odometer: row.mileage,
          lastServiceDate: parsedDate,
        },
      });

      const advisor =
        row.service_advisor.length > 0
          ? await prisma.user.findFirst({
              where: { name: { equals: row.service_advisor, mode: "insensitive" } },
              select: { id: true },
            })
          : null;

      const status = toPaymentStatus(row.payment_status);
      const transaction = existingTx
        ? await prisma.serviceTransaction.update({
            where: { id: existingTx.id },
            data: {
              customerId: customer.id,
              vehicleId: vehicle.id,
              branchId: branch.id,
              advisorId: advisor?.id ?? null,
              technicianName: row.technician_name || null,
              openedAt: parsedDate,
              closedAt: status === ServiceStatus.COMPLETED ? parsedDate : null,
              odometerIn: row.mileage,
              status,
              totalAmount: new Prisma.Decimal(row.total_amount),
              totalLaborAmount: new Prisma.Decimal(row.total_amount),
              notes: `${row.service_category} - ${row.service_description}`.trim(),
            },
          })
        : await prisma.serviceTransaction.create({
            data: {
              serviceNumber: row.invoice_number,
              customerId: customer.id,
              vehicleId: vehicle.id,
              branchId: branch.id,
              advisorId: advisor?.id ?? null,
              technicianName: row.technician_name || null,
              openedAt: parsedDate,
              closedAt: status === ServiceStatus.COMPLETED ? parsedDate : null,
              odometerIn: row.mileage,
              status,
              totalAmount: new Prisma.Decimal(row.total_amount),
              totalLaborAmount: new Prisma.Decimal(row.total_amount),
              notes: `${row.service_category} - ${row.service_description}`.trim(),
            },
          });

      const partNames = row.parts_replaced
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      if (partNames.length > 0) {
        await prisma.serviceItem.deleteMany({ where: { serviceTransactionId: transaction.id } });
        await prisma.serviceItem.createMany({
          data: partNames.map((name) => ({
            serviceTransactionId: transaction.id,
            type: ServiceItemType.PART,
            name,
            quantity: 1,
            unitPrice: new Prisma.Decimal(0),
            lineTotal: new Prisma.Decimal(0),
          })),
        });
      }

      if (status === ServiceStatus.COMPLETED) {
        await prisma.customerJourneyEvent.create({
          data: {
            customerId: customer.id,
            vehicleId: vehicle.id,
            serviceTransactionId: transaction.id,
            eventType: JourneyEventType.SERVICE_COMPLETED,
            title: "Transaksi impor selesai",
            description: `Invoice ${row.invoice_number} diimpor dari ${source}.`,
            source: `import_${source.toLowerCase()}`,
          },
        });

        const thankYou = buildThankYouVisitMessage({
          customerName: `${customer.firstName} ${customer.lastName}`,
          vehicleLabel: `${vehicle.make} ${vehicle.model}`,
          branchName: branch.name,
        });

        await prisma.notificationLog.create({
          data: {
            customerId: customer.id,
            channel: NotificationChannel.WHATSAPP,
            status: NotificationStatus.QUEUED,
            recipient: customer.phone,
            subject: thankYou.subject,
            message: thankYou.message,
            metadata: { invoiceNumber: row.invoice_number, source },
          },
        });

        await createPostTransactionRetentionFlow(transaction.id);
        await calculateCustomerHealthScore(customer.id);
      }

      successRows += 1;
    } catch (error) {
      failedRows += 1;
      rowErrors.push({
        row: i + 1,
        invoiceNumber: row.invoice_number,
        error: error instanceof Error ? error.message : "Import row gagal diproses.",
      });
    }
  }

  const status = toImportStatus(successRows, failedRows);
  const log = await prisma.transactionImportLog.create({
    data: {
      fileName,
      source,
      duplicateMode,
      status,
      branchId: firstBranchId,
      importedById: importedById || null,
      totalRows: rows.length,
      successRows,
      failedRows,
      skippedRows,
      errorDetails: rowErrors,
    },
  });

  return {
    logId: log.id,
    status,
    totalRows: rows.length,
    successRows,
    failedRows,
    skippedRows,
    errors: rowErrors,
  };
}
