"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  timeApi,
  type ManualEntryData,
  type UpdateEntryData,
} from "@/lib/api/time";

export function useTimeEntries(taskId: number | null) {
  return useQuery({
    queryKey: ["time-entries", taskId],
    queryFn: () => timeApi.fetchTimeEntries(taskId!),
    enabled: taskId !== null,
  });
}

export function useTotalTime(taskId: number | null) {
  return useQuery({
    queryKey: ["total-time", taskId],
    queryFn: () => timeApi.fetchTotalTime(taskId!),
    enabled: taskId !== null,
  });
}

export function useAddManualEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: number; data: ManualEntryData }) =>
      timeApi.addManualEntry(taskId, data),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["time-entries", taskId] });
      queryClient.invalidateQueries({ queryKey: ["total-time", taskId] });
      toast.success("Time entry added");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add time entry");
    },
  });
}

export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, entryId, data }: { taskId: number; entryId: number; data: UpdateEntryData }) =>
      timeApi.updateTimeEntry(taskId, entryId, data),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["time-entries", taskId] });
      queryClient.invalidateQueries({ queryKey: ["total-time", taskId] });
      toast.success("Time entry updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update time entry");
    },
  });
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, entryId }: { taskId: number; entryId: number }) =>
      timeApi.deleteTimeEntry(taskId, entryId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["time-entries", taskId] });
      queryClient.invalidateQueries({ queryKey: ["total-time", taskId] });
      toast.success("Time entry deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete time entry");
    },
  });
}

export function useStartTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: number) => timeApi.startTimer(taskId),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: ["time-entries", taskId] });
      queryClient.invalidateQueries({ queryKey: ["total-time", taskId] });
      toast.success("Timer started");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to start timer");
    },
  });
}

export function useStopTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: number) => timeApi.stopTimer(taskId),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: ["time-entries", taskId] });
      queryClient.invalidateQueries({ queryKey: ["total-time", taskId] });
      toast.success("Timer stopped");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to stop timer");
    },
  });
}
