import { createContext } from 'react';

import type { TemplateManagement } from './useTemplateManagementState';

export const TemplateManagementContext =
  createContext<TemplateManagement | null>(null);
