import { TransactionFormDrawer } from "@/components/crm/crud-form-drawers";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getCrmFormOptions } from "@/services/crm-queries";
import { Wrench } from "lucide-react";

export default async function MobileTransactionInputPage() {
  const options = await getCrmFormOptions();

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Mobile View"
        title="Transaction Input"
        description="Input cepat transaksi servis untuk frontliner."
        actions={
          <TransactionFormDrawer
            customers={options.customers}
            vehicles={options.vehicles}
            branches={options.branches}
            users={options.users}
          />
        }
      />
      <EmptyState
        icon={Wrench}
        title="Mulai input transaksi"
        description="Gunakan tombol di atas untuk buat transaksi baru dari perangkat mobile/tablet."
        action={
          <TransactionFormDrawer
            customers={options.customers}
            vehicles={options.vehicles}
            branches={options.branches}
            users={options.users}
          />
        }
      />
    </div>
  );
}

