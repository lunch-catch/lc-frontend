import type { ReactNode } from 'react';

import { TemplateManagementContext } from './templateManagementContext';
import { useTemplateManagementState } from './useTemplateManagementState';

// 라우터 바깥에서 유지해 다른 메뉴를 다녀와도 템플릿과 임시저장 목록을 잃지 않는다.
export const TemplateManagementProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const management = useTemplateManagementState();
  return (
    <TemplateManagementContext value={management}>
      {children}
    </TemplateManagementContext>
  );
};
