// 카카오 지도 JavaScript SDK. 탐색 탭 지도, 주소 검색, 좌표와 주소 변환에 쓴다
// 키는 브라우저에 그대로 노출되는 JavaScript 키라, 카카오 디벨로퍼스에 등록한 도메인에서만 동작한다

type KakaoStatus = 'OK' | 'ZERO_RESULT' | 'ERROR';

interface KakaoPlace {
  place_name: string;
  address_name: string;
  road_address_name: string;
  // 경도와 위도. 문자열로 온다
  x: string;
  y: string;
}

interface KakaoAddress {
  address_name: string;
  road_address: { address_name: string } | null;
  x: string;
  y: string;
}

interface KakaoCoordAddress {
  address: { address_name: string } | null;
  road_address: { address_name: string } | null;
}

interface KakaoServices {
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

const loadKakaoServices = () => loadKakaoMaps().then((maps) => maps.services);

// 검색 결과 하나. 장소 검색이면 이름이 있고, 주소 검색이면 null이다
export interface AddressResult {
  placeName: string | null;
  // 도로명 주소가 없는 곳은 지번 주소
  address: string;
  latitude: number;
  longitude: number;
}

// 검색 결과 상태를 결과 목록으로 바꾼다. 결과가 없으면 빈 목록이다
const settle = <T>(
  status: KakaoStatus,
  items: T[],
  resolve: (items: T[]) => void,
  reject: (error: Error) => void,
) => {
  if (status === 'ERROR') reject(new Error('카카오 검색에 실패했습니다'));
  else resolve(status === 'OK' ? items : []);
};

const searchPlaces = (services: KakaoServices, keyword: string) =>
  new Promise<KakaoPlace[]>((resolve, reject) => {
    new services.Places().keywordSearch(keyword, (result, status) =>
      settle(status, result, resolve, reject),
    );
  });

const searchAddresses = (services: KakaoServices, keyword: string) =>
  new Promise<KakaoAddress[]>((resolve, reject) => {
    new services.Geocoder().addressSearch(keyword, (result, status) =>
      settle(status, result, resolve, reject),
    );
  });

// 회사 이름이나 역 이름 같은 장소로 먼저 찾고, 없으면 주소로 찾는다
export const searchAddress = async (
  keyword: string,
): Promise<AddressResult[]> => {
  const services = await loadKakaoServices();

  const places = await searchPlaces(services, keyword);
  if (places.length > 0) {
    return places.map((place) => ({
      placeName: place.place_name,
      address: place.road_address_name || place.address_name,
      latitude: Number(place.y),
      longitude: Number(place.x),
    }));
  }

  const addresses = await searchAddresses(services, keyword);
  return addresses.map((item) => ({
    placeName: null,
    address: item.road_address?.address_name ?? item.address_name,
    latitude: Number(item.y),
    longitude: Number(item.x),
  }));
};

// 좌표의 주소. 도로명 주소가 없으면 지번 주소, 둘 다 없으면 null
export const findAddress = async (latitude: number, longitude: number) => {
  const services = await loadKakaoServices();

  return new Promise<string | null>((resolve, reject) => {
    new services.Geocoder().coord2Address(
      longitude,
      latitude,
      (result, status) => {
        if (status === 'ERROR') {
          reject(new Error('주소를 찾지 못했습니다'));
          return;
        }
        const [first] = result;
        resolve(
          first?.road_address?.address_name ??
            first?.address?.address_name ??
            null,
        );
      },
    );
  });
};
