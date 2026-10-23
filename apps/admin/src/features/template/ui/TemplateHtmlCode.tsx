import { type MouseEvent, useEffect, useMemo, useRef, useState } from 'react';

import { ScrollArea } from '@admin/ui/ScrollArea/ScrollArea';

import {
  findTemplateCodeElement,
  getTemplateCodeElements,
  type TemplateSelection,
} from '../templateSelection';

interface TemplateHtmlCodeProps {
  html: string;
  wrapLines: boolean;
  disabled: boolean;
  selected: TemplateSelection | null;
  onSelect: (selection: TemplateSelection) => void;
}

export const TemplateHtmlCode = ({
  html,
  wrapLines,
  disabled,
  selected,
  onSelect,
}: TemplateHtmlCodeProps) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLElement>(null);
  const [hoveredElement, setHoveredElement] = useState<{
    html: string;
    start: number;
  } | null>(null);
  const elements = useMemo(() => getTemplateCodeElements(html), [html]);
  const chunks = useMemo(() => {
    // 중첩된 태그의 경계를 나누되 원본 문자열과 줄바꿈은 그대로 표시한다.
    const boundaries = [
      ...new Set([
        0,
        html.length,
        ...elements.flatMap((element) => [
          element.start,
          element.openEnd,
          element.closeStart,
          element.end,
        ]),
      ]),
    ].sort((a, b) => a - b);
    return boundaries.slice(0, -1).map((start, index) => {
      const end = boundaries[index + 1];
      return {
        start,
        end,
        text: html.slice(start, end),
        element: findTemplateCodeElement(elements, start, end),
      };
    });
  }, [html, elements]);
  const selectedElement = selected?.selector
    ? elements.find(
        (element) => element.selection.selector === selected.selector,
      )
    : undefined;
  // 분할된 코드 조각이 아니라 원본 요소의 전체 범위로 호버를 표시한다.
  const hovered =
    !disabled && hoveredElement?.html === html
      ? elements.find((element) => element.start === hoveredElement.start)
      : undefined;
  const selectedStart = selectedElement?.start;
  useEffect(() => {
    if (selected?.source !== 'preview' || selectedStart === undefined) return;
    const viewport = viewportRef.current;
    const element = codeRef.current?.querySelector(
      `[data-code-start="${selectedStart}"]`,
    );
    if (!viewport || !element) return;
    // 직접 고른 코드는 그대로 두고, 미리보기 선택만 가로 위치를 유지하며 세로로 따라간다.
    const viewportTop =
      viewport.getBoundingClientRect().top + viewport.clientTop;
    const bounds = element.getBoundingClientRect();
    if (bounds.top < viewportTop)
      viewport.scrollTop += bounds.top - viewportTop;
    else if (bounds.bottom > viewportTop + viewport.clientHeight)
      viewport.scrollTop += bounds.bottom - viewportTop - viewport.clientHeight;
  }, [selectedStart, selected?.source, wrapLines]);
  const selectElement = (start: number, end?: number) => {
    if (disabled) return;
    const element = findTemplateCodeElement(elements, start, end);
    if (element) onSelect(element.selection);
  };
  const handleMouseUp = (event: MouseEvent<HTMLElement>) => {
    if (disabled) return;
    const selection = window.getSelection();
    if (
      selection?.toString().trim() &&
      selection.anchorNode &&
      selection.focusNode &&
      codeRef.current?.contains(selection.anchorNode) &&
      codeRef.current.contains(selection.focusNode)
    ) {
      const selectedRange = selection.getRangeAt(0);
      const range = selectedRange.cloneRange();
      range.selectNodeContents(codeRef.current);
      range.setEnd(selectedRange.startContainer, selectedRange.startOffset);
      const selectedText = selectedRange.toString();
      // 여러 span을 가로질러 드래그해도 코드 전체를 기준으로 선택 위치를 계산한다.
      const start =
        range.toString().length +
        selectedText.length -
        selectedText.trimStart().length;
      selectElement(start, start + selectedText.trim().length);
      return;
    }
    const target = (event.target as Element).closest('[data-code-start]');
    if (target)
      selectElement(
        Number(target.getAttribute('data-code-start')),
        Number(target.getAttribute('data-code-end')),
      );
  };

  return (
    <ScrollArea
      ref={viewportRef}
      aria-label="선택한 템플릿의 HTML"
      role="region"
      tabIndex={0}
      className={
        'template-editor__code min-w-0 overscroll-x-contain rounded-xl border focus-visible:outline-2 focus-visible:outline-action-primary ' +
        (wrapLines ? 'overflow-x-hidden' : 'overflow-x-auto')
      }
    >
      {/* 자동 줄바꿈은 영역 끝에서 문자 단위로 접고, 원본 개행과 요소 선택에 쓰는 문자 위치는 유지한다. */}
      <pre
        className={
          'm-0 p-4 font-mono text-caption-web leading-6 ' +
          (wrapLines
            ? 'w-full min-w-0 whitespace-pre-wrap break-all'
            : 'w-max min-w-full whitespace-pre')
        }
      >
        <code
          ref={codeRef}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setHoveredElement(null)}
        >
          {chunks.map((chunk) => {
            const isSelected = Boolean(
              selectedElement &&
              chunk.start >= selectedElement.start &&
              chunk.end <= selectedElement.end,
            );
            const selectable = !disabled && Boolean(chunk.element);
            return (
              <span
                key={chunk.start}
                data-code-start={chunk.start}
                data-code-end={chunk.end}
                data-code-selected={isSelected}
                data-code-selectable={selectable}
                data-code-hovered={Boolean(
                  hovered &&
                  chunk.start >= hovered.start &&
                  chunk.end <= hovered.end,
                )}
                onMouseEnter={() =>
                  setHoveredElement(
                    selectable && chunk.element
                      ? { html, start: chunk.element.start }
                      : null,
                  )
                }
                role={selectable ? 'button' : undefined}
                tabIndex={selectable ? 0 : undefined}
                aria-label={
                  selectable && chunk.element
                    ? `${chunk.element.selection.label} 태그를 수정 대상으로 선택`
                    : undefined
                }
                className={`template-editor__code-fragment outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action-primary ${selectable ? 'cursor-pointer' : ''}`}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    selectElement(chunk.start, chunk.end);
                  }
                }}
              >
                {chunk.text}
              </span>
            );
          })}
        </code>
      </pre>
    </ScrollArea>
  );
};
