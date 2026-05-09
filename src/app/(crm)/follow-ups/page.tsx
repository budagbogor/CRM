import {
  submitBadSurveyAction,
  submitGoodSurveyAction,
} from "@/app/actions/retention";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { SurveyStatus } from "@/generated/prisma/enums";
import { toneForStatus } from "@/lib/status";
import { formatDateTime, labelFromEnum } from "@/lib/utils";
import { getFollowUpsData } from "@/services/crm-queries";
import { ClipboardCheck } from "lucide-react";

export default async function FollowUpsPage() {
  const surveys = await getFollowUpsData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pasca Servis"
        title="Follow-Up"
        description="Survey follow-up live yang terhubung ke komplain, reminder, dan workflow kualitas layanan Mobeng."
      />
      {surveys.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Belum ada survey follow-up"
          description="Jalankan seed untuk menampilkan survey pasca servis dan routing komplain otomatis."
        />
      ) : (
        <DataTable
          data={surveys}
          getRowKey={(row) => row.id}
          columns={[
            {
              key: "customer",
              header: "Customer",
              cell: (row) => (
                <div>
                  <p className="font-medium text-zinc-950 dark:text-white">
                    <Link href={`/follow-ups/${row.id}`} className="hover:underline">
                      {row.customer.firstName} {row.customer.lastName}
                    </Link>
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {row.serviceTransaction?.serviceNumber ?? "Tanpa transaksi"}
                  </p>
                </div>
              ),
            },
            {
              key: "vehicle",
              header: "Vehicle",
              cell: (row) =>
                row.serviceTransaction?.vehicle
                  ? `${row.serviceTransaction.vehicle.make} ${row.serviceTransaction.vehicle.model}`
                  : "Tanpa kendaraan",
            },
            {
              key: "channel",
              header: "Channel",
              cell: (row) => labelFromEnum(row.channel),
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
              key: "sent",
              header: "Sent",
              cell: (row) => (row.sentAt ? formatDateTime(row.sentAt) : "Belum dikirim"),
            },
            {
              key: "score",
              header: "Score",
              cell: (row) => row.score ?? "Menunggu",
            },
            {
              key: "actions",
              header: "Hasil survey",
              cell: (row) =>
                row.status === SurveyStatus.COMPLETED ? (
                  <Link
                    href={`/follow-ups/${row.id}`}
                    className="text-xs font-medium text-sky-700 hover:underline dark:text-sky-300"
                  >
                    Lihat detail
                  </Link>
                ) : (
                  <div className="flex gap-2">
                    <Link
                      href={`/follow-ups/${row.id}`}
                      className="flex h-8 items-center rounded-md border border-zinc-200 px-3 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                    >
                      Detail
                    </Link>
                    <form action={submitGoodSurveyAction.bind(null, row.id)}>
                      <button
                        type="submit"
                        className="h-8 rounded-md border border-emerald-200 px-3 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950"
                      >
                        Baik
                      </button>
                    </form>
                    <form action={submitBadSurveyAction.bind(null, row.id)}>
                      <button
                        type="submit"
                        className="h-8 rounded-md border border-rose-200 px-3 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950"
                      >
                        Buruk
                      </button>
                    </form>
                  </div>
                ),
            },
          ]}
        />
      )}
    </div>
  );
}
