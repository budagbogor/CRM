import {
  Bell,
  CalendarCheck,
  ClipboardCheck,
  GitBranch,
  MessageSquareWarning,
  Phone,
  Wrench,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { toneForStatus } from "@/lib/status";
import { formatDateTime, labelFromEnum } from "@/lib/utils";
import { getCustomerJourneyData } from "@/services/crm-queries";

const eventIcons = {
  LEAD_CREATED: Phone,
  SERVICE_COMPLETED: Wrench,
  SURVEY_SENT: ClipboardCheck,
  SURVEY_COMPLETED: ClipboardCheck,
  COMPLAINT_OPENED: MessageSquareWarning,
  REMINDER_CREATED: Bell,
  BOOKING_CREATED: CalendarCheck,
};

export default async function JourneyPage() {
  const events = await getCustomerJourneyData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Journey pelanggan"
        title="Timeline"
        description="Kronologi interaksi pelanggan Mobeng di servis, survey, reminder, komplain, dan booking."
      />
      <div className="flex flex-wrap gap-2">
        {["Semua", "Servis", "Survey", "Komplain", "Reminder", "Booking"].map((filter) => (
          <span
            key={filter}
            className="rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
          >
            {filter}
          </span>
        ))}
      </div>
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="space-y-0">
          {events.length === 0 ? (
            <EmptyState
              icon={GitBranch}
              title="Belum ada activity journey"
              description="Jalankan seed untuk menampilkan cerita retention Mobeng dari awal sampai akhir."
            />
          ) : (
            events.map((event, index) => {
              const Icon = eventIcons[event.eventType as keyof typeof eventIcons] ?? Bell;
              return (
                <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {index !== events.length - 1 ? (
                    <span className="absolute left-5 top-10 h-full w-px bg-zinc-200 dark:bg-zinc-800" />
                  ) : null}
                  <div className="z-10 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 rounded-lg border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-zinc-950 dark:text-white">
                          {event.title}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                          {event.customer.firstName} {event.customer.lastName}
                          {event.vehicle ? ` - ${event.vehicle.make} ${event.vehicle.model}` : ""}
                          {event.serviceTransaction
                            ? ` - ${event.serviceTransaction.serviceNumber}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge tone={toneForStatus(event.eventType)}>
                          {labelFromEnum(event.eventType)}
                        </StatusBadge>
                        <span className="text-xs text-zinc-500">
                          {formatDateTime(event.eventAt)}
                        </span>
                      </div>
                    </div>
                    {event.description ? (
                      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
                        {event.description}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
