import {
  type MouseEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { LocateFixed, Minus, Plus } from 'lucide-react';

import type { StoreListItem } from '@user/api/store';
import { useDelayedLoading } from '@user/hooks/useDelayedLoading';
import ActionButton from '@user/ui/ActionButton/ActionButton';
import MapOverlay from '@user/ui/KakaoMap/MapOverlay';
import { useKakaoMap } from '@user/ui/KakaoMap/useKakaoMap';
import { formatDiscount } from '@user/ui/storeFormat';

import StoreCard from './StoreCard';

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

// 핀을 누른 자리에서 이만큼(px) 넘게 움직여 놓았으면 누른 것이 아니라 지도를 끈 것으로 본다
const PIN_DRAG_PX = 5;

// 영역을 맞춘 뒤 더 확대하는 단계 수. 가게가 한 구역에 몰려 있으면 영역에 맞춘 지도에서도 핀이 겹쳐 가격이 안 읽히는데,
// 한 단계 가까이 보면 핀 사이가 벌어져 읽힌다. 가장자리 가게가 화면 밖으로 나가면 축소 버튼이나 처음 모습으로 돌아가기로 본다
const FIT_EXTRA_ZOOM_STEPS = 1;

// 고른 핀과 아래 가게 카드 사이에 남기는 간격(px)
const PIN_CARD_GAP_PX = 12;

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
  // 지도가 빨리 뜨면 깜빡이는 회색 틀이 잠깐 나왔다 사라져 번쩍이므로, 조금 기다린 뒤에만 깜빡인다
  const showMapSkeleton = useDelayedLoading(!kakao && !hasLoadError);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  // 핀을 누른 자리. 핀 위에서 시작한 끌기가 놓은 뒤의 클릭으로 핀을 고르지 않게 한다
  const pinPressAt = useRef<{ x: number; y: number } | null>(null);
  // 방금 고른 핀과 아래 가게 카드. 카드가 핀을 덮으면 지도를 옮겨 핀이 카드 위에 보이게 한다
  const selectedPinElement = useRef<HTMLElement | null>(null);
  const cardElement = useRef<HTMLUListElement>(null);

  const rememberPinPress = (event: PointerEvent) => {
    pinPressAt.current = { x: event.clientX, y: event.clientY };
  };

  const isPinDrag = (event: MouseEvent) => {
    const start = pinPressAt.current;
    return (
      start !== null &&
      Math.hypot(event.clientX - start.x, event.clientY - start.y) > PIN_DRAG_PX
    );
  };
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
  // 처음 그릴 때와 "처음 모습으로" 버튼이 같은 모양으로 맞추도록 한 곳에 둔다
  const fitMap = useCallback(() => {
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
    map.setLevel(Math.max(1, map.getLevel() - FIT_EXTRA_ZOOM_STEPS));
  }, [kakao, center.latitude, center.longitude, campaignStores]);

  useEffect(() => {
    fitMap();
  }, [fitMap]);

  // 확대·축소. 마우스 휠이 없는 화면에서도 확대할 수 있고, 휠로 확대하는 걸 모르는 사람에게 단서가 된다
  const zoomBy = (step: number) => {
    if (!kakao) return;
    const { map } = kakao;
    map.setLevel(Math.min(14, Math.max(1, map.getLevel() + step)));
  };

  // 핀을 고르면 아래에 가게 카드가 뜨는데, 아래쪽 핀은 그 카드에 덮여 보이지 않는다
  // 카드가 그려진 뒤 핀이 카드에 가리면, 지도를 위로 옮겨 핀이 카드 바로 위에 보이게 한다
  useEffect(() => {
    if (!kakao || selectedStoreId === null) return;

    const frame = requestAnimationFrame(() => {
      const pin = selectedPinElement.current;
      const card = cardElement.current;
      if (!pin || !card) return;

      const overlap =
        pin.getBoundingClientRect().bottom +
        PIN_CARD_GAP_PX -
        card.getBoundingClientRect().top;
      if (overlap > 0) kakao.map.panBy(0, overlap);
    });
    return () => cancelAnimationFrame(frame);
  }, [kakao, selectedStoreId]);

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
                // 핀을 누를 수 있는 오버레이로 두면 카카오 지도가 핀 위에서 시작한 끌기를 지도로 넘기지 않는다
                // 핀이 많아 핀 위에서 끌기를 시작하기 쉬우므로 눌러도 지도가 움직이게 두고, 핀을 고르는 건 아래 버튼의 클릭으로 한다
                clickable={false}
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
                  onClick={(event) => {
                    if (isPinDrag(event)) return;
                    selectedPinElement.current = event.currentTarget;
                    setSelectedStoreId(store.storeId);
                  }}
                  onPointerDown={rememberPinPress}
                  type="button"
                >
                  {formatPinLabel(store)}
                </button>
              </MapOverlay>
            );
          })}
        </>
      )}
      {kakao && (
        // 지도 오른쪽 위의 조작 버튼. 카카오 로고와 축척, 아래에 뜨는 가게 카드를 가리지 않게 위에 둔다
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
          <div className="flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-bg-surface shadow-md">
            <button
              aria-label="지도 확대"
              className="flex size-10 items-center justify-center text-text-primary active:bg-surface-subtle"
              onClick={() => zoomBy(-1)}
              type="button"
            >
              <Plus aria-hidden="true" className="size-5" />
            </button>
            <button
              aria-label="지도 축소"
              className="flex size-10 items-center justify-center border-t border-border-subtle text-text-primary active:bg-surface-subtle"
              onClick={() => zoomBy(1)}
              type="button"
            >
              <Minus aria-hidden="true" className="size-5" />
            </button>
          </div>
          <button
            aria-label="처음 모습으로 돌아가기"
            className="flex size-10 items-center justify-center rounded-xl border border-border-subtle bg-bg-surface text-text-primary shadow-md active:bg-surface-subtle"
            onClick={() => {
              setSelectedStoreId(null);
              fitMap();
            }}
            type="button"
          >
            <LocateFixed aria-hidden="true" className="size-5" />
          </button>
        </div>
      )}
      {!kakao && !hasLoadError && (
        <>
          {showMapSkeleton && (
            <div
              aria-hidden="true"
              className="absolute inset-0 animate-pulse bg-surface-subtle motion-reduce:animate-none"
            />
          )}
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
        <p className="pointer-events-none absolute inset-x-page top-3 right-16 z-10 rounded-lg bg-bg-surface/90 px-3 py-2 text-center text-body-sm-mobile text-text-secondary">
          주변에 쿠폰 진행 중인 가게가 없어요
        </p>
      )}
      {selectedStore && (
        // 카카오 로고와 축척을 가리지 않도록 그 위에 띄운다
        <ul className="absolute inset-x-page bottom-9 z-10" ref={cardElement}>
          <StoreCard store={selectedStore} />
        </ul>
      )}
    </div>
  );
};

export default StoreMap;
