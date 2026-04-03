import { z } from "zod";
import {
  Role,
  ProjectStatus,
  EntryStatus,
  EditRequestStatus,
  TaskStatus,
  NotificationType,
} from "./enums.js";

// ── Department ───────────────────────────────────────────────────────────────

export const Department = z.object({
  id: z.string().uuid(),
  name: z.string(),
  maxDailyHours: z.number().int(),
  headUserId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Department = z.infer<typeof Department>;

// ── User ─────────────────────────────────────────────────────────────────────

export const User = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: Role,
  notifyEmail: z.boolean(),
  isActive: z.boolean(),
  departmentId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type User = z.infer<typeof User>;

// ── Project ──────────────────────────────────────────────────────────────────

export const Project = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  status: ProjectStatus,
  maxDailyHours: z.number().int().nullable(),
  createdById: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Project = z.infer<typeof Project>;

// ── TaskType ─────────────────────────────────────────────────────────────────

export const TaskType = z.object({
  id: z.string().uuid(),
  name: z.string(),
  isQuickAccess: z.boolean(),
  projectId: z.string().uuid(),
  createdAt: z.string().datetime(),
});
export type TaskType = z.infer<typeof TaskType>;

// ── ProjectAssignment ────────────────────────────────────────────────────────

export const ProjectAssignment = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
  assignedAt: z.string().datetime(),
});
export type ProjectAssignment = z.infer<typeof ProjectAssignment>;

// ── TimesheetEntry ───────────────────────────────────────────────────────────

export const TimesheetEntry = z.object({
  id: z.string().uuid(),
  date: z.string(),
  totalMinutes: z.number().int(),
  taskSummary: z.string().max(255),
  description: z.string().max(1000).nullable(),
  status: EntryStatus,
  userId: z.string().uuid(),
  projectId: z.string().uuid(),
  taskTypeId: z.string().uuid().nullable(),
  taskId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type TimesheetEntry = z.infer<typeof TimesheetEntry>;

// ── Task ─────────────────────────────────────────────────────────────────────

export const Task = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().max(500).nullable(),
  status: TaskStatus,
  dueDate: z.string().nullable(),
  estimatedHours: z.number().nullable(),
  completedAt: z.string().datetime().nullable(),
  projectId: z.string().uuid(),
  taskTypeId: z.string().uuid().nullable(),
  assignedToId: z.string().uuid(),
  createdById: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Task = z.infer<typeof Task>;

// ── EditRequest ──────────────────────────────────────────────────────────────

export const EditRequest = z.object({
  id: z.string().uuid(),
  originalData: z.record(z.unknown()),
  newData: z.record(z.unknown()),
  reason: z.string().nullable(),
  status: EditRequestStatus,
  rejectionReason: z.string().nullable(),
  entryId: z.string().uuid(),
  requestedById: z.string().uuid(),
  reviewedById: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  reviewedAt: z.string().datetime().nullable(),
});
export type EditRequest = z.infer<typeof EditRequest>;

// ── Notification ─────────────────────────────────────────────────────────────

export const Notification = z.object({
  id: z.string().uuid(),
  type: NotificationType,
  message: z.string(),
  isRead: z.boolean(),
  relatedId: z.string().nullable(),
  userId: z.string().uuid(),
  createdAt: z.string().datetime(),
});
export type Notification = z.infer<typeof Notification>;
