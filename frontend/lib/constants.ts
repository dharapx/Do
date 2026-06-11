export const STATUS_OPTIONS: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  done: "Done",
  wont_do: "Won't Do",
};

export const PRIORITY_OPTIONS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: "slate",
  medium: "blue",
  high: "orange",
  urgent: "red",
};

export const STATUS_COLORS: Record<string, string> = {
  not_started: "slate",
  in_progress: "blue",
  done: "green",
  wont_do: "slate",
};

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "Grid3X3" },
  { label: "Tasks", href: "/tasks", icon: "CheckSquare" },
  { label: "Notes", href: "/notes", icon: "FileText" },
] as const;
