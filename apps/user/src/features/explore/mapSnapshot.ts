// 지도 보기를 떠날 때의 지도 모습(중심, 확대 수준, 고른 핀)
// 가게 상세에 들어갔다 뒤로 오면 처음 모습으로 돌아가지 않고 보던 모습 그대로 다시 그린다
// 새로고침하면 사라지는 메모리에만 둔다. 오래된 모습이 남지 않도록 잠깐만 쓴다
export interface MapSnapshot {
  // 검색어·업종·위치를 묶은 값. 같은 조건일 때만 다시 쓴다
  key: string;
  latitude: number;
  longitude: number;
  level: number;
  selectedStoreId: number | null;
  savedAt: number;
}

// 가게 몇 곳을 둘러보고 돌아오는 정도의 시간 (탐색 목록 스냅샷과 같다)
const SNAPSHOT_TTL_MS = 5 * 60 * 1000;

let snapshot: MapSnapshot | null = null;

export const saveMapSnapshot = (next: MapSnapshot) => {
  snapshot = next;
};

// 같은 조건으로 방금 저장한 것만 돌려준다
// 개발 모드(StrictMode)에서는 처음 값을 두 번 읽어서, 읽을 때 비우지 않고 떠날 때 새로 덮어쓴다
export const readMapSnapshot = (key: string) => {
  if (!snapshot || snapshot.key !== key) return null;
  if (Date.now() - snapshot.savedAt > SNAPSHOT_TTL_MS) return null;
  return snapshot;
};
