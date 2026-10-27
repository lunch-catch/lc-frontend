import { useState } from 'react';
import { Utensils } from 'lucide-react';

import type { StoreMenu } from '@user/api/store';
import FadeImage from '@user/ui/FadeImage/FadeImage';

interface MenuRowProps {
  menu: StoreMenu;
  // 오늘 쿠폰의 할인 대상 메뉴면 붙이는 할인 표시 (예: 쿠폰 20%)
  couponLabel: string | null;
}

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;

// 대표 메뉴 한 줄. 왼쪽 사진, 가운데 이름과 설명, 오른쪽 가격
const MenuRow = ({ couponLabel, menu }: MenuRowProps) => {
  // 주소가 있어도 불러오지 못하면 빈 칸 대신 아이콘을 둔다
  const [hasImageError, setHasImageError] = useState(false);
  const showImage = menu.imageUrl && !hasImageError;

  return (
    <li className="flex items-center gap-3 py-3">
      {showImage ? (
        <FadeImage
          alt=""
          className="size-16 shrink-0 rounded-lg"
          height={64}
          loading="lazy"
          onError={() => setHasImageError(true)}
          src={menu.imageUrl ?? undefined}
          width={64}
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-text-tertiary"
        >
          <Utensils className="size-5" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="min-w-0 truncate text-body-mobile font-medium text-text-primary">
            {menu.name}
          </span>
          {/* 할인가는 반올림 규칙이 서버와 달라질 수 있어 계산하지 않고 할인율이나 금액만 보여준다 */}
          {couponLabel && (
            <span className="shrink-0 rounded-sm bg-surface-brand px-1.5 py-0.5 text-caption-mobile font-bold text-text-brand">
              {couponLabel}
            </span>
          )}
        </div>
        {menu.description && (
          <p className="truncate text-caption-mobile text-text-secondary">
            {menu.description}
          </p>
        )}
      </div>
      <span className="shrink-0 text-body-mobile font-bold text-text-primary">
        {formatPrice(menu.price)}
      </span>
    </li>
  );
};

export default MenuRow;
