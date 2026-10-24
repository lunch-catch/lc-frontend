import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from '@repo/ui';

import App from './app/App.tsx';
import { preloadAdminPage } from './app/pageLoaders';

initializeTheme();
// 코드 로딩 실패는 기존 페이지 오류 경계에서 처리하고 앱 시작을 막지 않는다.
void preloadAdminPage(window.location.pathname)?.catch(() => undefined);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
