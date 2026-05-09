import { runComplaintRecoveryFlowAction } from "@/app/actions/retention";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { toneForStatus } from "@/lib/status";
import { formatDateTime, labelFromEnum } from "@/lib/utils";
import { getComplaintRecoveryListData } from "@/services/crm-queries";
import { ShieldAlert } from "lucide-react";

export default async function MobileComplaintsPage() {
  const complaints = await getComplaintRecoveryListData();
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Mobile View" title="Complaint Recovery List" description="Daftar komplain aktif untuk recovery cepat." />
      {complaints.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="Tidak ada komplain aktif" description="Seluruh komplain sudah selesai atau ditutup." />
      ) : (
        <DataTable
          data={complaints}
          getRowKey={(row) => row.id}
          mobileCardTitle={(row) => row.ticketNumber}
          columns={[
            { key: "ticket", header: "Ticket", cell: (row) => row.ticketNumber },
            { key: "customer", header: "Customer", cell: (row) => `${row.customer.firstName} ${row.customer.lastName}` },
            { key: "priority", header: "Priority", cell: (row) => <StatusBadge tone={toneForStatus(row.priority)}>{labelFromEnum(row.priority)}</StatusBadge> },
            { key: "status", header: "Status", cell: (row) => <StatusBadge tone={toneForStatus(row.status)}>{labelFromEnum(row.status)}</StatusBadge> },
            { key: "opened", header: "Opened", cell: (row) => formatDateTime(row.openedAt) },
            {
              key: "action",
              header: "Action",
              cell: (row) => (
                <form action={runComplaintRecoveryFlowAction.bind(null, row.id)}>
                  <button className="h-10 rounded-lg border border-zinc-200 px-3 text-xs font-medium dark:border-zinc-800">Run SLA</button>
                </form>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}

