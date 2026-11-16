"use client";

import {
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
import { formatPkr } from "@/lib/format";
import type { CategorySpend } from "@/lib/finance/reports";

const COLORS = [
  "#0f766e",
  "#0369a1",
  "#b45309",
  "#be123c",
  "#4f46e5",
  "#15803d",
  "#7c3aed",
  "#0e7490",
];

type ReportsChartsProps = {
  weeklyCategories: CategorySpend[];
  monthlyCategories: CategorySpend[];
  weeklyComparison: { label: string; amount: number }[];
  utilizationPercent: number;
};

export function ReportsCharts({
  weeklyCategories,
  monthlyCategories,
  weeklyComparison,
  utilizationPercent,
}: ReportsChartsProps) {
  const pieData =
    monthlyCategories.length > 0
      ? monthlyCategories
      : [{ name: "No spending", amount: 1, categoryId: null }];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="h-72 rounded-xl border border-border p-4">
        <p className="mb-3 text-sm font-medium text-foreground">
          This week vs previous week
        </p>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={weeklyComparison}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
            />
            <Tooltip
              formatter={(value) => formatPkr(Number(value ?? 0))}
              contentStyle={{ borderRadius: 12 }}
            />
            <Bar dataKey="amount" fill="#0f766e" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="h-72 rounded-xl border border-border p-4">
        <p className="mb-3 text-sm font-medium text-foreground">
          Weekly category spending
        </p>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart
            data={
              weeklyCategories.length
                ? weeklyCategories
                : [{ name: "None", amount: 0, categoryId: null }]
            }
            layout="vertical"
            margin={{ left: 8, right: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={90}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value) => formatPkr(Number(value ?? 0))}
              contentStyle={{ borderRadius: 12 }}
            />
            <Bar dataKey="amount" fill="#0369a1" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="h-72 rounded-xl border border-border p-4">
        <p className="mb-3 text-sm font-medium text-foreground">
          Monthly category mix
        </p>
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="amount"
              nameKey="name"
              innerRadius={48}
              outerRadius={80}
              paddingAngle={2}
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`${entry.name}-${index}`}
                  fill={
                    monthlyCategories.length === 0
                      ? "#cbd5e1"
                      : COLORS[index % COLORS.length]
                  }
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatPkr(Number(value ?? 0))}
              contentStyle={{ borderRadius: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex h-72 flex-col justify-center rounded-xl border border-border p-6">
        <p className="text-sm font-medium text-foreground">
          Budget utilization
        </p>
        <p className="mt-2 font-heading text-5xl tracking-tight text-foreground">
          {utilizationPercent}%
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Share of your spending budget used this month. Allocated savings and
          emergency set-asides are not counted as expenses.
        </p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{
              width: `${Math.min(100, Math.max(0, utilizationPercent))}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
