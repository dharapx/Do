import { api } from "./client";

export interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  type: string;
  tags: string[];
  total_time_spent: number;
  progress: number;
  parent_id: number | null;
  children: Task[];
  reference_id: number | null;
  reference_title: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: string;
  type?: string;
  tags?: string[];
  parent_id?: number | null;
  reference_id?: number | null;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  type?: string;
  tags?: string[];
  progress?: number;
  parent_id?: number | null;
  reference_id?: number | null;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  type?: string;
  tags?: string;
  parent_id?: number;
  search?: string;
  keyword?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: string;
  limit?: number;
  offset?: number;
}

export interface TimeTimelinePoint {
  date: string;
  task_id: number;
  task_title: string;
  total_seconds: number;
}

export interface DashboardStats {
  total: number;
  not_started: number;
  in_progress: number;
  done: number;
  wont_do: number;
  high_priority: number;
  urgent: number;
  urgent_all: number;
  high_priority_all: number;
  avg_progress: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export const tasksApi = {
  fetchTasks(params?: TaskFilters) {
    return api.get<PaginatedResponse<Task>>("/tasks", params as Record<string, string | number | undefined>);
  },

  fetchTask(id: number) {
    return api.get<Task>(`/tasks/${id}`);
  },

  createTask(data: CreateTaskData) {
    return api.post<Task>("/tasks", data);
  },

  updateTask(id: number, data: UpdateTaskData) {
    return api.patch<Task>(`/tasks/${id}`, data);
  },

  deleteTask(id: number) {
    return api.delete<void>(`/tasks/${id}`);
  },

  fetchDashboardStats(params?: { date_from?: string; date_to?: string }) {
    return api.get<DashboardStats>("/tasks/dashboard/stats", params as Record<string, string | undefined>);
  },

  fetchTimeTimeline(params?: { date_from?: string; date_to?: string }) {
    return api.get<TimeTimelinePoint[]>("/tasks/dashboard/time-timeline", params as Record<string, string | undefined>);
  },

  updateTaskChildren(goalId: number, childIds: number[]) {
    return api.post<Task>(`/tasks/${goalId}/children`, { child_ids: childIds });
  },

  setTaskParent(taskId: number, parentId: number | null) {
    return api.put<Task>(`/tasks/${taskId}/parent`, { parent_id: parentId });
  },

  searchTasks(query: string) {
    return api.get<PaginatedResponse<Task>>("/search", { q: query });
  },
};
