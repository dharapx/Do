"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TaskCard } from "./task-card";
import { useTasks, useDeleteTask } from "@/lib/hooks/use-tasks";
import { useTaskStore } from "@/lib/store/task-store";
import { TaskFilters, type Task } from "@/lib/api/tasks";
import { PRIORITY_COLORS, PRIORITY_OPTIONS, STATUS_COLORS, STATUS_OPTIONS } from "@/lib/constants";
import { ListTodo, Clock, CalendarDays, ChevronDown, ChevronRight, Flag, MoreHorizontal, ExternalLink, Trash2 } from "lucide-react";

interface TaskListProps {
  filters?: TaskFilters;
}

function formatTimeSpent(seconds: number): string {
  if (!seconds) return "-";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function TaskList({ filters }: TaskListProps) {
  const router = useRouter();
  const { data, isLoading, isError, error } = useTasks(filters);
  const deleteTask = useDeleteTask();
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask);
  const [expandedGoals, setExpandedGoals] = useState<Set<number>>(new Set());

  const { goals, standalone, childMap } = useMemo(() => {
    const tasks = data?.items || [];
    const childMap = new Map<number, Task[]>();

    for (const t of tasks) {
      if (t.parent_id) {
        if (!childMap.has(t.parent_id)) childMap.set(t.parent_id, []);
        childMap.get(t.parent_id)!.push(t);
      }
    }

    const goals: Task[] = [];
    const standalone: Task[] = [];

    for (const t of tasks) {
      if (t.type === "goal") {
        goals.push(t);
      } else if (!t.parent_id) {
        standalone.push(t);
      }
    }

    return { goals, standalone, childMap };
  }, [data]);

  const toggleGoal = (id: number) => {
    setExpandedGoals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="divide-y rounded-lg border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border py-12">
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load tasks"}
        </p>
        <Button variant="outline" size="sm" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const tasks = data?.items || [];

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border py-16">
        <ListTodo className="h-12 w-12 text-muted-foreground/30" />
        <h3 className="mt-4 text-sm font-medium">No tasks found</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Create a new task to get started
        </p>
      </div>
    );
  }

  const headerRow = (
    <div className="hidden md:flex items-center gap-2 border-b bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
      <div className="flex-1">Task</div>
      <div className="flex items-center gap-2 ml-auto">
        <div className="w-24 text-center">Status</div>
        <div className="w-20 text-center">Priority</div>
        <div className="hidden lg:block w-28">Tags</div>
        <div className="hidden md:flex items-center gap-1 w-16 justify-end">
          <Clock className="h-3 w-3" />
          Time
        </div>
        <div className="hidden lg:flex items-center gap-1 w-24 justify-end">
          <CalendarDays className="h-3 w-3" />
          Created
        </div>
        <div className="w-9" />
      </div>
    </div>
  );

  return (
    <div className="rounded-lg border">
      {headerRow}
      <div className="divide-y">
        {goals.map((goal) => {
          const expanded = expandedGoals.has(goal.id);
          const children = childMap.get(goal.id) || [];
          const childProgress = children.length > 0
            ? Math.round(children.reduce((s, c) => s + c.progress, 0) / children.length)
            : goal.progress;
          return (
            <div key={goal.id}>
              <div className="bg-muted/30">
                <div
                  className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/tasks/${goal.id}`)}
                >
                  <button
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={(e) => { e.stopPropagation(); toggleGoal(goal.id); }}
                  >
                    {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <Flag className="h-4 w-4 text-primary shrink-0" />
                  <span className="hidden md:block w-10 text-center shrink-0">
                    <span className="text-primary font-mono tabular-nums text-xs">{goal.id}</span>
                  </span>
                  <span className="text-sm font-semibold flex-1 truncate">{goal.title}</span>
                  <div className="flex items-center gap-2 ml-auto">
                    <div className="w-24 overflow-hidden text-center">
                      <Badge variant={STATUS_COLORS[goal.status] as any || "slate"} className="inline-flex text-[10px] px-1.5 py-0">
                        <span className="truncate">{STATUS_OPTIONS[goal.status] || goal.status}</span>
                      </Badge>
                    </div>
                    <div className="w-20 overflow-hidden text-center">
                      <Badge variant={PRIORITY_COLORS[goal.priority] as any || "slate"} className="inline-flex text-[10px] px-1.5 py-0">
                        <span className="truncate">{PRIORITY_OPTIONS[goal.priority] || goal.priority}</span>
                      </Badge>
                    </div>
                    {goal.tags && goal.tags.length > 0 ? (
                      <div className="hidden lg:flex items-center gap-1 w-28">
                        {goal.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="truncate text-[10px] text-muted-foreground border rounded px-1.5 py-0">{tag}</span>
                        ))}
                        {goal.tags.length > 2 && <span className="text-[10px] text-muted-foreground shrink-0">+{goal.tags.length - 2}</span>}
                      </div>
                    ) : <div className="hidden lg:block w-28" />}
                    <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground w-16 justify-end">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeSpent(goal.total_time_spent)}</span>
                    </div>
                    <div className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground w-24 justify-end">
                      <span>{format(new Date(goal.created_at), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                      <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${childProgress}%` }} />
                      </div>
                      <span className="tabular-nums">{childProgress}%</span>
                      <span className="hidden lg:inline">{children.length} tasks</span>
                    </div>
                    <div className="w-9" />
                  </div>
                </div>
              </div>
              {expanded && (
                <div className="divide-y border-t">
                  {children.map((child) => (
                    <div key={child.id} className="pl-10">
                      <TaskCard
                        task={child}
                        onDelete={(id) => deleteTask.mutate(id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {standalone.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDelete={(id) => deleteTask.mutate(id)}
          />
        ))}
      </div>
    </div>
  );
}
