"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notesApi, type Note, type CreateNoteData, type UpdateNoteData } from "@/lib/api/notes";

export function useNotes(params?: { skip?: number; limit?: number }) {
  return useQuery({
    queryKey: ["notes", params],
    queryFn: () => notesApi.fetchNotes(params),
  });
}

export function useNote(id: number | null) {
  return useQuery({
    queryKey: ["note", id],
    queryFn: () => notesApi.fetchNote(id!),
    enabled: id !== null,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNoteData) => notesApi.createNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note created");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create note");
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateNoteData }) =>
      notesApi.updateNote(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["note", id] });
      const previous = queryClient.getQueryData<Note>(["note", id]);
      if (previous) {
        queryClient.setQueryData<Note>(["note", id], { ...previous, ...data });
      }
      return { previous, id };
    },
    onError: (error: Error, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["note", context.id], context.previous);
      }
      toast.error(error.message || "Failed to update note");
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["note", id] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notesApi.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete note");
    },
  });
}
