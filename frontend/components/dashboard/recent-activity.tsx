"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { tasksApi, type Task } from "@/lib/api/tasks";
import { PRIORITY_COLORS, PRIORITY_OPTIONS, STATUS_COLORS, STATUS_OPTIONS } from "@/lib/constants";

function getStatusBadgeVariant(status: string) {
  return STATUS_COLORS[status] || "slate" as const;
}

function getPriorityBadgeVariant(priority: string) {
  return PRIORITY_COLORS[priority] || "slate" as const;
}

export function RecentActivity() {
  const { data, isLoading } = useQuery({
    queryKey: ["tasks", { limit: 5, sort_by: "updated_at", sort_order: "desc" }],
    queryFn: () => tasksApi.fetchTasks({ limit: 5, sort_by: "updated_at", sort_order: "desc" }),
  });

  const tasks = data?.items || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-2 w-2 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <History className="h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task: Task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="flex items-start gap-3 group rounded-lg p-2 -mx-2 transition-colors hover:bg-muted/50"
              >
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/30" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {task.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(task.status) as any} className="text-[10px] px-1.5 py-0">
                      {STATUS_OPTIONS[task.status] || task.status}
                    </Badge>
                    <Badge variant={getPriorityBadgeVariant(task.priority) as any} className="text-[10px] px-1.5 py-0">
                      {PRIORITY_OPTIONS[task.priority] || task.priority}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(task.updated_at), "MMM d, HH:mm")}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
