import { useCallback, useState } from 'react';

// 템플릿은 폭 360px 안팎으로 만들어져 있어, 점주 미리보기(apps/owner PosterPreview)와 같은 폭으로 그린 뒤 카드 폭에 맞게 줄인다
// 카드 폭에 그대로 그리면 글자와 배치가 점주가 본 것과 달라진다
const POSTER_BASE_WIDTH = 360;

// 포스터는 점주가 만든 그대로 보여준다. 점주 미리보기와 다르게 보이지 않도록 여백, 이미지 크기 같은 배치는 건드리지 않는다
// 넘치는 부분만 잘라 스크롤 막대를 숨긴다. 카드 위에서는 스와이프를 받아 포스터를 스크롤할 수 없어 막대가 쓸모없이 보이기만 한다
// 포스터가 A4를 넘거나 이미지가 폭보다 넓으면 점주 미리보기처럼 잘린다. 크기는 템플릿(관리자)에서 맞춘다
const BASE_STYLE = '<style>html,body{overflow:hidden}</style>';

// 완성 HTML 문서면 head 안에, 조각이면 맨 앞에 기본 스타일을 넣는다
// 문서 맨 앞(<!doctype> 앞)에 넣으면 표준 모드가 풀려 배치가 달라질 수 있어 피한다
const withBaseStyle = (html: string) => {
  const head = /<head[^>]*>/i.exec(html);
  if (head) {
    const at = head.index + head[0].length;
    return html.slice(0, at) + BASE_STYLE + html.slice(at);
  }
  const doctype = /^\s*<!doctype[^>]*>/i.exec(html);
  if (doctype) {
    const at = doctype[0].length;
    return html.slice(0, at) + BASE_STYLE + html.slice(at);
  }
  return BASE_STYLE + html;
};

interface PosterFrameProps {
  html: string;
  title: string;
}

// 점주가 만든 포스터 HTML을 보여주는 틀. 감싼 요소를 꽉 채우고, 넘치는 부분은 잘린다
// 포스터는 보기만 하는 그림이라 터치를 받지 않는다 (스와이프 카드에서는 그 위에서도 카드를 끌 수 있다)
const PosterFrame = ({ html, title }: PosterFrameProps) => {
  // 감싼 요소의 크기. 재기 전에는 그리지 않아 큰 포스터가 잠깐 보였다 줄어드는 일이 없게 한다
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  const measureRef = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setSize({
          height: entry.contentRect.height,
          width: entry.contentRect.width,
        });
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scale = size ? size.width / POSTER_BASE_WIDTH : 0;

  return (
    <div className="absolute inset-0 overflow-hidden" ref={measureRef}>
      {size && size.width > 0 && (
        <iframe
          className="pointer-events-none absolute top-0 left-0 origin-top-left border-0"
          // 줄인 뒤에도 틀 높이를 채우도록, 줄이기 전 높이를 배율만큼 늘려 둔다
          height={size.height / scale}
          // 포스터 안의 스크립트, 폼, 링크 이동을 모두 막는다
          sandbox=""
          srcDoc={withBaseStyle(html)}
          style={{ transform: `scale(${scale})` }}
          tabIndex={-1}
          title={title}
          width={POSTER_BASE_WIDTH}
        />
      )}
    </div>
  );
};

export default PosterFrame;
