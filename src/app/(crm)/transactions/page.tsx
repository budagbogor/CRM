import { deleteTransactionAction } from "@/app/actions/crud";
import { runPostTransactionRetentionFlowAction } from "@/app/actions/retention";
import { TransactionFormDrawer } from "@/components/crm/crud-form-drawers";
import { DeleteButton } from "@/components/crm/delete-button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ServiceStatus } from "@/generated/prisma/enums";
import { toneForStatus } from "@/lib/status";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  labelFromEnum,
} from "@/lib/utils";
import { getCrmFormOptions, getTransactionsData } from "@/services/crm-queries";
import { Wrench } from "lucide-react";

export default async function TransactionsPage() {
  const [transactions, options] = await Promise.all([
    getTransactionsData(),
    getCrmFormOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Servis"
        title="Transaksi Servis"
        description="Repair order live dengan ownership advisor dan trigger workflow retention Mobeng."
        actions={
          <TransactionFormDrawer
            customers={options.customers}
            vehicles={options.vehicles}
            branches={options.branches}
            users={options.users}
          />
        }
      />
      {transactions.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="Belum ada transaksi"
          description="Buat transaksi servis lalu ubah ke completed untuk memicu automation retention."
          action={
            <TransactionFormDrawer
              customers={options.customers}
              vehicles={options.vehicles}
              branches={options.branches}
              users={options.users}
            />
          }
        />
      ) : (
        <DataTable
          data={transactions}
          getRowKey={(row) => row.id}
          columns={[
          {
            key: "service",
            header: "Service no.",
            cell: (row) => (
              <div>
                <p className="font-medium text-zinc-950 dark:text-white">
                  {row.serviceNumber}
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
              `${row.vehicle.make} ${row.vehicle.model} - ${row.vehicle.licensePlate}`,
          },
          {
            key: "advisor",
            header: "Advisor",
            cell: (row) => row.advisor?.name ?? "Unassigned",
          },
          {
            key: "odometer",
            header: "Odometer",
            cell: (row) => `${formatNumber(row.odometerIn)} km`,
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
            header: "Total",
            cell: (row) => formatCurrency(Number(row.totalAmount)),
          },
            {
              key: "action",
              header: "Actions",
              cell: (row) => (
                <div className="flex gap-2">
                  <TransactionFormDrawer
                    transaction={{
                      id: row.id,
                      serviceNumber: row.serviceNumber,
                      customerId: row.customerId,
                      vehicleId: row.vehicleId,
                      branchId: row.branchId,
                      advisorId: row.advisorId ?? undefined,
                      technicianName: row.technicianName ?? undefined,
                      openedAt: row.openedAt,
                      closedAt: row.closedAt ?? undefined,
                      odometerIn: row.odometerIn,
                      status: row.status,
                      totalLaborAmount: Number(row.totalLaborAmount),
                      totalPartsAmount: Number(row.totalPartsAmount),
                      discountAmount: Number(row.discountAmount),
                      taxAmount: Number(row.taxAmount),
                      totalAmount: Number(row.totalAmount),
                      paymentMethod: row.paymentMethod ?? undefined,
                      notes: row.notes ?? undefined,
                    }}
                    customers={options.customers}
                    vehicles={options.vehicles}
                    branches={options.branches}
                    users={options.users}
                  />
                  {row.status === ServiceStatus.COMPLETED ? (
                    <form action={runPostTransactionRetentionFlowAction.bind(null, row.id)}>
                      <button
                        type="submit"
                        className="h-8 rounded-md border border-zinc-200 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
                      >
                        Flow
                      </button>
                    </form>
                  ) : null}
                  <DeleteButton
                    id={row.id}
                    entityName="transaction"
                    action={deleteTransactionAction}
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
