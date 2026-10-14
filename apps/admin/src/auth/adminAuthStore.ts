import {
  loginAdmin as requestAdminLogin,
  logoutAdmin as requestAdminLogout,
  refreshAdmin as requestAdminRefresh,
} from '@admin/api/auth';
import { ApiError, registerAuthRecovery } from '@admin/api/client';

import type { AdminInfo, AdminLoginValues } from './adminAuthContext';

interface AuthState {
  admin: AdminInfo | null;
  authNotice: string | null;
  isRestoring: boolean;
  restoreError: unknown;
}

// Provider 재마운트에도 진행 중 요청을 공유한다. 토큰은 저장하지 않고 브라우저 쿠키로만 관리한다.
let state: AuthState = {
  admin: null,
  authNotice: null,
  isRestoring: true,
  restoreError: null,
};
// JWT의 서버 발급 순번과는 별개로, 요청 이후 인증 상태가 바뀌었는지 구분하는 값이다.
let authVersion = 0;
// 토큰 갱신은 같은 세션이지만 로그인·로그아웃은 기존 요청의 소유권을 끊는다.
let sessionId = 0;
// 로그인과 재발급이 같은 요청 제한을 공유하므로 대기 시간도 함께 관리한다.
let retryUntil = 0;
let refreshPromise: Promise<AdminInfo> | undefined;
let loginPromise: Promise<void> | undefined;
let logoutPromise: Promise<void> | undefined;
const listeners = new Set<() => void>();
const publish = (next: AuthState) => {
  state = next;
  listeners.forEach((listener) => listener());
};
export const getAuthState = () => state;
export const subscribeAuth = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const expire = (authNotice: string | null = null) => {
  sessionId += 1;
  authVersion += 1;
  publish({ admin: null, authNotice, isRestoring: false, restoreError: null });
};
const checkCooldown = () => {
  const seconds = Math.ceil((retryUntil - Date.now()) / 1000);
  if (seconds > 0)
    throw new ApiError(
      `${seconds}초 후 다시 시도해 주세요.`,
      429,
      undefined,
      seconds,
    );
};
const rememberCooldown = (error: unknown) => {
  if (error instanceof ApiError && error.retryAfterSeconds)
    retryUntil = Date.now() + error.retryAfterSeconds * 1000;
};

export const refreshAdmin = (): Promise<AdminInfo> => {
  if (logoutPromise)
    return Promise.reject(
      new ApiError('로그아웃 처리 중입니다.', 401, 'AUTH-005'),
    );
  if (refreshPromise) return refreshPromise;
  // StrictMode의 초기 복원과 여러 API의 인증 오류가 같은 요청을 공유한다.
  refreshPromise = (async () => {
    // 대기 시간 검사에서 즉시 실패해도 Promise 할당 이후 finally가 실행되도록 한다.
    await Promise.resolve();
    try {
      checkCooldown();
      const admin = await requestAdminRefresh();
      if (state.admin?.adminId !== admin.adminId) sessionId += 1;
      authVersion += 1;
      publish({
        admin,
        authNotice: null,
        isRestoring: false,
        restoreError: null,
      });
      return admin;
    } catch (error) {
      rememberCooldown(error);
      if (
        error instanceof ApiError &&
        error.status === 401 &&
        ['AUTH-003', 'AUTH-004'].includes(error.code ?? '')
      ) {
        // 처음 방문해 쿠키가 없는 경우는 정상 진입이므로 만료 안내를 띄우지 않는다.
        expire(
          error.code === 'AUTH-004'
            ? '보안을 위해 모든 기기에서 로그아웃되었습니다. 다시 로그인해 주세요.'
            : state.admin
              ? '로그인 시간이 만료되었습니다. 다시 로그인해 주세요.'
              : null,
        );
      } else {
        publish({
          ...state,
          isRestoring: false,
          restoreError: state.admin ? null : error,
        });
      }
      throw error;
    } finally {
      refreshPromise = undefined;
    }
  })();
  return refreshPromise;
};

export const restoreAdmin = () => {
  publish({ ...state, isRestoring: true, restoreError: null });
  return refreshAdmin();
};

export const loginAdmin = (values: AdminLoginValues): Promise<void> => {
  if (logoutPromise)
    return Promise.reject(new ApiError('로그아웃 처리 중입니다.', 0));
  if (loginPromise) return loginPromise;
  sessionId += 1;
  loginPromise = (async () => {
    // 쿠키를 회전하는 복원이 끝난 뒤 로그인해 응답 순서에 따른 계정 변경을 막는다.
    await refreshPromise?.catch(() => undefined);
    try {
      checkCooldown();
      const admin = await requestAdminLogin(values);
      authVersion += 1;
      publish({
        admin,
        authNotice: null,
        isRestoring: false,
        restoreError: null,
      });
    } catch (error) {
      rememberCooldown(error);
      throw error;
    }
  })().finally(() => {
    loginPromise = undefined;
  });
  return loginPromise;
};

export const logoutAdmin = (): Promise<void> => {
  if (logoutPromise) return logoutPromise;
  sessionId += 1;
  logoutPromise = (async () => {
    // 진행 중인 인증 응답의 쿠키를 받은 후 삭제해 늦은 응답이 로그아웃을 되돌리지 않게 한다.
    await Promise.allSettled([refreshPromise, loginPromise]);
    try {
      await requestAdminLogout();
      expire();
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 401 &&
        error.code === 'AUTH-005'
      )
        expire('로그인 상태를 확인할 수 없습니다. 다시 로그인해 주세요.');
      // 서버 실패 시 로그인 상태를 유지하고 사용자에게 실패를 알린다.
      throw error;
    }
  })().finally(() => {
    logoutPromise = undefined;
  });
  return logoutPromise;
};

registerAuthRecovery({
  getVersion: () => authVersion,
  getSessionId: () =>
    state.admin && !loginPromise && !logoutPromise ? sessionId : null,
  refresh: refreshAdmin,
  expire: (requestSessionId) => {
    if (requestSessionId === sessionId && !loginPromise && !logoutPromise)
      expire('로그인 상태를 확인할 수 없습니다. 다시 로그인해 주세요.');
  },
});
