// 찜 목록과 쿠폰함 카드가 같이 쓰는 쿠폰 모양 조각
// 두 화면이 같은 쿠폰을 다루므로, 뜯는 자리(점선과 반원 홈)와 오른쪽 아래 알약 버튼을 같은 모양으로 맞춘다

// 오른쪽 아래 알약. 높이 32px이지만 위아래로 터치 영역을 넓혀 44px 이상을 지킨다
export const ticketPillClassName =
  "relative flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-caption-mobile font-bold whitespace-nowrap after:absolute after:-inset-x-1 after:-inset-y-1.5 after:content-['']";

// 누를 수 있는 알약에 붙인다
export const ticketPressableClassName =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:opacity-60';

// 쿠폰을 뜯는 자리처럼 점선과 양옆 반원 홈을 둔다. 홈은 바탕색 원을 카드 가장자리에 반쯤 걸쳐 만든다
// 홈이 카드 밖으로 나간 반쪽이 보이지 않도록 감싼 카드는 overflow-hidden으로 둔다
export const TicketDivider = () => (
  <div aria-hidden="true" className="relative">
    <div className="mx-3 border-t border-dashed border-border-subtle" />
    <span className="absolute top-0 -left-2.5 size-5 -translate-y-1/2 rounded-full border border-border-subtle bg-bg-page" />
    <span className="absolute top-0 -right-2.5 size-5 -translate-y-1/2 rounded-full border border-border-subtle bg-bg-page" />
  </div>
);
