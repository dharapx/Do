import { api } from "./client";

export interface TimeEntry {
  id: number;
  task_id: number;
  duration: number;
  description: string | null;
  started_at: string | null;
  stopped_at: string | null;
  created_at: string;
}

export interface TotalTime {
  task_id: number;
  total_time: number;
}

export interface ManualEntryData {
  duration: number;
  description?: string;
}

export interface UpdateEntryData {
  duration?: number;
  description?: string | null;
}

export const timeApi = {
  fetchTimeEntries(taskId: number) {
    return api.get<TimeEntry[]>(`/tasks/${taskId}/time`);
  },

  fetchTotalTime(taskId: number) {
    return api.get<TotalTime>(`/tasks/${taskId}/time/total`);
  },

  addManualEntry(taskId: number, data: ManualEntryData) {
    return api.post<TimeEntry>(`/tasks/${taskId}/time`, data);
  },

  updateTimeEntry(taskId: number, entryId: number, data: UpdateEntryData) {
    return api.put<TimeEntry>(`/tasks/${taskId}/time/${entryId}`, data);
  },

  deleteTimeEntry(taskId: number, entryId: number) {
    return api.delete(`/tasks/${taskId}/time/${entryId}`);
  },

  startTimer(taskId: number) {
    return api.post<TimeEntry>(`/tasks/${taskId}/time/start`);
  },

  stopTimer(taskId: number) {
    return api.post<TimeEntry>(`/tasks/${taskId}/time/stop`);
  },
};
