import Link from "next/link";
import {
  CalendarPlus2,
  CircleAlert,
  MessagesSquare,
  Phone,
  Send,
  TicketPlus,
  Wrench,
} from "lucide-react";

const quickActions = [
  { href: "/mobile/lookup", label: "Cari Customer", icon: Phone },
  { href: "/bookings", label: "Buat Booking", icon: CalendarPlus2 },
  { href: "/mobile/transactions", label: "Input Transaksi", icon: Wrench },
  { href: "/mobile/reminders", label: "Reminder Sent", icon: Send },
  { href: "/mobile/reminders", label: "Reminder ke Booking", icon: MessagesSquare },
  { href: "/complaints", label: "Buat Komplain", icon: TicketPlus },
];

export function MobileQuickActions() {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 flex items-center gap-2 text-zinc-900 dark:text-white">
        <CircleAlert className="h-4 w-4" />
        <h2 className="text-sm font-semibold">Quick Actions</h2>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            <action.icon className="h-4 w-4" />
            <span>{action.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
