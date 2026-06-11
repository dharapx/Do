"use client";

import { Info } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">About</h1>
        <p className="text-sm text-muted-foreground">About this application and its developer.</p>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Info className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">do.</h2>
            <p className="text-sm text-muted-foreground">Task & Notes Manager</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium text-foreground">Developer: </span>
            <span className="text-muted-foreground">Pulakesh Dhara</span>
          </div>
          <div>
            <span className="font-medium text-foreground">Version: </span>
            <span className="text-muted-foreground">1.0.0</span>
          </div>
          <div>
            <span className="font-medium text-foreground">Stack: </span>
            <span className="text-muted-foreground">Next.js, FastAPI, PostgreSQL, Docker</span>
          </div>
          <div>
            <span className="font-medium text-foreground">Description: </span>
            <span className="text-muted-foreground">
              A full-featured productivity application for managing tasks, tracking time, and taking rich notes. Built with modern web technologies and deployed via Docker Compose.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
