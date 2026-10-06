import { createContext } from 'react';

import type { AdminAccountRole } from '@admin/features/admin-account/adminAccountTypes';

export interface AdminLoginValues {
  loginId: string;
  password: string;
}

export interface AdminAuth {
  role: AdminAccountRole | null;
  isAuthenticated: boolean;
  login: (values: AdminLoginValues) => void;
  logout: () => void;
}

export const AdminAuthContext = createContext<AdminAuth | null>(null);
