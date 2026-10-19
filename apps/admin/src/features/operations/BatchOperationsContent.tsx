import { useRef, useState } from 'react';
import { Button, DatePicker, Input } from '@repo/ui';
import { formatDate } from '@repo/utils';

import {
  type BatchRetryReceipt,
  retryBatchExecution,
} from '@admin/api/batchOperations';
import { ApiError } from '@admin/api/client';
import { AdminModal } from '@admin/ui/AdminModal/AdminModal';

const getRetryError = (cause: unknown) => {
  if (!(cause instanceof ApiError))
    return '재실행 요청을 보내지 못했습니다. 연결 상태를 확인해 주세요.';
  if (cause.code === 'OPS-001')
    return '수동 재실행을 지원하지 않는 작업입니다. 작업명을 확인해 주세요.';
  if (cause.code === 'OPS-002')
    return '해당 작업명과 영업일의 실행 기록이 없습니다.';
  if (cause.code === 'OPS-003')
    return '실패로 확정된 작업만 재실행할 수 있습니다. 실행 중이거나 이미 완료된 작업인지 확인해 주세요.';
  return cause.message;
};
export const BatchOperationsContent = () => {
  const [jobName, setJobName] = useState('DAILY_0000');
  const [businessDate, setBusinessDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [target, setTarget] = useState<{
    jobName: string;
    businessDate: string;
  } | null>(null);
  const [receipt, setReceipt] = useState<BatchRetryReceipt | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const close = () => {
    if (!pendingRef.current) setTarget(null);
  };
  const retry = async () => {
    if (!target || pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setError('');
    setReceipt(null);
    try {
      const result = await retryBatchExecution(
        target.jobName,
        target.businessDate,
      );
      setReceipt(result);
      setTarget(null);
    } catch (cause) {
      setError(getRetryError(cause));
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  };
  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-display-web font-semibold">배치 운영</h2>
        <p className="mt-2 text-body-sm-web text-text-secondary">
          실패로 확정된 배치 작업을 다시 실행합니다. 정확한 작업명과 대상
          영업일을 입력해 주세요.
        </p>
      </header>
      <form
        className="max-w-xl space-y-4 rounded-xl border border-border-subtle bg-bg-surface p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (!jobName.trim() || pendingRef.current) return;
          if (!businessDate) {
            setDateError('영업일을 선택해 주세요.');
            event.currentTarget
              .querySelector<HTMLButtonElement>(
                '[aria-label="영업일 선택 (필수)"]',
              )
              ?.focus();
            return;
          }
          setDateError('');
          setError('');
          setTarget({ jobName: jobName.trim(), businessDate });
        }}
      >
        <Input
          label="작업명"
          required
          pattern=".*\S.*"
          title="공백을 제외한 작업명을 입력해 주세요."
          value={jobName}
          disabled={pending}
          onChange={(event) => setJobName(event.target.value)}
          helperText="00:00 묶음의 작업명은 DAILY_0000입니다. 다른 작업은 등록된 정확한 작업명을 입력해 주세요."
        />
        <fieldset className="min-w-0 space-y-2">
          <legend className="mb-2 text-caption-web font-medium text-text-primary">
            영업일
            <span aria-hidden="true" className="ml-1 text-status-danger-fg">
              *
            </span>
          </legend>
          <DatePicker
            ariaLabel="영업일 선택 (필수)"
            placeholder="영업일 선택"
            value={businessDate}
            disabled={pending}
            onValueChange={(value) => {
              setBusinessDate(value);
              setDateError('');
            }}
          />
          <p
            role={dateError ? 'alert' : undefined}
            className={`ml-1 text-caption-web ${dateError ? 'text-status-danger-fg' : 'text-text-secondary'}`}
          >
            {dateError || '작업이 실패한 대상 영업일을 선택해 주세요.'}
          </p>
        </fieldset>
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            재실행 요청
          </Button>
        </div>
      </form>
      {receipt && (
        <div
          role="status"
          className="max-w-xl space-y-2 rounded-xl border border-status-success-border bg-status-success-bg p-5 text-status-success-fg"
        >
          <p className="font-semibold">재실행 요청이 접수되었습니다.</p>
          <p className="text-body-sm-web">
            {receipt.jobName} · {formatDate(receipt.businessDate)} · 실행 ID{' '}
            {receipt.runId}
          </p>
          <p className="text-caption-web">
            접수 시점의 상태는 실행 중입니다. 접수 성공은 작업 완료를 의미하지
            않습니다.
          </p>
        </div>
      )}
      <AdminModal
        open={target !== null}
        onClose={close}
        title="배치 재실행 확인"
      >
        <div className="space-y-4 px-5 pb-5 pt-3">
          <p className="text-body-sm-web">
            <strong>{target?.jobName}</strong> 작업의{' '}
            <strong>{formatDate(target?.businessDate)}</strong> 영업일을
            재실행할까요?
          </p>
          <p className="text-caption-web text-text-secondary">
            실패로 확정된 작업만 다시 실행합니다. 요청이 접수되면 작업이
            백그라운드에서 실행됩니다.
          </p>
          {error && (
            <p role="alert" className="text-body-sm-web text-status-danger-fg">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="neutral" disabled={pending} onClick={close}>
              취소
            </Button>
            <Button isLoading={pending} onClick={() => void retry()}>
              재실행
            </Button>
          </div>
        </div>
      </AdminModal>
    </section>
  );
};
