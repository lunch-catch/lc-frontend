import { ApiError } from '@admin/api/client';

import type { AdminInfo } from './adminAuthContext';

const storageKey = 'lunchcatch.admin.auth-state';
const cooldownKey = 'lunchcatch.admin.auth-cooldown';
const lockName = 'lunchcatch.admin.auth';

export interface SharedAuthState {
  revision: string;
  session: string;
  admin: AdminInfo | null;
  notice: string | null;
}

// 브라우저 없는 테스트에서도 같은 계약을 사용한다. 토큰·비밀번호는 저장하지 않는다.
let memoryState: SharedAuthState | null = null;
let memoryCooldown = 0;
const unavailable = () =>
  new ApiError(
    '인증 동기화를 사용할 수 없습니다. 브라우저의 사이트 저장소와 HTTPS 연결을 확인해 주세요.',
    0,
  );

const read = (): SharedAuthState | null => {
  if (typeof window === 'undefined') return memoryState;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return null;
    const record = value as Partial<SharedAuthState>;
    if (
      typeof record.revision !== 'string' ||
      typeof record.session !== 'string' ||
      !(record.notice === null || typeof record.notice === 'string') ||
      !(
        record.admin === null ||
        (record.admin &&
          Number.isSafeInteger(record.admin.adminId) &&
          record.admin.adminId > 0 &&
          typeof record.admin.name === 'string' &&
          ['ADMIN', 'SUPER_ADMIN'].includes(record.admin.role))
      )
    )
      return null;
    return record as SharedAuthState;
  } catch {
    throw unavailable();
  }
};

export const adminAuthSync = {
  read,
  /** 쿠키를 바꾸는 인증 요청은 탭에 관계없이 이 잠금 하나를 사용한다. */
  async lock<T>(work: () => Promise<T>): Promise<T> {
    if (typeof window === 'undefined') return work();
    // 잠금 없이 쿠키를 회전하는 대체 경로는 두지 않는다.
    if (!navigator.locks) throw unavailable();
    return navigator.locks.request(lockName, work);
  },
  /** 잠금을 보유한 호출자가 서버 결과를 공유한다. 토큰 대신 표시 정보만 저장한다. */
  write(
    admin: AdminInfo | null,
    session: string,
    notice: string | null = null,
  ) {
    const next: SharedAuthState = {
      revision: crypto.randomUUID(),
      session,
      admin,
      notice,
    };
    if (typeof window === 'undefined') memoryState = next;
    else {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        throw unavailable();
      }
    }
    return next;
  },
  newSession: () => crypto.randomUUID(),
  getCooldown() {
    if (typeof window === 'undefined') return memoryCooldown;
    try {
      return Number(window.localStorage.getItem(cooldownKey)) || 0;
    } catch {
      throw unavailable();
    }
  },
  setCooldown(until: number) {
    if (typeof window === 'undefined') memoryCooldown = until;
    else {
      try {
        window.localStorage.setItem(cooldownKey, String(until));
      } catch {
        throw unavailable();
      }
    }
  },
  subscribe(listener: (changed: boolean) => void) {
    if (typeof window === 'undefined') return;
    // 이벤트 본문 대신 최신 공유 값을 읽어 늦은 알림으로 상태가 되돌아가지 않게 한다.
    window.addEventListener('storage', (event) => {
      if (event.key === storageKey || event.key === null) listener(true);
    });
    // BFCache·백그라운드에서 복귀한 탭도 최신 상태 변경을 확인한다.
    window.addEventListener('pageshow', () => listener(false));
    window.addEventListener('focus', () => listener(false));
  },
};
