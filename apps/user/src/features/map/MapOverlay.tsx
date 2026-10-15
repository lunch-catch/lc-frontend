import { type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { KakaoCustomOverlay } from '@user/api/kakao';

import type { KakaoMapHandle } from './useKakaoMap';

interface MapOverlayProps {
  kakao: KakaoMapHandle;
  latitude: number;
  longitude: number;
  // 겹치면 큰 값이 위에 온다
  zIndex?: number;
  // false면 눌러도 지도 클릭으로 넘긴다 (내 위치 점처럼 누를 일이 없는 표시)
  clickable?: boolean;
  // 요소의 어느 높이를 좌표에 맞출지. 핀처럼 아래 끝이 위치를 가리키면 1
  yAnchor?: number;
  children: ReactNode;
}

// 카카오 지도의 커스텀 오버레이 자리에 React 요소를 그린다
// 오버레이에 넘긴 빈 요소 안으로 포털을 열어서, 핀 버튼의 클릭과 스타일을 React 그대로 쓴다
const MapOverlay = ({
  children,
  clickable = true,
  kakao,
  latitude,
  longitude,
  yAnchor = 0.5,
  zIndex = 0,
}: MapOverlayProps) => {
  const [element] = useState(() => document.createElement('div'));
  const overlayRef = useRef<KakaoCustomOverlay | null>(null);

  useEffect(() => {
    const overlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(latitude, longitude),
      content: element,
      clickable,
      yAnchor,
    });
    overlay.setMap(kakao.map);
    overlayRef.current = overlay;
    return () => {
      overlay.setMap(null);
      overlayRef.current = null;
    };
  }, [clickable, element, kakao, latitude, longitude, yAnchor]);

  // 핀을 고르면 오버레이를 새로 만들지 않고 겹치는 순서만 바꾼다
  useEffect(() => {
    overlayRef.current?.setZIndex(zIndex);
  }, [kakao, latitude, longitude, yAnchor, zIndex]);

  return createPortal(children, element);
};

export default MapOverlay;
