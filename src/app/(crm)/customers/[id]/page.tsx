import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Bell,
  CalendarClock,
  ClipboardCheck,
  HeartPulse,
  MessageSquareWarning,
  Phone,
  Wrench,
} from "lucide-react";
import { CustomerFormDrawer } from "@/components/crm/crud-form-drawers";
import { AiAssistantPanel } from "@/components/crm/ai-assistant-panel";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { toneForStatus } from "@/lib/status";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelativeDays,
  labelFromEnum,
} from "@/lib/utils";
import { getCrmFormOptions, getCustomerProfileData } from "@/services/crm-queries";
import { getAiProvider } from "@/services/ai";

const eventIcons = {
  LEAD_CREATED: Phone,
  BOOKING_CREATED: CalendarClock,
  SERVICE_COMPLETED: Wrench,
  SURVEY_SENT: ClipboardCheck,
  SURVEY_COMPLETED: ClipboardCheck,
  COMPLAINT_OPENED: MessageSquareWarning,
  REMINDER_CREATED: Bell,
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [customer, options] = await Promise.all([
    getCustomerProfileData(id),
    getCrmFormOptions(),
  ]);
  const insight = customer ? await getAiProvider().generateCustomerInsight(customer.id) : null;

  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profil pelanggan"
        title={`${customer.firstName} ${customer.lastName}`}
        description={`${customer.customerNumber} - ${customer.branch.name} - ${customer.phone}`}
        actions={
          <CustomerFormDrawer
            customer={{
              id: customer.id,
              customerNumber: customer.customerNumber,
              branchId: customer.branchId,
              assignedAdvisorId: customer.assignedAdvisorId ?? undefined,
              firstName: customer.firstName,
              lastName: customer.lastName,
              email: customer.email ?? undefined,
              phone: customer.phone,
              type: customer.type,
              status: customer.status,
              preferredChannel: customer.preferredChannel,
              acquisitionSource: customer.acquisitionSource ?? undefined,
              companyName: customer.companyName ?? undefined,
              consentMarketing: customer.consentMarketing,
              notes: customer.notes ?? undefined,
            }}
            branches={options.branches}
            users={options.users}
          />
        }
      />

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
            Ringkasan profil
          </h2>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
            <SummaryItem label="Status" value={<StatusBadge tone={toneForStatus(customer.status)}>{labelFromEnum(customer.status)}</StatusBadge>} />
            <SummaryItem label="Type" value={labelFromEnum(customer.type)} />
            <SummaryItem label="Preferred channel" value={labelFromEnum(customer.preferredChannel)} />
            <SummaryItem label="Advisor" value={customer.assignedAdvisor?.name ?? "Belum ditugaskan"} />
            <SummaryItem label="Acquisition source" value={customer.acquisitionSource ?? "Unknown"} />
            <SummaryItem label="Kontak terakhir" value={customer.lastContactedAt ? formatDate(customer.lastContactedAt) : "Belum ada kontak terbaru"} />
            <SummaryItem label="Email" value={customer.email ?? "-"} />
            <SummaryItem label="Company" value={customer.companyName ?? "-"} />
            <SummaryItem label="Marketing consent" value={customer.consentMarketing ? "Granted" : "Not granted"} />
          </dl>
          {customer.notes ? (
            <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              {customer.notes}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4">
          <DashboardCard
            title="Health score"
            value={customer.healthScore?.score ?? "N/A"}
            detail={customer.healthScore?.nextBestAction ?? "Run health scoring for this customer."}
            icon={HeartPulse}
            tone={customer.healthScore ? "emerald" : "zinc"}
          />
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
            Rincian health score
              </h2>
              {customer.healthScore ? (
                <StatusBadge tone={toneForStatus(customer.healthScore.band)}>
                  {labelFromEnum(customer.healthScore.band)}
                </StatusBadge>
              ) : null}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <SummaryItem
                label="Lifetime value"
                value={formatCurrency(Number(customer.healthScore?.lifetimeValue ?? 0))}
              />
              <SummaryItem
                label="Completed visits"
                value={String(customer.healthScore?.totalVisits ?? 0)}
              />
              <SummaryItem
                label="Open complaints"
                value={String(customer.healthScore?.openComplaints ?? 0)}
              />
              <SummaryItem
                label="Missed bookings"
                value={String(customer.healthScore?.missedBookings ?? 0)}
              />
            </div>
          </div>
        </div>
      </section>
      {insight ? (
        <AiAssistantPanel
          title="AI Assistant - Customer Insight"
          items={[
            {
              title: insight.customerName,
              summary: `Risk ${insight.churnRiskScore}: ${insight.churnRiskReason}`,
              recommendedAction: `${insight.nextBestAction} • Channel: ${insight.recommendedReminderChannel} • Campaign: ${insight.suggestedServiceCampaign}`,
              confidence: insight.confidence,
              sourceData: insight.sourceData,
            },
          ]}
        />
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
          Vehicles
        </h2>
        {customer.vehicles.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="Belum ada kendaraan di profil ini"
            description="Tambahkan kendaraan untuk mulai melacak cadence servis dan reminder."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {customer.vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-zinc-950 dark:text-white">
                      {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {vehicle.licensePlate} - {vehicle.year}
                    </p>
                  </div>
                  <StatusBadge tone={toneForStatus(vehicle.status)}>
                    {labelFromEnum(vehicle.status)}
                  </StatusBadge>
                </div>
                <dl className="mt-4 grid gap-3 text-sm">
                  <SummaryItem label="Odometer" value={`${vehicle.odometer.toLocaleString("id-ID")} km`} />
                  <SummaryItem label="Transmission" value={vehicle.transmission ?? "-"} />
                  <SummaryItem
                    label="Next service due"
                    value={
                      vehicle.nextServiceDueDate
                        ? `${formatDate(vehicle.nextServiceDueDate)} (${formatRelativeDays(vehicle.nextServiceDueDate)})`
                        : "Not calculated"
                    }
                  />
                </dl>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
            Service history
          </h2>
          <DataTable
            data={customer.serviceTransactions}
            getRowKey={(row) => row.id}
            emptyMessage="Belum ada riwayat servis."
            columns={[
              {
                key: "service",
                header: "Service",
                cell: (row) => (
                  <div>
                    <p className="font-medium text-zinc-950 dark:text-white">
                      {row.serviceNumber}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {row.vehicle.make} {row.vehicle.model}
                    </p>
                  </div>
                ),
              },
              {
                key: "date",
                header: "Opened",
                cell: (row) => formatDate(row.openedAt),
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
                key: "advisor",
                header: "Advisor",
                cell: (row) => row.advisor?.name ?? row.technicianName ?? "Unassigned",
              },
              {
                key: "amount",
                header: "Amount",
                cell: (row) => formatCurrency(Number(row.totalAmount)),
              },
            ]}
          />
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
            Bookings
          </h2>
          <DataTable
            data={customer.bookings}
            getRowKey={(row) => row.id}
            emptyMessage="Belum ada booking."
            columns={[
              {
                key: "number",
                header: "Booking",
                cell: (row) => (
                  <div>
                    <p className="font-medium text-zinc-950 dark:text-white">
                      {row.bookingNumber}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {row.vehicle.make} {row.vehicle.model}
                    </p>
                  </div>
                ),
              },
              {
                key: "start",
                header: "Start",
                cell: (row) => formatDateTime(row.scheduledStart),
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
            ]}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
            Reminders
          </h2>
          <DataTable
            data={customer.reminders}
            getRowKey={(row) => row.id}
            emptyMessage="Belum ada reminder terjadwal."
            columns={[
              {
                key: "title",
                header: "Reminder",
                cell: (row) => (
                  <div>
                    <p className="font-medium text-zinc-950 dark:text-white">{row.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {row.vehicle ? `${row.vehicle.make} ${row.vehicle.model}` : "Customer level"}
                    </p>
                  </div>
                ),
              },
              {
                key: "due",
                header: "Due",
                cell: (row) => formatDateTime(row.dueAt),
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
            ]}
          />
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
            Complaints
          </h2>
          <DataTable
            data={customer.complaints}
            getRowKey={(row) => row.id}
            emptyMessage="Belum ada komplain pada profil ini."
            columns={[
              {
                key: "ticket",
                header: "Ticket",
                cell: (row) => (
                  <div>
                    <p className="font-medium text-zinc-950 dark:text-white">
                      {row.ticketNumber}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{row.subject}</p>
                  </div>
                ),
              },
              {
                key: "opened",
                header: "Opened",
                cell: (row) => formatDate(row.openedAt),
              },
              {
                key: "priority",
                header: "Priority",
                cell: (row) => (
                  <StatusBadge tone={toneForStatus(row.priority)}>
                    {labelFromEnum(row.priority)}
                  </StatusBadge>
                ),
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
            ]}
          />
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
              Journey timeline
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Kronologi interaksi pelanggan ini di booking, servis, survey, komplain, dan reminder.
            </p>
          </div>
          <Link
            href="/journey"
            className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-300"
          >
            Open full timeline
          </Link>
        </div>
        <div className="mt-6 space-y-0">
          {customer.journeyEvents.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="Belum ada activity timeline"
              description="Pelanggan ini belum memiliki activity journey."
            />
          ) : (
            customer.journeyEvents.map((event, index) => {
              const Icon =
                eventIcons[event.eventType as keyof typeof eventIcons] ?? ClipboardCheck;

              return (
                <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {index !== customer.journeyEvents.length - 1 ? (
                    <span className="absolute left-5 top-10 h-full w-px bg-zinc-200 dark:bg-zinc-800" />
                  ) : null}
                  <div className="z-10 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-zinc-950 dark:text-white">
                          {event.title}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                          {event.vehicle ? `${event.vehicle.make} ${event.vehicle.model}` : "Customer event"}
                          {event.serviceTransaction ? ` - ${event.serviceTransaction.serviceNumber}` : ""}
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
                      <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
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

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="mt-1 font-medium text-zinc-950 dark:text-white">{value}</dd>
    </div>
  );
}
