import { MapPin } from 'lucide-react';

import type { StoreDetail } from '@user/api/store';

import { getKakaoMapUrl } from './kakaoMap';

interface LocationSectionProps {
  store: StoreDetail;
  onCopyAddress: () => void;
}

// 가게 위치. 카카오 지도 키를 받기 전까지 가짜 지도 판에 핀만 두고, 누르면 카카오맵으로 연다
const LocationSection = ({ onCopyAddress, store }: LocationSectionProps) => {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-h3-mobile font-bold text-text-primary">위치</h2>
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
      <a
        aria-label="카카오맵에서 위치 보기"
        className="relative block h-40 overflow-hidden rounded-xl bg-[#e9e2da]"
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
        <span className="absolute right-2 bottom-2 rounded-sm bg-bg-surface/90 px-2 py-1 text-caption-mobile font-medium text-text-primary">
          카카오맵에서 보기
        </span>
      </a>
    </section>
  );
};

export default LocationSection;
