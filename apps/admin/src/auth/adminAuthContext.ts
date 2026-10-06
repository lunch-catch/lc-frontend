import { createContext } from 'react';

export interface AdminLoginValues {
  loginId: string;
  password: string;
}

export interface AdminAuth {
  isAuthenticated: boolean;
  login: (values: AdminLoginValues) => void;
  logout: () => void;
}

export const AdminAuthContext = createContext<AdminAuth | null>(null);
