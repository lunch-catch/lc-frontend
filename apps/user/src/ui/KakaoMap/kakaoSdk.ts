// 카카오 지도 JavaScript SDK를 불러온다. 지도(useKakaoMap)와 주소 검색(features/location/kakaoSearch)이 같이 쓴다
// 서버 요청이 아니라 api가 아닌 여기에 둔다. ui는 api의 함수를 가져올 수 없어서 지도 컴포넌트 옆에 둔다
// 키는 브라우저에 그대로 노출되는 JavaScript 키라, 카카오 디벨로퍼스에 등록한 도메인에서만 동작한다

export type KakaoStatus = 'OK' | 'ZERO_RESULT' | 'ERROR';

export interface KakaoPlace {
  place_name: string;
  address_name: string;
  road_address_name: string;
  // 경도와 위도. 문자열로 온다
  x: string;
  y: string;
}

export interface KakaoAddress {
  address_name: string;
  road_address: { address_name: string } | null;
  x: string;
  y: string;
}

export interface KakaoCoordAddress {
  address: { address_name: string } | null;
  road_address: { address_name: string } | null;
}

export interface KakaoServices {
  Places: new () => {
    keywordSearch: (
      keyword: string,
      callback: (result: KakaoPlace[], status: KakaoStatus) => void,
    ) => void;
  };
  Geocoder: new () => {
    addressSearch: (
      address: string,
      callback: (result: KakaoAddress[], status: KakaoStatus) => void,
    ) => void;
    coord2Address: (
      longitude: number,
      latitude: number,
      callback: (result: KakaoCoordAddress[], status: KakaoStatus) => void,
    ) => void;
  };
}

export interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

interface KakaoLatLngBounds {
  extend: (latLng: KakaoLatLng) => void;
}

export interface KakaoMap {
  setCenter: (latLng: KakaoLatLng) => void;
  setLevel: (level: number) => void;
  // 확대 수준. 숫자가 작을수록 가까이 본다
  getLevel: () => number;
  // 지도를 화면 기준 dx, dy(px)만큼 옮겨 본다. 양수면 지도를 오른쪽, 아래로 본다 (내용은 반대로 움직인다)
  panBy: (dx: number, dy: number) => void;
  // 영역이 지도 안에 모두 들어오도록 옮기고 확대한다. 여백은 위, 오른쪽, 아래, 왼쪽 순서(px)
  setBounds: (
    bounds: KakaoLatLngBounds,
    paddingTop?: number,
    paddingRight?: number,
    paddingBottom?: number,
    paddingLeft?: number,
  ) => void;
}

export interface KakaoCustomOverlay {
  setMap: (map: KakaoMap | null) => void;
  setZIndex: (zIndex: number) => void;
}

export interface KakaoMaps {
  load: (callback: () => void) => void;
  services: KakaoServices;
  LatLng: new (latitude: number, longitude: number) => KakaoLatLng;
  LatLngBounds: new () => KakaoLatLngBounds;
  Map: new (
    container: HTMLElement,
    options: {
      center: KakaoLatLng;
      level: number;
      // 끌어서 옮기기, 마우스 휠과 두 번 눌러 확대. 미리보기처럼 움직이지 않는 지도에서 끈다
      draggable?: boolean;
      scrollwheel?: boolean;
      disableDoubleClickZoom?: boolean;
    },
  ) => KakaoMap;
  // 지도 위에 직접 만든 요소를 올린다. clickable이면 요소를 눌러도 지도 클릭으로 넘어가지 않는다
  CustomOverlay: new (options: {
    position: KakaoLatLng;
    content: HTMLElement;
    clickable?: boolean;
    zIndex?: number;
    // 요소의 어느 지점을 좌표에 맞출지 (0~1). 기본은 가운데(0.5), 핀 끝을 맞추려면 yAnchor 1
    xAnchor?: number;
    yAnchor?: number;
  }) => KakaoCustomOverlay;
  event: {
    addListener: (target: KakaoMap, type: string, handler: () => void) => void;
    removeListener: (
      target: KakaoMap,
      type: string,
      handler: () => void,
    ) => void;
  };
}

declare global {
  interface Window {
    kakao?: {
      // 스크립트가 비정상으로 내려오면 kakao만 있고 maps가 없을 수 있다
      maps?: KakaoMaps;
    };
  }
}

const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY;

let sdkPromise: Promise<KakaoMaps> | null = null;

// SDK를 처음 쓸 때 한 번만 불러온다. 실패하면 다음에 다시 시도할 수 있게 비운다
export const loadKakaoMaps = () => {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<KakaoMaps>((resolve, reject) => {
    if (!KAKAO_JS_KEY) {
      reject(new Error('VITE_KAKAO_JS_KEY가 없습니다'));
      return;
    }

    const script = document.createElement('script');
    // autoload=false로 받아서 load가 끝난 뒤에 services를 쓴다
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&libraries=services&autoload=false`;
    script.async = true;
    script.onload = () => {
      // maps가 없으면 load를 부르다 오류가 나고 promise가 끝나지 않아서, 먼저 실패로 돌려준다
      const maps = window.kakao?.maps;
      if (!maps) {
        reject(new Error('카카오 지도 SDK를 불러오지 못했습니다'));
        return;
      }
      maps.load(() => resolve(maps));
    };
    script.onerror = () =>
      reject(new Error('카카오 지도 SDK를 불러오지 못했습니다'));
    document.head.append(script);
  }).catch((error: unknown) => {
    sdkPromise = null;
    throw error;
  });

  return sdkPromise;
};
