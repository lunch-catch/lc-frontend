import type { ReactNode } from 'react';

import { TemplateManagementContext } from './templateManagementContext';
import { useTemplateManagementState } from './useTemplateManagementState';

// 목록과 작성 화면이 서버 목록의 갱신 상태를 공유한다.
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
