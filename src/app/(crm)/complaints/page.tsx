import { deleteComplaintAction } from "@/app/actions/crud";
import { runComplaintRecoveryFlowAction } from "@/app/actions/retention";
import { ComplaintUploadPlaceholder } from "@/components/crm/complaint-upload-placeholder";
import { AiAssistantPanel } from "@/components/crm/ai-assistant-panel";
import { ComplaintFormDrawer } from "@/components/crm/crud-form-drawers";
import { DeleteButton } from "@/components/crm/delete-button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ComplaintStatus } from "@/generated/prisma/enums";
import { toneForStatus } from "@/lib/status";
import { formatDate, labelFromEnum } from "@/lib/utils";
import { getComplaintsData, getCrmFormOptions } from "@/services/crm-queries";
import { getAiProvider } from "@/services/ai";
import { ShieldAlert } from "lucide-react";

export default async function ComplaintsPage() {
  const [complaints, options] = await Promise.all([
    getComplaintsData(),
    getCrmFormOptions(),
  ]);
  const aiProvider = getAiProvider();
  const complaintInsights = await Promise.all(
    complaints.slice(0, 3).map(async (complaint) => {
      const insight = await aiProvider.generateComplaintSummary(complaint.id);
      return {
        title: insight.summary,
        summary: `Ticket ${complaint.ticketNumber} - ${complaint.customer.firstName} ${complaint.customer.lastName}`,
        recommendedAction: insight.recommendedAction,
        confidence: insight.confidence,
        sourceData: insight.sourceData,
      };
    })
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Recovery"
        title="Komplain"
        description="Tiket komplain live dengan owner, SLA recovery, dan tindak lanjut outlet."
        actions={<ComplaintFormDrawer {...options} />}
      />
      <ComplaintUploadPlaceholder />
      {complaintInsights.length > 0 ? (
        <AiAssistantPanel title="AI Assistant - Complaint Recovery" items={complaintInsights} />
      ) : null}
      {complaints.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="Belum ada komplain"
          description="Buat tiket komplain manual atau biarkan survey buruk membukanya otomatis."
          action={<ComplaintFormDrawer {...options} />}
        />
      ) : (
        <DataTable
          data={complaints}
          getRowKey={(row) => row.id}
          columns={[
          {
            key: "ticket",
            header: "Ticket",
            cell: (row) => (
              <div>
                <p className="font-medium text-zinc-950 dark:text-white">
                  {row.ticketNumber}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatDate(row.openedAt)}
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
            key: "vehicle",
            header: "Vehicle",
            cell: (row) =>
              row.vehicle
                ? `${row.vehicle.make} ${row.vehicle.model}`
                : "No vehicle",
          },
          { key: "subject", header: "Subject", cell: (row) => row.subject },
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
          {
            key: "owner",
            header: "Owner",
            cell: (row) => row.assignedTo?.name ?? "Unassigned",
          },
            {
              key: "action",
              header: "Actions",
              cell: (row) => (
                <div className="flex gap-2">
                  <ComplaintFormDrawer
                    complaint={{
                      id: row.id,
                      ticketNumber: row.ticketNumber,
                      customerId: row.customerId,
                      vehicleId: row.vehicleId ?? undefined,
                      serviceTransactionId: row.serviceTransactionId ?? undefined,
                      branchId: row.branchId,
                      assignedToId: row.assignedToId ?? undefined,
                      status: row.status,
                      priority: row.priority,
                      category: row.category,
                      subject: row.subject,
                      description: row.description,
                    }}
                    {...options}
                  />
                  {row.status === ComplaintStatus.CLOSED ||
                  row.status === ComplaintStatus.RESOLVED ? null : (
                    <form action={runComplaintRecoveryFlowAction.bind(null, row.id)}>
                      <button
                        type="submit"
                        className="h-8 rounded-md border border-zinc-200 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
                      >
                        SLA
                      </button>
                    </form>
                  )}
                  <DeleteButton
                    id={row.id}
                    entityName="complaint"
                    action={deleteComplaintAction}
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
