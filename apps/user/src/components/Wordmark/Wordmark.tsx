export type WordmarkSize = 'sm' | 'md';

export interface WordmarkProps {
  size?: WordmarkSize;
  className?: string;
}

// sm: 상단 헤더, md: 로그인 화면
const sizeClassNames: Record<WordmarkSize, string> = {
  sm: 'text-h3-mobile font-bold',
  md: 'text-h2-mobile font-black',
};

// 두 가지 색으로 쓰는 "런치캐치" 글자 로고
const Wordmark = ({ className, size = 'md' }: WordmarkProps) => {
  return (
    <p
      className={['text-text-primary', sizeClassNames[size], className]
        .filter(Boolean)
        .join(' ')}
    >
      런치<span className="text-action-primary">캐치</span>
    </p>
  );
};

export default Wordmark;
