import { useState } from 'react';
import { Button, Input } from '@repo/ui';
import { Plus, X } from 'lucide-react';

import { type PointPolicy, savePointPolicy } from '@admin/api/pointPolicy';
import { AdminModal } from '@admin/ui/AdminModal/AdminModal';
import { ScrollArea } from '@admin/ui/ScrollArea/ScrollArea';

import { getPointPolicyError } from '../billingManagementUtils';
import { useBillingMutation } from '../useBillingMutation';

interface PointPolicyEditorProps {
  policy: PointPolicy;
  onClose: () => void;
  onSaved: () => void;
}
export const PointPolicyEditor = ({
  policy,
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
      title="내일 적용할 충전 정책"
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <p className="text-caption-web text-text-secondary">
          적용일은 서버 기준 내일입니다. 이미 예약된 정책이 있으면 새 값으로
          대체합니다.
        </p>
        <Input
          label="최소 충전 금액"
          required
          inputMode="numeric"
          value={minimum}
          trailing="원"
          disabled={mutation.busy}
          onChange={(event) => {
            setMinimum(event.target.value);
            mutation.setError('');
          }}
        />
        <fieldset disabled={mutation.busy} className="space-y-2">
          <legend className="mb-2 text-caption-web font-medium">
            충전 상품
            <span aria-hidden="true" className="ml-1 text-status-danger-fg">
              *
            </span>
          </legend>
          <ScrollArea
            className="max-h-48 space-y-2"
            tabIndex={0}
            role="group"
            aria-label="충전 상품 목록"
          >
            {products.map((product, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  aria-label={`충전 상품 ${index + 1}`}
                  required
                  inputMode="numeric"
                  value={product}
                  trailing="원"
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
                  className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-surface-subtle disabled:opacity-50"
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
          </ScrollArea>
          <Button
            variant="neutral"
            leadingIcon={<Plus className="size-4" aria-hidden />}
            onClick={() => setProducts((values) => [...values, ''])}
          >
            상품 추가
          </Button>
        </fieldset>
        <Input
          label="변경 사유 (선택)"
          value={reason}
          maxLength={255}
          disabled={mutation.busy}
          onChange={(event) => {
            setReason(event.target.value);
            mutation.setError('');
          }}
        />
        {mutation.error && (
          <p role="alert" className="text-caption-web text-status-danger-fg">
            {mutation.error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="neutral" disabled={mutation.busy} onClick={onClose}>
            취소
          </Button>
          <Button type="submit" isLoading={mutation.busy}>
            저장
          </Button>
        </div>
      </form>
    </AdminModal>
  );
};
