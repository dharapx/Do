"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  commentsApi,
  type CreateCommentData,
  type UpdateCommentData,
} from "@/lib/api/comments";

export function useComments(taskId: number | null) {
  return useQuery({
    queryKey: ["comments", taskId],
    queryFn: () => commentsApi.fetchComments(taskId!),
    enabled: taskId !== null,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: number; data: CreateCommentData }) =>
      commentsApi.createComment(taskId, data),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      toast.success("Comment added");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add comment");
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      commentId,
      data,
    }: {
      taskId: number;
      commentId: number;
      data: UpdateCommentData;
    }) => commentsApi.updateComment(taskId, commentId, data),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      toast.success("Comment updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update comment");
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, commentId }: { taskId: number; commentId: number }) =>
      commentsApi.deleteComment(taskId, commentId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      toast.success("Comment deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete comment");
    },
  });
}
