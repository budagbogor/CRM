import { z } from "zod";

export const transactionImportRowSchema = z.object({
  invoice_number: z.string().min(1),
  transaction_date: z.string().min(1),
  branch_name: z.string().min(1),
  customer_name: z.string().min(1),
  customer_phone: z.string().min(1),
  customer_email: z.string().optional().default(""),
  vehicle_plate: z.string().min(1),
  vehicle_brand: z.string().min(1),
  vehicle_model: z.string().min(1),
  vehicle_year: z.coerce.number().int().min(1950).max(2100),
  mileage: z.coerce.number().int().min(0),
  service_category: z.string().min(1),
  service_description: z.string().optional().default(""),
  parts_replaced: z.string().optional().default(""),
  total_amount: z.coerce.number().min(0),
  service_advisor: z.string().optional().default(""),
  technician_name: z.string().optional().default(""),
  payment_status: z.string().min(1),
});

export type TransactionImportRow = z.infer<typeof transactionImportRowSchema>;

export const transactionImportPayloadSchema = z.object({
  duplicateMode: z.enum(["SKIP", "UPDATE"]).default("SKIP"),
  transactions: z.array(transactionImportRowSchema).min(1),
});

