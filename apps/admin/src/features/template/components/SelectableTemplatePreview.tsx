import { useEffect, useMemo, useRef, useState } from 'react';

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
  const [loaded, setLoaded] = useState<{
    html: string;
    document: Document | null;
  } | null>(null);
  // 새 HTML이 로드되기 전에는 이전 문서에 선택 이벤트와 강조 표시를 연결하지 않는다.
  const document = loaded?.html === html ? loaded.document : null;
  const srcDoc = useMemo(() => createSelectablePreviewHtml(html), [html]);

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
      onSelect(selectTemplateElement(element));
    };
    document.addEventListener('click', select, true);
    return () => {
      style.remove();
      document.removeEventListener('click', select, true);
    };
  }, [document, disabled, onSelect]);

  useEffect(() => {
    if (!document || disabled || !selected?.selector) return;
    const element = document.querySelector(selected.selector);
    if (!element) return;
    element.setAttribute('data-editor-selected', '');
    // 선택 요소의 스타일과 겹침 순서를 바꾸지 않고, 별도 레이어를 템플릿 내용 위에 표시한다.
    const overlay = document.createElement('div');
    overlay.setAttribute('data-editor-selection-overlay', '');
    overlay.setAttribute('aria-hidden', 'true');
    const color = getComputedStyle(window.document.documentElement)
      .getPropertyValue('--semantic-code-selection-bg')
      .trim();
    overlay.style.setProperty('--template-selection-color', color);
    // 템플릿의 높은 z-index 위에 표시하면서 클릭은 원래 요소로 통과시킨다.
    Object.assign(overlay.style, {
      position: 'fixed',
      zIndex: '2147483647',
      pointerEvents: 'none',
      boxSizing: 'border-box',
      border: '2px solid var(--template-selection-color)',
      borderRadius: '4px',
      boxShadow:
        '0 0 0 1px color-mix(in srgb, var(--template-selection-color) 30%, transparent), 0 0 12px 2px color-mix(in srgb, var(--template-selection-color) 55%, transparent)',
    });
    document.body.append(overlay);
    // 테두리가 글자에 닿지 않도록 선택 영역보다 조금 넓게 그린다.
    const outlinePadding = 2;
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
    return () => {
      observer.disconnect();
      frameWindow?.removeEventListener('resize', updateBounds);
      overlay.remove();
      element.removeAttribute('data-editor-selected');
    };
  }, [document, disabled, selected]);

  return (
    <iframe
      ref={frameRef}
      className="size-full rounded-lg border border-border-subtle bg-bg-page shadow-md"
      // 부모가 DOM을 읽도록 동일 출처 접근을 허용하고 스크립트는 sandbox와 CSP로 차단한다.
      sandbox="allow-same-origin"
      srcDoc={srcDoc}
      title={title}
      onLoad={() =>
        setLoaded({ html, document: frameRef.current?.contentDocument ?? null })
      }
    />
  );
};
