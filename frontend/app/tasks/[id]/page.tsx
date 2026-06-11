"use client";

import { useParams } from "next/navigation";
import { TaskDetail } from "@/components/tasks/task-detail";

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = Number(params.id);

  if (isNaN(taskId)) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Invalid task ID</p>
      </div>
    );
  }

  return <TaskDetail taskId={taskId} />;
}
