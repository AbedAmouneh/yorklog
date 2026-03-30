import { useState } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import UsersPanel from './UsersPanel.jsx';
import ProjectsPanel from './ProjectsPanel.jsx';
import DepartmentsPanel from './DepartmentsPanel.jsx';
import { Users, FolderKanban, Building2 } from 'lucide-react';

const TABS = [
  { to: 'users', label: 'Users', icon: Users },
  { to: 'projects', label: 'Projects', icon: FolderKanban },
  { to: 'departments', label: 'Departments', icon: Building2 },
];

export default function Admin() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-navy-900">Admin</h1>
        <p className="text-sm text-slate-400 mt-0.5">Manage users, projects, and departments</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                isActive
                  ? 'border-brand-700 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`
            }
          >
            <tab.icon size={15} />
            {tab.label}
          </NavLink>
        ))}
      </div>

      {/* Sub-routes */}
      <Routes>
        <Route index element={<Navigate to="users" replace />} />
        <Route path="users" element={<UsersPanel />} />
        <Route path="projects" element={<ProjectsPanel />} />
        <Route path="departments" element={<DepartmentsPanel />} />
      </Routes>
    </div>
  );
}
