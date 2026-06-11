"use client";

import { useMemo } from "react";
import { useTimeTimeline } from "@/lib/hooks/use-tasks";

interface Props {
  dateParams?: { date_from?: string; date_to?: string };
}

function formatHours(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return "<1m";
}

function getDatesInRange(from?: string, to?: string): string[] {
  if (!from || !to) return [];
  const dates: string[] = [];
  const start = new Date(from);
  const end = new Date(to);
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export function TimeTimelineChart({ dateParams }: Props) {
  const { data, isLoading } = useTimeTimeline(dateParams);

  const { rows, dayTotals, grandTotal, dateColumns } = useMemo(() => {
    if (!data || data.length === 0) {
      return { rows: [], dayTotals: {}, grandTotal: 0, dateColumns: [] };
    }

    const allDates = getDatesInRange(dateParams?.date_from, dateParams?.date_to);
    const datesFromData = Array.from(new Set(data.map((d) => d.date))).sort();
    const dateColumns = allDates.length > 0 ? allDates : datesFromData;

    // Group: task_id -> { title, perDay: { date: seconds } }
    const taskMap: Record<number, { title: string; perDay: Record<string, number> }> = {};
    const dayTotals: Record<string, number> = {};
    let grandTotal = 0;

    for (const entry of data) {
      if (!taskMap[entry.task_id]) {
        taskMap[entry.task_id] = { title: entry.task_title, perDay: {} };
      }
      taskMap[entry.task_id].perDay[entry.date] = (taskMap[entry.task_id].perDay[entry.date] || 0) + entry.total_seconds;
      dayTotals[entry.date] = (dayTotals[entry.date] || 0) + entry.total_seconds;
      grandTotal += entry.total_seconds;
    }

    const rows = Object.entries(taskMap)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([taskId, info]) => {
        let rowTotal = 0;
        const cells: Record<string, number> = {};
        for (const date of dateColumns) {
          const secs = info.perDay[date] || 0;
          cells[date] = secs;
          rowTotal += secs;
        }
        return { taskId: Number(taskId), title: info.title, cells, rowTotal };
      });

    return { rows, dayTotals, grandTotal, dateColumns };
  }, [data, dateParams]);

  if (isLoading) {
    return <div className="glass-card p-5 h-64 animate-pulse" />;
  }

  if (!data || data.length === 0 || dateColumns.length === 0) {
    return (
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium mb-4">Time Spent</h3>
        <p className="text-sm text-muted-foreground text-center py-12">No time entries in this period</p>
      </div>
    );
  }

  const dateLabels = dateColumns.map((d) => {
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  });

  return (
    <div className="glass-card p-5 overflow-x-auto">
      <h3 className="text-sm font-medium mb-4">Time Spent</h3>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="text-left py-2 pr-4 font-medium">Task</th>
            {dateLabels.map((label, i) => (
              <th key={i} className="text-right py-2 px-2 font-medium tabular-nums min-w-[60px]">
                {label}
              </th>
            ))}
            <th className="text-right py-2 pl-2 font-medium tabular-nums min-w-[60px]">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.taskId} className="border-b border-muted/40 hover:bg-muted/20 transition-colors">
              <td className="py-2 pr-4 truncate max-w-[200px]">
                <span className="text-primary font-mono mr-1">{row.taskId}</span>
                {row.title}
              </td>
              {dateColumns.map((date) => (
                <td key={date} className="text-right py-2 px-2 tabular-nums text-muted-foreground">
                  {row.cells[date] ? formatHours(row.cells[date]) : "—"}
                </td>
              ))}
              <td className="text-right py-2 pl-2 tabular-nums font-medium">
                {formatHours(row.rowTotal)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 font-medium">
            <td className="py-2 pr-4 text-muted-foreground">Total</td>
            {dateColumns.map((date) => (
              <td key={date} className="text-right py-2 px-2 tabular-nums">
                {dayTotals[date] ? formatHours(dayTotals[date]) : "—"}
              </td>
            ))}
            <td className="text-right py-2 pl-2 tabular-nums">{formatHours(grandTotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
