import { api } from "./client";

export interface Comment {
  id: number;
  task_id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCommentData {
  content: string;
}

export interface UpdateCommentData {
  content: string;
}

export const commentsApi = {
  fetchComments(taskId: number) {
    return api.get<Comment[]>(`/tasks/${taskId}/comments`);
  },

  createComment(taskId: number, data: CreateCommentData) {
    return api.post<Comment>(`/tasks/${taskId}/comments`, data);
  },

  updateComment(taskId: number, commentId: number, data: UpdateCommentData) {
    return api.patch<Comment>(`/tasks/${taskId}/comments/${commentId}`, data);
  },

  deleteComment(taskId: number, commentId: number) {
    return api.delete<void>(`/tasks/${taskId}/comments/${commentId}`);
  },
};
