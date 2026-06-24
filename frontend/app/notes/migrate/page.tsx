"use client";

import dynamic from "next/dynamic";

const NotesMigration = dynamic(() => import("@/components/notes/notes-migration"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  ),
});

export default function MigratePage() {
  return (
    <main className="max-w-2xl mx-auto py-8 px-4">
      <NotesMigration />
    </main>
  );
}
