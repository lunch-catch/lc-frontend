import { useEffect, useMemo, useRef, useState } from 'react';

import { createSelectablePreviewHtml } from '@admin/features/template/templateSelection';

const previewWidth = 420;
const previewHeight = (previewWidth * 297) / 210;

interface TemplateThumbnailProps {
  html: string;
  name: string;
}

/** 카드 너비에 따라 글자가 재배치되지 않도록 고정된 A4 화면 전체를 축소한다. */
export const TemplateThumbnail = ({ html, name }: TemplateThumbnailProps) => {
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

  return (
    <div
      ref={containerRef}
      className="relative aspect-[210/297] w-full overflow-hidden rounded-md bg-white shadow-sm"
    >
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
