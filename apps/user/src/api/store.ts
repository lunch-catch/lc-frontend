import { request } from './client';
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

// 할인 대상 메뉴 (가게 목록 명세 activeCampaign.targetMenu)
export interface StoreTargetMenu {
  menuId: number;
  name: string;
  // 할인 전 가격(원)
  price: number;
}

// 지금 사용자에게 보여줄 활성 캠페인의 할인 요약
export interface StoreActiveCampaign {
  discountTargetType: 'ALL' | 'MENU';
  discountType: 'PERCENT' | 'AMOUNT';
  discountValue: number;
  // MENU면 할인 대상 메뉴, ALL이면 null. mock에는 없다
  targetMenu?: StoreTargetMenu | null;
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
  // 가게 대표 이미지. 서버 목록 응답에는 없어 실제 API에서는 항상 null이다
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
  // 고른 업종. 없으면 전체
  category?: BusinessCategory;
  // 거리를 잴 기준 위치. 서버는 필수로 받는다
  latitude: number;
  longitude: number;
  // 다음 페이지 커서. 없으면 첫 페이지
  pageToken?: string | null;
}

// 가게 목록은 서버 구현이 끝나 실제 API를 쓴다. 가게 상세와 걸어가는 경로는 아직 서버에 없어 mock이다
const USE_STORE_LIST_API = true;

// 한 번에 받는 가게 수. 지도에 핀을 넉넉히 찍도록 기본(20)보다 크게 받는다
const STORE_PAGE_SIZE = 50;

interface StoreListItemResponse {
  storeId: number;
  name: string;
  businessCategory: BusinessCategory;
  longitude: number;
  latitude: number;
  distanceMeters: number;
  hasActiveCampaign: boolean;
  activeCampaign: StoreActiveCampaign | null;
}

// 서버 목록에서 받은 가게. 가게 상세 API가 생기기 전까지 상세 화면을 이 정보로 채운다
const listedStores = new Map<number, StoreListItem>();

const toStoreListItem = (item: StoreListItemResponse): StoreListItem => ({
  ...item,
  thumbnailUrl: null,
});

const MOCK_DELAY_MS = 600;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 기준 위치에서 가까운 순으로 가게를 받는다 (GET /v1/stores). 반경 제한이 없어 페이지를 이어 받는다
// 쿠폰 여부는 정렬에 영향을 주지 않는다. 검색어, 업종, 위치가 바뀌면 첫 페이지부터 다시 받는다
const fetchServerStores = async ({
  category,
  latitude,
  longitude,
  pageToken,
  query,
}: StoreListQuery): Promise<StoreListResponse> => {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    // 업종을 고르지 않으면 ALL을 보낸다. 빠뜨리면 400이다
    filter: category ?? 'ALL',
    pageSize: String(STORE_PAGE_SIZE),
  });
  const keyword = query?.trim();
  if (keyword) params.set('query', keyword);
  if (pageToken) params.set('pageToken', pageToken);

  const data = await request<{
    items: StoreListItemResponse[];
    nextPageToken: string | null;
  }>(`/v1/stores?${params.toString()}`);

  const items = data.items.map(toStoreListItem);
  items.forEach((item) => listedStores.set(item.storeId, item));
  return { items, nextPageToken: data.nextPageToken };
};

// 주변 가게 목록. mock일 때 주소에 ?mockStoresEmpty를 붙이면 주변에 가게가 없는 상태를 확인할 수 있다
export const fetchStores = async (
  storeQuery: StoreListQuery,
): Promise<StoreListResponse> => {
  if (USE_STORE_LIST_API) return fetchServerStores(storeQuery);

  const { category, query } = storeQuery;
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
// 상세 API가 아직 없어 서버 목록의 가게는 목록 정보만으로 채운다 (isPartial). 주소, 전화, 메뉴, 영업시간이 비어 있다
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
  // 목록 정보로만 채운 상세인지
  isPartial?: boolean;
  // isPartial일 때 목록에서 받은 오늘 할인 요약. 찜·발급에 필요한 캠페인 ID가 없어 쿠폰 영역 대신 보여준다
  campaignSummary?: StoreActiveCampaign | null;
}

// 서버 목록에서 본 가게를 상세 모양으로 채운다. 목록에 없는 정보는 비워 둔다
const toPartialDetail = (store: StoreListItem): StoreDetail => ({
  storeId: store.storeId,
  name: store.name,
  businessCategory: store.businessCategory,
  roadAddress: '',
  phone: '',
  latitude: store.latitude,
  longitude: store.longitude,
  businessHours: [],
  imageUrl: store.thumbnailUrl,
  menus: [],
  activeCampaign: null,
  isPartial: true,
  campaignSummary: store.activeCampaign,
});

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
  if (!store || !detail) {
    // 상세 API가 없어, 서버 목록에서 본 가게면 목록 정보로 채운다
    const listed = listedStores.get(storeId);
    return listed ? toPartialDetail(listed) : null;
  }

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

  // 경로 API가 없어, 가게 목록에서 받은 직선거리로 대신한다
  const distance =
    listedStores.get(storeId)?.distanceMeters ??
    mockStores.find((store) => store.storeId === storeId)?.distanceMeters;
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
