import { useEffect, useRef, useState } from 'react';
import { Button, DatePicker, StatusBadge } from '@repo/ui';
import { formatDate, formatDateTime, formatNumber } from '@repo/utils';

import {
  getAggregationRun,
  recalculateAggregation,
  type RecalculationReceipt,
} from '@admin/api/aggregations';
import { queryDate } from '@admin/hooks/urlQuery';
import { useApiResource } from '@admin/hooks/useApiResource';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';
import { AdminModal } from '@admin/ui/AdminModal/AdminModal';

import {
  getRecalculationDateError,
  getRecalculationError,
} from './aggregationUtils';

const statuses = {
  RUNNING: { label: '실행 중', variant: 'warning' },
  SUCCESS: { label: '성공', variant: 'success' },
  FAILED: { label: '실패', variant: 'danger' },
} as const;

export const AggregationOperationsSection = () => {
  const { filters, updateFilters } = useUrlFilters('aggregation.', {
    businessDate: queryDate(),
  });
  const { businessDate } = filters;
  const query = businessDate
    ? new URLSearchParams({ businessDate }).toString()
    : null;
  const resource = useApiResource(getAggregationRun, query);
  const dateError = getRecalculationDateError(businessDate);
  const [target, setTarget] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<RecalculationReceipt | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const busyRef = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const close = () => {
    if (!busyRef.current) setTarget(null);
  };
  const submit = async () => {
    if (!target || busyRef.current || getRecalculationDateError(target)) return;
    busyRef.current = true;
    setPending(true);
    setError('');
    setReceipt(null);
    try {
      const result = await recalculateAggregation(target);
      if (!mounted.current) return;
      setReceipt(result);
      setTarget(null);
      resource.refresh();
    } catch (cause) {
      if (mounted.current) {
        setError(getRecalculationError(cause));
        resource.refresh();
      }
    } finally {
      busyRef.current = false;
      if (mounted.current) setPending(false);
    }
  };
  const run = resource.data;
  const currentReceipt =
    receipt?.businessDate === businessDate ? receipt : null;
  return (
    <section className="space-y-4" aria-label="통계 집계 운영">
      <header className="space-y-2">
        <h3 className="text-heading-sm-web font-semibold">통계 집계</h3>
        <p className="text-body-sm-web text-text-secondary">
          영업일별 집계 상태를 확인하고 통계를 다시 집계합니다.
        </p>
      </header>
      <div className="flex max-w-2xl flex-wrap items-end gap-3">
        <fieldset className="w-full max-w-xs space-y-2">
          <legend className="mb-2 text-caption-web font-medium">
            집계 영업일
          </legend>
          <DatePicker
            ariaLabel="집계 영업일 선택"
            placeholder="영업일 선택"
            value={businessDate}
            onValueChange={(value) => {
              updateFilters({ businessDate: value });
              setError('');
            }}
          />
        </fieldset>
        <Button
          variant="neutral"
          disabled={!businessDate || resource.loading || pending}
          onClick={resource.refresh}
        >
          상태 다시 확인
        </Button>
        <Button
          disabled={Boolean(dateError) || run?.status === 'RUNNING' || pending}
          onClick={() => {
            setError('');
            setTarget(businessDate);
          }}
        >
          재집계 요청
        </Button>
      </div>
      <p className="text-caption-web text-text-secondary">
        {dateError ||
          '어제까지, 최근 13개월 이내의 영업일을 재집계할 수 있습니다.'}
      </p>
      {currentReceipt && (
        <p role="status" className="text-body-sm-web text-status-success-fg">
          {formatDate(currentReceipt.businessDate)} 재집계 요청이
          접수되었습니다. 실행 ID {currentReceipt.runId} · 완료 여부는 실행
          상태를 확인해 주세요.
        </p>
      )}
      <div className="max-w-2xl rounded-xl border border-border-subtle bg-bg-surface p-5">
        {!businessDate ? (
          <p className="text-body-sm-web text-text-secondary">
            영업일을 선택하면 집계 실행 상태를 조회합니다.
          </p>
        ) : resource.loading ? (
          <p role="status" className="text-body-sm-web text-text-secondary">
            집계 실행 상태를 불러오는 중입니다.
          </p>
        ) : resource.error ? (
          <p role="alert" className="text-body-sm-web text-status-danger-fg">
            {resource.error}
          </p>
        ) : !run ? (
          <p className="text-body-sm-web text-text-secondary">
            해당 영업일의 집계 실행 기록이 없습니다.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-semibold">
                {formatDate(run.businessDate)} 집계
              </h4>
              <StatusBadge variant={statuses[run.status].variant}>
                {statuses[run.status].label}
              </StatusBadge>
            </div>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-3 text-body-sm-web">
              <dt className="text-text-secondary">실행 ID</dt>
              <dd>{run.runId}</dd>
              <dt className="text-text-secondary">시작 시각</dt>
              <dd>{formatDateTime(run.startedAt)}</dd>
              <dt className="text-text-secondary">종료 시각</dt>
              <dd>{formatDateTime(run.finishedAt)}</dd>
              <dt className="text-text-secondary">처리 행 수</dt>
              <dd>
                {run.processedCount === null
                  ? '—'
                  : formatNumber(run.processedCount)}
              </dd>
              <dt className="text-text-secondary">실행 서버</dt>
              <dd className="break-all">{run.executedBy ?? '—'}</dd>
              <dt className="text-text-secondary">자동 재시도</dt>
              <dd>{run.retryCount}회</dd>
            </dl>
            {run.failureReason && (
              <p className="whitespace-pre-wrap break-words text-body-sm-web text-status-danger-fg">
                실패 사유: {run.failureReason}
              </p>
            )}
          </div>
        )}
      </div>
      <AdminModal
        open={target !== null}
        onClose={close}
        title="통계 재집계 확인"
      >
        <div className="space-y-4">
          <p className="text-body-sm-web">
            {formatDate(target)} 통계를 다시 집계할까요?
          </p>
          <p className="text-caption-web text-text-secondary">
            이미 집계가 완료된 날짜도 다시 계산합니다. 접수 후 실행 상태를
            확인해 주세요.
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
            <Button isLoading={pending} onClick={() => void submit()}>
              재집계
            </Button>
          </div>
        </div>
      </AdminModal>
    </section>
  );
};
