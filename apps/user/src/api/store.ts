import { mockFeedCards } from './mocks/feed';
import { mockStoreDetails, mockStores } from './mocks/stores';

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

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

// 요일별 영업시간. 휴무일이면 시간이 모두 null
export interface StoreBusinessHour {
  dayOfWeek: DayOfWeek;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
  breakStartTime: string | null;
  breakEndTime: string | null;
  lastOrderTime: string | null;
}

export interface StoreMenu {
  menuId: number;
  name: string;
  price: number;
}

// 가게 상세의 활성 캠페인. 쿠폰 사용 가능 시간이 함께 온다
export interface StoreDetailCampaign extends StoreActiveCampaign {
  campaignId: string;
  usableStartTime: string;
  usableEndTime: string;
}

// 가게 상세 (GET /v1/stores/{storeId})
export interface StoreDetail {
  storeId: number;
  name: string;
  businessCategory: BusinessCategory;
  roadAddress: string;
  phone: string;
  latitude: number;
  longitude: number;
  businessHours: StoreBusinessHour[];
  // 명세는 objectKey로 되어 있고 URL로 줄지는 아직 정하지 않았다. 화면에서는 URL로 받는다고 가정한다
  imageUrl: string | null;
  menus: StoreMenu[];
  activeCampaign: StoreDetailCampaign | null;
}

const DAYS_OF_WEEK: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const createMockBusinessHours = (
  closedDays: DayOfWeek[] = [],
): StoreBusinessHour[] =>
  DAYS_OF_WEEK.map((dayOfWeek) =>
    closedDays.includes(dayOfWeek)
      ? {
          dayOfWeek,
          openTime: null,
          closeTime: null,
          isClosed: true,
          breakStartTime: null,
          breakEndTime: null,
          lastOrderTime: null,
        }
      : {
          dayOfWeek,
          openTime: '10:30',
          closeTime: '21:00',
          isClosed: false,
          breakStartTime: '15:00',
          breakEndTime: '17:00',
          lastOrderTime: '20:30',
        },
  );

// 없는 가게면 null (서버는 404)
export const fetchStoreDetail = async (
  storeId: number,
): Promise<StoreDetail | null> => {
  await wait(MOCK_DELAY_MS);

  const store = mockStores.find((item) => item.storeId === storeId);
  const detail = mockStoreDetails[storeId];
  if (!store || !detail) return null;

  const campaignCard = mockFeedCards.find(
    (card) => card.campaignId === detail.campaignId,
  );

  return {
    storeId,
    name: store.name,
    businessCategory: store.businessCategory,
    roadAddress: detail.roadAddress,
    phone: detail.phone,
    latitude: store.latitude,
    longitude: store.longitude,
    businessHours: createMockBusinessHours(detail.closedDays),
    imageUrl: store.thumbnailUrl,
    menus: detail.menus.map((menu, index) => ({ ...menu, menuId: index + 1 })),
    activeCampaign:
      store.activeCampaign && campaignCard
        ? {
            ...store.activeCampaign,
            campaignId: campaignCard.campaignId,
            usableStartTime: campaignCard.usableFrom,
            usableEndTime: campaignCard.usableTo,
          }
        : null,
  };
};

// 현재 위치에서 가게까지 걸어가는 거리와 시간 (GET /v1/stores/{storeId}/walking-route)
// 경로 좌표도 오지만 지도를 붙이기 전이라 거리와 시간만 쓴다
export interface WalkingRoute {
  totalDistanceMeters: number;
  totalDurationSeconds: number;
}

// 분당 약 70m로 걷는다고 보고 시간을 만든다
const MOCK_WALK_METERS_PER_SECOND = 70 / 60;

export const fetchWalkingRoute = async (
  storeId: number,
): Promise<WalkingRoute | null> => {
  await wait(MOCK_DELAY_MS);

  const distance = mockStores.find(
    (store) => store.storeId === storeId,
  )?.distanceMeters;
  if (distance == null) return null;

  return {
    totalDistanceMeters: distance,
    totalDurationSeconds: Math.round(distance / MOCK_WALK_METERS_PER_SECOND),
  };
};

// 점주가 만든 캠페인 포스터 HTML (GET /v1/campaigns/{campaignId}/poster)
// 관리자 검증을 거쳐 스크립트와 외부 리소스가 없는 것만 내려온다
export const fetchCampaignPoster = async (
  campaignId: string,
): Promise<string | null> => {
  await wait(MOCK_DELAY_MS);

  return (
    mockFeedCards.find((card) => card.campaignId === campaignId)?.posterHtml ??
    null
  );
};
