import { z } from "zod";
import { Role, ProjectStatus, TaskStatus } from "./enums.js";

// ── Auth ─────────────────────────────────────────────────────────────────────

export const LoginRequest = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginRequest = z.infer<typeof LoginRequest>;

export const UpdateProfileRequest = z.object({
  name: z.string().min(2).optional(),
  notifyEmail: z.boolean().optional(),
  password: z.string().min(8).optional(),
});
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequest>;

// ── Users ────────────────────────────────────────────────────────────────────

export const CreateUserRequest = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: Role.default("employee"),
  departmentId: z.string().uuid().optional(),
});
export type CreateUserRequest = z.infer<typeof CreateUserRequest>;

export const UpdateUserRequest = z.object({
  name: z.string().min(2).optional(),
  role: Role.optional(),
  departmentId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
  notifyEmail: z.boolean().optional(),
});
export type UpdateUserRequest = z.infer<typeof UpdateUserRequest>;

// ── Departments ──────────────────────────────────────────────────────────────

export const CreateDepartmentRequest = z.object({
  name: z.string().min(2).max(100),
  maxDailyHours: z.coerce.number().min(1).max(24).default(8),
  headUserId: z.string().uuid().optional(),
});
export type CreateDepartmentRequest = z.infer<typeof CreateDepartmentRequest>;

export const UpdateDepartmentRequest = z.object({
  name: z.string().min(2).max(100).optional(),
  maxDailyHours: z.coerce.number().min(1).max(24).optional(),
  headUserId: z.string().uuid().nullable().optional(),
});
export type UpdateDepartmentRequest = z.infer<typeof UpdateDepartmentRequest>;

// ── Projects ─────────────────────────────────────────────────────────────────

export const CreateProjectRequest = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});
export type CreateProjectRequest = z.infer<typeof CreateProjectRequest>;

export const UpdateProjectRequest = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  status: ProjectStatus.optional(),
});
export type UpdateProjectRequest = z.infer<typeof UpdateProjectRequest>;

// ── Task Types ───────────────────────────────────────────────────────────────

export const CreateTaskTypeRequest = z.object({
  name: z.string().min(1).max(100),
  isQuickAccess: z.boolean().optional(),
});
export type CreateTaskTypeRequest = z.infer<typeof CreateTaskTypeRequest>;

// ── Tasks ────────────────────────────────────────────────────────────────────

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

export const CreateTaskRequest = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  projectId: z.string().uuid(),
  taskTypeId: z.string().uuid().nullable().optional(),
  assignedToId: z.string().uuid().optional(),
  dueDate: z
    .string()
    .datetime({ offset: true })
    .or(dateString)
    .nullable()
    .optional(),
  estimatedHours: z.coerce.number().min(0).max(999).nullable().optional(),
});
export type CreateTaskRequest = z.infer<typeof CreateTaskRequest>;

export const UpdateTaskRequest = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).nullable().optional(),
  taskTypeId: z.string().uuid().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  estimatedHours: z.coerce.number().min(0).max(999).nullable().optional(),
  status: TaskStatus.optional(),
});
export type UpdateTaskRequest = z.infer<typeof UpdateTaskRequest>;

export const CompleteTaskRequest = z.object({
  hours: z.coerce.number().min(0.25).max(24),
  description: z.string().max(500).optional(),
  date: dateString.optional(),
});
export type CompleteTaskRequest = z.infer<typeof CompleteTaskRequest>;

// ── Timesheet Entries ────────────────────────────────────────────────────────

export const CreateTimesheetEntryRequest = z.object({
  date: dateString,
  totalMinutes: z.coerce.number().int().min(1).max(1440),
  projectId: z.string().uuid(),
  taskTypeId: z.string().uuid(),
  taskSummary: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
});
export type CreateTimesheetEntryRequest = z.infer<
  typeof CreateTimesheetEntryRequest
>;

// ── Edit Requests ────────────────────────────────────────────────────────────

export const CreateEditRequest = z.object({
  hours: z.number().int().min(0).max(23).optional(),
  minutes: z.number().int().min(0).max(59).optional(),
  taskDescription: z.string().max(255).optional(),
  description: z.string().max(300).optional(),
  projectId: z.string().uuid().optional(),
  taskTypeId: z.string().uuid().optional(),
});
export type CreateEditRequest = z.infer<typeof CreateEditRequest>;

// ── Teams ────────────────────────────────────────────────────────────────────

export const CreateTeamRequest = z.object({
  name: z.string().min(2).max(100),
  maxDailyHours: z.coerce.number().min(1).max(24).optional(),
  headUserId: z.string().uuid().nullable().optional(),
  memberIds: z.array(z.string().uuid()).optional(),
});
export type CreateTeamRequest = z.infer<typeof CreateTeamRequest>;
