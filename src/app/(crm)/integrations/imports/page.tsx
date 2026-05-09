import { DatabaseBackup } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { toneForStatus } from "@/lib/status";
import { formatDateTime, labelFromEnum } from "@/lib/utils";
import { getTransactionImportLogsData } from "@/services/crm-queries";

export default async function IntegrationImportLogsPage() {
  const logs = await getTransactionImportLogsData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Logs"
        description="Riwayat upload/API import transaksi harian lintas cabang Mobeng."
      />

      {logs.length === 0 ? (
        <EmptyState
          title="Belum ada log import"
          description="Silakan lakukan import transaksi dari halaman Integrations."
          icon={DatabaseBackup}
        />
      ) : (
        <DataTable
          columns={[
            { key: "file", header: "File", className: "min-w-[220px]", cell: (log) => log.fileName },
            { key: "source", header: "Source", cell: (log) => labelFromEnum(log.source) },
            { key: "branch", header: "Cabang", cell: (log) => log.branch?.name ?? "-" },
            {
              key: "rows",
              header: "Rows",
              cell: (log) =>
                `${log.totalRows} / ok ${log.successRows} / fail ${log.failedRows} / skip ${log.skippedRows}`,
            },
            {
              key: "status",
              header: "Status",
              cell: (log) => (
                <StatusBadge tone={toneForStatus(log.status)}>{labelFromEnum(log.status)}</StatusBadge>
              ),
            },
            { key: "importedBy", header: "Imported By", cell: (log) => log.importedBy?.name ?? "-" },
            { key: "importedAt", header: "Imported At", cell: (log) => formatDateTime(log.importedAt) },
            {
              key: "errors",
              header: "Error Details",
              className: "min-w-[280px]",
              cell: (log) => {
                const errors = Array.isArray(log.errorDetails) ? log.errorDetails : [];
                const preview = errors.slice(0, 2).map((item) => {
                  if (typeof item === "object" && item && "row" in item && "error" in item) {
                    return `row ${String((item as { row: unknown }).row)}: ${String((item as { error: unknown }).error)}`;
                  }
                  return String(item);
                });
                return preview.join("; ") || "-";
              },
            },
          ]}
          data={logs}
          getRowKey={(log) => log.id}
        />
      )}
    </div>
  );
}
