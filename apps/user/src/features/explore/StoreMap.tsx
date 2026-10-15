import { useEffect, useMemo, useRef, useState } from 'react';

import type { StoreListItem } from '@user/api/store';
import ActionButton from '@user/components/ActionButton/ActionButton';
import MapOverlay from '@user/features/map/MapOverlay';
import { useKakaoMap } from '@user/features/map/useKakaoMap';

import StoreCard from './StoreCard';
import { formatDiscount } from './storeFormat';

export interface MapCenter {
  latitude: number;
  longitude: number;
}

interface StoreMapProps {
  center: MapCenter;
  stores: StoreListItem[];
}

// 처음 보여줄 확대 수준. 쿠폰 가게가 없을 때 내 위치 주변 몇 블록이 보이는 정도
const DEFAULT_MAP_LEVEL = 4;
// 핀이 가장자리에 붙지 않도록 남기는 여백(px). 아래는 카카오 로고와 축척 자리까지 비운다
const BOUNDS_PADDING = { top: 48, side: 48, bottom: 64 };

// 핀에 짧게 보여줄 할인 (예: 20%, 3,000원)
const formatPinLabel = (store: StoreListItem) =>
  store.activeCampaign
    ? formatDiscount(store.activeCampaign).replace(' 할인', '')
    : '';

// 탐색 탭의 지도 보기. 쿠폰 진행 중인 가게를 카카오 지도 위 핀으로 보여주고, 핀을 누르면 아래에 가게 카드를 띄운다
const StoreMap = ({ center, stores }: StoreMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // 처음 가운데에 둘 위치. 그 뒤로 바뀌면 아래 영역 맞추기가 옮긴다
  const { hasLoadError, kakao, retry } = useKakaoMap(containerRef, {
    ...center,
    level: DEFAULT_MAP_LEVEL,
  });
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  // 지도에는 할인을 보여줄 수 있는 쿠폰 진행 중인 가게만 핀으로 둔다
  // 가게 목록을 새로 받을 때만 바뀌어서, 핀을 고를 때는 지도 영역을 다시 맞추지 않는다
  const campaignStores = useMemo(
    () => stores.filter((store) => store.hasActiveCampaign),
    [stores],
  );
  const selectedStore = campaignStores.find(
    (store) => store.storeId === selectedStoreId,
  );

  // 내 위치와 쿠폰 가게가 모두 보이도록 영역을 맞춘다. 가게가 없으면 내 위치를 가운데에 둔다
  useEffect(() => {
    if (!kakao) return;

    const { map, maps } = kakao;
    const centerLatLng = new maps.LatLng(center.latitude, center.longitude);
    if (campaignStores.length === 0) {
      map.setCenter(centerLatLng);
      map.setLevel(DEFAULT_MAP_LEVEL);
      return;
    }

    const bounds = new maps.LatLngBounds();
    bounds.extend(centerLatLng);
    campaignStores.forEach((store) =>
      bounds.extend(new maps.LatLng(store.latitude, store.longitude)),
    );
    map.setBounds(
      bounds,
      BOUNDS_PADDING.top,
      BOUNDS_PADDING.side,
      BOUNDS_PADDING.bottom,
      BOUNDS_PADDING.side,
    );
  }, [kakao, center.latitude, center.longitude, campaignStores]);

  // 지도의 빈 곳을 누르면 고른 가게를 닫는다
  useEffect(() => {
    if (!kakao) return;

    const { map, maps } = kakao;
    const clearSelection = () => setSelectedStoreId(null);
    maps.event.addListener(map, 'click', clearSelection);
    return () => maps.event.removeListener(map, 'click', clearSelection);
  }, [kakao]);

  return (
    <div className="relative -mx-page min-h-80 flex-1 overflow-hidden bg-surface-subtle">
      {/* 카카오 지도가 이 안에 그려진다 */}
      <div
        aria-label="주변 쿠폰 가게 지도"
        className="absolute inset-0"
        ref={containerRef}
        role="region"
      />
      {kakao && (
        <>
          <MapOverlay
            clickable={false}
            kakao={kakao}
            latitude={center.latitude}
            longitude={center.longitude}
          >
            <span
              aria-label="내 위치"
              className="flex size-7 items-center justify-center rounded-full bg-[#2b7bb9]/25"
              role="img"
            >
              <span className="size-3 rounded-full border-2 border-white bg-[#2b7bb9]" />
            </span>
          </MapOverlay>
          {campaignStores.map((store) => {
            const isSelected = store.storeId === selectedStoreId;
            return (
              <MapOverlay
                kakao={kakao}
                key={store.storeId}
                latitude={store.latitude}
                longitude={store.longitude}
                // 고른 핀은 다른 핀에 가리지 않게 맨 위로 올린다
                zIndex={isSelected ? 2 : 1}
              >
                <button
                  aria-label={`${store.name} ${formatPinLabel(store)} 할인`}
                  aria-pressed={isSelected}
                  // 지도는 다크 모드에서도 밝아서, 고르지 않은 핀은 모드와 상관없이 검정 바탕으로 둔다
                  className={`rounded-full px-2.5 py-1 text-caption-mobile font-bold whitespace-nowrap shadow-md transition-transform ${
                    isSelected
                      ? 'scale-110 bg-action-primary text-text-inverse'
                      : 'bg-(--primitive-neutral-900) text-(--primitive-neutral-0)'
                  }`}
                  onClick={() => setSelectedStoreId(store.storeId)}
                  type="button"
                >
                  {formatPinLabel(store)}
                </button>
              </MapOverlay>
            );
          })}
        </>
      )}
      {!kakao && !hasLoadError && (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-0 animate-pulse bg-surface-subtle motion-reduce:animate-none"
          />
          <p className="sr-only" role="status">
            지도를 불러오는 중이에요
          </p>
        </>
      )}
      {hasLoadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-page text-center">
          <p className="text-body-sm-mobile text-text-secondary">
            지도를 불러오지 못했어요
          </p>
          <ActionButton onClick={retry} variant="outline">
            다시 시도
          </ActionButton>
        </div>
      )}
      {kakao && campaignStores.length === 0 && (
        <p className="pointer-events-none absolute inset-x-page top-3 z-10 rounded-lg bg-bg-surface/90 px-3 py-2 text-center text-body-sm-mobile text-text-secondary">
          주변에 쿠폰 진행 중인 가게가 없어요
        </p>
      )}
      {selectedStore && (
        // 카카오 로고와 축척을 가리지 않도록 그 위에 띄운다
        <ul className="absolute inset-x-page bottom-9 z-10">
          <StoreCard store={selectedStore} />
        </ul>
      )}
    </div>
  );
};

export default StoreMap;
