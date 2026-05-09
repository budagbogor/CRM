import Link from "next/link";
import { TransactionImportPanel } from "@/components/crm/transaction-import-panel";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { toneForStatus } from "@/lib/status";
import { formatDateTime, labelFromEnum } from "@/lib/utils";
import { getTransactionImportLogsData } from "@/services/crm-queries";

export default async function IntegrationTransactionsPage() {
  const logs = await getTransactionImportLogsData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Transaksi Harian"
        description="Upload CSV/XLSX transaksi dari sistem operasional POS Mobeng."
      />

      <TransactionImportPanel />

      <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Riwayat Import Terakhir</h2>
          <Link href="/integrations/imports" className="text-sm text-sky-600 hover:underline dark:text-sky-400">
            Lihat semua log
          </Link>
        </div>
        <DataTable
          columns={[
            { key: "file", header: "File", className: "min-w-[220px]", cell: (log) => log.fileName },
            { key: "source", header: "Source", cell: (log) => labelFromEnum(log.source) },
            {
              key: "status",
              header: "Status",
              cell: (log) => <StatusBadge tone={toneForStatus(log.status)}>{labelFromEnum(log.status)}</StatusBadge>,
            },
            {
              key: "rows",
              header: "Rows",
              cell: (log) => `${log.successRows}/${log.totalRows} (fail ${log.failedRows}, skip ${log.skippedRows})`,
            },
            { key: "importedAt", header: "Import At", cell: (log) => formatDateTime(log.importedAt) },
          ]}
          data={logs.slice(0, 10)}
          getRowKey={(log) => log.id}
        />
      </section>
    </div>
  );
}
