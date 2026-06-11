import { create } from "zustand";

interface SearchStore {
  triggerSearch: number;
  requestSearch: () => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  triggerSearch: 0,
  requestSearch: () => set((s) => ({ triggerSearch: s.triggerSearch + 1 })),
}));
