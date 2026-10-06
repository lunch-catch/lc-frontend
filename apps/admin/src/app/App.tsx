import { RouterProvider } from 'react-router/dom';

import { AdminAuthProvider } from '@admin/auth/AdminAuthProvider';
import { TemplateManagementProvider } from '@admin/features/template/TemplateManagementProvider';

import { router } from './router';

const App = () => (
  <AdminAuthProvider>
    <TemplateManagementProvider>
      <RouterProvider router={router} />
    </TemplateManagementProvider>
  </AdminAuthProvider>
);

export default App;
