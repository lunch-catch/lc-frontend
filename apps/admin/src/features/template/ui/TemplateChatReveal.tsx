import { useEffect, useEffectEvent, useMemo, useState } from 'react';

import { TemplateChatMarkdown } from './TemplateChatMarkdown';

const REVEAL_INTERVAL_MS = 40;
const REVEAL_CHARACTER_MS = 14;
const REVEAL_MIN_MS = 300;
const REVEAL_MAX_MS = 4000;

interface TemplateChatRevealProps {
  text: string;
  onProgress: () => void;
}

/** 완성된 서버 응답을 화면에서만 점진적으로 표시한다. 서버 요청과 저장 원문은 바꾸지 않는다. */
export const TemplateChatReveal = ({
  text,
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
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? characters.length
      : 0,
  );
  const reportProgress = useEffectEvent(onProgress);

  useEffect(() => {
    // 접근성 설정에서는 즉시 표시하고, 긴 답변도 최대 4초 안에 끝낸다.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
      setVisibleCount(count);
      if (count === characters.length) window.clearInterval(timer);
    }, REVEAL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [characters]);

  useEffect(() => {
    reportProgress();
  }, [visibleCount]);

  // 글자가 늘어날 때마다 스크린 리더가 문장을 다시 읽지 않도록 한다.
  return (
    <div aria-live="off" aria-busy={visibleCount < characters.length}>
      <TemplateChatMarkdown>
        {characters.slice(0, visibleCount).join('')}
      </TemplateChatMarkdown>
    </div>
  );
};
