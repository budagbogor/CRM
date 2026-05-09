import {
  convertReminderToBookingAction,
  deleteReminderAction,
  markReminderNoResponseAction,
  markReminderRespondedAction,
  markReminderSentAction,
} from "@/app/actions/crud";
import { calculateNextServiceAction } from "@/app/actions/retention";
import { ReminderFormDrawer } from "@/components/crm/crud-form-drawers";
import { AiAssistantPanel } from "@/components/crm/ai-assistant-panel";
import { DeleteButton } from "@/components/crm/delete-button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { toneForStatus } from "@/lib/status";
import { formatDateTime, labelFromEnum } from "@/lib/utils";
import { getCrmFormOptions, getRemindersData } from "@/services/crm-queries";
import { getAiProvider } from "@/services/ai";
import { Bell } from "lucide-react";

export default async function RemindersPage() {
  const [reminders, options] = await Promise.all([
    getRemindersData(),
    getCrmFormOptions(),
  ]);
  const aiProvider = getAiProvider();
  const customerIds = [...new Set(reminders.map((reminder) => reminder.customerId))].slice(0, 3);
  const reminderInsights = await Promise.all(
    customerIds.map(async (customerId) => {
      const insight = await aiProvider.generateCustomerInsight(customerId);
      return {
        title: insight.customerName,
        summary: `Campaign: ${insight.suggestedServiceCampaign}`,
        recommendedAction: `${insight.nextBestAction} • Channel ${insight.recommendedReminderChannel}`,
        confidence: insight.confidence,
        sourceData: insight.sourceData,
      };
    })
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Retention"
        title="Reminder"
        description="Reminder live untuk follow-up, next service, callback, dan aksi retention outlet."
        actions={<ReminderFormDrawer {...options} />}
      />
      {reminderInsights.length > 0 ? (
        <AiAssistantPanel title="AI Assistant - Reminder Intelligence" items={reminderInsights} />
      ) : null}
      {reminders.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Belum ada reminder"
          description="Buat reminder manual atau biarkan workflow retention Mobeng membuatnya otomatis."
          action={<ReminderFormDrawer {...options} />}
        />
      ) : (
        <DataTable
          data={reminders}
          getRowKey={(row) => row.id}
          columns={[
          {
            key: "reminder",
            header: "Reminder",
            cell: (row) => (
              <div>
                <p className="font-medium text-zinc-950 dark:text-white">
                  {row.title}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {row.vehicle
                    ? `${row.vehicle.make} ${row.vehicle.model}`
                    : "Customer reminder"}
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
            key: "type",
            header: "Type",
            cell: (row) => (
              <StatusBadge tone={toneForStatus(row.type)}>
                {labelFromEnum(row.type)}
              </StatusBadge>
            ),
          },
          { key: "due", header: "Due", cell: (row) => formatDateTime(row.dueAt) },
          {
            key: "assignee",
            header: "Assignee",
            cell: (row) => row.assignedTo?.name ?? "Unassigned",
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
              key: "action",
              header: "Action center",
              cell: (row) => (
                <div className="flex flex-wrap gap-2">
                  <ReminderFormDrawer
                    reminder={{
                      id: row.id,
                      customerId: row.customerId,
                      vehicleId: row.vehicleId ?? undefined,
                      branchId: row.branchId ?? undefined,
                      assignedToId: row.assignedToId ?? undefined,
                      type: row.type,
                      status: row.status,
                      title: row.title,
                      notes: row.notes ?? undefined,
                      dueAt: row.dueAt,
                    }}
                    {...options}
                  />
                  <form action={markReminderSentAction.bind(null, row.id)}>
                    <button className="h-8 rounded-md border border-zinc-200 px-3 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                      Sent
                    </button>
                  </form>
                  <form action={markReminderRespondedAction.bind(null, row.id)}>
                    <button className="h-8 rounded-md border border-emerald-200 px-3 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300">
                      Responded
                    </button>
                  </form>
                  {row.vehicleId && row.branchId ? (
                    <form action={convertReminderToBookingAction.bind(null, row.id)}>
                      <button className="h-8 rounded-md border border-sky-200 px-3 text-xs font-medium text-sky-700 hover:bg-sky-50 dark:border-sky-900 dark:text-sky-300">
                        Booking
                      </button>
                    </form>
                  ) : null}
                  <form action={markReminderNoResponseAction.bind(null, row.id)}>
                    <button className="h-8 rounded-md border border-amber-200 px-3 text-xs font-medium text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-300">
                      No response
                    </button>
                  </form>
                  {row.vehicleId ? (
                    <form action={calculateNextServiceAction.bind(null, row.vehicleId)}>
                      <button className="h-8 rounded-md border border-zinc-200 px-3 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                        Recalc
                      </button>
                    </form>
                  ) : null}
                  <DeleteButton
                    id={row.id}
                    entityName="reminder"
                    action={deleteReminderAction}
                  />
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
