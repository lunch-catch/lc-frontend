import { useEffect, useState } from 'react';

// 응답이 이보다 빠르면 불러오는 중 화면을 보여주지 않는다
const DEFAULT_DELAY_MS = 300;
// 회색 틀이 한 번 나오면 적어도 이만큼은 보여준다
const DEFAULT_MIN_VISIBLE_MS = 400;

// 불러오는 중 화면(회색 틀)을 보여줄지
// 불러오기를 시작하자마자 보여주면 응답이 빠를 때 회색 틀이 잠깐 나왔다 사라져 화면이 번쩍여 보인다
// 그래서 불러오는 중인 채로 delayMs가 지난 뒤에만 true가 된다
export const useDelayedLoading = (
  isLoading: boolean,
  delayMs = DEFAULT_DELAY_MS,
) => {
  const [isDelayPassed, setIsDelayPassed] = useState(false);
  // 불러오기가 끝났다가 다시 시작하면 처음부터 기다리도록, 바뀌는 순간 렌더 중에 되돌린다
  const [previousLoading, setPreviousLoading] = useState(isLoading);
  if (previousLoading !== isLoading) {
    setPreviousLoading(isLoading);
    setIsDelayPassed(false);
  }

  useEffect(() => {
    if (!isLoading) return;

    const timer = setTimeout(() => setIsDelayPassed(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, isLoading]);

  return isLoading && isDelayPassed;
};

// 회색 틀을 늦게 띄우고, 한 번 띄웠으면 짧게 사라지지 않게 잡아 둔다
// 응답이 회색 틀이 뜬 직후(예: 0.35초)에 오면 틀이 0.05초만 보였다 사라져 번쩍인다
// 그래서 틀이 뜬 뒤에는 minVisibleMs가 지날 때까지 isPending을 true로 두고, 그동안 내용 대신 틀을 보여준다
// 요청을 여러 번 차례로 보내 0.3초를 넘기기 쉬운 화면(찜 목록)에서 쓴다
export const useSkeletonGate = (
  isLoading: boolean,
  delayMs = DEFAULT_DELAY_MS,
  minVisibleMs = DEFAULT_MIN_VISIBLE_MS,
) => {
  const showDelayed = useDelayedLoading(isLoading, delayMs);
  // 회색 틀을 띄운 뒤 최소 시간을 채우는 중인지
  const [isHolding, setIsHolding] = useState(false);
  const [wasShowing, setWasShowing] = useState(false);

  // 틀이 보이다가 불러오기가 끝나는 순간을 렌더 중에 잡아, 그 사이 내용이 한 번 그려지지 않게 한다
  if (showDelayed !== wasShowing) {
    setWasShowing(showDelayed);
    if (showDelayed) setIsHolding(true);
  }

  useEffect(() => {
    if (!isHolding) return;
    const timer = setTimeout(() => setIsHolding(false), minVisibleMs);
    return () => clearTimeout(timer);
  }, [isHolding, minVisibleMs]);

  const isPending = isLoading || isHolding;
  return { isPending, showSkeleton: showDelayed || isHolding };
};
