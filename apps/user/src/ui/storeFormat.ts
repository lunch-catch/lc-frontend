import type { StoreActiveCampaign } from '@user/api/store';

// 점심에 걸어가는 속도 (분당 약 70m, 시속 약 4km)
const WALK_METERS_PER_MINUTE = 70;

// 걷는 시간(분). 1분보다 짧아도 1분으로 보여준다
const getWalkMinutes = (meters: number) =>
  Math.max(1, Math.round(meters / WALK_METERS_PER_MINUTE));

// 걸어서 몇 분인지 (예: 도보 5분). 점심 장소는 거리보다 걸리는 시간으로 고르므로 m 대신 분으로 보여준다
// 직선거리로 계산해 실제 길보다 조금 짧게 나올 수 있다
export const formatWalkTime = (meters: number) =>
  `도보 ${getWalkMinutes(meters)}분`;

// 가게 상세의 거리 한 줄 (예: 도보 약 6분 · 420m)
// 걷는 길 API가 없어 직선거리로 계산한다. 실제 길보다 짧게 나와 '약'을 붙인다
// 목록은 한눈에 비교하는 곳이라 짧게 두고, 자세히 보는 상세에만 붙인다
export const formatWalkDistance = (meters: number) =>
  `도보 약 ${getWalkMinutes(meters)}분 · ${Math.round(meters).toLocaleString('ko-KR')}m`;

const EARTH_RADIUS_METERS = 6_371_000;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

interface Coordinates {
  latitude: number;
  longitude: number;
}

// 두 좌표 사이의 직선거리(m). 지구를 구로 보고 계산한다(하버사인 공식)
// 점심 거리(수 km 안)에서는 서버 목록의 직선거리와 몇 m 안으로 같다
export const getDistanceMeters = (from: Coordinates, to: Coordinates) => {
  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(deltaLongitude / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
};

// 할인 요약 (예: 20% 할인, 3,000원 할인)
export const formatDiscount = ({
  discountType,
  discountValue,
}: StoreActiveCampaign) =>
  discountType === 'PERCENT'
    ? `${discountValue}% 할인`
    : `${discountValue.toLocaleString('ko-KR')}원 할인`;

// 할인 대상 (예: 치즈버거, 전 메뉴). 찜 카드와 같이 할인 옆에 작게 붙인다
// 메뉴 할인인데 메뉴 이름이 없으면(mock) 아무것도 붙이지 않는다
export const formatDiscountTarget = ({
  discountTargetType,
  targetMenu,
}: StoreActiveCampaign) =>
  discountTargetType === 'ALL' ? '전 메뉴' : (targetMenu?.name ?? null);
