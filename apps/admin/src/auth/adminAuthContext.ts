import { createContext } from 'react';

import type { AdminAccountRole } from '@admin/features/admin-account/adminAccountTypes';

export interface AdminLoginValues {
  loginId: string;
  password: string;
}

export interface AdminAuth {
  admin: AdminInfo | null;
  role: AdminAccountRole | null;
  isAuthenticated: boolean;
  login: (values: AdminLoginValues) => Promise<void>;
  logout: () => void;
}

export interface AdminInfo {
  adminId: number;
  name: string;
  role: AdminAccountRole;
}

export const AdminAuthContext = createContext<AdminAuth | null>(null);
