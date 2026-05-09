import { AppShell } from "@/components/layout/app-shell";
import { getShellData } from "@/services/crm-queries";

export const dynamic = "force-dynamic";

export default async function CrmLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shellData = await getShellData();

  return (
    <AppShell
      branchSummary={{
        branchName: shellData.branchName,
        branchCode: shellData.branchCode,
        branchCity: shellData.branchCity,
        openComplaints: shellData.openComplaints,
        pendingReminders: shellData.pendingReminders,
        activeBookings: shellData.activeBookings,
      }}
      currentUser={shellData.currentUser}
    >
      {children}
    </AppShell>
  );
}
