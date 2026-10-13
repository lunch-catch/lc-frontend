import type { PointerEvent } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';

import type { TableColumnPreference } from './dataTableTypes';

export interface FieldDropTarget {
  visible: boolean;
  /** 이동 중인 필드를 제외한 대상 구역 목록의 삽입 위치. */
  index: number;
}

interface DragSession {
  key: string;
  startX: number;
  startY: number;
  sourceVisible: boolean;
  groupTops: { visible: number; hidden: number };
  groupScrollTops: { visible: number; hidden: number };
  sourceRect: { top: number; left: number; width: number };
  stride: number;
  moved: boolean;
  rows: { key: string; visible: boolean; center: number }[];
  target: FieldDropTarget | null;
}

// data-field-group은 이동 구역, data-field-scroll은 해당 구역의 스크롤 영역,
// data-column-key·data-visible은 필드의 식별자와 표시 상태를 나타낸다.
export const useTableFieldDrag = (
  fields: TableColumnPreference[],
  onDrop: (key: string, target: FieldDropTarget) => boolean,
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<DragSession | null>(null);
  const previousPositions = useRef(new Map<string, number>());
  const [drag, setDrag] = useState<{
    key: string;
    offset: number;
    stride: number;
    target: FieldDropTarget | null;
    preview: { top: number; left: number; width: number };
  } | null>(null);

  useLayoutEffect(() => {
    const rows =
      containerRef.current?.querySelectorAll<HTMLElement>('[data-column-key]');
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      for (const row of rows ?? []) {
        const previous = previousPositions.current.get(
          row.dataset.columnKey ?? '',
        );
        if (previous === undefined) continue;
        const offset = previous - row.getBoundingClientRect().top;
        if (offset)
          row.animate(
            [
              { transform: `translateY(${offset}px)` },
              { transform: 'translateY(0)' },
            ],
            { duration: 180, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
          );
      }
    }
    previousPositions.current.clear();
  }, [fields]);

  const cancel = () => {
    sessionRef.current = null;
    setDrag(null);
  };
  const resetScroll = () => {
    cancel();
    previousPositions.current.clear();
    containerRef.current
      ?.querySelectorAll<HTMLElement>('[data-field-scroll]')
      .forEach((list) => {
        list.scrollTop = 0;
      });
  };
  const start = (key: string, event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    const container = containerRef.current;
    if (!container) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const elements = Array.from(
      container.querySelectorAll<HTMLElement>('[data-column-key]'),
    );
    const source = elements.find((row) => row.dataset.columnKey === key);
    if (!source) return;
    // 드래그 중 행이 밀리는 애니메이션을 기준 좌표에 다시 반영하면 삽입 위치가 흔들리므로 시작 위치를 저장한다.
    const rows = elements.map((row) => {
      const rect = row.getBoundingClientRect();
      return {
        key: row.dataset.columnKey!,
        visible: row.dataset.visible === 'true',
        center: rect.top + rect.height / 2,
      };
    });
    const groupRows = rows.filter(
      (row) => row.visible === (source.dataset.visible === 'true'),
    );
    const sourceRect = source.getBoundingClientRect();
    sessionRef.current = {
      key,
      startX: event.clientX,
      startY: event.clientY,
      sourceVisible: source.dataset.visible === 'true',
      sourceRect: {
        top: sourceRect.top,
        left: sourceRect.left,
        width: sourceRect.width,
      },
      groupScrollTops: {
        visible:
          container.querySelector<HTMLElement>('[data-field-scroll="visible"]')
            ?.scrollTop ?? 0,
        hidden:
          container.querySelector<HTMLElement>('[data-field-scroll="hidden"]')
            ?.scrollTop ?? 0,
      },
      groupTops: {
        visible: container
          .querySelector('[data-field-group="visible"]')!
          .getBoundingClientRect().top,
        hidden: container
          .querySelector('[data-field-group="hidden"]')!
          .getBoundingClientRect().top,
      },
      stride:
        groupRows.length > 1
          ? groupRows[1].center - groupRows[0].center
          : source.getBoundingClientRect().height + 8,
      moved: false,
      rows,
      target: null,
    };
  };
  const update = (event: PointerEvent<HTMLButtonElement>) => {
    const session = sessionRef.current;
    const container = containerRef.current;
    if (!session || !container) return;
    // 좌우 구역 이동도 시작할 수 있게 수평·수직 거리를 함께 검사한다.
    if (
      !session.moved &&
      Math.hypot(
        event.clientX - session.startX,
        event.clientY - session.startY,
      ) < 4
    )
      return;
    session.moved = true;
    const sourceGroupName = session.sourceVisible ? 'visible' : 'hidden';
    const sourceGroup = container.querySelector(
      `[data-field-group="${sourceGroupName}"]`,
    );
    const group = Array.from(
      container.querySelectorAll<HTMLElement>('[data-field-group]'),
    )
      .reverse()
      .find((section) => {
        const rect = section.getBoundingClientRect();
        return (
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom
        );
      });
    const targetGroupName =
      group?.dataset.fieldGroup === 'visible' ? 'visible' : 'hidden';
    const targetScroll = group?.querySelector<HTMLElement>(
      '[data-field-scroll]',
    );
    if (targetScroll) {
      const bounds = targetScroll.getBoundingClientRect();
      if (event.clientY < bounds.top + 24) targetScroll.scrollTop -= 8;
      else if (event.clientY > bounds.bottom - 24) targetScroll.scrollTop += 8;
    }
    // 각 구역이 독립적으로 스크롤되므로 드래그 시작 후의 스크롤 차이를 좌표에 반영한다.
    const sourceScroll = sourceGroup?.querySelector<HTMLElement>(
      '[data-field-scroll]',
    );
    const sourceLayoutOffset =
      (sourceGroup?.getBoundingClientRect().top ??
        session.groupTops[sourceGroupName]) -
      session.groupTops[sourceGroupName] -
      ((sourceScroll?.scrollTop ?? 0) -
        session.groupScrollTops[sourceGroupName]);
    const targetLayoutOffset = group
      ? group.getBoundingClientRect().top -
        session.groupTops[targetGroupName] -
        ((targetScroll?.scrollTop ?? 0) -
          session.groupScrollTops[targetGroupName])
      : 0;
    session.target = group
      ? {
          visible: group.dataset.fieldGroup === 'visible',
          index: session.rows.filter(
            (row) =>
              row.key !== session.key &&
              row.visible === (group.dataset.fieldGroup === 'visible') &&
              row.center < event.clientY - targetLayoutOffset,
          ).length,
        }
      : null;
    setDrag({
      key: session.key,
      offset: event.clientY - session.startY - sourceLayoutOffset,
      stride: session.stride,
      target: session.target,
      // 포털 미리보기는 뷰포트 좌표로 이동하고, 목록 내부의 스크롤 보정과는 분리한다.
      preview: {
        ...session.sourceRect,
        left: session.sourceRect.left + event.clientX - session.startX,
        top: session.sourceRect.top + event.clientY - session.startY,
      },
    });
  };
  const finish = () => {
    const session = sessionRef.current;
    if (session?.moved && session.target) {
      const source = fields.find((field) => field.key === session.key);
      // 구역 간 이동은 새 영역의 실제 높이에 즉시 맞추고, 같은 구역의 정렬만 보간한다.
      if (source?.visible === session.target.visible) {
        previousPositions.current = new Map(
          Array.from(
            containerRef.current?.querySelectorAll<HTMLElement>(
              '[data-column-key]',
            ) ?? [],
          ).map((row) => [
            row.dataset.columnKey ?? '',
            row.getBoundingClientRect().top,
          ]),
        );
      } else {
        previousPositions.current.clear();
      }
      if (!onDrop(session.key, session.target))
        previousPositions.current.clear();
    }
    cancel();
  };
  const getTransform = (field: TableColumnPreference, index: number) => {
    if (!drag) return undefined;
    if (field.key === drag.key)
      return `translateY(${drag.offset}px) scale(1.02)`;
    const source = fields.find((item) => item.key === drag.key);
    if (!source || !drag.target) return undefined;
    if (
      source.visible &&
      !drag.target.visible &&
      fields.filter((item) => item.visible).length === 1
    )
      return undefined;
    const sourceIndex = fields
      .filter((item) => item.visible === source.visible)
      .findIndex((item) => item.key === source.key);
    if (source.visible === drag.target.visible) {
      if (field.visible !== source.visible) return undefined;
      if (index > sourceIndex && index <= drag.target.index)
        return `translateY(-${drag.stride}px)`;
      if (index < sourceIndex && index >= drag.target.index)
        return `translateY(${drag.stride}px)`;
    } else {
      if (field.visible === source.visible && index > sourceIndex)
        return `translateY(-${drag.stride}px)`;
      if (field.visible === drag.target.visible && index >= drag.target.index)
        return `translateY(${drag.stride}px)`;
    }
    return undefined;
  };
  return {
    containerRef,
    resetScroll,
    drag,
    start,
    update,
    finish,
    cancel,
    getTransform,
  };
};
