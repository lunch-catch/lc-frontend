// 서버 응답 봉투. 성공이면 code가 SUCCESS이고 data에 결과가 들어 있다
interface ResponseEnvelope<T> {
  code: string;
  message: string;
  data: T;
}

// 서버가 거절한 요청. code로 이유를 구분한다 (예: AUTH-007)
export class ApiError extends Error {
  readonly status: number;
  // 응답 본문을 읽지 못하면 (예: 서버가 꺼져 프록시가 HTML 오류를 준 경우) null이다
  readonly code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
}

// API 서버 주소. 배포에서는 https://api.lunchcatch.com 처럼 다른 주소를 넣고,
// 개발에서는 비워 두어 같은 주소의 /v1로 부르면 Vite 프록시가 API 서버로 넘긴다 (vite.config.ts)
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(
  /\/$/,
  '',
);

const REFRESH_PATH = '/v1/auth/tokens:refresh';

const readEnvelope = async <T>(
  response: Response,
): Promise<ResponseEnvelope<T> | null> => {
  try {
    return (await response.json()) as ResponseEnvelope<T>;
  } catch {
    return null;
  }
};

// 요청을 한 번 보내고 봉투를 벗긴 data를 돌려준다
const send = async <T>(
  path: string,
  { body, method = 'GET' }: RequestOptions,
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    // 배포에서는 API 서버가 다른 주소(api.lunchcatch.com)라 인증 쿠키를 실으려면 include가 필요하다
    // 같은 사이트(lunchcatch.com)라서 SameSite=Strict 쿠키도 함께 간다
    credentials: 'include',
    headers:
      body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // 204는 본문과 봉투가 없다
  if (response.status === 204) return undefined as T;

  const envelope = await readEnvelope<T>(response);

  if (!response.ok || envelope?.code !== 'SUCCESS') {
    throw new ApiError(
      response.status,
      envelope?.code ?? null,
      envelope?.message ?? `요청에 실패했습니다 (${response.status})`,
    );
  }

  return envelope.data;
};

// 다시 로그인해야 하는 상태가 됐을 때 알릴 곳 (AuthProvider가 로그인 정보를 지운다)
const sessionExpiredListeners = new Set<() => void>();

export const onSessionExpired = (listener: () => void) => {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
};

// 진행 중인 재발급. 여러 요청이 동시에 401을 받아도 재발급은 한 번만 보낸다
// 같은 Refresh Token이 두 번 가면 서버가 재사용으로 보고 모든 로그인을 끊는다 (AUTH-004)
let refreshing: Promise<boolean> | null = null;

// 재발급에 성공하면 true, 다시 로그인해야 하면 false
// 서버가 잠시 처리하지 못한 경우(503)나 네트워크 오류는 로그인을 끊지 않고 오류를 그대로 올린다
const refreshTokens = () => {
  refreshing ??= send<void>(REFRESH_PATH, { method: 'POST' })
    .then(() => true)
    .catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        sessionExpiredListeners.forEach((listener) => listener());
        return false;
      }
      throw error;
    })
    .finally(() => {
      refreshing = null;
    });

  return refreshing;
};

// 로그인 전에 부르는 요청은 Access Token이 없어 401이어도 재발급하지 않는다
const needsSession = (path: string, method: RequestOptions['method']) =>
  path !== REFRESH_PATH &&
  !path.startsWith('/v1/auth/kakao/authorize') &&
  !(path === '/v1/auth/tokens' && method === 'POST');

// API 서버에 요청하고 봉투를 벗긴 data를 돌려준다
// 인증 토큰은 서버가 HttpOnly 쿠키로 주고받으므로 따로 싣지 않는다
// Access Token(30분)이 만료돼 401이 오면 Refresh Token으로 재발급하고 한 번 더 보낸다
// 네트워크가 끊겨 응답을 못 받으면 fetch가 던진 오류가 그대로 올라간다
export const request = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  try {
    return await send<T>(path, options);
  } catch (error) {
    const isExpired =
      error instanceof ApiError &&
      error.status === 401 &&
      error.code === 'AUTH-005';
    if (!isExpired || !needsSession(path, options.method)) throw error;

    if (!(await refreshTokens())) throw error;
    return send<T>(path, options);
  }
};
