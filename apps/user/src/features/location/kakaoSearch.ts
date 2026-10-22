// 카카오 지도 SDK의 장소·주소 검색. 위치 설정에서 회사나 주소로 위치를 찾을 때 쓴다
import {
  type KakaoAddress,
  type KakaoPlace,
  type KakaoServices,
  type KakaoStatus,
  loadKakaoMaps,
} from '@user/ui/KakaoMap/kakaoSdk';

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
