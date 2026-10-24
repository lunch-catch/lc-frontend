import { useCallback, useEffect, useState } from 'react';

// 템플릿은 폭 360px 안팎으로 만들어져 있어, 점주 미리보기(apps/owner PosterPreview)와 같은 폭으로 그린 뒤 카드 폭에 맞게 줄인다
// 카드 폭에 그대로 그리면 글자와 배치가 점주가 본 것과 달라진다
const POSTER_BASE_WIDTH = 360;

// 포스터 안의 이미지를 기다리는 최대 시간(ms). 이 시간이 지나면 덜 불러왔어도 보여준다
// 길게 기다리면 첫 카드가 느려 보이고, 너무 짧으면 이미지가 늦게 튀어나오는 번쩍임이 돌아온다
const SHOW_TIMEOUT_MS = 700;

// 서버가 준 포스터 HTML을 그대로 보여준다. 포스터 안의 배치(글자, 이미지 크기, 안쪽 여백)는 건드리지 않는다
// 브라우저가 어떤 문서에나 자동으로 넣는 바깥 여백(8px)만 없앤다. 포스터 HTML에 있는 것이 아니라,
// 남겨 두면 포스터 둘레로 뒤 바탕이 테두리처럼 비친다
// 넘치는 부분은 잘라 스크롤 막대를 숨긴다. 카드 위에서는 스와이프를 받아 포스터를 스크롤할 수 없어 막대가 쓸모없이 보이기만 한다
// 포스터 맨 바깥 요소의 모서리는 없앤다. 모서리는 카드가 둥글리는데, 템플릿 루트가 카드(12px)보다 더 둥글면(예: 24px)
// 그 차이만큼 뒤 카드 바탕이 모서리에 비친다. 배경이 진한 포스터에서 특히 눈에 띈다
// 조각 HTML이면 이 스타일이 body의 첫 요소가 되므로, 첫 자식이 아니라 style, script, link가 아닌 자식에 건다
// 포스터가 A4를 넘거나 이미지가 폭보다 넓으면 잘린다. 크기는 템플릿(관리자)에서 맞춘다
const BASE_STYLE =
  '<style>html,body{margin:0;overflow:hidden}body>*:not(style):not(script):not(link){border-radius:0!important}</style>';

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

  // 이미지까지 다 그려진 포스터의 HTML. 같은 HTML이면 다시 숨기지 않는다
  const [shownHtml, setShownHtml] = useState<string | null>(null);
  const isShown = shownHtml === html;

  // 이미지가 너무 늦거나 막혀도 포스터가 계속 안 보이지 않도록 일정 시간 뒤에는 보여준다
  useEffect(() => {
    const timer = setTimeout(() => setShownHtml(html), SHOW_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [html]);

  const scale = size ? size.width / POSTER_BASE_WIDTH : 0;

  return (
    <div className="absolute inset-0 overflow-hidden" ref={measureRef}>
      {size && size.width > 0 && (
        <iframe
          // 포스터를 다 받기 전에 그리면 배경만 먼저 나오고 이미지가 늦게 튀어나와 번쩍여 보인다
          // 이미지까지 불러온 뒤에 뒤 회색 바탕에서 서서히 나타나게 한다
          className={`pointer-events-none absolute top-0 left-0 origin-top-left border-0 transition-opacity duration-150 motion-reduce:transition-none ${isShown ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setShownHtml(html)}
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
