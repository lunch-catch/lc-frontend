import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { TemplateChatMarkdown } from './TemplateChatMarkdown';

const REVEAL_INTERVAL_MS = 40;
const REVEAL_CHARACTER_MS = 14;
const REVEAL_MIN_MS = 300;
const REVEAL_MAX_MS = 4000;

interface TemplateChatRevealProps {
  text: string;
  complete: boolean;
  onComplete: () => void;
  onProgress: (force?: boolean) => boolean;
}

/** 완성된 서버 응답을 화면에서만 점진적으로 표시한다. 서버 요청과 저장 원문은 바꾸지 않는다. */
export const TemplateChatReveal = ({
  text,
  complete,
  onComplete,
  onProgress,
}: TemplateChatRevealProps) => {
  // 한글 조합 문자나 가족 이모지가 중간에서 잘리지 않도록 글자 단위로 나눈다.
  const characters = useMemo(
    () =>
      Array.from(
        new Intl.Segmenter('ko', { granularity: 'grapheme' }).segment(text),
        (part) => part.segment,
      ),
    [text],
  );
  const [visibleCount, setVisibleCount] = useState(() =>
    complete ||
    (typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      ? characters.length
      : 0,
  );
  const reportProgress = useEffectEvent(onProgress);
  const shouldFollow = useRef(false);
  const reportComplete = useEffectEvent(onComplete);
  // 출력 중단은 이미 받은 답변을 버리지 않고 애니메이션만 끝낸다.
  const displayedCount = complete ? characters.length : visibleCount;

  useEffect(() => {
    // 접근성 설정에서는 즉시 표시하고, 긴 답변도 최대 4초 안에 끝낸다.
    if (
      complete ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const duration = Math.min(
      REVEAL_MAX_MS,
      Math.max(REVEAL_MIN_MS, characters.length * REVEAL_CHARACTER_MS),
    );
    const startedAt = performance.now();
    const timer = window.setInterval(() => {
      const count = Math.min(
        characters.length,
        Math.ceil(
          ((performance.now() - startedAt) / duration) * characters.length,
        ),
      );
      // 높이가 늘기 전에 하단 추적 여부를 보존한다. 표·코드 블록은 한 번에 크게 늘 수 있다.
      shouldFollow.current = reportProgress();
      setVisibleCount(count);
      if (count === characters.length) window.clearInterval(timer);
    }, REVEAL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [characters, complete]);

  useLayoutEffect(() => {
    // 변경된 높이로 다시 판단하지 않고, 페인트 전에 이전 추적 상태를 적용한다.
    if (shouldFollow.current) reportProgress(true);
    shouldFollow.current = false;
  }, [displayedCount]);

  useEffect(() => {
    if (displayedCount >= characters.length) reportComplete();
  }, [displayedCount, characters.length]);

  // 글자가 늘어날 때마다 스크린 리더가 문장을 다시 읽지 않도록 한다.
  return (
    <div aria-live="off" aria-busy={displayedCount < characters.length}>
      <TemplateChatMarkdown>
        {characters.slice(0, displayedCount).join('')}
      </TemplateChatMarkdown>
    </div>
  );
};
