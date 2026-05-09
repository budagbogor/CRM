import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { toneForStatus } from "@/lib/status";
import { formatDateTime, labelFromEnum } from "@/lib/utils";
import { getTodayBookingsData } from "@/services/crm-queries";
import { CalendarDays } from "lucide-react";

export default async function MobileBookingsTodayPage() {
  const bookings = await getTodayBookingsData();
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Mobile View" title="Today's Bookings" description="Antrian booking hari ini untuk frontdesk bengkel." />
      {bookings.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Belum ada booking hari ini" description="Belum ada kendaraan dijadwalkan untuk hari ini." />
      ) : (
        <DataTable
          data={bookings}
          getRowKey={(row) => row.id}
          mobileCardTitle={(row) => row.bookingNumber}
          columns={[
            { key: "booking", header: "Booking", cell: (row) => row.bookingNumber },
            { key: "customer", header: "Customer", cell: (row) => `${row.customer.firstName} ${row.customer.lastName}` },
            { key: "vehicle", header: "Vehicle", cell: (row) => `${row.vehicle.make} ${row.vehicle.model} - ${row.vehicle.licensePlate}` },
            { key: "time", header: "Schedule", cell: (row) => formatDateTime(row.scheduledStart) },
            { key: "status", header: "Status", cell: (row) => <StatusBadge tone={toneForStatus(row.status)}>{labelFromEnum(row.status)}</StatusBadge> },
          ]}
        />
      )}
    </div>
  );
}

