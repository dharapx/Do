"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ListTodo,
  Circle,
  PlayCircle,
  AlertTriangle,
  ArrowRight,
  Maximize2,
  Minimize2,
  RefreshCw,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { useDashboardStats } from "@/lib/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TimeTimelineChart } from "@/components/dashboard/time-timeline-chart";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { MiniRing } from "@/components/dashboard/mini-ring";

const STATUS_COLORS: Record<string, string> = {
  "Not Started": "#64748b",
  "In Progress": "#3b82f6",
  Done: "#22c55e",
  "Won't Do": "#a1a1aa",
};
const PRIORITY_BAR_COLORS: Record<string, string> = {
  urgent: "#ef4444",
  high: "#f97316",
  "medium / low": "#94a3b8",
};

const PRESETS = [
  { label: "1d", days: 1 },
  { label: "2d", days: 2 },
  { label: "3d", days: 3 },
  { label: "7d", days: 7 },
  { label: "15d", days: 15 },
  { label: "30d", days: 30 },
] as const;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [activePreset, setActivePreset] = useState<number | "custom">(1);
  const [maximizedPanel, setMaximizedPanel] = useState<"activity" | "time" | null>(null);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const dateParams = useMemo(() => {
    if (activePreset === "custom") {
      if (!customFrom && !customTo) return undefined;
      const p: { date_from?: string; date_to?: string } = {};
      if (customFrom) p.date_from = customFrom;
      if (customTo) p.date_to = customTo;
      return p;
    }
    if (activePreset === 0) return undefined;
    return { date_from: daysAgoISO(activePreset), date_to: todayISO() };
  }, [activePreset, customFrom, customTo]);

  const { data: filteredStats, isLoading: isFilteredLoading } = useDashboardStats(dateParams);
  const { data: globalStats, isLoading: isGlobalLoading } = useDashboardStats();

  if (isGlobalLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  const pending = (globalStats?.not_started || 0) + (globalStats?.in_progress || 0);

  const statusPieData = [
    { name: "Not Started", value: filteredStats?.not_started || 0 },
    { name: "In Progress", value: filteredStats?.in_progress || 0 },
    { name: "Done", value: filteredStats?.done || 0 },
    { name: "Won't Do", value: filteredStats?.wont_do || 0 },
  ];

  const urgentCount = filteredStats?.urgent_all || 0;
  const highCount = filteredStats?.high_priority_all || 0;
  const otherCount = Math.max(0, (filteredStats?.total || 0) - urgentCount - highCount);
  const priorityData = [
    { name: "Urgent", value: urgentCount },
    { name: "High", value: highCount },
    { name: "Medium / Low", value: otherCount },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-row flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border p-0.5 bg-muted/30">
            {PRESETS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => { setActivePreset(opt.days); setCustomFrom(""); setCustomTo(""); }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  ["3d", "15d", "30d"].includes(opt.label) ? "hidden sm:inline-block" : ""
                } ${
                  activePreset === opt.days
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
            <button
              onClick={() => setActivePreset("custom")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activePreset === "custom"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Custom
            </button>
          </div>
          {activePreset === "custom" && (
            <div className="flex items-center gap-1">
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-7 w-32 text-xs"
              />
              <span className="text-xs text-muted-foreground">—</span>
              <Input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-7 w-32 text-xs"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Pending Tasks" value={pending} icon={ListTodo} iconColor="#3b82f6" />
        <StatsCard label="Not Started" value={globalStats?.not_started || 0} icon={Circle} iconColor="#64748b" />
        <StatsCard label="In Progress" value={globalStats?.in_progress || 0} icon={PlayCircle} iconColor="#3b82f6" />
        <StatsCard label="Urgent" value={globalStats?.urgent || 0} icon={AlertTriangle} iconColor="#ef4444" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-5">
          <h3 className="text-sm font-medium mb-4">Status Distribution</h3>
          {statusPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusPieData.map((entry, idx) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">No tasks in this period</p>
          )}
          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            {statusPieData.map((d) => (
              <span key={d.name} className="flex items-center gap-1">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[d.name] }}
                />
                {d.name}: {d.value}
              </span>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-medium mb-4">Priority Breakdown</h3>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={priorityData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={PRIORITY_BAR_COLORS[entry.name.toLowerCase()] || "#94a3b8"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">No tasks in this period</p>
          )}
        </div>

        <div className="grid grid-rows-2 gap-4">
          <div className="glass-card p-5 flex flex-col">
            <h3 className="text-sm font-medium">Quick Actions</h3>
            <div className="mt-auto space-y-2">
              <Link href="/tasks">
                <Button variant="outline" className="w-full justify-between">
                  View All Tasks
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/notes">
                <Button variant="outline" className="w-full justify-between">
                  New Note
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="glass-card p-5 flex flex-col items-center justify-center gap-3">
            <h3 className="text-sm font-medium self-start">Summary</h3>
            <div className="flex items-center justify-around w-full gap-4">
              <div className="flex flex-col items-center gap-1">
                <MiniRing
                  value={globalStats && globalStats.total > 0 ? Math.round(((globalStats.done + globalStats.wont_do) / globalStats.total) * 100) : 0}
                  size={96}
                  strokeWidth={8}
                  color="hsl(var(--primary))"
                  bgColor="hsl(var(--muted))"
                />
                <span className="text-[10px] text-muted-foreground">Completion</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <MiniRing
                  value={Math.round(globalStats?.avg_progress || 0)}
                  size={96}
                  strokeWidth={8}
                  color="#3b82f6"
                  bgColor="hsl(var(--muted))"
                />
                <span className="text-[10px] text-muted-foreground">Avg Progress</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`relative ${maximizedPanel === "time" ? "hidden" : maximizedPanel === "activity" ? "lg:col-span-2" : ""}`}>
          <div className="hidden sm:flex absolute top-3 right-3 z-10 items-center gap-1">
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["tasks"] })}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setMaximizedPanel(maximizedPanel === "activity" ? null : "activity")}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title={maximizedPanel === "activity" ? "Minimize" : "Maximize"}
            >
              {maximizedPanel === "activity" ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
          <RecentActivity />
        </div>

        <div className={`relative ${maximizedPanel === "activity" ? "hidden" : maximizedPanel === "time" ? "lg:col-span-2" : ""}`}>
          <div className="hidden sm:flex absolute top-3 right-3 z-10 items-center gap-1">
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["time-entries"] })}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setMaximizedPanel(maximizedPanel === "time" ? null : "time")}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title={maximizedPanel === "time" ? "Minimize" : "Maximize"}
            >
              {maximizedPanel === "time" ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
          <TimeTimelineChart dateParams={dateParams} />
        </div>
      </div>
    </div>
  );
}
