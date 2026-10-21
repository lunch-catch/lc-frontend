import { ApiError, request } from './client';
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

// 업종 고르기 값. ALL이면 전체 업종이다 (가게 목록 filter와 같은 값)
export type CategoryFilter = 'ALL' | BusinessCategory;

// 업종 고르기 선택지. 전체를 맨 앞에 둔다 (탐색 탭 업종 고르기, 피드 필터)
export const CATEGORY_FILTER_OPTIONS: {
  value: CategoryFilter;
  label: string;
}[] = [
  { value: 'ALL', label: '전체' },
  ...Object.entries(BUSINESS_CATEGORY_LABELS).map(([value, label]) => ({
    value: value as BusinessCategory,
    label,
  })),
];

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

// 가게 목록, 가게 상세, 캠페인 포스터는 서버 구현이 끝나 실제 API를 쓴다
// 걸어가는 경로 API는 만들지 않기로 해서, 도보 시간은 화면에서 직선거리로 계산한다
const USE_STORE_LIST_API = true;
const USE_STORE_DETAIL_API = true;
const USE_POSTER_API = true;

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

  return {
    items: data.items.map(toStoreListItem),
    nextPageToken: data.nextPageToken,
  };
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

// 요일별 영업시간. 휴무일이면 시간이 모두 null. 시각은 HH:MM
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
  // 메뉴 설명. 없으면 null
  description: string | null;
  // 메뉴 사진 주소. 없으면 null
  imageUrl: string | null;
}

// 가게 상세의 활성 캠페인. 쿠폰 사용 가능 시간(HH:MM)이 함께 온다
// 발급 오픈(11:00)이나 받을 수 있는지는 이 값이 아니라 쿠폰 API로 판단한다
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
  // 가게 대표 이미지 주소 (서버 logoImage). 점주가 "손님이 가게를 찾을 때 보여지는 사진"으로 올린다
  imageUrl: string | null;
  // 가게 내부 사진 주소 0~3개. 받은 순서가 보여줄 순서다 (명세)
  interiorImageUrls: string[];
  menus: StoreMenu[];
  // 서울 날짜 기준 오늘의 ACTIVE 캠페인. 없으면 null이다
  // null이어도 가게 조회 실패나 종료된 이벤트로 단정하지 않는다 (명세)
  activeCampaign: StoreDetailCampaign | null;
}

interface StoreImageResponse {
  objectKey: string;
  url: string;
  sortOrder: number | null;
}

interface StoreDetailResponse {
  storeId: number;
  name: string;
  businessCategory: BusinessCategory;
  roadAddress: string;
  phone: string;
  latitude: number;
  longitude: number;
  businessHours: StoreBusinessHour[];
  logoImage: StoreImageResponse | null;
  interiorImages: StoreImageResponse[];
  menus: (Omit<StoreMenu, 'imageUrl'> & {
    sortOrder: number;
    image: StoreImageResponse | null;
  })[];
  activeCampaign:
    (Omit<StoreDetailCampaign, 'campaignId'> & { campaignId: number }) | null;
}

// 서버 시각(HH:MM:SS)을 화면에 쓰는 HH:MM으로 줄인다
const toClockTime = <T extends string | null>(time: T): T =>
  (time === null ? null : time.slice(0, 5)) as T;

const toStoreDetail = (data: StoreDetailResponse): StoreDetail => ({
  storeId: data.storeId,
  name: data.name,
  businessCategory: data.businessCategory,
  roadAddress: data.roadAddress,
  phone: data.phone,
  latitude: data.latitude,
  longitude: data.longitude,
  businessHours: data.businessHours.map((hour) => ({
    ...hour,
    openTime: toClockTime(hour.openTime),
    closeTime: toClockTime(hour.closeTime),
    breakStartTime: toClockTime(hour.breakStartTime),
    breakEndTime: toClockTime(hour.breakEndTime),
    lastOrderTime: toClockTime(hour.lastOrderTime),
  })),
  imageUrl: data.logoImage?.url ?? null,
  interiorImageUrls: data.interiorImages.map((image) => image.url),
  // 메뉴는 받은 순서대로 보여준다 (명세)
  menus: data.menus.map(({ description, image, menuId, name, price }) => ({
    menuId,
    name,
    price,
    description,
    imageUrl: image?.url ?? null,
  })),
  activeCampaign: data.activeCampaign && {
    ...data.activeCampaign,
    campaignId: String(data.activeCampaign.campaignId),
    usableStartTime: toClockTime(data.activeCampaign.usableStartTime),
    usableEndTime: toClockTime(data.activeCampaign.usableEndTime),
  },
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

const fetchMockStoreDetail = async (
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
    interiorImageUrls: [],
    menus: detail.menus.map((menu, index) => ({
      description: null,
      imageUrl: null,
      ...menu,
      menuId: index + 1,
    })),
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

// 없거나 아직 최종 등록되지 않은 가게면 null (서버는 404 STORE-016). 두 경우를 구분하지 않는다
// 그 밖의 오류는 그대로 던진다. 이미지나 메뉴가 없는 정상 응답으로 취급하지 않는다 (명세)
export const fetchStoreDetail = async (
  storeId: number,
): Promise<StoreDetail | null> => {
  if (!USE_STORE_DETAIL_API) return fetchMockStoreDetail(storeId);

  try {
    return toStoreDetail(
      await request<StoreDetailResponse>(`/v1/stores/${storeId}`),
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
};

// 점주가 만든 캠페인 포스터 HTML (GET /v1/campaigns/{campaignId}/poster)
// 관리자 검증을 거쳐 스크립트와 외부 리소스가 없는 것만 내려온다
// 비공개, 없는 캠페인, 포스터 없음은 404 POSTER-022라 null로 돌려준다. 그 밖의 오류는 던진다
export const fetchCampaignPoster = async (
  campaignId: string,
): Promise<string | null> => {
  if (USE_POSTER_API && /^\d+$/.test(campaignId)) {
    try {
      const { html } = await request<{ html: string }>(
        `/v1/campaigns/${campaignId}/poster`,
      );
      return html;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  }

  await wait(MOCK_DELAY_MS);

  return (
    mockFeedCards.find((card) => card.campaignId === campaignId)?.posterHtml ??
    null
  );
};
