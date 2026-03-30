# YorkLog — York Press Time Tracking

Internal work-hour tracking system for York Press remote teams.

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+

---

### 1. Backend setup

```bash
cd backend

# Install dependencies
npm install

# Copy and fill in env variables
cp .env.example .env
# Edit .env with your database URL, JWT secret, and SMTP settings

# Generate Prisma client
npm run db:generate

# Run migrations (creates tables)
npm run db:migrate

# Seed demo data (4 users, 4 projects, task types)
npm run db:seed

# Start dev server (port 4000)
npm run dev
```

**Demo accounts created by seed:**

| Role        | Email                       | Password          |
|-------------|-----------------------------|-------------------|
| Super Admin | admin@yorkpress.co.uk       | Admin@YorkLog2024 |
| Manager     | manager@yorkpress.co.uk     | Manager@123       |
| Employee    | employee@yorkpress.co.uk    | Employee@123      |
| HR/Finance  | hr@yorkpress.co.uk          | HR@Finance123     |

---

### 2. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (port 5173, proxies /api to localhost:4000)
npm run dev
```

Open **http://localhost:5173**

---

## Project Structure

```
yorklog/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.js           # Demo data seeder
│   └── src/
│       ├── app.js            # Express entry point
│       ├── controllers/      # Request handlers
│       ├── middleware/        # Auth & role middleware
│       ├── routes/           # API route definitions
│       └── services/         # Email, cron, export
└── frontend/
    └── src/
        ├── lib/              # API client & auth context
        ├── components/       # Shared components (Layout)
        └── pages/            # Route-level pages
```

---

## API Endpoints

| Method | Path                            | Role            | Description               |
|--------|---------------------------------|-----------------|---------------------------|
| POST   | /api/auth/login                 | Public          | Log in                    |
| POST   | /api/auth/logout                | Any             | Log out                   |
| GET    | /api/auth/me                    | Any             | Current user              |
| POST   | /api/timesheets                 | Any             | Log hours                 |
| GET    | /api/timesheets/my              | Any             | My entries                |
| GET    | /api/timesheets/my/calendar/:y/:m | Any           | Monthly calendar          |
| GET    | /api/timesheets/team            | Manager+        | Team entries              |
| DELETE | /api/timesheets/:id             | Owner           | Delete entry              |
| POST   | /api/edit-requests/timesheets/:id | Any           | Request edit              |
| GET    | /api/edit-requests              | Manager+        | Team edit requests        |
| PATCH  | /api/edit-requests/:id/approve  | Manager+        | Approve edit              |
| PATCH  | /api/edit-requests/:id/reject   | Manager+        | Reject edit               |
| GET    | /api/projects/my                | Any             | My assigned projects      |
| GET    | /api/projects                   | Manager+        | All projects              |
| POST   | /api/projects                   | Admin           | Create project            |
| POST   | /api/projects/:id/assign        | Admin           | Assign users              |
| GET    | /api/projects/:id/tasks         | Any             | Project task types        |
| GET    | /api/reports/summary            | Manager+, HR    | Summary stats             |
| GET    | /api/reports/by-employee        | Manager+, HR    | Hours by employee         |
| GET    | /api/reports/by-project         | Manager+, HR    | Hours by project          |
| GET    | /api/reports/who-logged-today   | Manager+        | Daily logging status      |
| GET    | /api/reports/export             | Manager+, HR    | Excel export              |
| GET    | /api/users                      | Admin           | All users                 |
| POST   | /api/users                      | Admin           | Create user               |
| PATCH  | /api/users/:id                  | Admin           | Update user               |
| DELETE | /api/users/:id                  | Admin           | Deactivate user           |
| GET    | /api/departments                | Any             | All departments           |
| POST   | /api/departments                | Admin           | Create department         |
| PATCH  | /api/departments/:id            | Admin           | Update department         |
| GET    | /api/notifications              | Any             | My notifications          |
| PATCH  | /api/notifications/:id/read     | Any             | Mark as read              |
| PATCH  | /api/notifications/read-all     | Any             | Mark all as read          |

---

## Features

- **Daily hour logging** with project + task type assignment
- **Quick-access task buttons** for frequent task types
- **Monthly calendar heatmap** showing logged hours per day
- **Edit request workflow** — employees request edits, managers approve/reject with diff view
- **Manager dashboard** — team overview, bar charts, who hasn't logged today
- **Reports** — date-range filtering, by-employee, by-project charts, Excel export
- **Admin panel** — manage users, projects, task types, departments
- **In-app notifications** + optional email notifications
- **Daily reminder cron** at 17:00 Beirut time (14:00 UTC), Mon–Fri
- **Role-based access** — employee, dept_manager, hr_finance, super_admin
