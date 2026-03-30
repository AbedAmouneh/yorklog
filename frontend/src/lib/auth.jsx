import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from './api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to restore session on mount
    authApi.me()
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const updateUser = (data) => setUser(prev => ({ ...prev, ...data }));

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// Role helpers
export const isAdmin = (user) => user?.role === 'super_admin';
export const isOrgAdmin = (user) => ['org_admin', 'super_admin'].includes(user?.role);
// isManager: anyone who can approve timesheets, manage projects, and view reports
export const isManager = (user) => ['dept_manager', 'org_admin', 'super_admin'].includes(user?.role);
export const isHR = (user) => ['hr_finance', 'super_admin'].includes(user?.role);
// canManageTeams: org_admin + hr_finance (and super_admin)
export const canManageTeams = (user) => ['hr_finance', 'org_admin', 'super_admin'].includes(user?.role);
