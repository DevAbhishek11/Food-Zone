"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AXIS = "#9ca3af";
const GRID = "#374151";
const tooltipStyle = { backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#f9fafb", fontSize: 12 };
const shortDate = (d: string) => d.slice(5); // MM-DD

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  accepted: "#3b82f6",
  preparing: "#3b82f6",
  ready: "#3b82f6",
  out_for_delivery: "#3b82f6",
  delivered: "#10b981",
  cancelled: "#ef4444",
  rejected: "#ef4444",
};

export function RevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff6b35" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#ff6b35" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="date" tickFormatter={shortDate} stroke={AXIS} fontSize={11} />
        <YAxis stroke={AXIS} fontSize={11} width={48} />
        <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: AXIS }} formatter={(v) => [`₹${v}`, "Revenue"]} />
        <Area type="monotone" dataKey="revenue" stroke="#ff6b35" strokeWidth={2} fill="url(#rev)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function OrdersChart({ data }: { data: { date: string; orders: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="date" tickFormatter={shortDate} stroke={AXIS} fontSize={11} />
        <YAxis stroke={AXIS} fontSize={11} width={32} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: AXIS }} cursor={{ fill: "#ffffff10" }} />
        <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusPie({ data }: { data: { status: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((d) => (
            <Cell key={d.status} fill={STATUS_COLORS[d.status] ?? "#9ca3af"} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend formatter={(v: string) => <span style={{ color: AXIS, fontSize: 11 }}>{v.replace(/_/g, " ")}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}
