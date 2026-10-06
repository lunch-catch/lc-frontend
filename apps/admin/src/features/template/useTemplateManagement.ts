import { useContext } from 'react';

import { TemplateManagementContext } from './templateManagementContext';

export const useTemplateManagement = () => {
  const context = useContext(TemplateManagementContext);
  if (!context)
    throw new Error(
      'useTemplateManagement는 TemplateManagementProvider 안에서 사용해야 합니다.',
    );
  return context;
};
