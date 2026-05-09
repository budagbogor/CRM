import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { toneForStatus } from "@/lib/status";
import { getCustomerQuickLookupData } from "@/services/crm-queries";
import { Search } from "lucide-react";

type LookupPageProps = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function MobileLookupPage({ searchParams }: LookupPageProps) {
  const params = (await searchParams) ?? {};
  const query = params.q?.trim() ?? "";
  const results = query ? await getCustomerQuickLookupData(query) : [];

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Mobile View" title="Customer Quick Lookup" description="Cari cepat berdasarkan nomor telepon, nama, atau plat nomor." />
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="0812... atau B 1234 XYZ"
          className="h-11 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-900"
        />
        <button className="inline-flex h-11 items-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white dark:bg-white dark:text-zinc-950">
          <Search className="h-4 w-4" />
          Cari
        </button>
      </form>
      {query && results.length === 0 ? (
        <EmptyState icon={Search} title="Tidak ditemukan" description="Coba kata kunci lain untuk customer atau plat nomor." />
      ) : null}
      <div className="space-y-3">
        {results.map((customer) => (
          <Link
            key={customer.id}
            href={`/customers/${customer.id}`}
            className="block rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                  {customer.firstName} {customer.lastName}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {customer.phone} • {customer.branch.name}
                </p>
              </div>
              {customer.healthScore ? (
                <StatusBadge tone={toneForStatus(customer.healthScore.band)}>
                  {customer.healthScore.band}
                </StatusBadge>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">
              {customer.vehicles.map((vehicle) => `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`).join(" • ")}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

