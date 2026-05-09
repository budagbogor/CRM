import { deleteBookingAction } from "@/app/actions/crud";
import { BookingFormDrawer } from "@/components/crm/crud-form-drawers";
import { DeleteButton } from "@/components/crm/delete-button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { BookingStatus } from "@/generated/prisma/enums";
import { toneForStatus } from "@/lib/status";
import { formatDateTime, labelFromEnum } from "@/lib/utils";
import { getBookingsData, getCrmFormOptions } from "@/services/crm-queries";
import { CalendarDays } from "lucide-react";

export default async function BookingsPage() {
  const [bookings, options] = await Promise.all([
    getBookingsData(),
    getCrmFormOptions(),
  ]);
  const columns = [
    BookingStatus.REQUESTED,
    BookingStatus.CONFIRMED,
    BookingStatus.ARRIVED,
    BookingStatus.IN_SERVICE,
    BookingStatus.COMPLETED,
    BookingStatus.CANCELLED,
    BookingStatus.NO_SHOW,
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Appointments"
        title="Booking"
        description="Antrian booking live dengan sumber lead, kebutuhan servis, dan ownership advisor."
        actions={<BookingFormDrawer {...options} />}
      />
      {bookings.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Belum ada booking"
          description="Buat booking manual atau ubah reminder yang siap follow-up menjadi janji servis."
          action={<BookingFormDrawer {...options} />}
        />
      ) : (
        <section className="grid gap-4 overflow-x-auto pb-2 xl:grid-cols-7">
          {columns.map((status) => (
            <div
              key={status}
              className="min-w-64 rounded-lg border border-zinc-200 bg-zinc-100/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/70"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {labelFromEnum(status)}
                </h2>
                <StatusBadge tone={toneForStatus(status)}>
                  {bookings.filter((booking) => booking.status === status).length}
                </StatusBadge>
              </div>
              <div className="space-y-2">
                {bookings
                  .filter((booking) => booking.status === status)
                  .map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                        {booking.bookingNumber}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {booking.customer.firstName} {booking.customer.lastName}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDateTime(booking.scheduledStart)}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </section>
      )}
      {bookings.length > 0 ? (
        <DataTable
          data={bookings}
          getRowKey={(row) => row.id}
          columns={[
            {
              key: "booking",
              header: "Booking",
              cell: (row) => (
                <div>
                  <p className="font-medium text-zinc-950 dark:text-white">
                    {row.bookingNumber}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatDateTime(row.scheduledStart)}
                  </p>
                </div>
              ),
            },
            {
              key: "customer",
              header: "Customer",
              cell: (row) => `${row.customer.firstName} ${row.customer.lastName}`,
            },
            {
              key: "vehicle",
              header: "Vehicle",
              cell: (row) => `${row.vehicle.make} ${row.vehicle.model}`,
            },
            {
              key: "services",
              header: "Requested services",
              cell: (row) => row.requestedServices.join(", "),
            },
            {
              key: "source",
              header: "Source",
              cell: (row) => (
                <StatusBadge tone={toneForStatus(row.source)}>
                  {labelFromEnum(row.source)}
                </StatusBadge>
              ),
            },
            {
              key: "advisor",
              header: "Advisor",
              cell: (row) => row.advisor?.name ?? "Unassigned",
            },
            {
              key: "status",
              header: "Status",
              cell: (row) => (
                <StatusBadge tone={toneForStatus(row.status)}>
                  {labelFromEnum(row.status)}
                </StatusBadge>
              ),
            },
            {
              key: "actions",
              header: "Actions",
              cell: (row) => (
                <div className="flex gap-2">
                  <BookingFormDrawer
                    booking={{
                      id: row.id,
                      bookingNumber: row.bookingNumber,
                      customerId: row.customerId,
                      vehicleId: row.vehicleId,
                      branchId: row.branchId,
                      advisorId: row.advisorId ?? undefined,
                      status: row.status,
                      source: row.source,
                      scheduledStart: row.scheduledStart,
                      scheduledEnd: row.scheduledEnd,
                      requestedServices: row.requestedServices,
                      notes: row.notes ?? undefined,
                    }}
                    {...options}
                  />
                  <DeleteButton
                    id={row.id}
                    entityName="booking"
                    action={deleteBookingAction}
                  />
                </div>
              ),
            },
          ]}
        />
      ) : null}
    </div>
  );
}
