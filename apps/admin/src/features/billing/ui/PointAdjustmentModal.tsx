import { useRef, useState } from 'react';
import { Button, DatePicker, Input } from '@repo/ui';
import { formatPoints } from '@repo/utils';

import { adjustPoints } from '@admin/api/pointAdjustments';
import type { SettlementMismatch } from '@admin/api/settlementMismatches';
import { getKstToday } from '@admin/hooks/queryDateUtils';
import { AdminModal } from '@admin/ui/AdminModal/AdminModal';

import { getPointAdjustmentError } from '../billingManagementUtils';
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
  // 캠페인 대상 두 유형은 정정 시 targetId와 동일한 campaignId가 필요하다.
  const campaignRequired =
    mismatch !== undefined && mismatch.checkType !== 'PG_VS_CHARGE';
  const [owner, setOwner] = useState(ownerId);
  const [campaign, setCampaign] = useState(
    campaignRequired ? String(mismatch.targetId) : '',
  );
  const [targetBusinessDate, setTargetBusinessDate] = useState(
    campaignRequired ? mismatch.businessDate : '',
  );
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState(false);
  const pendingRequest = useRef<{ key: string; requestId: string } | null>(
    null,
  );
  const mutation = useBillingMutation();
  const commonValues = {
    ownerId: Number(owner),
    amount: Number(amount),
    reason: reason.trim(),
    ...(mismatch ? { mismatchId: mismatch.mismatchId } : {}),
  };
  // 조건부 객체 전개 대신 요청을 분기해 ID·영업일의 타입 관계를 유지한다.
  const values = campaign
    ? { ...commonValues, campaignId: Number(campaign), targetBusinessDate }
    : commonValues;
  const submit = () => {
    const error = getPointAdjustmentError({
      ownerId: owner,
      campaignId: campaign,
      targetBusinessDate,
      amount,
      reason,
      correctingMismatch: Boolean(mismatch),
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
    );
  };
  return (
    <AdminModal
      open
      onClose={() => {
        if (!mutation.busy) onClose();
      }}
      title={mismatch ? '정산 불일치 정정' : '포인트 수동 조정'}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="space-y-4"
      >
        {mismatch && (
          <p className="text-caption-web text-text-secondary">
            정산 불일치 #{mismatch.mismatchId}: 양수 조정으로 해결합니다. 대상
            점주 ID와 돌려줄 포인트를 확인해 주세요.
          </p>
        )}
        {confirming ? (
          <dl className="space-y-2 text-body-sm-web">
            <div className="flex justify-between">
              <dt>점주 ID</dt>
              <dd>{owner}</dd>
            </div>
            <div className="flex justify-between">
              <dt>조정 포인트</dt>
              <dd
                className={
                  Number(amount) < 0
                    ? 'text-status-danger-fg'
                    : 'text-action-primary'
                }
              >
                {Number(amount) > 0 ? '+' : ''}
                {formatPoints(Number(amount))}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>캠페인 ID</dt>
              <dd>{campaign || '—'}</dd>
            </div>
            {campaign && (
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
              onChange={(event) => {
                setOwner(event.target.value);
                mutation.setError('');
              }}
            />
            <Input
              label="조정 포인트"
              required
              inputMode={mismatch ? 'numeric' : 'text'}
              value={amount}
              trailing="P"
              helperText={
                mismatch
                  ? '정정할 포인트를 양수로 입력해 주세요.'
                  : '양수는 과오 차감 정정(잔액 증가), 음수는 포인트 차감입니다.'
              }
              onChange={(event) => {
                setAmount(event.target.value);
                mutation.setError('');
              }}
            />
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
                <p className="text-body-sm-web font-medium text-text-primary">
                  대상 영업일{' '}
                  <span aria-hidden className="text-status-danger-fg">
                    *
                  </span>
                </p>
                <DatePicker
                  maxDate={getKstToday()}
                  ariaLabel="대상 영업일"
                  value={targetBusinessDate}
                  disabled={campaignRequired}
                  onValueChange={(value) => {
                    setTargetBusinessDate(value);
                    mutation.setError('');
                  }}
                />
                <p className="text-caption-web text-text-secondary">
                  {campaignRequired
                    ? '정산 불일치 내역의 영업일로 정정합니다.'
                    : '조정할 원래 영업일을 선택해 주세요. 오늘(한국 시간)까지 가능합니다.'}
                </p>
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
