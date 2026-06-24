"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Timer,
  Square,
  Plus,
  Send,
  Trash2,
  Edit3,
  Check,
  X,
  MessageSquare,
  Flag,
  ListTodo,
  Link2,
  ChevronsUpDown,
  MoreVertical,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTask, useUpdateTask, useTasks, useSetTaskParent, useUpdateTaskChildren, useDeleteTask } from "@/lib/hooks/use-tasks";
import { useComments, useCreateComment, useDeleteComment, useUpdateComment } from "@/lib/hooks/use-comments";
import { useTimeEntries, useTotalTime, useStartTimer, useStopTimer, useAddManualEntry, useUpdateTimeEntry, useDeleteTimeEntry } from "@/lib/hooks/use-time";
import { useAttachments, useUploadAttachment, useDeleteAttachment } from "@/lib/hooks/use-attachments";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "@/lib/constants";
import { type Task } from "@/lib/api/tasks";
import { type TimeEntry } from "@/lib/api/time";
import { type Comment } from "@/lib/api/comments";
import { type Attachment } from "@/lib/api/attachments";
import { attachmentsApi } from "@/lib/api/attachments";
import { RichTextEditor, FormattedContent, isHtml } from "@/components/ui/rich-text-editor";
import { isCommentEmpty } from "@/components/comments/blocknote-comment";
import dynamic from "next/dynamic";

const BlockNoteComment = dynamic(
  () => import("@/components/comments/blocknote-comment").then((m) => m.BlockNoteComment),
  { ssr: false, loading: () => <div className="min-h-[80px]" /> }
);

interface TaskDetailProps {
  taskId: number;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "0m";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function TaskDetail({ taskId }: TaskDetailProps) {
  const router = useRouter();
  const { data: task, isLoading } = useTask(taskId);
  const { data: comments, isLoading: commentsLoading } = useComments(taskId);
  const { data: timeEntries, isLoading: timeLoading } = useTimeEntries(taskId);
  const { data: totalTime } = useTotalTime(taskId);

  const updateTask = useUpdateTask();
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const updateComment = useUpdateComment();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();
  const addManualEntry = useAddManualEntry();
  const updateTimeEntry = useUpdateTimeEntry();
  const deleteTimeEntry = useDeleteTimeEntry();
  const setTaskParent = useSetTaskParent();
  const updateTaskChildren = useUpdateTaskChildren();
  const deleteTask = useDeleteTask();
  const { data: attachments } = useAttachments(taskId);
  const uploadAttachment = useUploadAttachment();
  const deleteAttachment = useDeleteAttachment();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editedDesc, setEditedDesc] = useState("");
  const [commentText, setCommentText] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [localProgress, setLocalProgress] = useState<number | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [editDuration, setEditDuration] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [commentKey, setCommentKey] = useState(0);
  const [goalOpen, setGoalOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [manageIds, setManageIds] = useState<number[]>(() =>
    task?.children?.filter((c) => c.status !== "done").map((c) => c.id) ?? []
  );

  useEffect(() => {
    if (task?.children) {
      setManageIds(task.children.filter((c) => c.status !== "done").map((c) => c.id));
    }
  }, [task?.children]);

  useEffect(() => {
    if (localProgress !== null && task?.progress === localProgress) {
      setLocalProgress(null);
    }
  }, [task?.progress, localProgress]);

  const listQuery = useMemo(() => ({ limit: 200, sort_by: "created_at" as const, sort_order: "desc" as const }), []);
  const { data: allTasks } = useTasks(listQuery);

  const availableGoals = useMemo(
    () => allTasks?.items?.filter((t) => t.type === "goal" && t.status !== "done" && t.id !== taskId) ?? [],
    [allTasks, taskId]
  );

  const availableChildTasks = useMemo(
    () => allTasks?.items?.filter((t) =>
      t.type === "task" && t.status !== "done" && t.id !== taskId &&
      (!t.parent_id || t.parent_id === taskId)
    ) ?? [],
    [allTasks, taskId]
  );

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">Task not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/tasks")}>
          Back to Tasks
        </Button>
      </div>
    );
  }

  const handleUpdateTitle = () => {
    if (editedTitle.trim() && editedTitle !== task.title) {
      updateTask.mutate({ id: taskId, data: { title: editedTitle.trim() } });
    }
    setIsEditingTitle(false);
  };

  const handleUpdateDesc = () => {
    const cleanDesc = editedDesc === "<p></p>" || editedDesc === "<p><br></p>" ? "" : editedDesc;
    if (cleanDesc !== (task.description || "")) {
      updateTask.mutate({ id: taskId, data: { description: cleanDesc || undefined } });
    }
    setIsEditingDesc(false);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCommentEmpty(commentText)) return;
    createComment.mutate(
      { taskId, data: { content: commentText } },
      {
        onSuccess: () => {
          setCommentText("");
          setCommentKey((k) => k + 1);
        },
      }
    );
  };

  const handleTimerToggle = () => {
    if (isTimerRunning) {
      stopTimer.mutate(taskId, {
        onSuccess: () => setIsTimerRunning(false),
      });
    } else {
      startTimer.mutate(taskId, {
        onSuccess: () => setIsTimerRunning(true),
      });
    }
  };

  const handleManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = parseInt(manualTime);
    if (isNaN(minutes) || minutes <= 0 || minutes > 1440) return;
    addManualEntry.mutate(
      { taskId, data: { duration: minutes * 60 } },
      { onSuccess: () => setManualTime("") }
    );
  };

  const startEditEntry = (entry: TimeEntry) => {
    setEditingEntryId(entry.id);
    setEditDuration(String(Math.floor(entry.duration / 60)));
    setEditDescription(entry.description ?? "");
  };

  const cancelEditEntry = () => {
    setEditingEntryId(null);
    setEditDuration("");
    setEditDescription("");
  };

  const handleEditEntry = (entryId: number) => {
    const minutes = parseInt(editDuration);
    if (isNaN(minutes) || minutes <= 0 || minutes > 1440) return;
    updateTimeEntry.mutate(
      { taskId, entryId, data: { duration: minutes * 60, description: editDescription || null } },
      { onSuccess: () => cancelEditEntry() }
    );
  };

  const handleDeleteEntry = (entryId: number) => {
    if (confirm("Delete this time entry?")) {
      deleteTimeEntry.mutate({ taskId, entryId });
    }
  };

  const startEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditCommentContent(comment.content || "");
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentContent("");
  };

  const handleUpdateComment = (commentId: number) => {
    if (isCommentEmpty(editCommentContent)) return;
    updateComment.mutate(
      { taskId, commentId, data: { content: editCommentContent } },
      { onSuccess: () => cancelEditComment() }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push("/tasks")} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                if (confirm(`Delete task "${task.title}"? This cannot be undone.`)) {
                  deleteTask.mutate(taskId, {
                    onSuccess: () => router.push("/tasks"),
                  });
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
            <span className="flex items-center gap-1">
              {task.type === "goal" ? <Flag className="h-3 w-3" /> : <ListTodo className="h-3 w-3" />}
              {task.type === "goal" ? "Goal" : "Task"}
            </span>
            {task.type === "task" && task.parent_id ? (
              <>
                <span className="text-muted-foreground/40">·</span>
                <Link href={`/tasks/${task.parent_id}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  <Flag className="h-3 w-3" />
                  <span className="truncate">Goal #{task.parent_id}</span>
                </Link>
                <button
                  onClick={(e) => { e.stopPropagation(); setTaskParent.mutate({ taskId, parentId: null }); }}
                  className="text-muted-foreground/60 hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : task.type === "task" ? (
              <>
                <span className="text-muted-foreground/40">·</span>
                <Popover open={goalOpen} onOpenChange={setGoalOpen}>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1 text-primary hover:underline transition-colors">
                      <Flag className="h-3 w-3" />
                      Link to Goal
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search goals..." />
                      <CommandEmpty>No goals available</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {availableGoals.map((g) => (
                            <CommandItem
                              key={g.id}
                              value={String(g.id)}
                              onSelect={() => {
                                setTaskParent.mutate({ taskId, parentId: g.id });
                                setGoalOpen(false);
                              }}
                            >
                              <Flag className="mr-2 h-4 w-4 text-muted-foreground" />
                              <span className="truncate">{g.id}: {g.title}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </>
            ) : task.type === "goal" && (task.children?.length ?? 0) > 0 ? (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="flex items-center gap-1">
                  <Flag className="h-3 w-3" />
                  Goal
                </span>
              </>
            ) : null}
          </div>
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdateTitle();
                  if (e.key === "Escape") setIsEditingTitle(false);
                }}
                className="text-lg font-semibold h-9"
                autoFocus
              />
              <Button size="icon" variant="ghost" onClick={handleUpdateTitle}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setIsEditingTitle(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <h2
              className="text-lg font-semibold cursor-pointer hover:text-primary transition-colors"
              onClick={() => {
                setEditedTitle(task.title);
                setIsEditingTitle(true);
              }}
            >
              <span className="text-primary font-mono tabular-nums mr-2">{task.id}</span>
              {task.title}
            </h2>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border p-4 space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Details</h3>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              {isEditingDesc ? (
                <div className="space-y-2">
                  <RichTextEditor
                    content={editedDesc}
                    onChange={setEditedDesc}
                    placeholder="Add a description..."
                    minHeight="100px"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleUpdateDesc}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditingDesc(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div
                  className="text-sm text-foreground/80 cursor-pointer hover:text-foreground min-h-[2rem]"
                  onClick={() => {
                    setEditedDesc(task.description || "");
                    setIsEditingDesc(true);
                  }}
                >
                  {task.description ? (
                    isHtml(task.description) ? (
                      <FormattedContent html={task.description} />
                    ) : (
                      <span>{task.description}</span>
                    )
                  ) : (
                    <span className="text-muted-foreground italic">Add a description...</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Select
                  value={task.status}
                  onValueChange={(value) =>
                    updateTask.mutate({ id: taskId, data: { status: value } })
                  }
                >
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_OPTIONS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Priority</p>
                <Select
                  value={task.priority}
                  onValueChange={(value) =>
                    updateTask.mutate({ id: taskId, data: { priority: value } })
                  }
                >
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_OPTIONS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">Progress</p>
                <span className="text-xs font-medium tabular-nums">{localProgress ?? task.progress}%</span>
              </div>
              <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${localProgress ?? task.progress}%` }}
                />
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={localProgress ?? task.progress}
                onChange={(e) => setLocalProgress(parseInt(e.target.value))}
                onPointerUp={(e) => {
                  const val = parseInt((e.target as HTMLInputElement).value);
                  if (val !== task.progress) {
                    updateTask.mutate({ id: taskId, data: { progress: val } });
                  }
                }}
                onKeyUp={(e) => {
                  if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
                    const val = parseInt((e.target as HTMLInputElement).value);
                    if (val !== task.progress) {
                      updateTask.mutate({ id: taskId, data: { progress: val } });
                    }
                  }
                }}
                className="mt-1 w-full h-2 appearance-none cursor-pointer rounded-full bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow"
              />
            </div>

            {task.tags && task.tags.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {task.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {task.reference_id && task.reference_title && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Reference</p>
                <Link
                  href={`/tasks/${task.reference_id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  #{task.reference_id} — {task.reference_title}
                </Link>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Created {format(new Date(task.created_at), "MMM d, yyyy HH:mm")}
              {task.updated_at !== task.created_at &&
                ` · Updated ${format(new Date(task.updated_at), "MMM d, yyyy HH:mm")}`
              }
            </p>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Attachments
              <div className="ml-auto">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      uploadAttachment.mutate({ taskId, file });
                      e.target.value = "";
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Upload
                </Button>
              </div>
            </h3>

            {attachments && attachments.length > 0 ? (
              <div className="space-y-1">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between text-sm group -mx-4 px-4 py-1 hover:bg-muted/50 transition-colors">
                    <button
                      className="flex items-center gap-2 min-w-0 text-primary hover:underline truncate"
                      onClick={() => attachmentsApi.download(taskId, att.id)}
                    >
                      <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="truncate">{att.filename}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        ({att.size > 1024 ? `${(att.size / 1024).toFixed(1)} KB` : `${att.size} B`})
                      </span>
                    </button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive shrink-0"
                      onClick={() => deleteAttachment.mutate({ taskId, attachmentId: att.id })}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2 italic">
                Drop a file or click Upload to attach
              </p>
            )}
          </div>

          {task.type === "goal" && (
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ListTodo className="h-4 w-4" />
                Linked Tasks {(task.children?.length ?? 0) > 0 && `(${task.children!.length})`}
                <Popover open={manageOpen} onOpenChange={setManageOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-auto h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" />
                      Manage
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-0" align="end">
                    <Command>
                      <CommandInput placeholder="Search tasks..." />
                      <CommandEmpty>No tasks available</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {availableChildTasks.map((t) => {
                            const isSelected = manageIds.includes(t.id);
                            return (
                              <CommandItem
                                key={t.id}
                                value={String(t.id)}
                                onSelect={() => {
                                  setManageIds(prev =>
                                    isSelected ? prev.filter((x) => x !== t.id) : [...prev, t.id]
                                  );
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                <span className="truncate">{t.id}: {t.title}</span>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                      <div className="border-t p-2">
                        <Button
                          size="sm"
                          className="w-full text-xs"
                          onClick={async () => {
                            try {
                              const goal = await updateTaskChildren.mutateAsync({ goalId: taskId, childIds: manageIds });
                              setManageIds(goal.children?.map((c: any) => c.id) ?? []);
                              setManageOpen(false);
                            } catch {
                              /* error toast handled by hook */
                            }
                          }}
                        >
                          Save
                        </Button>
                      </div>
                    </Command>
                  </PopoverContent>
                </Popover>
              </h3>
              {task.children && task.children.length > 0 && (
                <div className="divide-y">
                  {task.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/tasks/${child.id}`}
                      className="flex items-center gap-3 py-2 text-sm hover:bg-muted/50 -mx-4 px-4 transition-colors"
                    >
                      <div className="flex-1 truncate font-medium">{child.title}</div>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        child.status === "done" ? "bg-green-500/10 text-green-600" :
                        child.status === "in_progress" ? "bg-blue-500/10 text-blue-600" :
                        child.status === "wont_do" ? "bg-gray-500/10 text-gray-600" :
                        "bg-gray-500/5 text-muted-foreground"
                      }`}>
                        {child.status === "not_started" ? "Not Started" :
                         child.status === "in_progress" ? "In Progress" :
                         child.status === "done" ? "Done" :
                         child.status === "wont_do" ? "Won't Do" : child.status}
                      </span>
                      <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">{child.progress}%</span>
                    </Link>
                  ))}
                </div>
              )}
              {(!task.children || task.children.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No linked tasks</p>
              )}
            </div>
          )}

          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments
              </h3>
            </div>

            <form onSubmit={handleAddComment} className="space-y-2">
              <BlockNoteComment
                key={commentKey}
                content={commentText}
                onChange={setCommentText}
                editable={true}
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={isCommentEmpty(commentText)}>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Comment
                </Button>
              </div>
            </form>

            {commentsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : comments && comments.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {comments.map((comment) => (
                  <div key={comment.id} className="rounded-lg bg-muted/50 p-3 group">
                    {editingCommentId === comment.id ? (
                      <div className="space-y-2">
                        <BlockNoteComment
                          key={`edit-${comment.id}`}
                          content={editCommentContent}
                          onChange={setEditCommentContent}
                          editable={true}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" onClick={() => handleUpdateComment(comment.id)} disabled={isCommentEmpty(editCommentContent)}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditComment}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm">
                          {comment.content.startsWith("[") ? (
                            <BlockNoteComment content={comment.content} editable={false} />
                          ) : isHtml(comment.content) ? (
                            <FormattedContent html={comment.content} />
                          ) : (
                            <span className="whitespace-pre-wrap">{comment.content}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-[10px] text-muted-foreground">
                            {format(new Date(comment.created_at), "MMM d, HH:mm")}
                          </p>
                          <button
                            className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors opacity-0 group-hover:opacity-100"
                            onClick={() => startEditComment(comment)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-[10px] text-muted-foreground/50 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                            onClick={() => deleteComment.mutate({ taskId, commentId: comment.id })}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No comments yet
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border p-4 space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Tracking
            </h3>

            <div className="text-center py-2">
              <p className="text-3xl font-bold tracking-tight">
                {formatDuration(totalTime?.total_time ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total tracked</p>
            </div>

            <div className="flex gap-2">
              <Button
                variant={isTimerRunning ? "destructive" : "default"}
                className="flex-1"
                onClick={handleTimerToggle}
              >
                {isTimerRunning ? (
                  <><Square className="h-4 w-4 mr-2" /> Stop</>
                ) : (
                  <><Timer className="h-4 w-4 mr-2" /> Start Timer</>
                )}
              </Button>
            </div>

            <Separator />

            <form onSubmit={handleManualEntry} className="flex gap-2">
              <Input
                type="number"
                placeholder="Minutes (max 1440)"
                value={manualTime}
                onChange={(e) => setManualTime(e.target.value)}
                className="flex-1"
                min="1"
                max="1440"
              />
              <Button type="submit" size="icon" variant="outline" disabled={!manualTime || parseInt(manualTime) > 1440}>
                <Plus className="h-4 w-4" />
              </Button>
            </form>

            {timeLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : timeEntries && timeEntries.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {timeEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between text-sm group">
                    {editingEntryId === entry.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          max="1440"
                          value={editDuration}
                          onChange={(e) => setEditDuration(e.target.value)}
                          className="w-20 h-7 text-xs"
                        />
                        <Input
                          placeholder="Description"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="flex-1 h-7 text-xs"
                        />
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEditEntry(entry.id)} disabled={!editDuration || parseInt(editDuration) > 1440}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEditEntry}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-muted-foreground shrink-0">
                            {entry.started_at
                              ? format(new Date(entry.started_at), "MMM d, HH:mm")
                              : "Manual"}
                          </span>
                          {entry.description && (
                            <span className="text-xs text-muted-foreground truncate max-w-[120px]">{entry.description}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="font-medium">{formatDuration(entry.duration)}</span>
                          <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => startEditEntry(entry)}>
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => handleDeleteEntry(entry.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                No time entries
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
