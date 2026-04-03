import axios from 'axios';
import { routes } from '@yorklog/contracts';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // send httpOnly cookies
  headers: { 'Content-Type': 'application/json' },
});

// Global response interceptor — handle 401 (session expired)
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Clear any local auth state and redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data) => api.post(routes.auth.login, data),
  logout: () => api.post(routes.auth.logout),
  me: () => api.get(routes.auth.me),
  updateMe: (data) => api.patch(routes.auth.me, data),
};

// ── Timesheets ────────────────────────────────────────────────────────────────
export const timesheetsApi = {
  create: (data) => api.post(routes.timesheets.create, data),
  getMyEntries: (params) => api.get(routes.timesheets.my, { params }),
  getCalendar: (year, month) => api.get(routes.timesheets.calendar(year, month)),
  getTeamEntries: (params) => api.get(routes.timesheets.team, { params }),
  getEntry: (id) => api.get(routes.timesheets.byId(id)),
  delete: (id) => api.delete(routes.timesheets.byId(id)),
};

// ── Edit Requests ─────────────────────────────────────────────────────────────
export const editRequestsApi = {
  submit: (entryId, data) => api.post(routes.editRequests.submit(entryId), data),
  getTeamRequests: (params) => api.get(routes.editRequests.list, { params }),
  getMyRequests: () => api.get(routes.editRequests.my),
  approve: (id) => api.patch(routes.editRequests.approve(id)),
  reject: (id, reason) => api.patch(routes.editRequests.reject(id), { reason }),
};

// ── Projects ──────────────────────────────────────────────────────────────────
export const projectsApi = {
  getMyProjects: () => api.get(routes.projects.my),
  getAll: (params) => api.get(routes.projects.list, { params }),
  create: (data) => api.post(routes.projects.create, data),
  update: (id, data) => api.patch(routes.projects.update(id), data),
  assign: (id, userIds) => api.post(routes.projects.assign(id), { userIds }),
  getTasks: (projectId) => api.get(routes.projects.taskTypes(projectId)),
  createTask: (projectId, data) => api.post(routes.projects.createTaskType(projectId), data),
  deleteTask: (projectId, taskId) => api.delete(routes.projects.deleteTaskType(projectId, taskId)),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  summary: (params) => api.get(routes.reports.summary, { params }),
  byEmployee: (params) => api.get(routes.reports.byEmployee, { params }),
  byProject: (params) => api.get(routes.reports.byProject, { params }),
  whoLoggedToday: () => api.get(routes.reports.whoLoggedToday),
  export: (params) => api.get(routes.reports.export, { params, responseType: 'blob' }),
  hoursLog: (params) => api.get(routes.reports.hoursLog, { params }),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: () => api.get(routes.notifications.list),
  markRead: (id) => api.patch(routes.notifications.markRead(id)),
  markAllRead: () => api.patch(routes.notifications.markAllRead),
};

// ── Users (admin) ─────────────────────────────────────────────────────────────
export const usersApi = {
  getAll: (params) => api.get(routes.users.list, { params }),
  create: (data) => api.post(routes.users.create, data),
  update: (id, data) => api.patch(routes.users.update(id), data),
  deactivate: (id) => api.delete(routes.users.deactivate(id)),
};

// ── Departments (admin) ───────────────────────────────────────────────────────
export const departmentsApi = {
  getAll: () => api.get(routes.departments.list),
  create: (data) => api.post(routes.departments.create, data),
  update: (id, data) => api.patch(routes.departments.update(id), data),
};

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const tasksApi = {
  getMyTasks: (params) => api.get(routes.tasks.my, { params }),
  getAll: (params) => api.get(routes.tasks.list, { params }),
  create: (data) => api.post(routes.tasks.create, data),
  update: (id, data) => api.patch(routes.tasks.update(id), data),
  complete: (id, data) => api.post(routes.tasks.complete(id), data),
  delete: (id) => api.delete(routes.tasks.delete(id)),
};

// ── Teams (org_admin / hr_finance) ────────────────────────────────────────────
export const teamsApi = {
  create: (data) => api.post(routes.teams.create, data),
  getAll: () => api.get(routes.teams.list),
  getManagers: () => api.get(routes.teams.managers),
  setManager: (deptId, managerId) => api.patch(routes.teams.setManager(deptId), { managerId }),
  moveMember: (userId, departmentId) => api.patch(routes.teams.moveMember(userId), { departmentId }),
};
