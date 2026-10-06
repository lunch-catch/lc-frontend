import { useContext } from 'react';

import { AdminAuthContext } from './adminAuthContext';

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context)
    throw new Error('useAdminAuth는 AdminAuthProvider 안에서 사용해야 합니다.');
  return context;
};
