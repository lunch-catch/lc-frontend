import { useEffect, useMemo, useRef, useState } from 'react';

import { createSelectablePreviewHtml } from '../templateSelection';

const previewWidth = 420;
const previewHeight = (previewWidth * 297) / 210;

interface TemplateThumbnailProps {
  html: string;
  name: string;
}

export const TemplateThumbnail = ({ html, name }: TemplateThumbnailProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldRenderPreview, setShouldRenderPreview] = useState(
    () => typeof IntersectionObserver === 'undefined',
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === 'undefined') return;
    // 화면 위아래 300px부터 준비하고, 생성한 iframe은 유지해 재진입 시 로딩을 반복하지 않는다.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldRenderPreview(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px 0px' },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // 미리보기 생성 전에도 A4 공간을 확보해 스크롤 중 카드 높이가 바뀌지 않게 한다.
  return (
    <div
      ref={containerRef}
      className="relative aspect-[210/297] w-full overflow-hidden rounded-md bg-white shadow-sm"
    >
      {shouldRenderPreview && (
        <LoadedTemplateThumbnail html={html} name={name} />
      )}
    </div>
  );
};

/** HTML 파싱과 크기 관찰도 실제 미리보기를 표시할 때 시작한다. */
const LoadedTemplateThumbnail = ({ html, name }: TemplateThumbnailProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const previewHtml = useMemo(() => {
    const document = new DOMParser().parseFromString(
      createSelectablePreviewHtml(html),
      'text/html',
    );
    // 브라우저 기본 body 여백이 A4 바깥으로 내용을 밀어내지 않게 한다.
    document.body.style.margin = '0';
    return `<!doctype html>\n${document.documentElement.outerHTML}`;
  }, [html]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // 창 크기가 그대로여도 사이드바 등으로 카드 너비가 바뀌면 배율을 갱신한다.
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setScale(entry.contentRect.width / previewWidth);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // 카드 너비로 HTML을 재배치하지 않고 고정된 A4 화면 전체를 축소한다.
  return (
    <div ref={containerRef} className="absolute inset-0">
      <iframe
        className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
        height={previewHeight}
        sandbox=""
        srcDoc={previewHtml}
        style={{ transform: `scale(${scale})` }}
        tabIndex={-1}
        title={`${name} 미리보기`}
        width={previewWidth}
      />
    </div>
  );
};
