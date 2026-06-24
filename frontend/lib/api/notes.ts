import { api } from "./client";

export interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteData {
  title: string;
  content?: string;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
}

export interface NoteAttachment {
  id: number;
  filename: string;
  mime_type: string;
  size: number;
  url: string;
  created_at: string;
}

export const notesApi = {
  fetchNotes(params?: { skip?: number; limit?: number }) {
    return api.get<{ items: Note[]; total: number }>("/notes", params as Record<string, string | number | undefined>);
  },

  fetchNote(id: number) {
    return api.get<Note>(`/notes/${id}`);
  },

  createNote(data: CreateNoteData) {
    return api.post<Note>("/notes", data);
  },

  updateNote(id: number, data: UpdateNoteData) {
    return api.patch<Note>(`/notes/${id}`, data);
  },

  deleteNote(id: number) {
    return api.delete<void>(`/notes/${id}`);
  },

  uploadAttachment(noteId: number, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<NoteAttachment>(`/notes/${noteId}/attachments`, formData);
  },
};
