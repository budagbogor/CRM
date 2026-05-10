import { Activity } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { toneForStatus } from "@/lib/status";
import { formatDateTime } from "@/lib/utils";
import { getMonitoringData } from "@/services/crm-queries";

export default async function MonitoringPage() {
  const data = await getMonitoringData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Monitoring"
        description="Observability ringkas untuk job scheduler, import API, notifikasi, dan health sistem."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <DashboardCard title="System health" value={data.systemHealth} icon={Activity} tone="emerald" />
        <DashboardCard title="Database" value={data.databaseStatus} icon={Activity} tone="sky" />
        <DashboardCard title="Scheduler" value={data.schedulerStatus} icon={Activity} tone="violet" />
        <DashboardCard title="Notification provider" value={data.notificationProvider} icon={Activity} tone="amber" />
        <DashboardCard
          title="Last job run"
          value={data.lastJobRunAt ? formatDateTime(data.lastJobRunAt) : "-"}
          icon={Activity}
          tone="rose"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Recent Job Failures</h2>
        {data.jobFailures.length === 0 ? (
          <EmptyState title="No failed jobs" description="Tidak ada job gagal terbaru." icon={Activity} />
        ) : (
          <DataTable
            columns={[
              { key: "name", header: "Job", cell: (row) => row.name },
              { key: "type", header: "Type", cell: (row) => row.jobType },
              { key: "attempts", header: "Attempts", cell: (row) => `${row.attempts}/${row.maxAttempts}` },
              { key: "error", header: "Last error", cell: (row) => row.lastError ?? "-" },
              {
                key: "status",
                header: "Status",
                cell: (row) => <StatusBadge tone={toneForStatus(row.status)}>{row.status}</StatusBadge>,
              },
            ]}
            data={data.jobFailures}
            getRowKey={(row) => row.id}
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Recent API Import Failures</h2>
        {data.importFailures.length === 0 ? (
          <EmptyState title="No import failures" description="Tidak ada kegagalan import terbaru." icon={Activity} />
        ) : (
          <DataTable
            columns={[
              { key: "file", header: "File", cell: (row) => row.fileName },
              { key: "source", header: "Source", cell: (row) => row.source },
              { key: "failed", header: "Failed rows", cell: (row) => row.failedRows },
              { key: "success", header: "Success rows", cell: (row) => row.successRows },
              { key: "at", header: "Imported at", cell: (row) => formatDateTime(row.importedAt) },
            ]}
            data={data.importFailures}
            getRowKey={(row) => row.id}
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Recent Notification Failures</h2>
        {data.notificationFailures.length === 0 ? (
          <EmptyState title="No notification failures" description="Tidak ada kegagalan notifikasi terbaru." icon={Activity} />
        ) : (
          <DataTable
            columns={[
              { key: "channel", header: "Channel", cell: (row) => row.channel },
              { key: "recipient", header: "Recipient", cell: (row) => row.recipient },
              { key: "subject", header: "Subject", cell: (row) => row.subject ?? "-" },
              { key: "reason", header: "Failure reason", cell: (row) => row.failureReason ?? "-" },
              { key: "at", header: "Failed at", cell: (row) => (row.failedAt ? formatDateTime(row.failedAt) : "-") },
            ]}
            data={data.notificationFailures}
            getRowKey={(row) => row.id}
          />
        )}
      </section>
    </div>
  );
}

