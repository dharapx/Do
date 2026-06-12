import { api } from "./client";

export interface Attachment {
  id: number;
  task_id: number;
  filename: string;
  mime_type: string;
  size: number;
  created_at: string;
}

function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:8000/api/v1`;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
}

export const attachmentsApi = {
  list(taskId: number) {
    return api.get<Attachment[]>(`/tasks/${taskId}/attachments`);
  },

  async upload(taskId: number, file: File): Promise<Attachment> {
    const BASE_URL = getBaseUrl();
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    const store = (window as any).__ZUSTAND_STORE__;
    const token = store ? store.getState().accessToken : null;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/tasks/${taskId}/attachments`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const message = errorBody?.detail || errorBody?.message || response.statusText;
      throw new Error(message);
    }

    return response.json();
  },

  async download(taskId: number, attachmentId: number): Promise<void> {
    const BASE_URL = getBaseUrl();
    const headers: Record<string, string> = {};
    const store = (window as any).__ZUSTAND_STORE__;
    const token = store ? store.getState().accessToken : null;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/tasks/${taskId}/attachments/${attachmentId}`, {
      headers,
      credentials: "include",
    });

    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const contentDisposition = response.headers.get("content-disposition");
    const filenameMatch = contentDisposition?.match(/filename="?(.+?)"?$/);
    const filename = filenameMatch?.[1] || "download";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  delete(taskId: number, attachmentId: number) {
    return api.delete<void>(`/tasks/${taskId}/attachments/${attachmentId}`);
  },
};
