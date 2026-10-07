import { RouterProvider } from 'react-router';

import { AuthProvider } from '@user/auth/AuthProvider';

import { router } from './router';

const App = () => {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

export default App;
