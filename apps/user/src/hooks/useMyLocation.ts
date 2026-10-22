import { useEffect, useState } from 'react';

import {
  fetchMyLocation,
  hasLocation,
  type MemberLocation,
} from '@user/api/location';

// 탭을 옮길 때마다 헤더 위치가 비었다 채워지지 않도록 마지막으로 받은 위치를 기억한다
let lastLocation: MemberLocation | undefined;
let refreshSequence = 0;
const refreshListeners = new Set<(sequence: number) => void>();

// 위치 조회 실패 화면에서 서버의 저장 위치를 다시 받게 한다
export const refreshMyLocation = () => {
  refreshSequence += 1;
  refreshListeners.forEach((listener) => listener(refreshSequence));
};

// 위치 설정 화면에서 저장하거나 지운 위치를 바로 기억해, 돌아왔을 때 이전 위치가 잠깐 보이지 않게 한다
export const rememberMyLocation = (location: MemberLocation) => {
  lastLocation = location;
};

// 주소를 알 수 없는 동안에는 사용자가 붙인 이름을 먼저 쓴다
export const getLocationLabel = (location: MemberLocation) =>
  location.locationNickname ?? location.roadAddress;

// 내 위치를 불러온다. 기억해 둔 위치가 있으면 먼저 보여주고 새로 받은 값으로 바꾼다
// undefined면 불러오는 중, null이면 실패
export const useMyLocation = () => {
  const [location, setLocation] = useState<MemberLocation | null | undefined>(
    lastLocation,
  );
  const [attempt, setAttempt] = useState(refreshSequence);

  useEffect(() => {
    refreshListeners.add(setAttempt);
    return () => {
      refreshListeners.delete(setAttempt);
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    fetchMyLocation()
      .then((result) => {
        lastLocation = result;
        if (!ignore) setLocation(result);
      })
      .catch(() => {
        // 기억해 둔 위치가 있으면 그대로 둔다
        if (!ignore) setLocation((current) => current ?? null);
      });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [attempt]);

  return location;
};

// 헤더에 보여줄 위치 문구. undefined면 아직 불러오는 중이다
// 위치를 따로 쓰는 화면(피드)은 받은 위치로 이 문구만 만든다
export const getHeaderLocationName = (
  location: MemberLocation | null | undefined,
) => {
  if (location === undefined) return undefined;
  // 불러오지 못했으면 설정을 다시 하라고 하지 않고 이름 없이 보여준다
  if (location === null) return '내 위치';
  if (!hasLocation(location)) return '위치를 설정해 주세요';
  return `${getLocationLabel(location) ?? '내 위치'} 주변`;
};

export const useHeaderLocationName = () =>
  getHeaderLocationName(useMyLocation());
