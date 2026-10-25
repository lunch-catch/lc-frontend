import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useRef,
  useState,
} from 'react';

const MIN_WIDTHS = [260, 240, 280] as const;
const DEFAULT_WEIGHTS = [1, 1, 1.2];
const KEYBOARD_STEP = 20;

type Divider = 0 | 1;
interface DragState {
  divider: Divider;
  pointerId: number;
  startX: number;
  widths: number[];
}
interface TemplateEditorPanelsProps {
  children: [ReactNode, ReactNode, ReactNode];
}

/** 경계선 양옆 패널의 합계 너비는 유지하고, 화면 크기가 바뀌면 조절한 비율을 따른다. */
export const TemplateEditorPanels = ({
  children,
}: TemplateEditorPanelsProps) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [activeDivider, setActiveDivider] = useState<Divider | null>(null);

  const measureWidths = () => {
    const grid = gridRef.current;
    return grid
      ? [0, 2, 4].map(
          (index) => grid.children[index].getBoundingClientRect().width,
        )
      : null;
  };
  const resize = (divider: Divider, widths: number[], delta: number) => {
    const next = [...widths];
    const pairWidth = widths[divider] + widths[divider + 1];
    next[divider] = Math.max(
      MIN_WIDTHS[divider],
      Math.min(pairWidth - MIN_WIDTHS[divider + 1], widths[divider] + delta),
    );
    next[divider + 1] = pairWidth - next[divider];
    setWeights(next);
  };
  const startDrag = (event: PointerEvent<HTMLDivElement>, divider: Divider) => {
    if (event.button !== 0 || !event.isPrimary) return;
    const widths = measureWidths();
    if (!widths) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    drag.current = {
      divider,
      pointerId: event.pointerId,
      startX: event.clientX,
      widths,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setActiveDivider(divider);
  };
  const finishDrag = () => {
    drag.current = null;
    setActiveDivider(null);
  };
  const resizeWithKeyboard = (
    event: KeyboardEvent<HTMLDivElement>,
    divider: Divider,
  ) => {
    const widths = measureWidths();
    if (!widths) return;
    const delta =
      event.key === 'ArrowLeft'
        ? -KEYBOARD_STEP
        : event.key === 'ArrowRight'
          ? KEYBOARD_STEP
          : event.key === 'Home'
            ? MIN_WIDTHS[divider] - widths[divider]
            : event.key === 'End'
              ? widths[divider + 1] - MIN_WIDTHS[divider + 1]
              : null;
    if (delta === null) return;
    event.preventDefault();
    resize(divider, widths, delta);
  };
  const renderDivider = (index: Divider) => (
    <div
      role="separator"
      aria-label={
        index === 0 ? '채팅과 미리보기 너비 조절' : '미리보기와 HTML 너비 조절'
      }
      aria-orientation="vertical"
      aria-valuenow={Math.round(
        (weights[index] / (weights[index] + weights[index + 1])) * 100,
      )}
      aria-valuemin={0}
      aria-valuemax={100}
      title="드래그 또는 좌우 방향키로 너비 조절 · 두 번 클릭하여 초기화"
      tabIndex={0}
      className="template-editor__resize-handle"
      data-active={activeDivider === index}
      onPointerDown={(event) => startDrag(event, index)}
      onPointerMove={(event) => {
        const current = drag.current;
        if (current?.pointerId === event.pointerId)
          resize(
            current.divider,
            current.widths,
            event.clientX - current.startX,
          );
      }}
      onPointerUp={(event) => {
        if (drag.current?.pointerId !== event.pointerId) return;
        finishDrag();
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={finishDrag}
      onLostPointerCapture={finishDrag}
      onKeyDown={(event) => resizeWithKeyboard(event, index)}
      onDoubleClick={() => setWeights(DEFAULT_WEIGHTS)}
    />
  );

  return (
    <div
      ref={gridRef}
      className="template-editor__panes relative grid h-full min-h-0 min-w-[800px]"
      style={{
        gridTemplateColumns: weights
          .map((weight, index) => `minmax(${MIN_WIDTHS[index]}px, ${weight}fr)`)
          .join(' 8px '),
      }}
    >
      {children[0]}
      {renderDivider(0)}
      {children[1]}
      {renderDivider(1)}
      {children[2]}
      {/* iframe 위에서도 드래그가 끊기지 않고 페이지의 텍스트가 선택되지 않도록 막는다. */}
      {activeDivider !== null && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-50 cursor-col-resize touch-none select-none"
        />
      )}
    </div>
  );
};
