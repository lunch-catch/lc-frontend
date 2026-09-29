import { useState } from 'react';

export interface AdminLoginValues {
  loginId: string;
  password: string;
}

export interface AdminAuth {
  isAuthenticated: boolean;
  login: (values: AdminLoginValues) => void;
  logout: () => void;
}

export const useAdminAuth = (): AdminAuth => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = ({ loginId, password }: AdminLoginValues) => {
    if (loginId && password) {
      setIsAuthenticated(true);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  return { isAuthenticated, login, logout };
};
