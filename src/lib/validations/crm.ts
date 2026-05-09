import { z } from "zod";
import {
  BookingSource,
  BookingStatus,
  ComplaintPriority,
  ComplaintStatus,
  CustomerStatus,
  CustomerType,
  PreferredChannel,
  ReminderStatus,
  ReminderType,
  ServiceStatus,
  VehicleStatus,
} from "@/generated/prisma/enums";

const optionalText = z.string().trim().optional().transform((value) => value || undefined);
const id = z.string().trim().min(1, "Required");
const money = z.coerce.number().min(0).default(0);

export const customerSchema = z.object({
  id: z.string().optional(),
  customerNumber: optionalText,
  branchId: id,
  assignedAdvisorId: z.string().optional(),
  firstName: z.string().trim().min(2, "First name is required"),
  lastName: z.string().trim().min(2, "Last name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().trim().min(6, "Phone is required"),
  type: z.enum(CustomerType).default(CustomerType.RETAIL),
  status: z.enum(CustomerStatus).default(CustomerStatus.ACTIVE),
  preferredChannel: z.enum(PreferredChannel).default(PreferredChannel.WHATSAPP),
  acquisitionSource: optionalText,
  companyName: optionalText,
  consentMarketing: z.coerce.boolean().default(false),
  notes: optionalText,
});

export const vehicleSchema = z.object({
  id: z.string().optional(),
  customerId: id,
  branchId: id,
  vin: optionalText,
  licensePlate: z.string().trim().min(3, "License plate is required"),
  make: z.string().trim().min(2, "Make is required"),
  model: z.string().trim().min(1, "Model is required"),
  trim: optionalText,
  year: z.coerce.number().int().min(1980).max(2100),
  color: optionalText,
  odometer: z.coerce.number().int().min(0),
  fuelType: optionalText,
  transmission: optionalText,
  nextServiceOdometer: z.coerce.number().int().min(0).optional(),
  status: z.enum(VehicleStatus).default(VehicleStatus.ACTIVE),
});

export const transactionSchema = z.object({
  id: z.string().optional(),
  serviceNumber: optionalText,
  customerId: id,
  vehicleId: id,
  branchId: id,
  advisorId: z.string().optional(),
  technicianName: optionalText,
  openedAt: z.coerce.date(),
  closedAt: z.coerce.date().optional(),
  odometerIn: z.coerce.number().int().min(0),
  status: z.enum(ServiceStatus).default(ServiceStatus.OPEN),
  totalLaborAmount: money,
  totalPartsAmount: money,
  discountAmount: money,
  taxAmount: money,
  totalAmount: money,
  paymentMethod: optionalText,
  notes: optionalText,
});

export const complaintSchema = z.object({
  id: z.string().optional(),
  ticketNumber: optionalText,
  customerId: id,
  vehicleId: z.string().optional(),
  serviceTransactionId: z.string().optional(),
  branchId: id,
  assignedToId: z.string().optional(),
  status: z.enum(ComplaintStatus).default(ComplaintStatus.OPEN),
  priority: z.enum(ComplaintPriority).default(ComplaintPriority.MEDIUM),
  category: z.string().trim().min(2, "Category is required"),
  subject: z.string().trim().min(3, "Subject is required"),
  description: z.string().trim().min(5, "Description is required"),
});

export const reminderSchema = z.object({
  id: z.string().optional(),
  customerId: id,
  vehicleId: z.string().optional(),
  branchId: z.string().optional(),
  assignedToId: z.string().optional(),
  type: z.enum(ReminderType),
  status: z.enum(ReminderStatus).default(ReminderStatus.PENDING),
  title: z.string().trim().min(3, "Title is required"),
  notes: optionalText,
  dueAt: z.coerce.date(),
});

export const bookingSchema = z.object({
  id: z.string().optional(),
  bookingNumber: optionalText,
  customerId: id,
  vehicleId: id,
  branchId: id,
  advisorId: z.string().optional(),
  status: z.enum(BookingStatus).default(BookingStatus.REQUESTED),
  source: z.enum(BookingSource).default(BookingSource.PHONE),
  scheduledStart: z.coerce.date(),
  scheduledEnd: z.coerce.date(),
  requestedServices: z.string().trim().min(2, "Requested services are required"),
  notes: optionalText,
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
export type VehicleFormValues = z.infer<typeof vehicleSchema>;
export type TransactionFormValues = z.infer<typeof transactionSchema>;
export type ComplaintFormValues = z.infer<typeof complaintSchema>;
export type ReminderFormValues = z.infer<typeof reminderSchema>;
export type BookingFormValues = z.infer<typeof bookingSchema>;
