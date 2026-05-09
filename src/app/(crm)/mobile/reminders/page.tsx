import {
  convertReminderToBookingAction,
  markReminderRespondedAction,
  markReminderSentAction,
} from "@/app/actions/crud";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { toneForStatus } from "@/lib/status";
import { formatDateTime, labelFromEnum } from "@/lib/utils";
import { getRemindersData } from "@/services/crm-queries";
import { Bell } from "lucide-react";

export default async function MobileRemindersPage() {
  const reminders = await getRemindersData();
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Mobile View" title="Reminder Action Center" description="Aksi cepat reminder untuk tim CS dan advisor." />
      {reminders.length === 0 ? (
        <EmptyState icon={Bell} title="Belum ada reminder" description="Reminder retention akan muncul di sini." />
      ) : (
        <DataTable
          data={reminders}
          getRowKey={(row) => row.id}
          mobileCardTitle={(row) => row.title}
          columns={[
            { key: "title", header: "Reminder", cell: (row) => row.title },
            { key: "customer", header: "Customer", cell: (row) => `${row.customer.firstName} ${row.customer.lastName}` },
            { key: "due", header: "Due", cell: (row) => formatDateTime(row.dueAt) },
            { key: "status", header: "Status", cell: (row) => <StatusBadge tone={toneForStatus(row.status)}>{labelFromEnum(row.status)}</StatusBadge> },
            {
              key: "actions",
              header: "Actions",
              cell: (row) => (
                <div className="flex flex-wrap justify-end gap-2">
                  <form action={markReminderSentAction.bind(null, row.id)}>
                    <button className="h-10 rounded-lg border border-zinc-200 px-3 text-xs font-medium dark:border-zinc-800">Sent</button>
                  </form>
                  <form action={markReminderRespondedAction.bind(null, row.id)}>
                    <button className="h-10 rounded-lg border border-emerald-200 px-3 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:text-emerald-300">Responded</button>
                  </form>
                  {row.vehicleId && row.branchId ? (
                    <form action={convertReminderToBookingAction.bind(null, row.id)}>
                      <button className="h-10 rounded-lg border border-sky-200 px-3 text-xs font-medium text-sky-700 dark:border-sky-900 dark:text-sky-300">To Booking</button>
                    </form>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}

