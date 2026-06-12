"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { attachmentsApi } from "@/lib/api/attachments";

export function useAttachments(taskId: number) {
  return useQuery({
    queryKey: ["attachments", taskId],
    queryFn: () => attachmentsApi.list(taskId),
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, file }: { taskId: number; file: File }) =>
      attachmentsApi.upload(taskId, file),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["attachments", taskId] });
      toast.success("File uploaded");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload file");
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, attachmentId }: { taskId: number; attachmentId: number }) =>
      attachmentsApi.delete(taskId, attachmentId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["attachments", taskId] });
      toast.success("Attachment deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete attachment");
    },
  });
}
