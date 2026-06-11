import { create } from "zustand";

interface TaskFilters {
  status: string | null;
  priority: string | null;
  tags: string | null;
  search: string;
  dateFrom: string | null;
  dateTo: string | null;
}

interface TaskStore {
  selectedTaskId: number | null;
  isCreateDialogOpen: boolean;
  filters: TaskFilters;
  sortBy: string;
  sortOrder: "asc" | "desc";
  setSelectedTask: (id: number | null) => void;
  toggleCreateDialog: (open?: boolean) => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (order: "asc" | "desc") => void;
  resetFilters: () => void;
}

const defaultFilters: TaskFilters = {
  status: null,
  priority: null,
  tags: null,
  search: "",
  dateFrom: null,
  dateTo: null,
};

export const useTaskStore = create<TaskStore>((set) => ({
  selectedTaskId: null,
  isCreateDialogOpen: false,
  filters: { ...defaultFilters },
  sortBy: "created_at",
  sortOrder: "desc",
  setSelectedTask: (id) => set({ selectedTaskId: id }),
  toggleCreateDialog: (open) =>
    set((state) => ({
      isCreateDialogOpen: open !== undefined ? open : !state.isCreateDialogOpen,
    })),
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (order) => set({ sortOrder: order }),
  resetFilters: () => set({ filters: { ...defaultFilters } }),
}));
