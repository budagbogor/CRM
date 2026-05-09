import Link from "next/link";
import {
  AlertTriangle,
  CalendarCheck,
  ClipboardList,
  HeartPulse,
  Repeat2,
  Smile,
  TimerReset,
  Users,
  Wrench,
} from "lucide-react";
import { DashboardVisuals } from "@/components/crm/dashboard-visuals";
import { BranchGlobalFilter } from "@/components/crm/branch-global-filter";
import { MobileQuickActions } from "@/components/crm/mobile-quick-actions";
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
import { getDashboardData } from "@/services/crm-queries";
import { getAiProvider } from "@/services/ai";

type DashboardPageProps = {
  searchParams?: Promise<{
    branchId?: string;
    from?: string;
    to?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = (await searchParams) ?? {};
  const {
    metrics,
    retentionFunnel,
    recentTransactions,
    overdueServices,
    complaintSlaAlerts,
    todayBookingsList,
    topChurnRiskCustomers,
    repeatServiceTrend,
    branchRanking,
    branchComparison,
    performance,
    filterContext,
  } = await getDashboardData({
    branchId: params.branchId && params.branchId !== "all" ? params.branchId : undefined,
    from: params.from ? new Date(params.from) : undefined,
    to: params.to ? new Date(params.to) : undefined,
  });
  const aiProvider = getAiProvider();
  const assistantInsights = await Promise.all(
    topChurnRiskCustomers.slice(0, 3).map(async (item) => {
      const insight = await aiProvider.generateCustomerInsight(item.customerId);
      return {
        title: insight.customerName,
        summary: `Risk ${insight.churnRiskScore}: ${insight.churnRiskReason}`,
        recommendedAction: insight.nextBestAction,
        confidence: insight.confidence,
        sourceData: insight.sourceData,
      };
    })
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mobeng CRM"
        title="HQ & Branch Dashboard"
        description="Monitoring kinerja multi-branch Mobeng untuk tim HQ dan operasional outlet."
      />
      <BranchGlobalFilter
        branches={filterContext.branches}
        selectedBranchId={filterContext.selectedBranchId}
        from={params.from}
        to={params.to}
      />
      <MobileQuickActions />
      {assistantInsights.length > 0 ? <AiAssistantPanel items={assistantInsights} /> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Pelanggan aktif"
          value={metrics.activeCustomers}
          detail="Total profil pelanggan yang sedang dipantau di Mobeng CRM."
          icon={Users}
          tone="sky"
        />
        <DashboardCard
          title="Pelanggan servis ulang"
          value={metrics.repeatCustomers}
          detail="Pelanggan yang sudah minimal dua kali servis completed."
          icon={Repeat2}
          tone="emerald"
        />
        <DashboardCard
          title="Kasus recovery aktif"
          value={metrics.openComplaints}
          detail="Tiket komplain yang masih diselidiki atau menunggu tindak lanjut."
          icon={AlertTriangle}
          tone="rose"
        />
        <DashboardCard
          title="Booking hari ini"
          value={metrics.todayBookings}
          detail="Janji servis yang dijadwalkan datang hari ini."
          icon={CalendarCheck}
          tone="violet"
        />
        <DashboardCard
          title="Aksi retention berjalan"
          value={metrics.upcomingReminders}
          detail="Reminder advisor yang siap dikontak ke pelanggan."
          icon={ClipboardList}
          tone="amber"
        />
        <DashboardCard
          title="CSAT rata-rata"
          value={`${metrics.customerSatisfaction}%`}
          detail="Kepuasan pelanggan dari survey follow-up yang sudah selesai."
          icon={Smile}
          tone="emerald"
        />
        <DashboardCard
          title="Pelanggan berisiko churn"
          value={metrics.churnRiskCount}
          detail="Pelanggan di band watch, at-risk, atau lost."
          icon={HeartPulse}
          tone="rose"
        />
        <DashboardCard
          title="Revenue servis"
          value={formatCurrency(metrics.revenue)}
          detail="Nilai transaksi servis completed pada data demo Mobeng."
          icon={Wrench}
          tone="zinc"
        />
      </section>

      <DashboardVisuals
        funnel={retentionFunnel}
        repeatServiceTrend={repeatServiceTrend}
      />
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-base font-semibold text-zinc-950 dark:text-white">Branch Ranking</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Peringkat cabang berdasarkan revenue servis.</p>
          <div className="mt-4 space-y-2">
            {branchRanking.map((branch, index) => (
              <div key={branch.branchId} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
                <div>
                  <p className="font-medium">{index + 1}. {branch.branchName}</p>
                  <p className="text-xs text-zinc-500">{branch.transactions} transaksi</p>
                </div>
                <p className="font-semibold">{formatCurrency(branch.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-base font-semibold text-zinc-950 dark:text-white">Performance Metrics</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <DashboardCard title="Advisor Top" value={performance.serviceAdvisors[0]?.completedTransactions ?? 0} detail={performance.serviceAdvisors[0]?.advisorId ?? "-"} icon={Users} tone="sky" />
            <DashboardCard title="Technician Top" value={performance.technicians[0]?.completedTransactions ?? 0} detail={performance.technicians[0]?.technicianName ?? "-"} icon={Wrench} tone="emerald" />
            <DashboardCard title="SLA Breaches" value={performance.complaintRecoverySla.breaches} detail="Complaint recovery overdue" icon={AlertTriangle} tone="rose" />
            <DashboardCard title="Reminder Conversion" value={`${performance.reminderConversionByBranch[0]?.conversionRate ?? 0}%`} detail={performance.reminderConversionByBranch[0]?.branchName ?? "-"} icon={Repeat2} tone="amber" />
          </div>
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">Branch Comparison</h2>
        <DataTable
          data={branchComparison}
          getRowKey={(row) => row.branchId}
          columns={[
            { key: "branch", header: "Branch", cell: (row) => <Link href={`/branches/${row.branchId}`} className="font-medium text-sky-700 hover:underline dark:text-sky-300">{row.branchName}</Link> },
            { key: "revenue", header: "Revenue", cell: (row) => formatCurrency(row.revenue) },
            { key: "transactions", header: "Transactions", cell: (row) => row.transactions },
            { key: "customers", header: "Customers", cell: (row) => row.customers },
            { key: "bookings", header: "Bookings Today", cell: (row) => row.bookingsToday },
            { key: "complaints", header: "Open Complaints", cell: (row) => row.openComplaints },
          ]}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                Alert servis overdue
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {metrics.overdueServices} kendaraan sudah melewati jadwal servis ideal.
              </p>
            </div>
            <StatusBadge tone="warning">{metrics.overdueServices} alert</StatusBadge>
          </div>
          <div className="mt-5 space-y-3">
            {overdueServices.length === 0 ? (
              <EmptyState
                icon={Wrench}
                title="Belum ada kendaraan overdue"
                description="Semua kendaraan demo masih berada dalam jendela servis yang aman."
              />
            ) : (
              overdueServices.map((vehicle) => (
                <Link
                  key={vehicle.id}
                  href={`/customers/${vehicle.customerId}`}
                  className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 transition hover:border-sky-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-sky-800 dark:hover:bg-zinc-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-zinc-950 dark:text-white">
                        {vehicle.customer.firstName} {vehicle.customer.lastName}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {vehicle.make} {vehicle.model} - {vehicle.licensePlate}
                      </p>
                    </div>
                    <StatusBadge tone="danger">
                      {vehicle.nextServiceDueDate
                        ? formatRelativeDays(vehicle.nextServiceDueDate)
                        : "Due"}
                    </StatusBadge>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    Due date {vehicle.nextServiceDueDate ? formatDate(vehicle.nextServiceDueDate) : "-"} -
                    Odometer {vehicle.odometer.toLocaleString("id-ID")} km
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                Alert SLA komplain
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {metrics.slaBreaches} recovery action sudah melewati janji waktu tindak lanjut.
              </p>
            </div>
            <StatusBadge tone="danger">{metrics.slaBreaches} breach</StatusBadge>
          </div>
          <div className="mt-5 space-y-3">
            {complaintSlaAlerts.length === 0 ? (
              <EmptyState
                icon={TimerReset}
                title="Belum ada SLA komplain yang lewat"
                description="Seluruh recovery action masih berada dalam jendela SLA yang dijanjikan."
              />
            ) : (
              complaintSlaAlerts.map((action) => (
                <div
                  key={action.id}
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-zinc-950 dark:text-white">
                        {action.complaintTicket.customer.firstName}{" "}
                        {action.complaintTicket.customer.lastName}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {action.complaintTicket.subject}
                      </p>
                    </div>
                    <StatusBadge tone={toneForStatus(action.complaintTicket.status)}>
                      {labelFromEnum(action.complaintTicket.status)}
                    </StatusBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                    <span>Owner: {action.owner?.name ?? "Belum ditugaskan"}</span>
                    <span>
                      Due: {action.promisedAt ? formatDateTime(action.promisedAt) : "-"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                Daftar booking hari ini
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Kendaraan yang diperkirakan masuk outlet hari ini.
              </p>
            </div>
            <StatusBadge tone="info">{todayBookingsList.length} booking</StatusBadge>
          </div>
          <div className="mt-5 space-y-3">
            {todayBookingsList.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="Belum ada booking untuk hari ini"
                description="Belum ada kendaraan yang dijadwalkan datang hari ini pada data demo saat ini."
              />
            ) : (
              todayBookingsList.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-zinc-950 dark:text-white">
                        {booking.customer.firstName} {booking.customer.lastName}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {booking.vehicle.make} {booking.vehicle.model} -{" "}
                        {booking.vehicle.licensePlate}
                      </p>
                    </div>
                    <StatusBadge tone={toneForStatus(booking.status)}>
                      {labelFromEnum(booking.status)}
                    </StatusBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                    <span>{formatDateTime(booking.scheduledStart)}</span>
                    <span>Advisor: {booking.advisor?.name ?? "Belum ditugaskan"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                Pelanggan churn risk tertinggi
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Skor kesehatan terendah untuk review owner dan intervensi advisor.
              </p>
            </div>
            <StatusBadge tone="danger">{topChurnRiskCustomers.length} prioritas</StatusBadge>
          </div>
          <div className="mt-5 space-y-3">
            {topChurnRiskCustomers.map((health) => (
              <Link
                key={health.id}
                href={`/customers/${health.customerId}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 p-4 transition hover:border-rose-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-rose-900 dark:hover:bg-zinc-900"
              >
                <div>
                  <p className="font-medium text-zinc-950 dark:text-white">
                    {health.customer.firstName} {health.customer.lastName}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {health.nextBestAction ?? "Perlu review advisor"}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge tone={toneForStatus(health.band)}>
                    {labelFromEnum(health.band)}
                  </StatusBadge>
                  <p className="mt-2 text-sm font-semibold text-zinc-950 dark:text-white">
                    Score {health.score}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
            Transaksi servis terbaru
          </h2>
          <DataTable
            data={recentTransactions}
            getRowKey={(row) => row.id}
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
                key: "customer",
                header: "Customer",
                cell: (row) => (
                  <Link
                    href={`/customers/${row.customerId}`}
                    className="font-medium text-sky-700 hover:underline dark:text-sky-300"
                  >
                    {row.customer.firstName} {row.customer.lastName}
                  </Link>
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
            Poin demo untuk owner
          </h2>
          <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="text-sm font-medium text-zinc-950 dark:text-white">
                Coverage retention
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {retentionFunnel[1]?.value ?? 0} dari {retentionFunnel[0]?.value ?? 0} servis
                completed sudah masuk ke funnel survey Mobeng.
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="text-sm font-medium text-zinc-950 dark:text-white">
                Fokus recovery
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {metrics.slaBreaches} recovery action sudah lewat SLA dan layak menjadi topik
                eskalasi pertama saat demo.
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="text-sm font-medium text-zinc-950 dark:text-white">
                Peluang servis
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {metrics.overdueServices} kendaraan sudah overdue, sehingga alur reminder dan
                konversi booking mudah didemokan ke owner bengkel.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
