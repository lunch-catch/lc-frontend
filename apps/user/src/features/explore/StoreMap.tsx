import { useState } from 'react';

import type { StoreListItem } from '@user/api/store';

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

// 위도 1도와 경도 1도의 거리(m). 서울 위도(약 37.5도) 기준
const METERS_PER_LATITUDE = 111_000;
const METERS_PER_LONGITUDE = 88_000;
// 핀이 가장자리에 붙지 않도록 지도 판 안쪽에 남기는 비율
const MAP_EDGE_PADDING = 0.12;

// 지도 판 위에 그리는 길. Figma 지도 화면의 가짜 지도와 같은 모양
const roadLines = [
  { orientation: 'horizontal', position: '30%' },
  { orientation: 'horizontal', position: '64%' },
  { orientation: 'vertical', position: '36%' },
  { orientation: 'vertical', position: '74%' },
] as const;

// 핀에 짧게 보여줄 할인 (예: 20%, 3,000원)
const formatPinLabel = (store: StoreListItem) =>
  store.activeCampaign
    ? formatDiscount(store.activeCampaign).replace(' 할인', '')
    : '';

// 내 위치를 가운데에 두고, 가장 먼 가게까지 판 안에 들어오도록 좌표를 판 위 위치(%)로 바꾼다
const toMapPositions = (center: MapCenter, stores: StoreListItem[]) => {
  const offsets = stores.map((store) => ({
    storeId: store.storeId,
    x: (store.longitude - center.longitude) * METERS_PER_LONGITUDE,
    y: (center.latitude - store.latitude) * METERS_PER_LATITUDE,
  }));
  const farthest = Math.max(
    1,
    ...offsets.map(({ x, y }) => Math.max(Math.abs(x), Math.abs(y))),
  );
  const scale = (0.5 - MAP_EDGE_PADDING) / farthest;

  return new Map(
    offsets.map(({ storeId, x, y }) => [
      storeId,
      {
        left: `${(0.5 + x * scale) * 100}%`,
        top: `${(0.5 + y * scale) * 100}%`,
      },
    ]),
  );
};

// 탐색 탭의 지도 보기. 쿠폰 진행 중인 가게를 핀으로 보여주고, 핀을 누르면 아래에 가게 카드를 띄운다
// 카카오 지도 키를 받기 전까지 쓰는 가짜 지도 판이다. 키를 받으면 판과 위치 계산(toMapPositions)만 카카오 지도로 바꾸고,
// 핀과 선택한 가게 카드는 카카오 지도의 커스텀 오버레이로 그대로 옮긴다
const StoreMap = ({ center, stores }: StoreMapProps) => {
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  // 지도에는 할인을 보여줄 수 있는 쿠폰 진행 중인 가게만 핀으로 둔다
  const campaignStores = stores.filter((store) => store.hasActiveCampaign);
  const positions = toMapPositions(center, campaignStores);
  const selectedStore = campaignStores.find(
    (store) => store.storeId === selectedStoreId,
  );

  return (
    <div className="relative -mx-page min-h-80 flex-1 overflow-hidden bg-[#e9e2da]">
      {/* 빈 곳을 누르면 고른 가게를 닫는다 */}
      <button
        aria-label="가게 선택 닫기"
        className="absolute inset-0 cursor-default"
        onClick={() => setSelectedStoreId(null)}
        tabIndex={-1}
        type="button"
      />
      {roadLines.map((road) => (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute bg-bg-surface ${
            road.orientation === 'horizontal'
              ? 'inset-x-0 h-4 -translate-y-1/2'
              : 'inset-y-0 w-4 -translate-x-1/2'
          }`}
          key={`${road.orientation}-${road.position}`}
          style={
            road.orientation === 'horizontal'
              ? { top: road.position }
              : { left: road.position }
          }
        />
      ))}
      {/* 내 위치 */}
      <span
        aria-label="내 위치"
        className="pointer-events-none absolute top-1/2 left-1/2 flex size-7 -translate-1/2 items-center justify-center rounded-full bg-[#2b7bb9]/25"
        role="img"
      >
        <span className="size-3 rounded-full border-2 border-bg-surface bg-[#2b7bb9]" />
      </span>
      {campaignStores.map((store) => {
        const isSelected = store.storeId === selectedStoreId;
        return (
          <button
            aria-label={`${store.name} ${formatPinLabel(store)} 할인`}
            aria-pressed={isSelected}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-2.5 py-1 text-caption-mobile font-bold whitespace-nowrap text-text-inverse shadow-md transition-transform ${
              isSelected
                ? 'z-10 scale-110 bg-action-primary'
                : 'bg-text-primary'
            }`}
            key={store.storeId}
            onClick={() => setSelectedStoreId(store.storeId)}
            style={positions.get(store.storeId)}
            type="button"
          >
            {formatPinLabel(store)}
          </button>
        );
      })}
      {campaignStores.length === 0 && (
        <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-body-sm-mobile text-text-secondary">
          주변에 쿠폰 진행 중인 가게가 없어요
        </p>
      )}
      {selectedStore && (
        // 아래쪽에 떠 있는 "목록으로 보기" 버튼과 겹치지 않도록 그 위에 띄운다
        <ul className="absolute inset-x-page bottom-14">
          <StoreCard store={selectedStore} />
        </ul>
      )}
      <p className="pointer-events-none absolute top-2 right-3 rounded-sm bg-bg-surface/80 px-1.5 py-0.5 text-caption-mobile text-text-tertiary">
        지도 준비 중 · 위치는 대략적이에요
      </p>
    </div>
  );
};

export default StoreMap;
