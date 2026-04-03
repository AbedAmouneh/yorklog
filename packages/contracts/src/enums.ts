import { z } from "zod";

export const Role = z.enum([
  "employee",
  "dept_manager",
  "hr_finance",
  "org_admin",
  "super_admin",
]);
export type Role = z.infer<typeof Role>;

export const ProjectStatus = z.enum(["active", "archived"]);
export type ProjectStatus = z.infer<typeof ProjectStatus>;

export const EntryStatus = z.enum([
  "submitted",
  "approved",
  "pending_edit",
  "rejected",
]);
export type EntryStatus = z.infer<typeof EntryStatus>;

export const EditRequestStatus = z.enum(["pending", "approved", "rejected"]);
export type EditRequestStatus = z.infer<typeof EditRequestStatus>;

export const TaskStatus = z.enum(["todo", "in_progress", "done"]);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const NotificationType = z.enum([
  "edit_submitted",
  "edit_approved",
  "edit_rejected",
  "daily_reminder",
  "project_assigned",
  "task_assigned",
]);
export type NotificationType = z.infer<typeof NotificationType>;
