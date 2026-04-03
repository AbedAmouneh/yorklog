// ── API Route Constants ──────────────────────────────────────────────────────
// Single source of truth for all API paths used by backend and frontend.

export const routes = {
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    me: "/auth/me",
  },

  timesheets: {
    create: "/timesheets",
    my: "/timesheets/my",
    calendar: (year: number | string, month: number | string) =>
      `/timesheets/my/calendar/${year}/${month}`,
    team: "/timesheets/team",
    byId: (id: string) => `/timesheets/${id}`,
  },

  editRequests: {
    submit: (entryId: string) => `/edit-requests/timesheets/${entryId}`,
    list: "/edit-requests",
    my: "/edit-requests/my",
    approve: (id: string) => `/edit-requests/${id}/approve`,
    reject: (id: string) => `/edit-requests/${id}/reject`,
  },

  projects: {
    list: "/projects",
    my: "/projects/my",
    create: "/projects",
    update: (id: string) => `/projects/${id}`,
    assign: (id: string) => `/projects/${id}/assign`,
    taskTypes: (projectId: string) => `/projects/${projectId}/tasks`,
    createTaskType: (projectId: string) => `/projects/${projectId}/tasks`,
    deleteTaskType: (projectId: string, taskId: string) =>
      `/projects/${projectId}/tasks/${taskId}`,
  },

  reports: {
    summary: "/reports/summary",
    byEmployee: "/reports/by-employee",
    byProject: "/reports/by-project",
    whoLoggedToday: "/reports/who-logged-today",
    export: "/reports/export",
    hoursLog: "/reports/hours-log",
  },

  notifications: {
    list: "/notifications",
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: "/notifications/read-all",
  },

  users: {
    list: "/users",
    create: "/users",
    update: (id: string) => `/users/${id}`,
    deactivate: (id: string) => `/users/${id}`,
  },

  departments: {
    list: "/departments",
    create: "/departments",
    update: (id: string) => `/departments/${id}`,
  },

  tasks: {
    my: "/tasks/my",
    list: "/tasks",
    create: "/tasks",
    update: (id: string) => `/tasks/${id}`,
    complete: (id: string) => `/tasks/${id}/complete`,
    delete: (id: string) => `/tasks/${id}`,
  },

  teams: {
    list: "/teams",
    create: "/teams",
    managers: "/teams/managers",
    setManager: (deptId: string) => `/teams/${deptId}/manager`,
    moveMember: (userId: string) => `/teams/members/${userId}`,
  },
} as const;
