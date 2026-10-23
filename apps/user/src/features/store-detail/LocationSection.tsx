import { MapPin } from 'lucide-react';

import type { StoreDetail } from '@user/api/store';
import LocationPreviewMap from '@user/ui/KakaoMap/LocationPreviewMap';

import { getKakaoMapUrl } from './kakaoMap';

interface LocationSectionProps {
  store: StoreDetail;
  onCopyAddress: () => void;
}

// 가게 위치. 카카오 지도에 가게 핀을 보여주고, 누르면 카카오맵으로 연다
// 지도를 불러오지 못하면 지도 컴포넌트가 사라지고 뒤에 깔아 둔 가짜 지도 판이 보인다
const LocationSection = ({ onCopyAddress, store }: LocationSectionProps) => {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-h3-mobile font-bold text-text-primary">위치</h2>
      {/* 주소가 비어 오면 주소 줄 없이 지도만 보여준다 */}
      {store.roadAddress && (
        <div className="flex items-start justify-between gap-3">
          <p className="text-body-sm-mobile text-text-primary">
            {store.roadAddress}
          </p>
          <button
            className="-my-2 shrink-0 px-1 py-2 text-caption-mobile font-medium text-text-secondary underline underline-offset-2"
            onClick={onCopyAddress}
            type="button"
          >
            주소 복사
          </button>
        </div>
      )}
      <a
        aria-label="카카오맵에서 위치 보기"
        className="relative block h-40 overflow-hidden rounded-2xl border border-border-subtle bg-[#e9e2da]"
        href={getKakaoMapUrl(store)}
        rel="noreferrer"
        target="_blank"
      >
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-[38%] h-4 bg-bg-surface"
        />
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-[62%] w-4 bg-bg-surface"
        />
        <MapPin
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 size-9 -translate-x-1/2 -translate-y-full fill-action-primary text-bg-surface"
        />
        {/* 진짜 지도를 가짜 판 위에 덮는다. 지도가 누르는 동작을 가져가지 않게 해서 눌러도 카카오맵이 열린다 */}
        <div aria-hidden="true" className="pointer-events-none relative">
          <LocationPreviewMap
            latitude={store.latitude}
            longitude={store.longitude}
          />
        </div>
        <span className="absolute right-2 bottom-2 z-10 rounded-sm bg-bg-surface/90 px-2 py-1 text-caption-mobile font-medium text-text-primary">
          카카오맵에서 보기
        </span>
      </a>
    </section>
  );
};

export default LocationSection;
