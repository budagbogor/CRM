import Link from "next/link";
import { Users } from "lucide-react";
import { deleteCustomerAction } from "@/app/actions/crud";
import { calculateCustomerHealthScoreAction } from "@/app/actions/retention";
import { CustomerFormDrawer } from "@/components/crm/crud-form-drawers";
import { DeleteButton } from "@/components/crm/delete-button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { toneForStatus } from "@/lib/status";
import { formatCurrency, labelFromEnum } from "@/lib/utils";
import { getCrmFormOptions, getCustomersData } from "@/services/crm-queries";

export default async function CustomersPage() {
  const [customers, options] = await Promise.all([
    getCustomersData(),
    getCrmFormOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mobeng CRM"
        title="Pelanggan"
        description="Profil pelanggan live dengan owner advisor, histori servis, dan skor kesehatan retention."
        actions={<CustomerFormDrawer branches={options.branches} users={options.users} />}
      />
      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Belum ada pelanggan"
          description="Buat data pelanggan pertama untuk mulai membangun histori retention."
          action={<CustomerFormDrawer branches={options.branches} users={options.users} />}
        />
      ) : (
        <DataTable
          data={customers}
          getRowKey={(row) => row.id}
          columns={[
            {
              key: "customer",
              header: "Customer",
              cell: (row) => (
                <div>
                  <p className="font-medium text-zinc-950 dark:text-white">
                    <Link
                      href={`/customers/${row.id}`}
                      className="text-sky-700 hover:underline dark:text-sky-300"
                    >
                      {row.firstName} {row.lastName}
                    </Link>
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {row.customerNumber} - {row.email ?? row.phone}
                  </p>
                </div>
              ),
            },
            { key: "phone", header: "Phone", cell: (row) => row.phone },
            {
              key: "type",
              header: "Type",
              cell: (row) => (
                <StatusBadge tone={toneForStatus(row.type)}>
                  {labelFromEnum(row.type)}
                </StatusBadge>
              ),
            },
            {
              key: "advisor",
              header: "Advisor",
              cell: (row) => row.assignedAdvisor?.name ?? "Unassigned",
            },
            { key: "vehicles", header: "Vehicles", cell: (row) => row._count.vehicles },
            {
              key: "visits",
              header: "Visits",
              cell: (row) => row._count.serviceTransactions,
            },
            {
              key: "health",
              header: "Health",
              cell: (row) =>
                row.healthScore ? (
                  <div className="flex items-center gap-2">
                    <StatusBadge tone={toneForStatus(row.healthScore.band)}>
                      {labelFromEnum(row.healthScore.band)}
                    </StatusBadge>
                    <span className="text-xs text-zinc-500">{row.healthScore.score}</span>
                  </div>
                ) : (
                  <span className="text-xs text-zinc-500">Not calculated</span>
                ),
            },
            {
              key: "value",
              header: "Lifetime value",
              cell: (row) => formatCurrency(Number(row.healthScore?.lifetimeValue ?? 0)),
            },
            {
              key: "action",
              header: "Actions",
              cell: (row) => (
                <div className="flex gap-2">
                  <Link
                    href={`/customers/${row.id}`}
                    className="flex h-8 items-center rounded-md border border-sky-200 px-3 text-xs font-medium text-sky-700 hover:bg-sky-50 dark:border-sky-900 dark:text-sky-300 dark:hover:bg-sky-950"
                  >
                    Profile
                  </Link>
                  <CustomerFormDrawer
                    customer={{
                      id: row.id,
                      customerNumber: row.customerNumber,
                      branchId: row.branchId,
                      assignedAdvisorId: row.assignedAdvisorId ?? undefined,
                      firstName: row.firstName,
                      lastName: row.lastName,
                      email: row.email ?? undefined,
                      phone: row.phone,
                      type: row.type,
                      status: row.status,
                      preferredChannel: row.preferredChannel,
                      acquisitionSource: row.acquisitionSource ?? undefined,
                      companyName: row.companyName ?? undefined,
                      consentMarketing: row.consentMarketing,
                      notes: row.notes ?? undefined,
                    }}
                    branches={options.branches}
                    users={options.users}
                  />
                  <form action={calculateCustomerHealthScoreAction.bind(null, row.id)}>
                    <button
                      type="submit"
                      className="h-8 rounded-md border border-zinc-200 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
                    >
                      Score
                    </button>
                  </form>
                  <DeleteButton
                    id={row.id}
                    entityName="customer"
                    action={deleteCustomerAction}
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
