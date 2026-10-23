import type { StoreListItem } from '@user/api/store';

// 탐색 목록을 떠날 때 받아 둔 가게와 보던 위치
// 가게 상세에 들어갔다 뒤로 오면 목록을 다시 받지 않고 이걸로 바로 그려, 회색 틀 없이 보던 자리로 돌아간다
// 새로고침하면 사라지는 메모리에만 둔다. 오래된 목록을 보여주지 않도록 잠깐만 쓴다
export interface ExploreSnapshot {
  // 검색어·업종·위치를 묶은 값. 같은 조건일 때만 다시 쓴다
  key: string;
  stores: StoreListItem[];
  // 더 보기로 펼쳐 둔 개수. 돌아와서도 같은 높이로 그려야 보던 자리로 내려갈 수 있다
  visibleCount: number;
  nextPageToken: string | null;
  scrollY: number;
  savedAt: number;
}

// 가게 몇 곳을 둘러보고 돌아오는 정도의 시간. 이보다 오래되면 쿠폰 상태가 바뀌었을 수 있어 새로 받는다
const SNAPSHOT_TTL_MS = 5 * 60 * 1000;

let snapshot: ExploreSnapshot | null = null;

export const saveExploreSnapshot = (next: ExploreSnapshot) => {
  snapshot = next;
};

// 같은 조건으로 방금 저장한 것만 돌려준다
// 개발 모드(StrictMode)에서는 처음 값을 두 번 읽어서, 읽을 때 비우지 않고 떠날 때 새로 덮어쓴다
export const readExploreSnapshot = (key: string) => {
  if (!snapshot || snapshot.key !== key) return null;
  if (Date.now() - snapshot.savedAt > SNAPSHOT_TTL_MS) return null;
  return snapshot;
};
