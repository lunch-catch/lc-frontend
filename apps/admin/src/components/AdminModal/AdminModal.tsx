import { type ReactNode, useEffect, useId } from 'react';
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

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return createPortal(
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 text-text-primary"
      role="dialog"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
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
    </div>,
    document.body,
  );
};
