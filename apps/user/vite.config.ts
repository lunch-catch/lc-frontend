import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// 개발 중 API 서버 주소. 다른 서버에 붙이려면 API_PROXY_TARGET 환경변수로 바꾼다
const DEFAULT_API_PROXY_TARGET = 'http://localhost:8080';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
    ],
    resolve: {
      // 경로 별칭은 tsconfig.app.json의 paths를 그대로 사용한다
      tsconfigPaths: true,
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        // 인증 쿠키가 SameSite=Strict이고 경로가 /v1/auth/로 묶여 있어,
        // 프론트와 같은 주소의 /v1 경로로 부르도록 API 서버에 넘긴다
        '/v1': {
          target: env.API_PROXY_TARGET || DEFAULT_API_PROXY_TARGET,
          changeOrigin: true,
        },
      },
    },
  };
});
