import { useRef, useState } from 'react';
import { Button, Input } from '@repo/ui';
import { formatDateTime, formatWon } from '@repo/utils';
import { Plus, Trash2 } from 'lucide-react';

import { Pagination } from '@admin/components/Pagination/Pagination';
import { validatePolicy } from '@admin/features/billing/billingUtils';
import {
  type BillingTabProps,
  currentTimestamp,
  useBillingFeedback,
} from '@admin/features/billing/billingView';
import { BillingFeedback } from '@admin/features/billing/components/BillingDetails';
export const PointPolicyTab = (props: BillingTabProps) => {
  const { state, setState, today } = props;
  const { notice, error, setError, setNotice } = useBillingFeedback(props);
  const [minimum, setMinimum] = useState(String(state.policy.minimum));
  const [products, setProducts] = useState(() =>
    state.policy.products.map((amount, id) => ({ id, amount: String(amount) })),
  );
  // 삭제 후에도 다른 입력칸의 키가 바뀌지 않도록 상품 ID와 표시 순서를 분리한다.
  const nextProductId = useRef(state.policy.products.length);
  const [policyReason, setPolicyReason] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  // 이력이 늘어나도 입력 화면 높이를 밀어내지 않도록 페이지로 나눈다.
  const historyPageSize = 2;
  const history = [...state.policyHistory].reverse();
  const savePolicy = () => {
    const nextMinimum = Number(minimum);
    const nextProducts = products.map((product) => Number(product.amount));
    const validation = validatePolicy(nextMinimum, nextProducts);
    if (validation) {
      setError(validation);
      return;
    }
    // API 연동 시 처리자와 변경 시각은 서버의 인증 정보·처리 결과로 대체한다.
    const policy = {
      minimum: nextMinimum,
      products: nextProducts.sort((a, b) => a - b),
      actorId: 'ADMIN-MOCK',
      updatedAt: currentTimestamp(today),
      reason: policyReason.trim(),
    };
    setState((current) => ({
      ...current,
      policy,
      policyHistory: [...current.policyHistory, policy],
    }));
    setMinimum(String(policy.minimum));
    setProducts((current) =>
      [...current].sort((a, b) => Number(a.amount) - Number(b.amount)),
    );
    setPolicyReason('');
    setHistoryPage(1);
    setError('');
    setNotice('충전 정책을 목업 상태에 저장했습니다.');
  };

  return (
    <>
      <BillingFeedback notice={notice} error={error} />
      <div className="grid items-start gap-4 md:grid-cols-2">
        <form
          className="space-y-3 rounded-xl border border-border-subtle bg-bg-surface p-4"
          onSubmit={(event) => {
            event.preventDefault();
            savePolicy();
          }}
        >
          <h3 className="text-title-sm-web font-semibold">충전 정책</h3>
          <Input
            type="number"
            min={1}
            step={1}
            required
            label="최소 충전 금액 (원)"
            value={minimum}
            onChange={(event) => setMinimum(event.target.value)}
          />
          <fieldset className="space-y-2">
            <legend className="text-caption-web font-medium">충전 상품</legend>
            <div className="flex items-center justify-between gap-3">
              <p className="text-caption-web text-text-secondary">
                점주에게 표시할 충전 금액
              </p>
              <Button
                variant="tertiary"
                className="!min-h-8 !px-2 !py-1 !text-caption-web"
                leadingIcon={<Plus aria-hidden="true" className="size-4" />}
                onClick={() => {
                  const id = nextProductId.current++;
                  setProducts((current) => [...current, { id, amount: '' }]);
                  setError('');
                }}
              >
                상품 추가
              </Button>
            </div>
            <div className="divide-y divide-border-subtle rounded-lg border border-border-subtle px-3">
              {products.map((product, index) => {
                const amount = Number(product.amount);
                const duplicate =
                  product.amount !== '' &&
                  products.some(
                    (other) =>
                      other.id !== product.id &&
                      other.amount !== '' &&
                      Number(other.amount) === amount,
                  );
                const productError = duplicate
                  ? '같은 금액의 상품이 있습니다.'
                  : product.amount !== '' && amount < Number(minimum)
                    ? '최소 충전 금액 이상을 입력해주세요.'
                    : undefined;
                return (
                  <div key={product.id} className="flex items-start gap-3 py-2">
                    <span className="flex h-10 shrink-0 items-center text-caption-web text-text-secondary">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <Input
                      containerClassName="min-w-0 flex-1"
                      type="number"
                      inputMode="numeric"
                      min={Math.max(1, Number(minimum) || 1)}
                      step={1}
                      required
                      aria-label={`상품 ${index + 1} 금액 (원)`}
                      placeholder="충전 금액"
                      value={product.amount}
                      errorMessage={productError}
                      onChange={(event) => {
                        const amount = event.target.value;
                        setProducts((current) =>
                          current.map((item) =>
                            item.id === product.id ? { ...item, amount } : item,
                          ),
                        );
                        setError('');
                      }}
                    />
                    <span className="flex h-10 shrink-0 items-center text-caption-web text-text-secondary">
                      원
                    </span>
                    <button
                      type="button"
                      aria-label={`상품 ${index + 1} 삭제`}
                      title="상품 삭제"
                      disabled={products.length === 1}
                      className="flex h-10 w-6 shrink-0 items-center justify-center rounded-md text-text-secondary hover:text-status-danger-fg focus-visible:outline-2 focus-visible:outline-action-primary disabled:cursor-not-allowed disabled:opacity-30"
                      onClick={() => {
                        setProducts((current) =>
                          current.filter((item) => item.id !== product.id),
                        );
                        setError('');
                      }}
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-caption-web text-text-secondary">
              단위: 원 · 최소 충전 금액 이상 · 동일 금액 중복 불가
            </p>
          </fieldset>
          <Input
            label="변경 사유 (선택)"
            value={policyReason}
            maxLength={300}
            onChange={(event) => setPolicyReason(event.target.value)}
          />
          <div className="flex justify-end">
            <Button type="submit">정책 저장</Button>
          </div>
        </form>
        <section
          aria-label="정책 변경 이력"
          className="space-y-3 rounded-xl border border-border-subtle bg-bg-surface p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-title-sm-web font-semibold">정책 변경 이력</h3>
            <span className="text-caption-web text-text-secondary">
              총 {history.length}건
            </span>
          </div>
          <ul className="space-y-3">
            {history
              .slice(
                (historyPage - 1) * historyPageSize,
                historyPage * historyPageSize,
              )
              .map((item, index) => (
                <li
                  key={item.updatedAt + historyPage + index}
                  className="space-y-2 rounded-lg border border-border-subtle p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-2">
                    <time
                      dateTime={item.updatedAt}
                      className="text-caption-web font-medium"
                    >
                      {formatDateTime(item.updatedAt)}
                    </time>
                    {historyPage === 1 && index === 0 && (
                      <span className="rounded-md bg-status-success-bg px-2 py-1 text-caption-web text-status-success-fg">
                        현재 적용
                      </span>
                    )}
                  </div>
                  <dl className="grid grid-cols-[80px_minmax(0,1fr)] gap-x-3 gap-y-2 text-caption-web">
                    <dt className="text-text-secondary">최소 충전</dt>
                    <dd className="font-semibold">{formatWon(item.minimum)}</dd>
                    <dt className="text-text-secondary">충전 상품</dt>
                    <dd className="flex flex-wrap gap-1">
                      {item.products.map((amount) => (
                        <span
                          key={amount}
                          className="rounded-md bg-surface-subtle px-2 py-1"
                        >
                          {formatWon(amount)}
                        </span>
                      ))}
                    </dd>
                    <dt className="text-text-secondary">변경자</dt>
                    <dd className="break-words">{item.actorId}</dd>
                    <dt className="text-text-secondary">변경 사유</dt>
                    <dd className="min-w-0 break-words text-text-secondary">
                      {item.reason || '—'}
                    </dd>
                  </dl>
                </li>
              ))}
          </ul>
          {/* 숨김 여부는 공통 Pagination에서 판단하고 이력의 고정 페이지 크기는 유지한다. */}
          <Pagination
            currentPage={historyPage}
            onPageChange={setHistoryPage}
            totalPages={Math.ceil(history.length / historyPageSize)}
          />
        </section>
      </div>
    </>
  );
};
