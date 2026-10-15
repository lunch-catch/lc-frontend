import { useEffect, useMemo, useRef, useState } from 'react';

import scrollbarStyles from '@admin/components/ScrollArea/scrollbar.css?inline';
import {
  createSelectablePreviewHtml,
  selectTemplateElement,
  type TemplateSelection,
} from '@admin/features/template/templateSelection';

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
    if (!document) return;
    // iframe은 부모의 CSS를 상속하지 않으므로 기존 ScrollArea 스타일과 필요한 토큰만 전달한다.
    const style = document.createElement('style');
    style.textContent = scrollbarStyles;
    document.head.append(style);
    const root = document.documentElement;
    root.classList.add('admin-scrollbar');
    const themeRoot = window.document.documentElement;
    const syncTokens = () => {
      const tokens = getComputedStyle(themeRoot);
      for (const name of [
        '--space-1',
        '--space-2',
        '--semantic-border-subtle',
        '--semantic-text-tertiary',
      ]) {
        root.style.setProperty(name, tokens.getPropertyValue(name));
      }
    };
    syncTokens();
    // 테마 변경은 스크롤바 토큰만 갱신해 선택 상태와 스크롤 위치를 유지한다.
    const observer = new MutationObserver(syncTokens);
    observer.observe(themeRoot, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => {
      observer.disconnect();
      style.remove();
      root.classList.remove('admin-scrollbar');
    };
  }, [document]);

  useEffect(() => {
    if (!document || disabled) return;
    const style = document.createElement('style');
    style.textContent =
      'body * { cursor: crosshair; } [data-editor-selected] { outline: 2px solid #F56B20 !important; outline-offset: -2px !important; }';
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
    element?.setAttribute('data-editor-selected', '');
    element?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    return () => element?.removeAttribute('data-editor-selected');
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
