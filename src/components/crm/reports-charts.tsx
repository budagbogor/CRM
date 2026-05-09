"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, labelFromEnum } from "@/lib/utils";

const colors = ["#0284c7", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function ReportsCharts({
  revenueTrend,
  complaintTrend,
  healthDistribution,
}: {
  revenueTrend: Array<{ month: string; revenue: number }>;
  complaintTrend: Array<{ month: string; complaints: number }>;
  healthDistribution: Array<{ band: string; count: number }>;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-3">
      <ChartCard title="Revenue trends" className="xl:col-span-2">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={revenueTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `${Number(value) / 1_000_000}m`} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Area type="monotone" dataKey="revenue" stroke="#0284c7" fill="#bae6fd" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Customer health distribution">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={healthDistribution.map((item) => ({
                ...item,
                band: labelFromEnum(item.band),
              }))}
              dataKey="count"
              nameKey="band"
              outerRadius={88}
              label
            >
              {healthDistribution.map((_, index) => (
                <Cell key={index} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Complaint trends" className="xl:col-span-3">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={complaintTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="complaints" fill="#ef4444" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  );
}

function ChartCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 ${className ?? ""}`}>
      <h2 className="mb-4 text-base font-semibold text-zinc-950 dark:text-white">
        {title}
      </h2>
      {children}
    </div>
  );
}
