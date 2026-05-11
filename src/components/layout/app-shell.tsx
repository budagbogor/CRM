"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Activity,
  CalendarClock,
  Car,
  ClipboardCheck,
  Database,
  GitBranch,
  Gauge,
  GitMerge,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  ShieldAlert,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { filterNavigationByRole, type AppRole } from "@/lib/rbac";
import { brandIdentity } from "@/lib/brand";
import { cn, initials } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Cabang", href: "/branches", icon: GitBranch },
  { name: "Pelanggan", href: "/customers", icon: Users },
  { name: "Kendaraan", href: "/vehicles", icon: Car },
  { name: "Transaksi", href: "/transactions", icon: Wrench },
  { name: "Komplain", href: "/complaints", icon: ShieldAlert },
  { name: "Follow-Up", href: "/follow-ups", icon: ClipboardCheck },
  { name: "Journey", href: "/journey", icon: GitBranch },
  { name: "Reminder", href: "/reminders", icon: Bell },
  { name: "Bookings", href: "/bookings", icon: CalendarClock },
  { name: "Workflow", href: "/workflow", icon: GitMerge },
  { name: "Integrasi", href: "/integrations/transactions", icon: Database },
  { name: "Monitoring", href: "/admin/monitoring", icon: Activity },
  { name: "Laporan", href: "/reports", icon: BarChart3 },
  { name: "Pengaturan", href: "/settings", icon: Settings },
];

type AppShellProps = {
  children: React.ReactNode;
  branchSummary: {
    branchName: string;
    branchCode: string;
    branchCity: string;
    openComplaints: number;
    pendingReminders: number;
    activeBookings: number;
  };
  currentUser: {
    id: string;
    name: string;
    role: AppRole;
  };
};

export function AppShell({ children, branchSummary, currentUser }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-16 items-center gap-3 border-b border-zinc-200 px-5 dark:border-zinc-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
          <Gauge aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-950 dark:text-white">
            {brandIdentity.appName}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {brandIdentity.subtitle}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {filterNavigationByRole(navigation, currentUser.role).map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
              )}
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Outlet aktif
          </p>
          <p className="mt-1 text-sm font-semibold text-zinc-950 dark:text-white">
            {branchSummary.branchName}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {branchSummary.branchCode}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {branchSummary.openComplaints} komplain aktif,{" "}
            {branchSummary.pendingReminders} reminder berjalan
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {branchSummary.activeBookings} booking aktif di {branchSummary.branchCity}
          </p>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex">{sidebar}</div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="absolute inset-0 bg-zinc-950/40"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative h-full">{sidebar}</div>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-zinc-200 bg-white/95 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 sm:px-6">
          <button
            type="button"
            aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-300 lg:hidden"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            {sidebarOpen ? (
              <X aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Menu aria-hidden="true" className="h-5 w-5" />
            )}
          </button>

          <div className="relative hidden min-w-0 flex-1 md:block">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="search"
              placeholder="Cari pelanggan, kendaraan, booking, atau komplain"
              className="h-11 w-full max-w-xl rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-sky-500 dark:focus:bg-zinc-950"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              aria-label="Notifications"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-300"
            >
              <Bell aria-hidden="true" className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-zinc-950 dark:text-white">
                {currentUser.name}
              </p>
              <div className="mt-1 inline-flex rounded-md border border-zinc-200 px-2 py-0.5 text-[11px] text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                {currentUser.role}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sm font-semibold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              {initials(currentUser.name)}
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Logout
              </button>
            </form>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
