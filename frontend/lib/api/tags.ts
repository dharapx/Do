import { api } from "./client";

export interface TagSuggestionsResponse {
  tags: string[];
}

export const tagsApi = {
  getSuggestions: async (q: string): Promise<TagSuggestionsResponse> => {
    return api.get("/tags/suggestions", { q });
  },
};
