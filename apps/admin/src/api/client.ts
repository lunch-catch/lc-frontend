const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '')
  .trim()
  .replace(/\/+$/, '');

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly retryAfterSeconds?: number;
  // 공통 안내와 분리해 화면에서 필요한 경우에만 서버의 구체적인 사유를 사용한다.
  readonly serverMessage?: string;

  constructor(
    message: string,
    status: number,
    code?: string,
    retryAfterSeconds?: number,
    serverMessage?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
    this.serverMessage = serverMessage;
  }
}

/** JSON 본문을 보내는 변경 요청의 헤더와 직렬화를 공통으로 구성한다. */
export const jsonOptions = (
  method: 'POST' | 'PUT' | 'PATCH',
  body: object,
) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const getRetryAfter = (response: Response) => {
  const header = response.headers.get('Retry-After');
  if (!header) return response.status === 503 ? 1 : undefined;
  const seconds = /^\d+$/.test(header)
    ? Number(header)
    : (Date.parse(header) - Date.now()) / 1000;
  return Number.isFinite(seconds)
    ? Math.max(0, Math.ceil(seconds))
    : response.status === 503
      ? 1
      : undefined;
};

const getErrorMessage = (status: number, code?: string) => {
  if (status === 401 && code === 'AUTH-001')
    return '아이디 또는 비밀번호가 올바르지 않습니다.';
  if (status === 401) return '로그인이 필요합니다. 다시 로그인해 주세요.';
  if (status === 403) return '접근 권한이 없습니다.';
  if (status === 409 && code === 'ADMIN-001')
    return '이미 사용 중인 관리자 ID입니다.';
  if (status === 400) return '입력한 정보를 확인해 주세요.';
  if (status === 429)
    return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
  if (status === 503)
    return '일시적으로 처리할 수 없습니다. 잠시 후 다시 시도해 주세요.';
  return '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';
};

interface AuthRecovery {
  getVersion: () => number;
  getSessionId: () => number | null;
  refresh: () => Promise<unknown>;
  expire: (sessionId: number) => void | Promise<void>;
}

let authRecovery: AuthRecovery | undefined;
// 요청 모듈이 인증 Store를 직접 import하지 않도록 복구 동작을 주입받는다.
export const registerAuthRecovery = (recovery: AuthRecovery) => {
  authRecovery = recovery;
};

const sendRequest = async (
  path: string,
  options: Omit<RequestInit, 'credentials'> = {},
): Promise<Response> => {
  if (!API_BASE_URL) {
    throw new ApiError('VITE_API_BASE_URL 환경변수를 설정해 주세요.', 0);
  }

  if (!path.startsWith('/') || path.startsWith('//')) {
    throw new Error('API 경로는 /로 시작하는 상대 경로여야 합니다.');
  }

  // HttpOnly 인증 쿠키는 브라우저가 전송하며 요청마다 쿠키 포함을 유지한다.
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
  });

  if (!response.ok) {
    const retryAfterSeconds = getRetryAfter(response);
    // 인증의 빈 429 본문은 허용하고, 템플릿처럼 본문이 있는 429의 오류 코드는 유지한다.
    const body: unknown = await response.json().catch(() => null);
    const code =
      body &&
      typeof body === 'object' &&
      'code' in body &&
      typeof body.code === 'string'
        ? body.code
        : undefined;
    const waitMessage = retryAfterSeconds
      ? ` ${retryAfterSeconds}초 후 다시 시도해 주세요.`
      : '';
    const serverMessage =
      body &&
      typeof body === 'object' &&
      'message' in body &&
      typeof body.message === 'string' &&
      body.message.trim()
        ? body.message.trim()
        : undefined;
    throw new ApiError(
      getErrorMessage(response.status, code) + waitMessage,
      response.status,
      code,
      retryAfterSeconds,
      serverMessage,
    );
  }

  return response;
};

export const request = async (
  path: string,
  options: Omit<RequestInit, 'credentials'> = {},
): Promise<Response> => {
  const recovery = authRecovery;
  const version = recovery?.getVersion();
  const isProtected =
    path.startsWith('/v1/admin/') && !path.startsWith('/v1/admin/auth/');
  const sessionId = isProtected ? recovery?.getSessionId() : undefined;
  const assertSession = () => {
    if (
      isProtected &&
      recovery &&
      (sessionId == null || sessionId !== recovery.getSessionId())
    )
      throw new ApiError(
        '로그인 상태가 변경되어 요청을 중단했습니다. 다시 시도해 주세요.',
        0,
      );
  };
  assertSession();
  try {
    const response = await sendRequest(path, options);
    assertSession();
    return response;
  } catch (error) {
    assertSession();
    // 로그인·재발급·로그아웃은 재시도하지 않는다. 권한 오류도 재발급 대상이 아니다.
    if (
      !recovery ||
      sessionId == null ||
      !path.startsWith('/v1/admin/') ||
      path.startsWith('/v1/admin/auth/') ||
      !(error instanceof ApiError) ||
      error.code !== 'AUTH-005' ||
      error.status !== 401
    )
      throw error;
    options.signal?.throwIfAborted();
    // 이전 쿠키로 보낸 요청이 늦게 실패해도 이미 완료된 재발급을 반복하지 않는다.
    if (version === recovery.getVersion()) await recovery.refresh();
    assertSession();
    options.signal?.throwIfAborted();
    try {
      const response = await sendRequest(path, options);
      assertSession();
      return response;
    } catch (retryError) {
      assertSession();
      if (
        retryError instanceof ApiError &&
        retryError.status === 401 &&
        retryError.code === 'AUTH-005'
      )
        // 만료도 인증 잠금을 기다리므로 상태 반영이 끝난 뒤 요청 실패를 전달한다.
        await recovery.expire(sessionId);
      throw retryError;
    }
  }
};

export const requestData = async <T>(
  path: string,
  options: Omit<RequestInit, 'credentials'>,
  expectedStatus: number | readonly number[],
): Promise<T> => {
  const response = await request(path, options);
  const matchesStatus =
    typeof expectedStatus === 'number'
      ? response.status === expectedStatus
      : expectedStatus.includes(response.status);
  if (!matchesStatus)
    throw new ApiError('서버 응답 상태를 확인할 수 없습니다.', response.status);
  const body = await response.json().catch(() => null);
  if (!body || body.code !== 'SUCCESS' || body.data == null)
    throw new ApiError('서버 응답 형식을 확인할 수 없습니다.', response.status);
  return body.data as T;
};
