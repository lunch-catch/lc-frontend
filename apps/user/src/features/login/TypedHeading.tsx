import { useEffect, useState } from 'react';

import { TYPING_CHAR_MS, TYPING_START_DELAY_MS } from './loginIntro';

interface TypedHeadingProps {
  // 줄바꿈은 \n으로 쓴다
  text: string;
  className?: string;
  // true면 타이핑 없이 전체를 바로 보여준다
  skip: boolean;
  onDone?: () => void;
}

// 글자가 한 글자씩 나타나는 제목. 한 음절씩 나오고, 끝나면 깜빡이는 막대(커서)가 사라진다
// 보이지 않는 전체 글자가 자리를 먼저 잡아서, 글자가 늘어나도 아래 내용이 밀리지 않는다
// 스크린리더에는 전체 문장을 그대로 읽게 하고 타이핑 중인 글자는 숨긴다
const TypedHeading = ({ className, onDone, skip, text }: TypedHeadingProps) => {
  const [count, setCount] = useState(skip ? text.length : 0);
  const isTyping = count < text.length;

  useEffect(() => {
    if (skip) return;

    let timer: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      let index = 0;
      timer = setInterval(() => {
        index += 1;
        setCount(index);
        if (index >= text.length) clearInterval(timer);
      }, TYPING_CHAR_MS);
    }, TYPING_START_DELAY_MS);

    return () => {
      clearTimeout(start);
      clearInterval(timer);
    };
  }, [skip, text]);

  useEffect(() => {
    if (!isTyping) onDone?.();
    // 타이핑이 끝났을 때 한 번만 알린다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTyping]);

  return (
    <h1 aria-label={text.replace('\n', ' ')} className={className}>
      <span aria-hidden="true" className="relative block whitespace-pre-line">
        <span className="invisible">{text}</span>
        <span className="absolute inset-0">
          {text.slice(0, count)}
          {isTyping && (
            <span className="ml-0.5 inline-block h-[0.85em] w-[3px] translate-y-[0.1em] animate-caret-blink bg-text-brand" />
          )}
        </span>
      </span>
    </h1>
  );
};

export default TypedHeading;
