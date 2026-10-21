import { useState } from 'react';
import { Button, Input } from '@repo/ui';
import { formatWon } from '@repo/utils';
import { Clock3, Plus, X } from 'lucide-react';

import { type PointPolicy, savePointPolicy } from '@admin/api/pointPolicy';
import { AdminModal } from '@admin/ui/AdminModal/AdminModal';
import { ScrollArea } from '@admin/ui/ScrollArea/ScrollArea';

import { getPointPolicyError } from '../billingManagementUtils';
import { useBillingMutation } from '../useBillingMutation';

interface PointPolicyEditorProps {
  policy: PointPolicy;
  currentPolicy: PointPolicy;
  hasScheduledPolicy: boolean;
  onClose: () => void;
  onSaved: () => void;
}
export const PointPolicyEditor = ({
  policy,
  currentPolicy,
  hasScheduledPolicy,
  onClose,
  onSaved,
}: PointPolicyEditorProps) => {
  const [minimum, setMinimum] = useState(String(policy.minChargeAmount));
  const [products, setProducts] = useState(policy.chargeProducts.map(String));
  const [reason, setReason] = useState('');
  const mutation = useBillingMutation();
  const submit = () => {
    const validation = getPointPolicyError(minimum, products, reason);
    if (validation) {
      mutation.setError(validation);
      return;
    }
    // 적용일은 서버가 정한다. 검증한 입력만 정수로 변환해 정책 값과 사유를 전송한다.
    void mutation.run(
      () =>
        savePointPolicy({
          minChargeAmount: Number(minimum),
          chargeProducts: products.map(Number),
          reason: reason.trim(),
        }),
      onSaved,
    );
  };
  return (
    <AdminModal
      open
      onClose={() => {
        if (!mutation.busy) onClose();
      }}
      title={hasScheduledPolicy ? '예약 정책 수정' : '충전 정책 변경 예약'}
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <ScrollArea
          className="max-h-[60dvh]"
          tabIndex={0}
          role="group"
          aria-label="충전 정책 입력"
        >
          <div className="space-y-5 pr-1">
            <div className="rounded-lg border border-border-subtle bg-bg-page p-3">
              <p className="flex items-center gap-2 text-body-sm-web font-medium">
                <Clock3
                  aria-hidden
                  className="size-4 shrink-0 text-action-primary"
                />
                내일 00:00부터 적용
              </p>
              <p className="mt-1.5 text-caption-web leading-5 text-text-secondary">
                한국 시간 기준입니다. 오늘은 현재 정책이 유지됩니다.
                {hasScheduledPolicy &&
                  ' 저장하면 기존에 예약한 정책을 대체합니다.'}
              </p>
            </div>
            <Input
              label="최소 충전 금액"
              required
              inputMode="numeric"
              value={minimum}
              trailing="원"
              helperText={`현재 적용 중: ${formatWon(currentPolicy.minChargeAmount)} · 0보다 큰 정수를 입력해 주세요.`}
              disabled={mutation.busy}
              onChange={(event) => {
                setMinimum(event.target.value);
                mutation.setError('');
              }}
            />
            <fieldset disabled={mutation.busy} className="space-y-2">
              <legend className="text-caption-web font-medium">
                충전 상품
                <span aria-hidden="true" className="ml-1 text-status-danger-fg">
                  *
                </span>
              </legend>
              <p className="text-caption-web leading-5 text-text-secondary">
                점주가 선택할 충전 금액입니다. 모든 상품은 최소 충전 금액
                이상이어야 합니다.
              </p>
              <div
                className="space-y-2"
                role="group"
                aria-label="충전 상품 목록"
              >
                {products.map((product, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="w-5 shrink-0 text-center text-caption-web tabular-nums text-text-secondary"
                    >
                      {index + 1}
                    </span>
                    <Input
                      aria-label={`충전 상품 ${index + 1}`}
                      required
                      inputMode="numeric"
                      value={product}
                      trailing="원"
                      errorMessage={
                        product &&
                        /^\d+$/.test(product) &&
                        Number(product) < Number(minimum)
                          ? '최소 충전 금액 이상으로 입력해 주세요.'
                          : undefined
                      }
                      onChange={(event) => {
                        setProducts((values) =>
                          values.map((value, i) =>
                            i === index ? event.target.value : value,
                          ),
                        );
                        mutation.setError('');
                      }}
                    />
                    <button
                      type="button"
                      aria-label={`충전 상품 ${index + 1} 삭제`}
                      className="flex size-8 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-surface-subtle hover:text-status-danger-fg focus-visible:outline-2 focus-visible:outline-action-primary disabled:opacity-50"
                      disabled={products.length === 1}
                      onClick={() => {
                        setProducts((values) =>
                          values.filter((_, i) => i !== index),
                        );
                        mutation.setError('');
                      }}
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                variant="neutral"
                className="w-full"
                leadingIcon={<Plus className="size-4" aria-hidden />}
                onClick={() => setProducts((values) => [...values, ''])}
              >
                충전 금액 추가
              </Button>
            </fieldset>
            <Input
              label="변경 사유 (선택)"
              value={reason}
              maxLength={255}
              helperText="정책 변경 이력에 함께 기록됩니다. 최대 255자까지 입력할 수 있습니다."
              disabled={mutation.busy}
              onChange={(event) => {
                setReason(event.target.value);
                mutation.setError('');
              }}
            />
          </div>
        </ScrollArea>
        {mutation.error && (
          <p role="alert" className="text-caption-web text-status-danger-fg">
            {mutation.error}
          </p>
        )}
        <div className="flex justify-end gap-2 border-t border-border-subtle pt-4">
          <Button variant="neutral" disabled={mutation.busy} onClick={onClose}>
            취소
          </Button>
          <Button type="submit" isLoading={mutation.busy}>
            {hasScheduledPolicy ? '예약 변경 저장' : '내일 적용 예약'}
          </Button>
        </div>
      </form>
    </AdminModal>
  );
};
