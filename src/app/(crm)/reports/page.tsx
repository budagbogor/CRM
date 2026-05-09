import { BarChart3, CircleDollarSign, HeartPulse, Repeat2 } from "lucide-react";
import { ReportsCharts } from "@/components/crm/reports-charts";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { PageHeader } from "@/components/ui/page-header";
import { getReportsData } from "@/services/crm-queries";

export default async function ReportsPage() {
  const reports = await getReportsData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Laporan"
        description="Analitik live untuk owner bengkel dan branch manager Mobeng."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Repeat customer rate"
          value={`${reports.kpis.repeatCustomerRate}%`}
          detail="Pelanggan dengan beberapa kunjungan completed"
          icon={Repeat2}
          tone="emerald"
        />
        <DashboardCard
          title="Complaint rate"
          value={`${reports.kpis.complaintRate}%`}
          detail="Volume komplain terhadap basis pelanggan"
          icon={BarChart3}
          tone="rose"
        />
        <DashboardCard
          title="Reminder conversion"
          value={`${reports.kpis.reminderConversion}%`}
          detail="Reminder yang berhasil diproses dari action center"
          icon={HeartPulse}
          tone="violet"
        />
        <DashboardCard
          title="Booking aktif"
          value={reports.kpis.activeBookings}
          detail="Booking dengan status requested dan confirmed"
          icon={CircleDollarSign}
          tone="sky"
        />
      </section>

      <ReportsCharts
        revenueTrend={reports.revenueTrend}
        complaintTrend={reports.complaintTrend}
        healthDistribution={reports.healthDistribution}
      />
    </div>
  );
}
