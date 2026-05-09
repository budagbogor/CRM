import { deleteVehicleAction } from "@/app/actions/crud";
import { VehicleFormDrawer } from "@/components/crm/crud-form-drawers";
import { DeleteButton } from "@/components/crm/delete-button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { toneForStatus } from "@/lib/status";
import { formatDate, formatNumber, labelFromEnum } from "@/lib/utils";
import { getCrmFormOptions, getVehiclesData } from "@/services/crm-queries";
import { Car } from "lucide-react";

export default async function VehiclesPage() {
  const [vehicles, options] = await Promise.all([
    getVehiclesData(),
    getCrmFormOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operasional"
        title="Kendaraan"
        description="Data kendaraan pelanggan, posisi odometer, dan estimasi servis berikutnya."
        actions={<VehicleFormDrawer customers={options.customers} branches={options.branches} />}
      />
      {vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="Belum ada kendaraan"
          description="Tambahkan kendaraan pelanggan agar engine retention bisa menghitung jadwal servis berikutnya."
          action={<VehicleFormDrawer customers={options.customers} branches={options.branches} />}
        />
      ) : (
        <DataTable
          data={vehicles}
          getRowKey={(row) => row.id}
          columns={[
          {
            key: "vehicle",
            header: "Vehicle",
            cell: (row) => (
              <div>
                <p className="font-medium text-zinc-950 dark:text-white">
                  {row.year} {row.make} {row.model}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {row.licensePlate}
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
            key: "odometer",
            header: "Odometer",
            cell: (row) => `${formatNumber(row.odometer)} km`,
          },
          {
            key: "next",
            header: "Next service",
            cell: (row) =>
              row.nextServiceDueDate
                ? formatDate(row.nextServiceDueDate)
                : "Not calculated",
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
              key: "actions",
              header: "Actions",
              cell: (row) => (
                <div className="flex gap-2">
                  <VehicleFormDrawer
                    vehicle={{
                      id: row.id,
                      customerId: row.customerId,
                      branchId: row.branchId,
                      vin: row.vin ?? undefined,
                      licensePlate: row.licensePlate,
                      make: row.make,
                      model: row.model,
                      trim: row.trim ?? undefined,
                      year: row.year,
                      color: row.color ?? undefined,
                      odometer: row.odometer,
                      fuelType: row.fuelType ?? undefined,
                      transmission: row.transmission ?? undefined,
                      nextServiceOdometer: row.nextServiceOdometer ?? undefined,
                      status: row.status,
                    }}
                    customers={options.customers}
                    branches={options.branches}
                  />
                  <DeleteButton
                    id={row.id}
                    entityName="vehicle"
                    action={deleteVehicleAction}
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
