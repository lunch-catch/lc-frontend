import { useEffect, useMemo, useRef, useState } from 'react';

import { syncTemplatePreviewFrame } from '../templatePreviewFrame';
import {
  TEMPLATE_PREVIEW_HEIGHT,
  TEMPLATE_PREVIEW_WIDTH,
} from '../templatePreviewSize';
import {
  createSelectablePreviewHtml,
  selectTemplateElement,
  type TemplateSelection,
} from '../templateSelection';

interface SelectableTemplatePreviewProps {
  html: string;
  title: string;
  disabled: boolean;
  selected: TemplateSelection | null;
  onSelect: (selection: TemplateSelection) => void;
}

export const SelectableTemplatePreview = ({
  html,
  title,
  disabled,
  selected,
  onSelect,
}: SelectableTemplatePreviewProps) => {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [loaded, setLoaded] = useState<{
    html: string;
    document: Document | null;
  } | null>(null);
  // 새 HTML이 로드되기 전에는 이전 문서에 선택 이벤트와 강조 표시를 연결하지 않는다.
  const document = loaded?.html === html ? loaded.document : null;
  const srcDoc = useMemo(() => createSelectablePreviewHtml(html), [html]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      // 창이 낮거나 패널을 좁혀도, 폭·높이 중 작은 배율에 맞춰 A4 전체를 표시한다.
      setScale(
        Math.min(
          entry.contentRect.width / TEMPLATE_PREVIEW_WIDTH,
          entry.contentRect.height / TEMPLATE_PREVIEW_HEIGHT,
        ),
      );
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!document || disabled) return;
    const style = document.createElement('style');
    style.textContent = 'body * { cursor: crosshair; }';
    document.head.append(style);
    const select = (event: MouseEvent) => {
      event.preventDefault();
      const element = event.target as Element | null;
      if (
        !element ||
        element.nodeType !== 1 ||
        !/^(DIV|SPAN|P|H[1-6]|STRONG|EM|BR|IMG)$/.test(element.tagName)
      )
        return;
      onSelect(selectTemplateElement(element, html));
    };
    document.addEventListener('click', select, true);
    return () => {
      style.remove();
      document.removeEventListener('click', select, true);
    };
  }, [document, disabled, onSelect, html]);

  useEffect(() => {
    // 전송 중 선택 변경은 막되, 기존 강조 표시는 성공할 때까지 유지한다.
    if (!document || !selected?.selector) return;
    const element = document.querySelector(selected.selector);
    if (!element) return;
    element.setAttribute('data-editor-selected', '');
    // 선택 요소의 스타일과 겹침 순서를 바꾸지 않고, 별도 레이어를 템플릿 내용 위에 표시한다.
    const overlay = document.createElement('div');
    overlay.setAttribute('data-editor-selection-overlay', '');
    overlay.setAttribute('aria-hidden', 'true');
    // 템플릿의 높은 z-index 위에 표시하면서 클릭은 원래 요소로 통과시킨다.
    Object.assign(overlay.style, {
      position: 'fixed',
      zIndex: '2147483647',
      pointerEvents: 'none',
      boxSizing: 'border-box',
      // 포스터 색·앱 테마와 무관하게 밝고 어두운 경계가 모두 남도록 한다.
      border: '2px solid #ffffff',
      boxShadow: '0 0 0 1px #1f2937, inset 0 0 0 1px #1f2937',
      borderRadius: '4px',
      background: 'transparent',
    });
    document.body.append(overlay);
    // 테두리가 글자에 닿지 않도록 선택 영역보다 조금 넓게 그린다.
    const outlinePadding = 3;
    const updateBounds = () => {
      const bounds = element.getBoundingClientRect();
      Object.assign(overlay.style, {
        left: `${bounds.left - outlinePadding}px`,
        top: `${bounds.top - outlinePadding}px`,
        width: `${bounds.width + outlinePadding * 2}px`,
        height: `${bounds.height + outlinePadding * 2}px`,
      });
    };
    updateBounds();
    const observer = new ResizeObserver(updateBounds);
    observer.observe(element);
    observer.observe(document.body);
    const frameWindow = document.defaultView;
    frameWindow?.addEventListener('resize', updateBounds);
    frameWindow?.addEventListener('scroll', updateBounds, true);
    return () => {
      observer.disconnect();
      frameWindow?.removeEventListener('resize', updateBounds);
      frameWindow?.removeEventListener('scroll', updateBounds, true);
      overlay.remove();
      element.removeAttribute('data-editor-selected');
    };
  }, [document, selected]);

  return (
    <div
      ref={viewportRef}
      className="relative size-full min-h-0 min-w-0 flex-1 overflow-auto"
    >
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: TEMPLATE_PREVIEW_WIDTH * scale,
          height: TEMPLATE_PREVIEW_HEIGHT * scale,
        }}
      >
        <iframe
          ref={frameRef}
          className="absolute left-0 top-0 origin-top-left border-0 bg-transparent shadow-md"
          width={TEMPLATE_PREVIEW_WIDTH}
          height={TEMPLATE_PREVIEW_HEIGHT}
          style={{
            transform: `scale(${scale})`,
            visibility: scale > 0 ? 'visible' : 'hidden',
          }}
          // 고정 A4 화면을 통째로 축소한다. 넘치는 원본 내용은 iframe 안에서 스크롤한다.
          sandbox="allow-same-origin"
          srcDoc={srcDoc}
          title={title}
          onLoad={(event) => {
            syncTemplatePreviewFrame(event.currentTarget);
            setLoaded({
              html,
              document: frameRef.current?.contentDocument ?? null,
            });
          }}
        />
      </div>
    </div>
  );
};
