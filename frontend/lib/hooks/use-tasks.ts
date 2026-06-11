"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tasksApi, type Task, type TaskFilters, type CreateTaskData, type UpdateTaskData } from "@/lib/api/tasks";

export function useTasks(params?: TaskFilters) {
  return useQuery({
    queryKey: ["tasks", params],
    queryFn: () => tasksApi.fetchTasks(params),
  });
}

export function useTask(id: number | null) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: () => tasksApi.fetchTask(id!),
    enabled: id !== null,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskData) => tasksApi.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task created");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create task");
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTaskData }) =>
      tasksApi.updateTask(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["task", id] });
      const previous = queryClient.getQueryData<Task>(["task", id]);
      if (previous) {
        queryClient.setQueryData<Task>(["task", id], { ...previous, ...data });
      }
      return { previous, id };
    },
    onError: (error: Error, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["task", context.id], context.previous);
      }
      toast.error(error.message || "Failed to update task");
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["task", id] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onSuccess: () => {
      toast.success("Task updated");
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => tasksApi.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete task");
    },
  });
}

export function useDashboardStats(params?: { date_from?: string; date_to?: string }) {
  return useQuery({
    queryKey: ["dashboard", "stats", params],
    queryFn: () => tasksApi.fetchDashboardStats(params),
  });
}

export function useTimeTimeline(params?: { date_from?: string; date_to?: string }) {
  return useQuery({
    queryKey: ["dashboard", "time-timeline", params],
    queryFn: () => tasksApi.fetchTimeTimeline(params),
  });
}

export function useSetTaskParent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, parentId }: { taskId: number; parentId: number | null }) =>
      tasksApi.setTaskParent(taskId, parentId),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ["task", task.id] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update goal link");
    },
  });
}

export function useUpdateTaskChildren() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ goalId, childIds }: { goalId: number; childIds: number[] }) =>
      tasksApi.updateTaskChildren(goalId, childIds),
    onSuccess: (goal) => {
      queryClient.invalidateQueries({ queryKey: ["task", goal.id] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update linked tasks");
    },
  });
}

export function useSearchTasks(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => tasksApi.searchTasks(query),
    enabled: query.length > 0,
  });
}
