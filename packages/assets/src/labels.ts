import type { Role, TaskStatus, EntryStatus, EditRequestStatus } from "@yorklog/contracts";

// ── Role labels ──────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<Role, string> = {
  employee: "Employee",
  dept_manager: "Team Leader",
  hr_finance: "HR / Finance",
  org_admin: "Manager",
  super_admin: "Super Admin",
};

export const ROLE_BADGE_COLORS: Record<Role, string> = {
  employee: "bg-slate-100 text-slate-600",
  dept_manager: "bg-brand-50 text-brand-700",
  hr_finance: "bg-purple-50 text-purple-700",
  org_admin: "bg-amber-50 text-amber-700",
  super_admin: "bg-red-50 text-red-700",
};

// ── Task status ──────────────────────────────────────────────────────────────

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

export const TASK_STATUS_COLORS: Record<
  TaskStatus,
  { color: string; bg: string; border: string }
> = {
  todo: {
    color: "text-slate-400",
    bg: "bg-slate-100 text-slate-600",
    border: "border-slate-200",
  },
  in_progress: {
    color: "text-blue-500",
    bg: "bg-blue-100 text-blue-700",
    border: "border-blue-200",
  },
  done: {
    color: "text-green-500",
    bg: "bg-green-100 text-green-700",
    border: "border-green-100",
  },
};

// ── Entry status ─────────────────────────────────────────────────────────────

export const ENTRY_STATUS_BADGE: Record<EntryStatus, string> = {
  submitted: "badge-slate",
  approved: "badge-green",
  pending_edit: "badge-amber",
  rejected: "badge-red",
};

// ── Edit request status ──────────────────────────────────────────────────────

export const EDIT_REQUEST_STATUS_BADGE: Record<EditRequestStatus, string> = {
  pending: "badge-amber",
  approved: "badge-green",
  rejected: "badge-red",
};
