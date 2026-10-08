import { mockStores } from './mocks/stores';

// 가게 업종 코드 (가게 API 명세 store.business_category)
export type BusinessCategory =
  | 'KOREAN'
  | 'CHINESE'
  | 'JAPANESE'
  | 'WESTERN'
  | 'BUNSIK'
  | 'ASIAN'
  | 'FAST_FOOD'
  | 'CAFE_DESSERT'
  | 'OTHER';

export const BUSINESS_CATEGORY_LABELS: Record<BusinessCategory, string> = {
  KOREAN: '한식',
  CHINESE: '중식',
  JAPANESE: '일식',
  WESTERN: '양식',
  BUNSIK: '분식',
  ASIAN: '아시안',
  FAST_FOOD: '패스트푸드',
  CAFE_DESSERT: '카페·디저트',
  OTHER: '기타',
};

// 지금 사용자에게 보여줄 활성 캠페인의 할인 요약
export interface StoreActiveCampaign {
  discountTargetType: 'ALL' | 'MENU';
  discountType: 'PERCENT' | 'AMOUNT';
  discountValue: number;
}

// 가게 목록·검색 항목 (GET /v1/stores)
export interface StoreListItem {
  storeId: number;
  name: string;
  businessCategory: BusinessCategory;
  longitude: number;
  latitude: number;
  // 요청 좌표에서 가게까지의 직선거리(m). 좌표 없이 검색하면 null
  distanceMeters: number | null;
  hasActiveCampaign: boolean;
  activeCampaign: StoreActiveCampaign | null;
  // 가게 대표 이미지. 명세에 아직 없어 가게 API 담당에게 추가를 요청했다
  thumbnailUrl: string | null;
}

export interface StoreListResponse {
  items: StoreListItem[];
  // 다음 페이지 커서. 마지막 페이지면 null
  nextPageToken: string | null;
}

export interface StoreListQuery {
  // 가게명 또는 대표 메뉴명 검색어
  query?: string;
  category?: BusinessCategory;
}

const MOCK_DELAY_MS = 600;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 현재 위치 기준 주변 가게를 가까운 순으로 받는다. 활성 캠페인이 있는 가게가 먼저 온다
// 주소에 ?mockStoresEmpty를 붙이면 주변에 가게가 없는 상태를 확인할 수 있다
export const fetchStores = async ({
  category,
  query,
}: StoreListQuery = {}): Promise<StoreListResponse> => {
  await wait(MOCK_DELAY_MS);

  if (new URLSearchParams(window.location.search).has('mockStoresEmpty')) {
    return { items: [], nextPageToken: null };
  }

  const keyword = query?.trim();
  const items = mockStores
    .filter((store) => !category || store.businessCategory === category)
    .filter(
      (store) =>
        !keyword ||
        store.name.includes(keyword) ||
        store.menuNames.some((menuName) => menuName.includes(keyword)),
    )
    .sort(
      (a, b) =>
        Number(b.hasActiveCampaign) - Number(a.hasActiveCampaign) ||
        (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0),
    )
    // 검색에만 쓰는 mock 메뉴명은 응답에서 뺀다
    .map((store) => {
      const item: StoreListItem & { menuNames?: string[] } = { ...store };
      delete item.menuNames;
      return item;
    });

  return { items, nextPageToken: null };
};
