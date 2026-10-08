import { useEffect, useRef, useState } from 'react';
import { Button } from '@repo/ui';
import { Eye, EyeOff, GripVertical, SlidersHorizontal } from 'lucide-react';

import { AdminModal } from '@admin/components/AdminModal/AdminModal';
import { ScrollArea } from '@admin/components/ScrollArea/ScrollArea';

import type { TableColumnPreference } from './dataTableTypes';
import { type FieldDropTarget, useTableFieldDrag } from './useTableFieldDrag';

interface ColumnSettingsProps {
  fields: { key: string; label: string }[];
  preferences: TableColumnPreference[];
  onApply: (next: TableColumnPreference[]) => void;
}

interface SettingsEditorProps extends ColumnSettingsProps {
  onClose: () => void;
}

const minimumFieldMessage = '최소 한 개의 필드를 표시해야 합니다.';

const SettingsEditor = ({
  fields,
  preferences,
  onApply,
  onClose,
}: SettingsEditorProps) => {
  const [draft, setDraft] = useState(() => [
    ...preferences.filter((field) => field.visible),
    ...preferences.filter((field) => !field.visible),
  ]);
  const [error, setError] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const labels = new Map(fields.map((field) => [field.key, field.label]));
  const visibleCount = draft.filter((field) => field.visible).length;
  const move = (key: string, target: FieldDropTarget) => {
    const field = draft.find((item) => item.key === key);
    if (!field) return false;
    if (field.visible && !target.visible && visibleCount === 1) {
      setError(minimumFieldMessage);
      return false;
    }
    const remaining = draft.filter((item) => item.key !== key);
    const destination = remaining.filter(
      (item) => item.visible === target.visible,
    );
    const position = Math.max(0, Math.min(target.index, destination.length));
    destination.splice(position, 0, { ...field, visible: target.visible });
    const other = remaining.filter((item) => item.visible !== target.visible);
    setDraft(
      target.visible ? [...destination, ...other] : [...other, ...destination],
    );
    setError('');
    return true;
  };
  const {
    containerRef,
    listHeight,
    drag,
    start,
    update,
    finish,
    cancel,
    resetListHeight,
    getTransform,
  } = useTableFieldDrag(draft, move);
  const lastFieldDropBlocked =
    visibleCount === 1 &&
    drag?.target?.visible === false &&
    draft.find((field) => field.key === drag?.key)?.visible === true;
  const errorMessage = lastFieldDropBlocked ? minimumFieldMessage : error;
  useEffect(() => {
    const dialog = contentRef.current?.closest('[role="dialog"]');
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), [tabindex="0"]',
        ) ?? [],
      );
    focusable()[0]?.focus();
    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const items = focusable();
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    dialog?.addEventListener('keydown', handleTab as EventListener);
    return () =>
      dialog?.removeEventListener('keydown', handleTab as EventListener);
  }, []);
  return (
    <div ref={contentRef} className="space-y-4">
      <p className="text-caption-web text-text-secondary">
        필드를 드래그해 순서를 바꾸거나, 구역 사이로 옮겨 표시하거나 숨길 수
        있습니다. 적용 버튼을 눌러야 변경 사항이 반영됩니다.
      </p>
      <ScrollArea
        ref={containerRef}
        className="max-h-[55dvh] space-y-4 p-1"
        style={{
          height: listHeight
            ? `min(calc(${listHeight}px + var(--space-2)), 55dvh)`
            : undefined,
        }}
      >
        {[true, false].map((visible) => {
          const group = draft.filter((field) => field.visible === visible);
          const active = drag?.target?.visible === visible;
          const sourceField = draft.find((field) => field.key === drag?.key);
          const blocked =
            !visible && visibleCount === 1 && sourceField?.visible;
          const reserveDropSpace =
            active && !blocked && sourceField?.visible !== visible;
          const movingBetweenGroups =
            drag?.target &&
            sourceField?.visible !== drag.target.visible &&
            !(
              sourceField?.visible &&
              !drag.target.visible &&
              visibleCount === 1
            );
          const releaseSourceSpace =
            movingBetweenGroups && sourceField?.visible === visible;
          return (
            <section
              key={String(visible)}
              data-field-group={visible ? 'visible' : 'hidden'}
              aria-label={visible ? '표시 중인 필드' : '숨긴 필드'}
              className={
                'rounded-lg p-2 transition-colors motion-reduce:transition-none ' +
                (visible
                  ? ''
                  : 'border border-dashed border-border-subtle bg-bg-page ') +
                (!visible && group.length === 0
                  ? 'sticky bottom-0 z-20 '
                  : '') +
                (active && blocked ? 'ring-2 ring-status-danger-fg' : '')
              }
            >
              <h3 className="mb-2 flex items-center gap-2 text-caption-web font-medium text-text-secondary">
                {visible ? (
                  <Eye
                    className="size-4 text-[var(--primitive-neutral-400)]"
                    aria-hidden="true"
                  />
                ) : (
                  <EyeOff
                    className="size-4 text-[var(--primitive-neutral-400)]"
                    aria-hidden="true"
                  />
                )}
                {visible ? '표시 중인 필드' : '숨긴 필드'}
                <span className="text-text-tertiary">{group.length}</span>
              </h3>
              <ul
                className="space-y-1"
                style={{
                  paddingBottom: reserveDropSpace ? drag?.stride : undefined,
                  marginBottom: releaseSourceSpace
                    ? -(drag?.stride ?? 0)
                    : undefined,
                }}
                aria-label={visible ? '표시 필드 순서' : '숨긴 필드 목록'}
              >
                {group.map((item, index) => (
                  <li
                    key={item.key}
                    data-column-key={item.key}
                    data-visible={String(item.visible)}
                    style={{ transform: getTransform(item, index) }}
                    className={
                      'relative flex items-center gap-2 rounded-md border border-border-subtle bg-bg-surface p-1 motion-reduce:transition-none ' +
                      (drag?.key === item.key
                        ? 'z-30 border-action-primary shadow-lg'
                        : drag
                          ? 'transition-transform duration-200 ease-out'
                          : '')
                    }
                  >
                    <button
                      type="button"
                      aria-label={labels.get(item.key) + ' 순서 드래그'}
                      title="드래그 또는 위·아래 방향키로 순서 변경"
                      onKeyDown={(event) => {
                        if (
                          event.key !== 'ArrowUp' &&
                          event.key !== 'ArrowDown'
                        )
                          return;
                        event.preventDefault();
                        const nextIndex =
                          index + (event.key === 'ArrowUp' ? -1 : 1);
                        if (nextIndex >= 0 && nextIndex < group.length)
                          move(item.key, { visible, index: nextIndex });
                      }}
                      className="shrink-0 touch-none cursor-grab rounded-sm p-1 text-text-secondary active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-action-primary"
                      onPointerDown={(event) => start(item.key, event)}
                      onPointerMove={update}
                      onPointerUp={finish}
                      onPointerCancel={cancel}
                    >
                      <GripVertical aria-hidden="true" className="size-4" />
                    </button>
                    <span
                      className={
                        'min-w-0 flex-1 truncate text-caption-web ' +
                        (item.visible
                          ? 'text-text-primary'
                          : 'text-text-tertiary')
                      }
                    >
                      {labels.get(item.key) ?? item.key}
                    </span>
                  </li>
                ))}
              </ul>
              {group.length === 0 && (
                <p className="py-2 text-center text-caption-web text-text-tertiary">
                  {visible
                    ? '표시할 필드를 여기로 드래그하세요'
                    : '숨길 필드를 여기로 드래그하세요'}
                </p>
              )}
            </section>
          );
        })}
      </ScrollArea>
      <div className="flex items-center justify-end gap-2">
        <p
          role="alert"
          className="mr-auto text-caption-web text-status-danger-fg"
        >
          {errorMessage}
        </p>
        <Button
          variant="neutral"
          onClick={() => {
            setDraft(fields.map(({ key }) => ({ key, visible: true })));
            setError('');
            resetListHeight();
          }}
        >
          기본값 복원
        </Button>
        <Button
          onClick={() => {
            onApply(draft);
            onClose();
          }}
        >
          적용
        </Button>
      </div>
    </div>
  );
};

export const TableColumnSettings = (props: ColumnSettingsProps) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label="필드 설정"
        title="필드 설정"
        className="inline-flex size-10 items-center justify-center rounded-md border border-border-subtle bg-bg-surface text-text-secondary hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-action-primary"
      >
        <SlidersHorizontal aria-hidden="true" className="size-4" />
      </button>
      <AdminModal open={open} onClose={close} title="테이블 필드 설정">
        {open && <SettingsEditor {...props} onClose={close} />}
      </AdminModal>
    </>
  );
};
