import { create } from "zustand";

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface FilterStore {
  statusFilter: string | null;
  priorityFilter: string | null;
  tagFilter: string | null;
  searchQuery: string;
  dateRange: DateRange;
  setStatusFilter: (status: string | null) => void;
  setPriorityFilter: (priority: string | null) => void;
  setTagFilter: (tag: string | null) => void;
  setSearchQuery: (query: string) => void;
  setDateRange: (range: DateRange) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  statusFilter: null,
  priorityFilter: null,
  tagFilter: null,
  searchQuery: "",
  dateRange: { from: null, to: null },
  setStatusFilter: (status) => set({ statusFilter: status }),
  setPriorityFilter: (priority) => set({ priorityFilter: priority }),
  setTagFilter: (tag) => set({ tagFilter: tag }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setDateRange: (range) => set({ dateRange: range }),
  resetFilters: () =>
    set({
      statusFilter: null,
      priorityFilter: null,
      tagFilter: null,
      searchQuery: "",
      dateRange: { from: null, to: null },
    }),
}));
