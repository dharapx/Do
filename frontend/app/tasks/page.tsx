"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Filter, ArrowUpDown, X, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { TaskList } from "@/components/tasks/task-list";
import { TaskForm } from "@/components/tasks/task-form";
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from "@/lib/constants";

function TasksContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const filters = {
    search: search || undefined,
    status: statusFilter.length > 0 ? statusFilter.join(",") : undefined,
    priority: priorityFilter.length > 0 ? priorityFilter.join(",") : undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
  };

  const hasActiveFilters = statusFilter.length > 0 || priorityFilter.length > 0 || sortBy !== "created_at" || sortOrder !== "desc";

  const filterContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Status</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-md border border-input bg-background text-muted-foreground hover:text-foreground">
              {statusFilter.length > 0
                ? `${statusFilter.length} selected`
                : "All Statuses"}
              <Filter className="h-3 w-3 ml-2" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {Object.entries(STATUS_OPTIONS).map(([value, label]) => (
              <DropdownMenuCheckboxItem
                key={value}
                checked={statusFilter.includes(value)}
                onCheckedChange={() =>
                  setStatusFilter((prev) =>
                    prev.includes(value)
                      ? prev.filter((s) => s !== value)
                      : [...prev, value]
                  )
                }
              >
                {label}
              </DropdownMenuCheckboxItem>
            ))}
            {statusFilter.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  onCheckedChange={() => setStatusFilter([])}
                >
                  Clear
                </DropdownMenuCheckboxItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Priority</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-md border border-input bg-background text-muted-foreground hover:text-foreground">
              {priorityFilter.length > 0
                ? `${priorityFilter.length} selected`
                : "All Priorities"}
              <Filter className="h-3 w-3 ml-2" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {Object.entries(PRIORITY_OPTIONS).map(([value, label]) => (
              <DropdownMenuCheckboxItem
                key={value}
                checked={priorityFilter.includes(value)}
                onCheckedChange={() =>
                  setPriorityFilter((prev) =>
                    prev.includes(value)
                      ? prev.filter((p) => p !== value)
                      : [...prev, value]
                  )
                }
              >
                {label}
              </DropdownMenuCheckboxItem>
            ))}
            {priorityFilter.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  onCheckedChange={() => setPriorityFilter([])}
                >
                  Clear
                </DropdownMenuCheckboxItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Sort By</label>
        <Select value={`${sortBy}-${sortOrder}`} onValueChange={(v) => {
          const [by, order] = v.split("-");
          setSortBy(by);
          setSortOrder(order as "asc" | "desc");
        }}>
          <SelectTrigger>
            <ArrowUpDown className="h-3 w-3 mr-2" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at-desc">Newest First</SelectItem>
            <SelectItem value="created_at-asc">Oldest First</SelectItem>
            <SelectItem value="updated_at-desc">Recently Updated</SelectItem>
            <SelectItem value="priority-desc">Highest Priority</SelectItem>
            <SelectItem value="priority-asc">Lowest Priority</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in pb-16 md:pb-0">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 h-9 text-sm"
          />
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 h-9 text-sm font-medium rounded-md border border-input bg-background text-muted-foreground hover:text-foreground whitespace-nowrap">
                <Filter className="h-3.5 w-3.5" />
                {statusFilter.length > 0
                  ? `${statusFilter.length} selected`
                  : "Status"}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              {Object.entries(STATUS_OPTIONS).map(([value, label]) => (
                <DropdownMenuCheckboxItem
                  key={value}
                  checked={statusFilter.includes(value)}
                  onCheckedChange={() =>
                    setStatusFilter((prev) =>
                      prev.includes(value)
                        ? prev.filter((s) => s !== value)
                        : [...prev, value]
                    )
                  }
                >
                  {label}
                </DropdownMenuCheckboxItem>
              ))}
              {statusFilter.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    onCheckedChange={() => setStatusFilter([])}
                  >
                    Clear
                  </DropdownMenuCheckboxItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 h-9 text-sm font-medium rounded-md border border-input bg-background text-muted-foreground hover:text-foreground whitespace-nowrap">
                <Filter className="h-3.5 w-3.5" />
                {priorityFilter.length > 0
                  ? `${priorityFilter.length} selected`
                  : "Priority"}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              {Object.entries(PRIORITY_OPTIONS).map(([value, label]) => (
                <DropdownMenuCheckboxItem
                  key={value}
                  checked={priorityFilter.includes(value)}
                  onCheckedChange={() =>
                    setPriorityFilter((prev) =>
                      prev.includes(value)
                        ? prev.filter((p) => p !== value)
                        : [...prev, value]
                    )
                  }
                >
                  {label}
                </DropdownMenuCheckboxItem>
              ))}
              {priorityFilter.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    onCheckedChange={() => setPriorityFilter([])}
                  >
                    Clear
                  </DropdownMenuCheckboxItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Select value={`${sortBy}-${sortOrder}`} onValueChange={(v) => {
            const [by, order] = v.split("-");
            setSortBy(by);
            setSortOrder(order as "asc" | "desc");
          }}>
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="h-3 w-3 mr-2" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at-desc">Newest First</SelectItem>
              <SelectItem value="created_at-asc">Oldest First</SelectItem>
              <SelectItem value="updated_at-desc">Recently Updated</SelectItem>
              <SelectItem value="priority-desc">Highest Priority</SelectItem>
              <SelectItem value="priority-asc">Lowest Priority</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Filter className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Filters</DialogTitle>
              </DialogHeader>
              {filterContent}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <TaskList filters={filters} />

      <TaskForm open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      <button
        onClick={() => setIsCreateOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 md:hidden"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="space-y-4 animate-fade-in"><p className="text-muted-foreground">Loading...</p></div>}>
      <TasksContent />
    </Suspense>
  );
}
