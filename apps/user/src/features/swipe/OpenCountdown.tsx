import { Clock } from 'lucide-react';

import {
  formatCountdown,
  useOpenCountdown,
} from '@user/features/wishlist/useOpenCountdown';

// 카드 위에 두는 11:00 오픈까지 남은 시간. 오픈 뒤에는 보여주지 않는다
// 큰 화면에서 카드 위가 비어 보일 때만 보여준다. 오픈 시각은 카드 아래 안내에도 있어서 작은 화면에서 빠져도 된다
const OpenCountdown = () => {
  const { isOpen, remainingMs } = useOpenCountdown();

  if (isOpen) return null;

  return (
    // 바로 아래 포스터와 주황색으로 겹치지 않도록 배경 없이 회색 글자로 둔다
    <p className="flex h-8 items-center gap-1.5 text-body-sm-mobile text-text-secondary">
      <Clock aria-hidden="true" className="size-4" />
      쿠폰 오픈까지
      {/* 숫자 폭을 같게 해 1초마다 글자가 좌우로 흔들리지 않게 한다 */}
      <span className="font-bold text-text-primary tabular-nums">
        {formatCountdown(remainingMs)}
      </span>
    </p>
  );
};

export default OpenCountdown;
