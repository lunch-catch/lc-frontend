import type { StoreDetail } from '@user/api/store';

// 카카오맵 링크. 앱이 있으면 앱으로, 없으면 웹으로 열린다 (지도 키가 필요 없다)
type MapPlace = Pick<StoreDetail, 'latitude' | 'longitude' | 'name'>;

const toPath = ({ latitude, longitude, name }: MapPlace) =>
  `${encodeURIComponent(name)},${latitude},${longitude}`;

// 가게 위치를 지도에 띄운다
export const getKakaoMapUrl = (place: MapPlace) =>
  `https://map.kakao.com/link/map/${toPath(place)}`;

// 현재 위치에서 가게까지 길찾기를 연다
export const getKakaoDirectionsUrl = (place: MapPlace) =>
  `https://map.kakao.com/link/to/${toPath(place)}`;
