import type { ReactNode } from 'react';
import { Store, X } from 'lucide-react';

import type { Coupon } from '@user/api/coupon';
import Card from '@user/ui/Card/Card';
import { TicketDivider } from '@user/ui/Ticket/Ticket';

import { formatDiscount, formatTarget } from './couponFormat';

interface CouponCardProps {
  coupon: Coupon;
  // 아래 줄 왼쪽 정보. 쿠폰 상태에 따라 사용 시간이나 사용한 시각을 보여준다
  info: ReactNode;
  // 아래 줄 오른쪽 알약 (QR 보기, 사용 완료 등). 찜 카드의 쿠폰 받기 알약과 같은 자리다
  action?: ReactNode;
  // 이미 쓴 쿠폰처럼 더 쓸 수 없는 쿠폰은 위쪽 내용을 흐리게 하고 사진을 흑백으로 보여준다
  dimmed?: boolean;
  // 넘기면 오른쪽 위에 삭제(×) 버튼을 둔다. 찜 카드와 같은 자리다
  onRemove?: () => void;
}

// 쿠폰함의 받은 쿠폰 한 장
// 찜 카드와 같은 쿠폰 모양(점선과 반원 홈, 알약)으로 두어 쿠폰함 탭끼리 같은 카드로 보이게 한다
// 가게 이름은 작게, 할인은 크게 두어 어떤 쿠폰인지 먼저 눈에 들어오게 한다
// 할인은 주황 대신 검정으로 둔다. 받은 쿠폰이라 할인을 비교할 일이 없고, 카드마다 주황이 둘이면
// 지금 할 일인 QR 보기 버튼과 곧 끝나는 남은 시간이 묻힌다 (찜 카드는 할인을 비교하는 화면이라 주황)
const CouponCard = ({
  action,
  coupon,
  dimmed = false,
  info,
  onRemove,
}: CouponCardProps) => (
  // 홈이 카드 밖으로 나간 반쪽을 가리도록 카드를 넘치지 않게 자른다
  <Card as="li" className="relative overflow-hidden">
    {/* 흐리게 한 내용(opacity)이 새 쌓임 순서를 만들어 버튼을 덮지 않도록 z-10으로 위에 둔다 */}
    {onRemove && (
      <button
        aria-label={`${coupon.storeName} 쿠폰 삭제`}
        className="absolute top-1 right-1 z-10 flex size-10 items-center justify-center rounded-full text-text-tertiary active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary"
        onClick={onRemove}
        type="button"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    )}
    <div
      className={`flex items-center gap-3 p-3 ${onRemove ? 'pr-10' : ''} ${dimmed ? 'opacity-60' : ''}`}
    >
      {coupon.storeImageUrl ? (
        <img
          alt=""
          className={`size-14 shrink-0 rounded-lg bg-surface-subtle object-cover ${dimmed ? 'grayscale' : ''}`}
          height={56}
          src={coupon.storeImageUrl}
          width={56}
        />
      ) : (
        // 가게 사진이 없으면 회색 바탕에 가게 아이콘을 둔다
        <div
          aria-hidden="true"
          className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-text-tertiary"
        >
          <Store className="size-6" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
        <h3 className="max-w-full truncate text-body-sm-mobile font-medium text-text-primary">
          {coupon.storeName}
        </h3>
        {/* 할인 대상은 같은 줄 옆에 작게 둔다. 좁으면 대상 쪽이 말줄임으로 줄어든다 */}
        <div className="flex max-w-full min-w-0 items-center gap-1.5">
          <strong
            className={`shrink-0 text-h3-mobile font-bold ${dimmed ? 'text-text-secondary' : 'text-text-primary'}`}
          >
            {formatDiscount(coupon)}
          </strong>
          <span className="min-w-0 truncate text-caption-mobile text-text-secondary">
            {formatTarget(coupon)}
          </span>
        </div>
      </div>
    </div>
    <TicketDivider />
    {/* 정보 줄 오른쪽에 알약을 두어 버튼 줄 하나를 줄인다 */}
    <div className="flex items-center justify-between gap-2 px-3 py-2.5">
      <p className="flex min-w-0 items-center gap-1.5 text-caption-mobile text-text-secondary">
        {info}
      </p>
      {action}
    </div>
  </Card>
);

export default CouponCard;
