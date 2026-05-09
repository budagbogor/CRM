"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DashboardVisualsProps = {
  funnel: Array<{ label: string; value: number }>;
  repeatServiceTrend: Array<{ month: string; repeatVisits: number }>;
};

export function DashboardVisuals({
  funnel,
  repeatServiceTrend,
}: DashboardVisualsProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
          Retention funnel
        </h2>
        <div className="mt-5 space-y-4">
          {funnel.map((step, index) => {
            const previous = funnel[index - 1]?.value ?? step.value;
            const width =
              previous > 0 ? Math.max(20, Math.round((step.value / previous) * 100)) : 20;

            return (
              <div key={step.label} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {step.label}
                  </p>
                  <span className="text-sm font-semibold text-zinc-950 dark:text-white">
                    {step.value}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-zinc-100 dark:bg-zinc-900">
                  <div
                    className="h-3 rounded-full bg-sky-500 transition-all"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
          Repeat service trend
        </h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={repeatServiceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar
                dataKey="repeatVisits"
                fill="#0f766e"
                radius={[8, 8, 0, 0]}
                name="Repeat visits"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
