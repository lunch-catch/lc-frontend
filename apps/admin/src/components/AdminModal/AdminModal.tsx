import { type ReactNode, useId, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface AdminModalProps {
  children: ReactNode;
  onClose: () => void;
  open: boolean;
  title: string;
}

export const AdminModal = ({
  children,
  onClose,
  open,
  title,
}: AdminModalProps) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;

    // 패널도 native dialog이므로 일반 z-index 대신 같은 최상위 레이어에 나중에 올린다.
    // 브라우저가 배경 상호작용 차단과 모달 안의 포커스 이동·닫힌 뒤 포커스 복원을 담당한다.
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <dialog
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-4 text-text-primary outline-none backdrop:bg-black/40 open:flex open:items-center open:justify-center"
      ref={dialogRef}
      onCancel={(event) => {
        // 모달에서 Escape를 눌러도 아래에 있는 상세 패널까지 닫히지 않게 한다.
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-xl border border-border-subtle bg-bg-surface shadow-lg">
        <header className="relative flex justify-center px-5 pb-2 pt-5">
          <h2
            className="translate-y-px text-heading-sm-web font-semibold"
            id={titleId}
          >
            {title}
          </h2>
          <button
            aria-label="모달 닫기"
            className="absolute right-5 top-4 flex size-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </dialog>,
    document.body,
  );
};
