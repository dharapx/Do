"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Check, ChevronsUpDown, Flag, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateTask, useUpdateTask, useTasks } from "@/lib/hooks/use-tasks";
import { tasksApi, type Task, type CreateTaskData, type UpdateTaskData } from "@/lib/api/tasks";
import { PRIORITY_OPTIONS } from "@/lib/constants";

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
}

const TYPE_OPTIONS = [
  { value: "task", label: "Task", icon: ListTodo },
  { value: "goal", label: "Goal", icon: Flag },
] as const;

export function TaskForm({ open, onOpenChange, task }: TaskFormProps) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const isEditing = !!task;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [taskType, setTaskType] = useState<"task" | "goal">("task");
  const [tagsInput, setTagsInput] = useState("");
  const [parentId, setParentId] = useState<number | null>(null);
  const [referenceId, setReferenceId] = useState<number | null>(null);
  const [childIds, setChildIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [parentOpen, setParentOpen] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [childOpen, setChildOpen] = useState(false);

  const listQuery = useMemo(() => ({ limit: 200, sort_by: "created_at" as const, sort_order: "desc" as const }), []);
  const { data: allTasks } = useTasks(listQuery);

  const goalOptions = useMemo(
    () => allTasks?.items?.filter((t) => t.type === "goal" && t.status !== "done" && t.id !== task?.id) ?? [],
    [allTasks, task?.id]
  );
  const refOptions = useMemo(
    () => allTasks?.items?.filter((t) => t.status !== "done" && t.id !== task?.id) ?? [],
    [allTasks, task?.id]
  );

  const availableChildTasks = useMemo(
    () => allTasks?.items?.filter((t) =>
      t.type === "task" && t.status !== "done" && t.id !== task?.id &&
      (!t.parent_id || t.parent_id === task?.id)
    ) ?? [],
    [allTasks, task?.id]
  );

  const selectedParent = useMemo(
    () => (parentId && allTasks?.items ? allTasks.items.find((t) => t.id === parentId) ?? null : null),
    [parentId, allTasks]
  );
  const selectedRef = useMemo(
    () => (referenceId && allTasks?.items ? allTasks.items.find((t) => t.id === referenceId) ?? null : null),
    [referenceId, allTasks]
  );

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority || "medium");
      setTaskType((task.type as "task" | "goal") || "task");
      setTagsInput(task.tags?.join(", ") || "");
      setParentId(task.parent_id ?? null);
      setReferenceId(task.reference_id ?? null);
    } else {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setTaskType("task");
      setTagsInput("");
      setParentId(null);
      setReferenceId(null);
    }
    setChildIds([]);
    setErrors({});
  }, [task, open]);

  useEffect(() => {
    if (task && allTasks?.items) {
      const children = allTasks.items.filter((t) => t.parent_id === task.id).map((t) => t.id);
      setChildIds(children);
    }
  }, [task, allTasks]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = "Title is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (isEditing && task) {
      await updateTask.mutateAsync({
        id: task.id,
        data: {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          type: taskType,
          tags: tags.length > 0 ? tags : undefined,
          parent_id: parentId,
          reference_id: referenceId,
        } as UpdateTaskData,
      });

      if (taskType === "goal") {
        await tasksApi.updateTaskChildren(task.id, childIds);
      }
    } else {
      const created = await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        type: taskType,
        tags: tags.length > 0 ? tags : undefined,
        parent_id: taskType === "task" ? parentId : null,
        reference_id: referenceId,
      } as CreateTaskData);

      if (taskType === "goal" && childIds.length > 0) {
        await tasksApi.updateTaskChildren(created.id, childIds);
      }
    }

    onOpenChange(false);
  };

  const isPending = createTask.isPending || updateTask.isPending;
  const editDisabled = isEditing && task?.status === "done";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "Create Task"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the task details below." : "Fill in the details to create a new task."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter task description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-3">
                {TYPE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setTaskType(opt.value);
                        setParentId(null);
                      }}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors",
                        taskType === opt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input bg-background text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
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

            {!editDisabled && (
              <div className="space-y-2">
                {taskType === "task" ? (
                  <>
                    <Label>Parent Goal</Label>
                    <Popover open={parentOpen} onOpenChange={setParentOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={parentOpen}
                          className="w-full justify-between font-normal"
                        >
                          {selectedParent
                            ? `${selectedParent.id}: ${selectedParent.title}`
                            : "None (standalone task)"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search goals..." />
                          <CommandEmpty>No goals found</CommandEmpty>
                          <CommandList>
                            <CommandGroup>
                              <CommandItem
                                value="0"
                                onSelect={() => {
                                  setParentId(null);
                                  setParentOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    !parentId ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                None (standalone task)
                              </CommandItem>
                              {goalOptions.map((t) => (
                                <CommandItem
                                  key={t.id}
                                  value={String(t.id)}
                                  onSelect={() => {
                                    setParentId(t.id);
                                    setParentOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      parentId === t.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <span className="truncate">{t.id}: {t.title}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </>
                ) : (
                  <>
                    <Label>Link Tasks (add as children)</Label>
                    <Popover open={childOpen} onOpenChange={setChildOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={childOpen}
                          className="w-full justify-between font-normal"
                        >
                          {childIds.length > 0 ? `${childIds.length} task${childIds.length > 1 ? "s" : ""} selected` : "None"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search tasks..." />
                          <CommandEmpty>No tasks available</CommandEmpty>
                          <CommandList>
                            <CommandGroup>
                              {availableChildTasks.map((t) => {
                                const isSelected = childIds.includes(t.id);
                                return (
                                  <CommandItem
                                    key={t.id}
                                    value={String(t.id)}
                                    onSelect={() => {
                                      setChildIds((prev) =>
                                        prev.includes(t.id)
                                          ? prev.filter((x) => x !== t.id)
                                          : [...prev, t.id]
                                      );
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        isSelected ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <span className="truncate">{t.id}: {t.title}</span>
                                  </CommandItem>
                                );
                              })}
                              {availableChildTasks.length === 0 && (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                  No unlinked tasks available
                                </div>
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Reference Task</Label>
              <Popover open={refOpen} onOpenChange={setRefOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={refOpen}
                    className="w-full justify-between font-normal"
                  >
                    {selectedRef
                      ? `${selectedRef.id}: ${selectedRef.title}`
                      : "None"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search tasks or goals..." />
                    <CommandEmpty>No items found</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        <CommandItem
                          value="0"
                          onSelect={() => {
                            setReferenceId(null);
                            setRefOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !referenceId ? "opacity-100" : "opacity-0"
                            )}
                          />
                          None
                        </CommandItem>
                        {refOptions.map((t) => (
                          <CommandItem
                            key={t.id}
                            value={String(t.id)}
                            onSelect={() => {
                              setReferenceId(t.id);
                              setRefOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                referenceId === t.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="truncate">
                              {t.type === "goal" ? <Flag className="inline h-3 w-3 mr-1" /> : <ListTodo className="inline h-3 w-3 mr-1" />}
                              {t.id}: {t.title}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="Enter tags, comma separated"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Separate tags with commas (e.g. bug, frontend, urgent)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEditing ? "Update Task" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
