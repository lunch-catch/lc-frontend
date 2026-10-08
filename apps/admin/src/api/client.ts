const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '')
  .trim()
  .replace(/\/+$/, '');

export const request = (
  path: string,
  options: Omit<RequestInit, 'credentials'> = {},
): Promise<Response> => {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL 환경변수를 설정해 주세요.');
  }

  if (!path.startsWith('/') || path.startsWith('//')) {
    throw new Error('API 경로는 /로 시작하는 상대 경로여야 합니다.');
  }

  // HttpOnly 인증 쿠키는 브라우저가 전송하며 요청마다 쿠키 포함을 유지한다.
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
  });
};
