import {
  loginAdmin as requestAdminLogin,
  logoutAdmin as requestAdminLogout,
  refreshAdmin as requestAdminRefresh,
} from '@admin/api/auth';
import { ApiError, registerAuthRecovery } from '@admin/api/client';

import type { AdminInfo, AdminLoginValues } from './adminAuthContext';
import { adminAuthSync, type SharedAuthState } from './adminAuthSync';

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
// revision은 갱신마다, session은 로그인·로그아웃·계정 변경 때 바뀐다.
// 둘을 구분해야 같은 세션의 재발급은 재사용하면서 이전 계정의 요청은 차단할 수 있다.
let sharedRevision: string | undefined;
let sharedSession: string | undefined;
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
const applySharedState = (next: SharedAuthState) => {
  if (next.revision === sharedRevision) return;
  const sameSession =
    next.session === sharedSession &&
    next.admin?.adminId === state.admin?.adminId;
  if (!sameSession) sessionId += 1;
  // 토큰만 갱신됐을 때 객체를 바꾸면 조회 훅이 재시도를 취소하고 새 요청을 시작한다.
  // 같은 세션·표시 정보는 유지하되 재로그인과 권한 변경은 새 객체로 구분한다.
  const admin =
    sameSession &&
    state.admin &&
    next.admin &&
    state.admin.name === next.admin.name &&
    state.admin.role === next.admin.role
      ? state.admin
      : next.admin;
  sharedRevision = next.revision;
  sharedSession = next.session;
  authVersion += 1;
  publish({
    admin,
    authNotice: next.notice,
    isRestoring: false,
    restoreError: null,
  });
};
const sessionChanged = () =>
  new ApiError(
    '로그인 상태가 변경되어 요청을 중단했습니다. 다시 시도해 주세요.',
    0,
  );
// 호출자는 인증 잠금을 보유한다. 만료도 다른 탭의 로그인·재발급과 순서가 뒤집히지 않게 한다.
const expire = (authNotice: string | null = null) => {
  applySharedState(
    adminAuthSync.write(null, adminAuthSync.newSession(), authNotice),
  );
};
const checkCooldown = () => {
  const seconds = Math.ceil(
    (Math.max(retryUntil, adminAuthSync.getCooldown()) - Date.now()) / 1000,
  );
  if (seconds > 0)
    throw new ApiError(
      `${seconds}초 후 다시 시도해 주세요.`,
      429,
      undefined,
      seconds,
    );
};
const rememberCooldown = (error: unknown) => {
  if (error instanceof ApiError && error.retryAfterSeconds) {
    retryUntil = Date.now() + error.retryAfterSeconds * 1000;
    adminAuthSync.setCooldown(retryUntil);
  }
};
// AUTH-002는 회전 결과가 불확실하므로 같은 토큰으로 재발급을 반복하지 않는다.
const requiresLogin = (error: unknown): error is ApiError =>
  error instanceof ApiError &&
  ((error.status === 401 &&
    ['AUTH-003', 'AUTH-004'].includes(error.code ?? '')) ||
    (error.status === 503 && error.code === 'AUTH-002'));

export const refreshAdmin = (): Promise<AdminInfo> => {
  if (logoutPromise)
    return Promise.reject(
      new ApiError('로그아웃 처리 중입니다.', 401, 'AUTH-005'),
    );
  if (refreshPromise) return refreshPromise;
  const requestSessionId = sessionId;
  const hadAdmin = state.admin !== null;
  // StrictMode의 초기 복원과 여러 API의 인증 오류가 같은 요청을 공유한다.
  refreshPromise = (async () => {
    // 대기 시간 검사에서 즉시 실패해도 Promise 할당 이후 finally가 실행되도록 한다.
    await Promise.resolve();
    try {
      // 처음 복원할 때는 저장된 표시 정보만으로 로그인시키지 않고 서버에서 확인한다.
      const revision = sharedRevision ?? adminAuthSync.read()?.revision;
      return await adminAuthSync.lock(async () => {
        const latest = adminAuthSync.read();
        if (latest && latest.revision !== revision) {
          applySharedState(latest);
          // 다른 탭이 같은 세션을 갱신했다면 공유 쿠키로 원래 요청만 재시도한다.
          if (latest.admin && (!hadAdmin || sessionId === requestSessionId))
            return latest.admin;
          throw sessionChanged();
        }
        if (hadAdmin && sessionId !== requestSessionId) throw sessionChanged();
        checkCooldown();
        try {
          const admin = await requestAdminRefresh();
          const session =
            latest?.admin?.adminId === admin.adminId
              ? latest.session
              : adminAuthSync.newSession();
          applySharedState(adminAuthSync.write(admin, session));
          return admin;
        } catch (error) {
          rememberCooldown(error);
          if (requiresLogin(error)) {
            expire(
              error.code === 'AUTH-004'
                ? '보안을 위해 로그아웃되었습니다. 다시 로그인해 주세요.'
                : error.code === 'AUTH-002'
                  ? '로그인 상태를 확인할 수 없습니다. 다시 로그인해 주세요.'
                  : state.admin
                    ? '로그인 시간이 만료되었습니다. 다시 로그인해 주세요.'
                    : null,
            );
          }
          throw error;
        }
      });
    } catch (error) {
      if (!requiresLogin(error)) {
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
    await adminAuthSync.lock(async () => {
      checkCooldown();
      try {
        const admin = await requestAdminLogin(values);
        applySharedState(
          adminAuthSync.write(admin, adminAuthSync.newSession()),
        );
      } catch (error) {
        rememberCooldown(error);
        throw error;
      }
    });
  })().finally(() => {
    loginPromise = undefined;
  });
  return loginPromise;
};

export const logoutAdmin = (): Promise<void> => {
  if (logoutPromise) return logoutPromise;
  sessionId += 1;
  const session = sharedSession;
  const pendingLogin = loginPromise;
  logoutPromise = (async () => {
    // 진행 중인 인증 응답의 쿠키를 받은 후 삭제해 늦은 응답이 로그아웃을 되돌리지 않게 한다.
    await Promise.allSettled([refreshPromise, loginPromise]);
    // 같은 탭에서 먼저 시작한 로그인은 마친 뒤 로그아웃하되, 다른 탭의 새 로그인은 취소하지 않는다.
    const expectedSession = pendingLogin ? sharedSession : session;
    await adminAuthSync.lock(async () => {
      const latest = adminAuthSync.read();
      if (latest && latest.session !== expectedSession) {
        applySharedState(latest);
        throw sessionChanged();
      }
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
    });
  })().finally(() => {
    logoutPromise = undefined;
  });
  return logoutPromise;
};

adminAuthSync.subscribe((changed) => {
  // 첫 포커스·페이지 표시만으로 저장된 관리자 정보를 인증된 상태로 취급하지 않는다.
  if (!changed && sharedRevision === undefined) return;
  try {
    const latest = adminAuthSync.read();
    if (latest) applySharedState(latest);
    else if (sharedRevision !== undefined) {
      sharedRevision = undefined;
      sharedSession = undefined;
      sessionId += 1;
      authVersion += 1;
      publish({
        admin: null,
        authNotice: null,
        isRestoring: false,
        restoreError: null,
      });
    }
  } catch (error) {
    sessionId += 1;
    publish({
      admin: null,
      authNotice: null,
      isRestoring: false,
      restoreError: error,
    });
  }
});

registerAuthRecovery({
  getVersion: () => authVersion,
  // storage 이벤트가 아직 도착하지 않았어도 다른 계정의 쿠키로 요청을 보내지 않는다.
  getSessionId: () =>
    state.admin &&
    !loginPromise &&
    !logoutPromise &&
    adminAuthSync.read()?.session === sharedSession
      ? sessionId
      : null,
  refresh: refreshAdmin,
  expire: async (requestSessionId) => {
    const revision = sharedRevision;
    await adminAuthSync.lock(async () => {
      const latest = adminAuthSync.read();
      if (latest && latest.revision !== revision) {
        applySharedState(latest);
        return;
      }
      if (requestSessionId === sessionId && !loginPromise && !logoutPromise)
        expire('로그인 상태를 확인할 수 없습니다. 다시 로그인해 주세요.');
    });
  },
});
