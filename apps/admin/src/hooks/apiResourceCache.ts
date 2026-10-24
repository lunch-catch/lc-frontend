const FRESH_FOR_MS = 30_000;
const MAX_ENTRIES = 32;

interface CacheEntry {
  load: object;
  query: string;
  data: unknown;
  expiresAt: number;
}

// 인증 객체가 바뀌면 이전 세션의 캐시에 접근할 수 없고, 참조가 없어지면 함께 회수된다.
const owners = new WeakMap<object, CacheEntry[]>();
// 무효화 이후에는 먼저 시작한 요청이 캐시를 다시 채우지 못하도록 세대를 구분한다.
const revisions = new WeakMap<object, WeakMap<object, number>>();

export const apiResourceCache = {
  revision(owner: object, load: object) {
    return revisions.get(owner)?.get(load) ?? 0;
  },
  read<T>(owner: object, load: object, query: string) {
    const entry = owners
      .get(owner)
      ?.find(
        (item) =>
          item.load === load &&
          item.query === query &&
          item.expiresAt > Date.now(),
      );
    return entry ? { data: entry.data as T } : undefined;
  },
  write(owner: object, load: object, query: string, data: unknown) {
    const now = Date.now();
    const entries = (owners.get(owner) ?? []).filter(
      (item) =>
        item.expiresAt > now && !(item.load === load && item.query === query),
    );
    owners.set(
      owner,
      [...entries, { load, query, data, expiresAt: now + FRESH_FOR_MS }].slice(
        -MAX_ENTRIES,
      ),
    );
  },
  // 변경 작업 후에는 같은 조회 함수의 다른 검색 조건·페이지도 다시 읽는다.
  invalidate(owner: object, load: object) {
    const versions = revisions.get(owner) ?? new WeakMap<object, number>();
    versions.set(load, (versions.get(load) ?? 0) + 1);
    revisions.set(owner, versions);
    owners.set(
      owner,
      (owners.get(owner) ?? []).filter((item) => item.load !== load),
    );
  },
};
