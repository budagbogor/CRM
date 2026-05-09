import Link from "next/link";
import { Building2 } from "lucide-react";
import { BranchGlobalFilter } from "@/components/crm/branch-global-filter";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatCurrency } from "@/lib/utils";
import { getBranchesOverviewData, getShellData } from "@/services/crm-queries";

type BranchesPageProps = {
  searchParams?: Promise<{
    branchId?: string;
    from?: string;
    to?: string;
  }>;
};

export default async function BranchesPage({ searchParams }: BranchesPageProps) {
  const params = (await searchParams) ?? {};
  const [shell, data] = await Promise.all([
    getShellData(),
    getBranchesOverviewData({
      branchId: params.branchId && params.branchId !== "all" ? params.branchId : undefined,
      from: params.from ? new Date(params.from) : undefined,
      to: params.to ? new Date(params.to) : undefined,
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Multi-Branch"
        title="Branch Dashboard"
        description="Performa tiap outlet Mobeng untuk operasional dan evaluasi HQ."
      />
      <BranchGlobalFilter
        branches={shell.branches}
        selectedBranchId={params.branchId}
        from={params.from}
        to={params.to}
      />
      {data.branches.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Tidak ada data cabang"
          description="Belum ada cabang yang sesuai dengan filter."
        />
      ) : (
        <DataTable
          data={data.branches}
          getRowKey={(row) => row.id}
          columns={[
            {
              key: "branch",
              header: "Branch",
              cell: (row) => (
                <Link href={`/branches/${row.id}`} className="font-medium text-sky-700 hover:underline dark:text-sky-300">
                  {row.name}
                </Link>
              ),
            },
            { key: "city", header: "City", cell: (row) => row.city },
            { key: "revenue", header: "Revenue", cell: (row) => formatCurrency(row.revenue) },
            { key: "transactions", header: "Transactions", cell: (row) => row.transactions },
            { key: "bookings", header: "Bookings", cell: (row) => row.bookings },
            { key: "complaints", header: "Complaints", cell: (row) => row.complaints },
            { key: "reminders", header: "Reminders", cell: (row) => row.reminders },
            { key: "csat", header: "CSAT", cell: (row) => `${row.customerSatisfaction}%` },
          ]}
        />
      )}
    </div>
  );
}

