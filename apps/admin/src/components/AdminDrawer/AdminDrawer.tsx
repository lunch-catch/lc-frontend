import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import { ScrollArea } from '@admin/components/ScrollArea/ScrollArea';

export interface AdminDrawerProps {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
  title: string;
  width?: number;
  resizable?: boolean;
}

const minDrawerWidth = 400;
const maxDrawerWidth = 720;
const keyboardResizeStep = 16;

// 같은 마스크를 겹쳐 손잡이 외곽선과 내부 배경의 곡선이 어긋나지 않게 한다.
const resizeHandleMask: CSSProperties = {
  maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 80'%3E%3Cpath fill='white' d='M20 0 Q20 3 17 6 L3 20 Q0 22 0 26 L0 54 Q0 58 3 60 L17 74 Q20 77 20 80 Z'/%3E%3C/svg%3E")`,
  maskSize: '100% 100%',
  maskRepeat: 'no-repeat',
};

// 좁은 화면에서는 최소 너비보다 뷰포트 너비를 우선한다.
const clampDrawerWidth = (value: number) =>
  Math.max(
    Math.min(minDrawerWidth, window.innerWidth),
    Math.min(maxDrawerWidth, window.innerWidth, value),
  );

export const AdminDrawer = ({
  children,
  open,
  onClose,
  title,
  width = 560,
  resizable = false,
}: AdminDrawerProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const [visible, setVisible] = useState(false);
  const [resizedWidth, setResizedWidth] = useState<number>();
  const resizeCleanupRef = useRef<(() => void) | null>(null);

  const handleResizeStart = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    resizeCleanupRef.current?.();
    const startX = event.clientX;
    const startWidth =
      event.currentTarget.parentElement?.getBoundingClientRect().width ?? width;
    let frame: number | undefined;
    let nextWidth = startWidth;
    const applyWidth = () => {
      frame = undefined;
      setResizedWidth(nextWidth);
    };
    const move = (pointer: globalThis.PointerEvent) => {
      nextWidth = clampDrawerWidth(startWidth + startX - pointer.clientX);
      // 포인터 이동을 프레임 단위로 반영해 드래그 중 불필요한 렌더링을 줄인다.
      if (frame === undefined) frame = window.requestAnimationFrame(applyWidth);
    };
    const cleanup = () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      resizeCleanupRef.current = null;
    };
    const finish = () => {
      // 드래그 종료 직전의 이동도 반영한 뒤 프레임과 이벤트 리스너를 정리한다.
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      applyWidth();
      cleanup();
    };
    resizeCleanupRef.current = cleanup;
    event.currentTarget.setPointerCapture(event.pointerId);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  };

  const handleResizeKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const currentWidth =
      event.currentTarget.parentElement?.getBoundingClientRect().width ?? width;
    const delta =
      event.key === 'ArrowLeft' ? keyboardResizeStep : -keyboardResizeStep;
    setResizedWidth(clampDrawerWidth(currentWidth + delta));
  };

  useEffect(() => () => resizeCleanupRef.current?.(), []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!open) resizeCleanupRef.current?.();
    let nextFrame: number | undefined;
    let closeTimer: number | undefined;
    // native dialog가 배경 상호작용을 차단하고 키보드 포커스를 패널 안에 가둔다.
    if (open && !dialog.open) {
      dialog.showModal();
      titleRef.current?.focus({ preventScroll: true });
    }
    const frame = window.requestAnimationFrame(() => {
      // 화면 밖 초기 위치가 먼저 그려져야 진입 transition이 실행된다.
      nextFrame = window.requestAnimationFrame(() => setVisible(open));
      if (!open) {
        // 퇴장 transition 동안 dialog를 유지하고, 동작 줄이기 설정에서는 즉시 닫는다.
        const reducedMotion = window.matchMedia(
          '(prefers-reduced-motion: reduce)',
        ).matches;
        closeTimer = window.setTimeout(
          () => dialog.close(),
          reducedMotion ? 0 : 200,
        );
      }
    });
    return () => {
      window.cancelAnimationFrame(frame);
      if (nextFrame !== undefined) window.cancelAnimationFrame(nextFrame);
      if (closeTimer !== undefined) window.clearTimeout(closeTimer);
    };
  }, [open]);

  return (
    <dialog
      aria-labelledby={titleId}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-text-primary backdrop:bg-black/40"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      ref={dialogRef}
    >
      <div
        className={`absolute inset-y-0 right-0 flex max-w-full flex-col border-l border-border-subtle bg-bg-surface shadow-lg transition-transform duration-200 ease-out motion-reduce:transition-none ${visible ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ width: resizedWidth ?? width }}
      >
        {resizable && (
          <button
            aria-label="상세 패널 너비 조절"
            className="absolute -left-5 top-1/2 z-20 flex h-20 w-5 -translate-y-1/2 cursor-col-resize touch-none select-none items-center justify-center bg-border-subtle text-text-tertiary transition-colors hover:text-text-secondary active:text-action-primary focus-visible:bg-action-primary focus-visible:outline-none motion-reduce:transition-none"
            style={resizeHandleMask}
            onPointerDown={handleResizeStart}
            onKeyDown={handleResizeKeyDown}
            type="button"
            title="드래그하거나 좌우 방향키로 너비 조절"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-px left-px right-0 bg-bg-surface"
              style={resizeHandleMask}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none relative flex items-center gap-0.5"
            >
              <span className="h-4 w-px rounded-full bg-current" />
              <span className="h-4 w-px rounded-full bg-current" />
            </span>
          </button>
        )}
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border-subtle px-6 py-4">
          <h2
            className="text-title-sm-web font-semibold outline-none"
            id={titleId}
            ref={titleRef}
            tabIndex={-1}
          >
            {title}
          </h2>
        </header>
        <ScrollArea className="p-6">{children}</ScrollArea>
      </div>
    </dialog>
  );
};
