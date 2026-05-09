import { notFound } from "next/navigation";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { toneForStatus } from "@/lib/status";
import { formatCurrency, formatDateTime, labelFromEnum } from "@/lib/utils";
import { getBranchDetailData } from "@/services/crm-queries";
import { AlertTriangle, Bell, CalendarClock, Smile, Users, Wrench } from "lucide-react";

type BranchDetailProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ from?: string; to?: string }>;
};

export default async function BranchDetailPage({ params, searchParams }: BranchDetailProps) {
  const { id } = await params;
  const dateParams = (await searchParams) ?? {};
  const data = await getBranchDetailData(id, {
    from: dateParams.from ? new Date(dateParams.from) : undefined,
    to: dateParams.to ? new Date(dateParams.to) : undefined,
  });

  if (!data) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Branch Detail"
        title={data.branch.name}
        description={`${data.branch.address}, ${data.branch.city}`}
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Revenue" value={formatCurrency(data.metrics.revenue)} detail="Completed transactions" icon={Wrench} tone="emerald" />
        <DashboardCard title="Transactions" value={data.metrics.transactions} detail="Total periode filter" icon={Wrench} tone="sky" />
        <DashboardCard title="Bookings" value={data.metrics.bookings} detail="Branch booking load" icon={CalendarClock} tone="violet" />
        <DashboardCard title="Complaints" value={data.metrics.complaints} detail="Cases tracked" icon={AlertTriangle} tone="rose" />
        <DashboardCard title="Reminders" value={data.metrics.reminders} detail="Retention reminders" icon={Bell} tone="amber" />
        <DashboardCard title="CSAT" value={`${data.metrics.customerSatisfaction}%`} detail="Follow-up survey score" icon={Smile} tone="emerald" />
        <DashboardCard title="Repeat Rate" value={`${data.metrics.repeatCustomerRate}%`} detail="Repeat completed customers" icon={Users} tone="zinc" />
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">Team Users</h2>
        {data.users.length === 0 ? (
          <EmptyState icon={Users} title="Belum ada user cabang" description="Tambahkan user untuk menjalankan operasional cabang." />
        ) : (
          <DataTable
            data={data.users}
            getRowKey={(row) => row.id}
            columns={[
              { key: "name", header: "Name", cell: (row) => row.name },
              { key: "email", header: "Email", cell: (row) => row.email },
              { key: "role", header: "Role", cell: (row) => row.role.name },
              { key: "status", header: "Status", cell: (row) => <StatusBadge tone={toneForStatus(row.status)}>{labelFromEnum(row.status)}</StatusBadge> },
            ]}
          />
        )}
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">Transactions</h2>
        <DataTable
          data={data.transactions}
          getRowKey={(row) => row.id}
          columns={[
            { key: "service", header: "Service", cell: (row) => row.serviceNumber },
            { key: "customer", header: "Customer", cell: (row) => `${row.customer.firstName} ${row.customer.lastName}` },
            { key: "status", header: "Status", cell: (row) => <StatusBadge tone={toneForStatus(row.status)}>{labelFromEnum(row.status)}</StatusBadge> },
            { key: "amount", header: "Amount", cell: (row) => formatCurrency(Number(row.totalAmount)) },
            { key: "openedAt", header: "Opened", cell: (row) => formatDateTime(row.openedAt) },
          ]}
        />
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">Bookings</h2>
        <DataTable
          data={data.bookings}
          getRowKey={(row) => row.id}
          columns={[
            { key: "booking", header: "Booking", cell: (row) => row.bookingNumber },
            { key: "customer", header: "Customer", cell: (row) => `${row.customer.firstName} ${row.customer.lastName}` },
            { key: "status", header: "Status", cell: (row) => <StatusBadge tone={toneForStatus(row.status)}>{labelFromEnum(row.status)}</StatusBadge> },
            { key: "start", header: "Scheduled", cell: (row) => formatDateTime(row.scheduledStart) },
          ]}
        />
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">Complaints</h2>
        <DataTable
          data={data.complaints}
          getRowKey={(row) => row.id}
          columns={[
            { key: "ticket", header: "Ticket", cell: (row) => row.ticketNumber },
            { key: "customer", header: "Customer", cell: (row) => `${row.customer.firstName} ${row.customer.lastName}` },
            { key: "priority", header: "Priority", cell: (row) => <StatusBadge tone={toneForStatus(row.priority)}>{labelFromEnum(row.priority)}</StatusBadge> },
            { key: "status", header: "Status", cell: (row) => <StatusBadge tone={toneForStatus(row.status)}>{labelFromEnum(row.status)}</StatusBadge> },
          ]}
        />
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">Reminders</h2>
        <DataTable
          data={data.reminders}
          getRowKey={(row) => row.id}
          columns={[
            { key: "title", header: "Reminder", cell: (row) => row.title },
            { key: "customer", header: "Customer", cell: (row) => `${row.customer.firstName} ${row.customer.lastName}` },
            { key: "due", header: "Due", cell: (row) => formatDateTime(row.dueAt) },
            { key: "status", header: "Status", cell: (row) => <StatusBadge tone={toneForStatus(row.status)}>{labelFromEnum(row.status)}</StatusBadge> },
          ]}
        />
      </section>
    </div>
  );
}
