import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardCardProps = {
  title: string;
  value: string | number;
  detail?: string;
  icon: LucideIcon;
  tone?: "sky" | "emerald" | "amber" | "rose" | "violet" | "zinc";
};

const toneClasses = {
  sky: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  emerald:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  violet:
    "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  zinc: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export function DashboardCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = "zinc",
}: DashboardCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {title}
          </p>
          <p className="mt-3 text-3xl font-semibold text-zinc-950 dark:text-white">
            {value}
          </p>
        </div>
        <div className={cn("rounded-lg p-2", toneClasses[tone])}>
          <Icon aria-hidden="true" className="h-5 w-5" />
        </div>
      </div>
      {detail ? (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{detail}</p>
      ) : null}
    </div>
  );
}
