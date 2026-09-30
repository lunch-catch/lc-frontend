import { createContext } from 'react';

import type { AuthUser } from '@user/api/auth';

export interface AuthContextValue {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  completeOnboarding: () => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
