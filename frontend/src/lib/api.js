import axios from 'axios';

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
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateMe: (data) => api.patch('/auth/me', data),
};

// ── Timesheets ────────────────────────────────────────────────────────────────
export const timesheetsApi = {
  create: (data) => api.post('/timesheets', data),
  getMyEntries: (params) => api.get('/timesheets/my', { params }),
  getCalendar: (year, month) => api.get(`/timesheets/my/calendar/${year}/${month}`),
  getTeamEntries: (params) => api.get('/timesheets/team', { params }),
  getEntry: (id) => api.get(`/timesheets/${id}`),
  delete: (id) => api.delete(`/timesheets/${id}`),
};

// ── Edit Requests ─────────────────────────────────────────────────────────────
export const editRequestsApi = {
  submit: (entryId, data) => api.post(`/edit-requests/timesheets/${entryId}`, data),
  getTeamRequests: (params) => api.get('/edit-requests', { params }),
  getMyRequests: () => api.get('/edit-requests/my'),
  approve: (id) => api.patch(`/edit-requests/${id}/approve`),
  reject: (id, reason) => api.patch(`/edit-requests/${id}/reject`, { reason }),
};

// ── Projects ──────────────────────────────────────────────────────────────────
export const projectsApi = {
  getMyProjects: () => api.get('/projects/my'),
  getAll: (params) => api.get('/projects', { params }),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  assign: (id, userIds) => api.post(`/projects/${id}/assign`, { userIds }),
  getTasks: (projectId) => api.get(`/projects/${projectId}/tasks`),
  createTask: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  deleteTask: (projectId, taskId) => api.delete(`/projects/${projectId}/tasks/${taskId}`),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  summary: (params) => api.get('/reports/summary', { params }),
  byEmployee: (params) => api.get('/reports/by-employee', { params }),
  byProject: (params) => api.get('/reports/by-project', { params }),
  whoLoggedToday: () => api.get('/reports/who-logged-today'),
  export: (params) => api.get('/reports/export', { params, responseType: 'blob' }),
  hoursLog: (params) => api.get('/reports/hours-log', { params }),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// ── Users (admin) ─────────────────────────────────────────────────────────────
export const usersApi = {
  getAll: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  deactivate: (id) => api.delete(`/users/${id}`),
};

// ── Departments (admin) ───────────────────────────────────────────────────────
export const departmentsApi = {
  getAll: () => api.get('/departments'),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.patch(`/departments/${id}`, data),
};

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const tasksApi = {
  getMyTasks: (params) => api.get('/tasks/my', { params }),
  getAll: (params) => api.get('/tasks', { params }),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  complete: (id, data) => api.post(`/tasks/${id}/complete`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

// ── Teams (org_admin / hr_finance) ────────────────────────────────────────────
export const teamsApi = {
  create: (data) => api.post('/teams', data),
  getAll: () => api.get('/teams'),
  getManagers: () => api.get('/teams/managers'),
  setManager: (deptId, managerId) => api.patch(`/teams/${deptId}/manager`, { managerId }),
  moveMember: (userId, departmentId) => api.patch(`/teams/members/${userId}`, { departmentId }),
};
