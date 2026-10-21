import { useOpenCountdown } from '@user/hooks/useOpenCountdown';

// 탐색 "쿠폰 진행 중" 제목 옆에 붙는 오늘 발급 상태 (예: · 11:00 오픈)
// 오픈 시각은 모든 가게가 같아서 카드마다 반복하지 않고 제목에 한 번만 둔다
// 쿠폰은 찜한 뒤 찜 목록에서 받으므로 "지금 받을 수 있어요"처럼 바로 받는다는 말은 쓰지 않는다
// 오픈 전에는 시계가 1초마다 돌아서, 목록 전체가 다시 그려지지 않게 이 글자만 따로 둔다
const IssuePhaseLabel = () => {
  const { isIssueClosed, isOpen } = useOpenCountdown();

  const getLabel = () => {
    if (isIssueClosed) return '내일 11:00 오픈';
    return isOpen ? '선착순 발급 중' : '11:00 오픈';
  };

  return (
    <span className="font-medium text-text-secondary"> · {getLabel()}</span>
  );
};

export default IssuePhaseLabel;
