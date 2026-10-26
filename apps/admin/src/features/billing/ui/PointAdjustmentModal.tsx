import { useId, useRef, useState } from 'react';
import { Button, DatePicker, Input, SegmentedControl } from '@repo/ui';
import { formatPoints } from '@repo/utils';

import { ApiError } from '@admin/api/client';
import { adjustPoints } from '@admin/api/pointAdjustments';
import type { SettlementMismatch } from '@admin/api/settlementMismatches';
import { getKstToday } from '@admin/hooks/queryDateUtils';
import { AdminModal } from '@admin/ui/AdminModal/AdminModal';

import {
  campaignDeductionError,
  getPointAdjustmentError,
  mismatchGuidance,
} from '../billingManagementUtils';
import { useBillingMutation } from '../useBillingMutation';

interface PointAdjustmentModalProps {
  ownerId?: string;
  mismatch?: SettlementMismatch;
  onClose: () => void;
  onSaved: (ledgerId: number) => void;
}
export const PointAdjustmentModal = ({
  ownerId = '',
  mismatch,
  onClose,
  onSaved,
}: PointAdjustmentModalProps) => {
  const amountHintId = useId();
  // 캠페인 대상 두 유형은 정정 시 targetId와 동일한 campaignId가 필요하다.
  const campaignRequired =
    mismatch !== undefined && mismatch.checkType !== 'PG_VS_CHARGE';
  // 결제 불일치는 캠페인과 무관하므로 입력 UI와 요청 필드에서 모두 제외한다.
  const campaignApplicable = !mismatch || campaignRequired;
  // 대상 ID는 결제 또는 캠페인 ID이므로 점주를 추측하지 않고 서버의 ownerId를 사용한다.
  const [owner, setOwner] = useState(
    mismatch ? String(mismatch.ownerId ?? '') : ownerId,
  );
  const [campaign, setCampaign] = useState(
    campaignRequired ? String(mismatch.targetId) : '',
  );
  const [targetBusinessDate, setTargetBusinessDate] = useState(
    campaignRequired ? mismatch.businessDate : '',
  );
  // 차액에는 캐시 차이도 포함되므로 실제 조정액을 추정해 미리 채우지 않는다.
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'increase' | 'decrease'>(
    'increase',
  );
  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState(false);
  const kstToday = getKstToday();
  const pendingRequest = useRef<{ key: string; requestId: string } | null>(
    null,
  );
  const mutation = useBillingMutation();
  // 사용자는 크기만 입력하고 부호는 조정 방식으로 결정한다.
  const isDeduction = direction === 'decrease';
  const signedAmount = isDeduction && amount ? `-${amount}` : amount;
  const commonValues = {
    ownerId: Number(owner),
    amount: Number(signedAmount),
    reason: reason.trim(),
    // 서버가 이 조정과 불일치를 연결해 해결 처리하도록 함께 전달한다.
    ...(mismatch ? { mismatchId: mismatch.mismatchId } : {}),
  };
  // 조건부 객체 전개 대신 요청을 분기해 ID·영업일의 타입 관계를 유지한다.
  const values =
    campaignApplicable && campaign
      ? { ...commonValues, campaignId: Number(campaign), targetBusinessDate }
      : commonValues;
  const submit = () => {
    if (!/^\d+$/.test(amount)) {
      mutation.setError(
        '조정 포인트는 부호 없이 0보다 큰 정수로 입력해 주세요.',
      );
      return;
    }
    const error = getPointAdjustmentError({
      ownerId: owner,
      campaignId: campaignApplicable ? campaign : '',
      targetBusinessDate: campaignApplicable ? targetBusinessDate : '',
      amount: signedAmount,
      reason,
      mismatchCheckType: mismatch?.checkType,
      mismatchExcess: mismatch
        ? mismatch.actualValue - mismatch.expectedValue
        : undefined,
    });
    if (error) {
      mutation.setError(error);
      return;
    }
    if (!confirming) {
      setConfirming(true);
      return;
    }
    const key = JSON.stringify(values);
    // 결과를 받지 못한 같은 조정을 다시 제출해도 원장은 한 번만 기록한다.
    if (pendingRequest.current?.key !== key)
      pendingRequest.current = { key, requestId: crypto.randomUUID() };
    const requestId = pendingRequest.current.requestId;
    void mutation.run(
      () => adjustPoints({ ...values, requestId }),
      (result) => onSaved(result.ledgerId),
      (cause) => {
        if (
          mismatch &&
          cause instanceof ApiError &&
          cause.status === 400 &&
          cause.code === 'COMMON-002'
        ) {
          mutation.setError(
            mismatch.checkType === 'PG_VS_CHARGE'
              ? '결제 승인액과 해당 결제의 실제 충전 원장을 다시 확인해 정확한 조정 금액을 입력해 주세요.'
              : mismatch.checkType === 'CAMPAIGN_SPEND_VS_LEDGER'
                ? '이 불일치는 포인트 조정 없이 종결해야 합니다.'
                : isDeduction
                  ? campaignDeductionError
                  : '실제 초과 차감액 이하의 지급 금액인지 다시 확인해 주세요.',
          );
        }
      },
    );
  };
  return (
    <AdminModal
      open
      onClose={() => {
        if (!mutation.busy) onClose();
      }}
      title={mismatch ? '정산 불일치 정정' : '포인트 수동 조정'}
      size={mismatch ? 'wide' : 'default'}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className={`max-h-[calc(100dvh-10rem)] overflow-y-auto ${mismatch ? 'space-y-3' : 'space-y-4'}`}
      >
        {mismatch && (
          <div className="space-y-2 text-caption-web leading-5 text-text-secondary">
            <p className="font-medium text-text-primary">
              차이 값은 조정 금액이 아닙니다. 원인 확인 후 필요한 금액만
              입력하세요.
            </p>
            <p>{mismatchGuidance[mismatch.checkType]}</p>
          </div>
        )}
        {confirming ? (
          <dl className="space-y-2 text-body-sm-web">
            <div className="flex justify-between">
              <dt>점주 ID</dt>
              <dd>{owner}</dd>
            </div>
            <div className="flex justify-between">
              <dt>조정 방식</dt>
              <dd>{isDeduction ? '차감 · 잔액 감소' : '지급 · 잔액 증가'}</dd>
            </div>
            <div className="flex justify-between">
              <dt>조정 포인트</dt>
              <dd
                className={
                  isDeduction
                    ? 'text-status-danger-fg'
                    : 'text-action-primary-text'
                }
              >
                {isDeduction ? '' : '+'}
                {formatPoints(Number(signedAmount))}
              </dd>
            </div>
            {campaignApplicable && campaign && (
              <div className="flex justify-between">
                <dt>캠페인 ID</dt>
                <dd>{campaign}</dd>
              </div>
            )}
            {campaignApplicable && campaign && (
              <div className="flex justify-between">
                <dt>대상 영업일</dt>
                <dd>{targetBusinessDate}</dd>
              </div>
            )}
            <div>
              <dt className="text-text-secondary">조정 사유</dt>
              <dd className="mt-1 break-words">{reason}</dd>
            </div>
          </dl>
        ) : (
          <>
            <Input
              label="점주 ID"
              required
              inputMode="numeric"
              value={owner}
              disabled={Boolean(mismatch)}
              onChange={(event) => {
                setOwner(event.target.value);
                mutation.setError('');
              }}
            />
            <fieldset className="min-w-0">
              <legend className="mb-2 text-caption-web font-medium text-text-primary">
                조정 포인트
                <span aria-hidden="true" className="ml-1 text-status-danger-fg">
                  *
                </span>
              </legend>
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
                <SegmentedControl
                  ariaLabel="포인트 조정 방식"
                  items={[
                    { label: '지급 (+)', value: 'increase' },
                    {
                      label: '차감 (−)',
                      value: 'decrease',
                      disabled: campaignRequired,
                    },
                  ]}
                  value={direction}
                  onValueChange={(value) => {
                    if (campaignRequired && value === 'decrease') return;
                    setDirection(value);
                    mutation.setError('');
                  }}
                />
                <Input
                  aria-label="조정 포인트"
                  aria-describedby={amountHintId}
                  required
                  inputMode="numeric"
                  value={amount}
                  leadingIcon={
                    <span
                      aria-hidden="true"
                      className="flex size-4 items-center justify-center text-body-sm-web leading-none"
                    >
                      {isDeduction ? '−' : '+'}
                    </span>
                  }
                  trailing="P"
                  onChange={(event) => {
                    setAmount(event.target.value);
                    mutation.setError('');
                  }}
                />
              </div>
              <p
                id={amountHintId}
                className="mt-1 text-caption-web text-text-secondary"
              >
                {isDeduction
                  ? '입력한 포인트만큼 점주의 잔액이 줄어듭니다.'
                  : '입력한 포인트만큼 점주의 잔액이 늘어납니다.'}
                {campaignRequired && ' 캠페인 관련 불일치는 지급만 가능합니다.'}
              </p>
            </fieldset>
            {campaignApplicable && (
              <div
                className={`grid items-start gap-3 ${campaignRequired ? 'sm:grid-cols-2' : ''}`}
              >
                <Input
                  label={campaignRequired ? '캠페인 ID' : '캠페인 ID (선택)'}
                  required={campaignRequired}
                  inputMode="numeric"
                  value={campaign}
                  disabled={campaignRequired}
                  onChange={(event) => {
                    setCampaign(event.target.value);
                    if (!event.target.value) setTargetBusinessDate('');
                    mutation.setError('');
                  }}
                />
                {campaign && (
                  <div className="space-y-1.5">
                    <p className="text-caption-web font-medium text-text-primary">
                      대상 영업일{' '}
                      <span aria-hidden className="text-status-danger-fg">
                        *
                      </span>
                    </p>
                    <DatePicker
                      maxDate={kstToday}
                      todayDate={kstToday}
                      ariaLabel="대상 영업일"
                      value={targetBusinessDate}
                      disabled={campaignRequired}
                      onValueChange={(value) => {
                        setTargetBusinessDate(value);
                        mutation.setError('');
                      }}
                    />
                    {!campaignRequired && (
                      <p className="text-caption-web text-text-secondary">
                        조정할 원래 영업일을 선택해 주세요. 오늘(한국 시간)까지
                        가능합니다.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            <Input
              label="조정 사유"
              required
              minLength={1}
              value={reason}
              maxLength={255}
              placeholder="포인트를 조정하는 이유를 입력하세요"
              onChange={(event) => {
                setReason(event.target.value);
                mutation.setError('');
              }}
            />
          </>
        )}
        {mutation.error && (
          <p role="alert" className="text-caption-web text-status-danger-fg">
            {mutation.error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            variant="neutral"
            disabled={mutation.busy}
            onClick={() => {
              if (confirming) {
                setConfirming(false);
                mutation.setError('');
              } else onClose();
            }}
          >
            {confirming ? '수정' : '취소'}
          </Button>
          <Button type="submit" isLoading={mutation.busy}>
            {confirming ? '조정 확정' : '내용 확인'}
          </Button>
        </div>
      </form>
    </AdminModal>
  );
};
