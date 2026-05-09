"use client";

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
import {
  saveBookingAction,
  saveComplaintAction,
  saveCustomerAction,
  saveReminderAction,
  saveTransactionAction,
  saveVehicleAction,
} from "@/app/actions/crud";
import {
  bookingSchema,
  complaintSchema,
  customerSchema,
  reminderSchema,
  transactionSchema,
  vehicleSchema,
} from "@/lib/validations/crm";
import { EntityFormDrawer, type SelectOption } from "./entity-form-drawer";
import { entityOptions, enumOptions, toDateTimeInput } from "./form-options";

type BaseEntity = { id: string };
type CustomerOption = BaseEntity & {
  firstName: string;
  lastName: string;
  customerNumber?: string;
};
type VehicleOption = BaseEntity & {
  make: string;
  model: string;
  licensePlate: string;
};
type BranchOption = BaseEntity & { name: string };
type UserOption = BaseEntity & { name: string };
type TransactionOption = BaseEntity & { serviceNumber: string };

type SharedOptions = {
  customers?: CustomerOption[];
  vehicles?: VehicleOption[];
  branches?: BranchOption[];
  users?: UserOption[];
  transactions?: TransactionOption[];
};

const emptyOption = [{ value: "", label: "Belum ditugaskan" }];

export function CustomerFormDrawer({
  customer,
  branches = [],
  users = [],
}: SharedOptions & {
  customer?: Record<string, unknown>;
}) {
  return (
    <EntityFormDrawer
      title={customer ? "Ubah pelanggan" : "Tambah pelanggan"}
      description="Kelola identitas pelanggan, owner advisor, dan preferensi kontak."
      triggerLabel={customer ? "Ubah" : "Pelanggan baru"}
      schema={customerSchema}
      action={saveCustomerAction}
      variant={customer ? "secondary" : "primary"}
      defaultValues={{
        id: customer?.id as string | undefined,
        customerNumber: customer?.customerNumber as string | undefined,
        branchId: (customer?.branchId as string | undefined) ?? branches[0]?.id,
        assignedAdvisorId: customer?.assignedAdvisorId as string | undefined,
        firstName: customer?.firstName as string | undefined,
        lastName: customer?.lastName as string | undefined,
        email: customer?.email as string | undefined,
        phone: customer?.phone as string | undefined,
        type: (customer?.type as string | undefined) ?? CustomerType.RETAIL,
        status: (customer?.status as string | undefined) ?? CustomerStatus.ACTIVE,
        preferredChannel:
          (customer?.preferredChannel as string | undefined) ?? PreferredChannel.WHATSAPP,
        acquisitionSource: customer?.acquisitionSource as string | undefined,
        companyName: customer?.companyName as string | undefined,
        consentMarketing: (customer?.consentMarketing as boolean | undefined) ?? false,
        notes: customer?.notes as string | undefined,
      }}
      fields={[
        { name: "id", label: "ID", type: "text", className: "hidden" },
        { name: "customerNumber", label: "Customer number", required: true },
        { name: "branchId", label: "Branch", type: "select", options: entityOptions(branches, (item) => item.name), required: true },
        { name: "assignedAdvisorId", label: "Advisor", type: "select", options: [...emptyOption, ...entityOptions(users, (item) => item.name)] },
        { name: "firstName", label: "First name", required: true },
        { name: "lastName", label: "Last name", required: true },
        { name: "email", label: "Email", type: "email" },
        { name: "phone", label: "Phone", required: true },
        { name: "type", label: "Type", type: "select", options: enumOptions(CustomerType) },
        { name: "status", label: "Status", type: "select", options: enumOptions(CustomerStatus) },
        { name: "preferredChannel", label: "Preferred channel", type: "select", options: enumOptions(PreferredChannel) },
        { name: "acquisitionSource", label: "Acquisition source" },
        { name: "companyName", label: "Company" },
        { name: "consentMarketing", label: "Marketing consent", type: "checkbox" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}

export function VehicleFormDrawer({
  vehicle,
  customers = [],
  branches = [],
}: SharedOptions & {
  vehicle?: Record<string, unknown>;
}) {
  return (
    <EntityFormDrawer
      title={vehicle ? "Ubah kendaraan" : "Tambah kendaraan"}
      description="Simpan data odometer dan rencana servis agar retention tetap akurat."
      triggerLabel={vehicle ? "Ubah" : "Kendaraan baru"}
      schema={vehicleSchema}
      action={saveVehicleAction}
      variant={vehicle ? "secondary" : "primary"}
      defaultValues={{
        id: vehicle?.id as string | undefined,
        customerId: (vehicle?.customerId as string | undefined) ?? customers[0]?.id,
        branchId: (vehicle?.branchId as string | undefined) ?? branches[0]?.id,
        vin: vehicle?.vin as string | undefined,
        licensePlate: vehicle?.licensePlate as string | undefined,
        make: vehicle?.make as string | undefined,
        model: vehicle?.model as string | undefined,
        trim: vehicle?.trim as string | undefined,
        year: (vehicle?.year as number | undefined) ?? new Date().getFullYear(),
        color: vehicle?.color as string | undefined,
        odometer: (vehicle?.odometer as number | undefined) ?? 0,
        fuelType: vehicle?.fuelType as string | undefined,
        transmission: vehicle?.transmission as string | undefined,
        nextServiceOdometer: vehicle?.nextServiceOdometer as number | undefined,
        status: (vehicle?.status as string | undefined) ?? VehicleStatus.ACTIVE,
      }}
      fields={[
        { name: "id", label: "ID", className: "hidden" },
        { name: "customerId", label: "Customer", type: "select", options: entityOptions(customers, (item) => `${item.firstName} ${item.lastName}`), required: true },
        { name: "branchId", label: "Branch", type: "select", options: entityOptions(branches, (item) => item.name), required: true },
        { name: "licensePlate", label: "License plate", required: true },
        { name: "vin", label: "VIN" },
        { name: "make", label: "Make", required: true },
        { name: "model", label: "Model", required: true },
        { name: "trim", label: "Trim" },
        { name: "year", label: "Year", type: "number", required: true },
        { name: "color", label: "Color" },
        { name: "odometer", label: "Odometer", type: "number", required: true },
        { name: "fuelType", label: "Fuel type" },
        { name: "transmission", label: "Transmission" },
        { name: "nextServiceOdometer", label: "Next service odometer", type: "number" },
        { name: "status", label: "Status", type: "select", options: enumOptions(VehicleStatus) },
      ]}
    />
  );
}

export function TransactionFormDrawer({
  transaction,
  customers = [],
  vehicles = [],
  branches = [],
  users = [],
}: SharedOptions & {
  transaction?: Record<string, unknown>;
}) {
  return (
    <EntityFormDrawer
      title={transaction ? "Ubah transaksi" : "Tambah transaksi"}
      description="Saat transaksi completed, workflow retention Mobeng akan berjalan otomatis."
      triggerLabel={transaction ? "Ubah" : "Transaksi baru"}
      schema={transactionSchema}
      action={saveTransactionAction}
      variant={transaction ? "secondary" : "primary"}
      defaultValues={{
        id: transaction?.id as string | undefined,
        serviceNumber: transaction?.serviceNumber as string | undefined,
        customerId: (transaction?.customerId as string | undefined) ?? customers[0]?.id,
        vehicleId: (transaction?.vehicleId as string | undefined) ?? vehicles[0]?.id,
        branchId: (transaction?.branchId as string | undefined) ?? branches[0]?.id,
        advisorId: transaction?.advisorId as string | undefined,
        technicianName: transaction?.technicianName as string | undefined,
        openedAt: toDateTimeInput(transaction?.openedAt as Date | undefined) || toDateTimeInput(new Date()),
        closedAt: toDateTimeInput(transaction?.closedAt as Date | undefined),
        odometerIn: (transaction?.odometerIn as number | undefined) ?? 0,
        status: (transaction?.status as string | undefined) ?? ServiceStatus.OPEN,
        totalLaborAmount: Number(transaction?.totalLaborAmount ?? 0),
        totalPartsAmount: Number(transaction?.totalPartsAmount ?? 0),
        discountAmount: Number(transaction?.discountAmount ?? 0),
        taxAmount: Number(transaction?.taxAmount ?? 0),
        totalAmount: Number(transaction?.totalAmount ?? 0),
        paymentMethod: transaction?.paymentMethod as string | undefined,
        notes: transaction?.notes as string | undefined,
      }}
      fields={[
        { name: "id", label: "ID", className: "hidden" },
        { name: "serviceNumber", label: "Service number", required: true },
        { name: "status", label: "Status", type: "select", options: enumOptions(ServiceStatus) },
        { name: "customerId", label: "Customer", type: "select", options: entityOptions(customers, (item) => `${item.firstName} ${item.lastName}`), required: true },
        { name: "vehicleId", label: "Vehicle", type: "select", options: entityOptions(vehicles, (item) => `${item.make} ${item.model} - ${item.licensePlate}`), required: true },
        { name: "branchId", label: "Branch", type: "select", options: entityOptions(branches, (item) => item.name), required: true },
        { name: "advisorId", label: "Advisor", type: "select", options: [...emptyOption, ...entityOptions(users, (item) => item.name)] },
        { name: "technicianName", label: "Technician" },
        { name: "openedAt", label: "Opened at", type: "datetime-local", required: true },
        { name: "closedAt", label: "Closed at", type: "datetime-local" },
        { name: "odometerIn", label: "Odometer in", type: "number", required: true },
        { name: "totalLaborAmount", label: "Labor", type: "number" },
        { name: "totalPartsAmount", label: "Parts", type: "number" },
        { name: "discountAmount", label: "Discount", type: "number" },
        { name: "taxAmount", label: "Tax", type: "number" },
        { name: "totalAmount", label: "Total override", type: "number" },
        { name: "paymentMethod", label: "Payment method" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}

export function ComplaintFormDrawer({
  complaint,
  customers = [],
  vehicles = [],
  branches = [],
  users = [],
  transactions = [],
}: SharedOptions & {
  complaint?: Record<string, unknown>;
}) {
  return (
    <EntityFormDrawer
      title={complaint ? "Ubah komplain" : "Tambah komplain"}
      description="Komplain baru akan memicu workflow recovery dan audit trail."
      triggerLabel={complaint ? "Ubah" : "Komplain baru"}
      schema={complaintSchema}
      action={saveComplaintAction}
      variant={complaint ? "secondary" : "primary"}
      defaultValues={{
        id: complaint?.id as string | undefined,
        ticketNumber: complaint?.ticketNumber as string | undefined,
        customerId: (complaint?.customerId as string | undefined) ?? customers[0]?.id,
        vehicleId: complaint?.vehicleId as string | undefined,
        serviceTransactionId: complaint?.serviceTransactionId as string | undefined,
        branchId: (complaint?.branchId as string | undefined) ?? branches[0]?.id,
        assignedToId: complaint?.assignedToId as string | undefined,
        status: (complaint?.status as string | undefined) ?? ComplaintStatus.OPEN,
        priority: (complaint?.priority as string | undefined) ?? ComplaintPriority.MEDIUM,
        category: (complaint?.category as string | undefined) ?? "Service Quality",
        subject: complaint?.subject as string | undefined,
        description: complaint?.description as string | undefined,
      }}
      fields={[
        { name: "id", label: "ID", className: "hidden" },
        { name: "ticketNumber", label: "Ticket number", required: true },
        { name: "customerId", label: "Customer", type: "select", options: entityOptions(customers, (item) => `${item.firstName} ${item.lastName}`), required: true },
        { name: "vehicleId", label: "Vehicle", type: "select", options: [...emptyOption, ...entityOptions(vehicles, (item) => `${item.make} ${item.model}`)] },
        { name: "serviceTransactionId", label: "Transaction", type: "select", options: [...emptyOption, ...entityOptions(transactions, (item) => item.serviceNumber)] },
        { name: "branchId", label: "Branch", type: "select", options: entityOptions(branches, (item) => item.name), required: true },
        { name: "assignedToId", label: "Owner", type: "select", options: [...emptyOption, ...entityOptions(users, (item) => item.name)] },
        { name: "status", label: "Status", type: "select", options: enumOptions(ComplaintStatus) },
        { name: "priority", label: "Priority", type: "select", options: enumOptions(ComplaintPriority) },
        { name: "category", label: "Category", required: true },
        { name: "subject", label: "Subject", required: true, className: "sm:col-span-2" },
        { name: "description", label: "Description", type: "textarea", required: true },
      ]}
    />
  );
}

export function ReminderFormDrawer({
  reminder,
  customers = [],
  vehicles = [],
  branches = [],
  users = [],
}: SharedOptions & {
  reminder?: Record<string, unknown>;
}) {
  return (
    <EntityFormDrawer
      title={reminder ? "Ubah reminder" : "Tambah reminder"}
      description="Jadwalkan aksi advisor untuk retention, callback, atau servis berikutnya."
      triggerLabel={reminder ? "Ubah" : "Reminder baru"}
      schema={reminderSchema}
      action={saveReminderAction}
      variant={reminder ? "secondary" : "primary"}
      defaultValues={{
        id: reminder?.id as string | undefined,
        customerId: (reminder?.customerId as string | undefined) ?? customers[0]?.id,
        vehicleId: reminder?.vehicleId as string | undefined,
        branchId: reminder?.branchId as string | undefined,
        assignedToId: reminder?.assignedToId as string | undefined,
        type: (reminder?.type as string | undefined) ?? ReminderType.FOLLOW_UP,
        status: (reminder?.status as string | undefined) ?? ReminderStatus.PENDING,
        title: reminder?.title as string | undefined,
        notes: reminder?.notes as string | undefined,
        dueAt: toDateTimeInput(reminder?.dueAt as Date | undefined) || toDateTimeInput(new Date()),
      }}
      fields={[
        { name: "id", label: "ID", className: "hidden" },
        { name: "customerId", label: "Customer", type: "select", options: entityOptions(customers, (item) => `${item.firstName} ${item.lastName}`), required: true },
        { name: "vehicleId", label: "Vehicle", type: "select", options: [...emptyOption, ...entityOptions(vehicles, (item) => `${item.make} ${item.model}`)] },
        { name: "branchId", label: "Branch", type: "select", options: [...emptyOption, ...entityOptions(branches, (item) => item.name)] },
        { name: "assignedToId", label: "Assignee", type: "select", options: [...emptyOption, ...entityOptions(users, (item) => item.name)] },
        { name: "type", label: "Type", type: "select", options: enumOptions(ReminderType) },
        { name: "status", label: "Status", type: "select", options: enumOptions(ReminderStatus) },
        { name: "title", label: "Title", required: true, className: "sm:col-span-2" },
        { name: "dueAt", label: "Due at", type: "datetime-local", required: true },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}

export function BookingFormDrawer({
  booking,
  customers = [],
  vehicles = [],
  branches = [],
  users = [],
}: SharedOptions & {
  booking?: Record<string, unknown>;
}) {
  return (
    <EntityFormDrawer
      title={booking ? "Ubah booking" : "Tambah booking"}
      description="Atur kapasitas outlet dan ubah reminder yang siap follow-up menjadi booking."
      triggerLabel={booking ? "Ubah" : "Booking baru"}
      schema={bookingSchema}
      action={saveBookingAction}
      variant={booking ? "secondary" : "primary"}
      defaultValues={{
        id: booking?.id as string | undefined,
        bookingNumber: booking?.bookingNumber as string | undefined,
        customerId: (booking?.customerId as string | undefined) ?? customers[0]?.id,
        vehicleId: (booking?.vehicleId as string | undefined) ?? vehicles[0]?.id,
        branchId: (booking?.branchId as string | undefined) ?? branches[0]?.id,
        advisorId: booking?.advisorId as string | undefined,
        status: (booking?.status as string | undefined) ?? BookingStatus.REQUESTED,
        source: (booking?.source as string | undefined) ?? BookingSource.PHONE,
        scheduledStart: toDateTimeInput(booking?.scheduledStart as Date | undefined) || toDateTimeInput(new Date()),
        scheduledEnd: toDateTimeInput(booking?.scheduledEnd as Date | undefined) || toDateTimeInput(new Date()),
        requestedServices: Array.isArray(booking?.requestedServices)
          ? (booking.requestedServices as string[]).join(", ")
          : undefined,
        notes: booking?.notes as string | undefined,
      }}
      fields={[
        { name: "id", label: "ID", className: "hidden" },
        { name: "bookingNumber", label: "Booking number", required: true },
        { name: "status", label: "Status", type: "select", options: enumOptions(BookingStatus) },
        { name: "customerId", label: "Customer", type: "select", options: entityOptions(customers, (item) => `${item.firstName} ${item.lastName}`), required: true },
        { name: "vehicleId", label: "Vehicle", type: "select", options: entityOptions(vehicles, (item) => `${item.make} ${item.model} - ${item.licensePlate}`), required: true },
        { name: "branchId", label: "Branch", type: "select", options: entityOptions(branches, (item) => item.name), required: true },
        { name: "advisorId", label: "Advisor", type: "select", options: [...emptyOption, ...entityOptions(users, (item) => item.name)] },
        { name: "source", label: "Source", type: "select", options: enumOptions(BookingSource) },
        { name: "scheduledStart", label: "Start", type: "datetime-local", required: true },
        { name: "scheduledEnd", label: "End", type: "datetime-local", required: true },
        { name: "requestedServices", label: "Requested services", required: true, className: "sm:col-span-2", placeholder: "Oil change, brake inspection" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}

export type { SelectOption };
