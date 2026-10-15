import { type MouseEvent, useEffect, useMemo, useRef } from 'react';

import { ScrollArea } from '@admin/components/ScrollArea/ScrollArea';
import {
  findTemplateCodeElement,
  getTemplateCodeElements,
  type TemplateSelection,
} from '@admin/features/template/templateSelection';

interface TemplateHtmlCodeProps {
  html: string;
  disabled: boolean;
  selected: TemplateSelection | null;
  onSelect: (selection: TemplateSelection) => void;
}

export const TemplateHtmlCode = ({
  html,
  disabled,
  selected,
  onSelect,
}: TemplateHtmlCodeProps) => {
  const codeRef = useRef<HTMLElement>(null);
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
  const selectedStart = selectedElement?.start;
  useEffect(() => {
    if (selectedStart === undefined) return;
    codeRef.current
      ?.querySelector(`[data-code-start="${selectedStart}"]`)
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [selectedStart]);
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
      aria-label="선택한 템플릿의 HTML"
      role="region"
      tabIndex={0}
      className="min-w-0 overflow-x-auto overscroll-x-contain rounded-md border border-border-subtle bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary"
    >
      <pre className="m-0 w-max min-w-full p-3 font-mono text-caption-web text-text-primary">
        <code ref={codeRef} onMouseUp={handleMouseUp}>
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
                role={selectable ? 'button' : undefined}
                tabIndex={selectable ? 0 : undefined}
                aria-label={
                  selectable && chunk.element
                    ? `${chunk.element.selection.label} 태그를 수정 대상으로 선택`
                    : undefined
                }
                className={`outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action-primary ${selectable ? 'cursor-pointer' : ''} ${isSelected ? 'bg-surface-brand text-text-primary' : selectable ? 'hover:bg-bg-surface' : ''}`}
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
