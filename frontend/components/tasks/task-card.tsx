"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Clock, MoreHorizontal, Trash2, ExternalLink, Flag, ListTodo, Link2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PRIORITY_COLORS, PRIORITY_OPTIONS, STATUS_COLORS, STATUS_OPTIONS } from "@/lib/constants";
import { type Task } from "@/lib/api/tasks";

interface TaskCardProps {
  task: Task;
  onDelete?: (id: number) => void;
}

function formatTimeSpent(seconds: number): string {
  if (!seconds) return "-";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function TaskCard({ task, onDelete }: TaskCardProps) {
  const router = useRouter();

  return (
    <div
      className="group flex items-center gap-2 border-b px-4 py-3 transition-colors hover:bg-muted/50 cursor-pointer"
      onClick={() => router.push(`/tasks/${task.id}`)}
    >
      <div className="hidden md:block w-10 text-center shrink-0">
        <span className="text-primary font-mono tabular-nums text-xs">{task.id}</span>
      </div>

      <div className="w-5 shrink-0 text-muted-foreground">
        {task.type === "goal" ? <Flag className="h-4 w-4" /> : <ListTodo className="h-4 w-4" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {task.title}
        </p>
        {task.reference_id && task.reference_title && (
          <p className="text-[10px] text-muted-foreground truncate mt-0.5 flex items-center gap-1">
            <Link2Icon className="h-3 w-3 shrink-0" />
            Ref: #{task.reference_id} — {task.reference_title}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <div className="hidden md:flex w-16 items-center gap-1.5">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${task.progress}%` }}
            />
          </div>
          <span className="text-[10px] tabular-nums text-muted-foreground w-6 text-right">{task.progress}%</span>
        </div>

        <div className="w-24 overflow-hidden text-center">
          <Badge
            variant={STATUS_COLORS[task.status] as any || "slate"}
            className="inline-flex text-[10px] px-1.5 py-0"
          >
            <span className="truncate">{STATUS_OPTIONS[task.status] || task.status}</span>
          </Badge>
        </div>

        <div className="w-20 overflow-hidden text-center">
          <Badge
            variant={PRIORITY_COLORS[task.priority] as any || "slate"}
            className="inline-flex text-[10px] px-1.5 py-0"
          >
            <span className="truncate">{PRIORITY_OPTIONS[task.priority] || task.priority}</span>
          </Badge>
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="hidden lg:flex items-center gap-1 w-28">
            {task.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="truncate text-[10px] text-muted-foreground border rounded px-1.5 py-0">
                {tag}
              </span>
            ))}
            {task.tags.length > 2 && (
              <span className="text-[10px] text-muted-foreground shrink-0">+{task.tags.length - 2}</span>
            )}
          </div>
        )}
        {(!task.tags || task.tags.length === 0) && <div className="hidden lg:block w-28" />}

        <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground w-16 justify-end">
          <Clock className="h-3 w-3" />
          <span>{formatTimeSpent(task.total_time_spent)}</span>
        </div>

        <div className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground w-24 justify-end">
          <span>{format(new Date(task.created_at), "MMM d, yyyy")}</span>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => router.push(`/tasks/${task.id}`)}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete?.(task.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
