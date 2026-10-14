import { request } from './client';

const LOCATION_PATH = '/v1/member-profiles/location';

// 내 대표 위치 (GET /v1/member-profiles/location). 회원마다 하나만 저장한다
// 저장한 적이 없으면 네 값이 모두 null로 온다
export interface MemberLocation {
  // 사용자가 붙인 이름 (예: 회사)
  locationNickname: string | null;
  roadAddress: string | null;
  latitude: number | null;
  longitude: number | null;
}

// 저장할 위치. 위도와 경도는 함께 보내야 한다
export interface MemberLocationInput {
  locationNickname?: string;
  roadAddress?: string;
  latitude: number;
  longitude: number;
}

// 서버는 좌표를 소수 7자리까지 저장한다
const roundCoordinate = (value: number) => Math.round(value * 1e7) / 1e7;

export const fetchMyLocation = () => request<MemberLocation>(LOCATION_PATH);

// 이미 저장한 위치가 있으면 새 위치로 바꾼다 (PUT)
export const saveMyLocation = (input: MemberLocationInput) =>
  request<MemberLocation>(LOCATION_PATH, {
    method: 'PUT',
    body: {
      ...input,
      latitude: roundCoordinate(input.latitude),
      longitude: roundCoordinate(input.longitude),
    },
  });

// 저장한 위치가 없어도 성공(204)으로 온다
export const deleteMyLocation = () =>
  request<void>(LOCATION_PATH, { method: 'DELETE' });

// 저장한 위치가 있는지. 좌표가 있어야 저장된 것으로 본다
export const hasLocation = (location: MemberLocation) =>
  location.latitude !== null && location.longitude !== null;
