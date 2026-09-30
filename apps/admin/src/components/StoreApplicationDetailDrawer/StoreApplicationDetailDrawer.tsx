import { type PointerEvent, type ReactNode, useEffect, useState } from 'react';
import { StatusBadge } from '@repo/ui';
import { Check, Clock3, FileText, Image, MapPin, X } from 'lucide-react';

export interface StoreApplicationDetail {
  address: string;
  addressDetail: string;
  appliedAt: string;
  businessDays: string;
  businessLicenseRegistered: boolean;
  businessNumber: string;
  businessVerified: boolean;
  category: string;
  id: string;
  menus: { name: string; price: string }[];
  ownerName: string;
  phoneNumber: string;
  status: 'ACTIVE' | 'ONBOARDING';
  storeName: string;
  termsAgreed: boolean;
  weekdayHours: string;
  weekendHours: string;
}

interface StoreApplicationDetailDrawerProps {
  application: StoreApplicationDetail | null;
  onClose: () => void;
}

interface DetailSectionProps {
  children: ReactNode;
  title: string;
}

interface DetailItemProps {
  children: ReactNode;
  label: string;
}

const DetailSection = ({ children, title }: DetailSectionProps) => (
  <section className="border-b border-border-subtle py-6 first:pt-0 last:border-b-0 last:pb-0">
    <h3 className="mb-4 text-body-md-web font-semibold text-text-primary">
      {title}
    </h3>
    {children}
  </section>
);

const DetailItem = ({ children, label }: DetailItemProps) => (
  <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 py-2 text-body-sm-web">
    <dt className="text-text-secondary">{label}</dt>
    <dd className="min-w-0 break-words text-right font-medium text-text-primary">
      {children}
    </dd>
  </div>
);

export const StoreApplicationDetailDrawer = ({
  application: requestedApplication,
  onClose,
}: StoreApplicationDetailDrawerProps) => {
  const [displayedApplication, setDisplayedApplication] =
    useState<StoreApplicationDetail | null>(requestedApplication);
  const [isOpen, setIsOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(560);

  const handleResizeStart = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const startX = event.clientX;
    const startWidth = panelWidth;
    const minimumWidth = Math.min(400, window.innerWidth);
    const maximumWidth = Math.min(720, window.innerWidth);
    let animationFrameId: number | undefined;
    let latestWidth = panelWidth;

    const applyWidth = () => {
      animationFrameId = undefined;
      setPanelWidth(latestWidth);
    };

    const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
      latestWidth = Math.max(
        minimumWidth,
        Math.min(maximumWidth, startWidth - (moveEvent.clientX - startX)),
      );

      if (animationFrameId === undefined) {
        // 드래그 중에는 화면 프레임 단위로만 너비를 반영한다.
        animationFrameId = window.requestAnimationFrame(applyWidth);
      }
    };

    const handlePointerUp = () => {
      if (animationFrameId !== undefined) {
        window.cancelAnimationFrame(animationFrameId);
        applyWidth();
      }

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  useEffect(() => {
    if (requestedApplication) {
      let openFrameId: number | undefined;
      // 닫힘 전환 중에도 이전 상세 내용을 유지한 뒤, 다음 프레임에 패널을 연다.
      const displayFrameId = window.requestAnimationFrame(() => {
        setDisplayedApplication(requestedApplication);
        openFrameId = window.requestAnimationFrame(() => setIsOpen(true));
      });

      return () => {
        window.cancelAnimationFrame(displayFrameId);
        if (openFrameId !== undefined) {
          window.cancelAnimationFrame(openFrameId);
        }
      };
    }

    const closeFrameId = window.requestAnimationFrame(() => setIsOpen(false));

    return () => window.cancelAnimationFrame(closeFrameId);
  }, [requestedApplication]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!displayedApplication) {
    return null;
  }

  const application = displayedApplication;
  const isCompleted = application.status === 'ACTIVE';

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="presentation">
      <button
        aria-label="입점 신청 상세 닫기"
        className={[
          'absolute inset-0 bg-text-primary/20 transition-opacity duration-300 ease-out motion-reduce:transition-none',
          isOpen ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        onClick={onClose}
        type="button"
      />
      <aside
        aria-labelledby="store-application-detail-title"
        aria-modal="true"
        className={[
          'relative z-10 flex h-full max-w-full flex-col bg-bg-surface shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        onTransitionEnd={() => {
          if (!isOpen) {
            setDisplayedApplication(null);
          }
        }}
        role="dialog"
        style={{ width: panelWidth }}
      >
        <button
          aria-label="상세 패널 너비 조절"
          className="absolute inset-y-0 -left-1.5 z-20 w-3 cursor-col-resize touch-none before:absolute before:inset-y-0 before:left-1/2 before:w-px before:bg-transparent hover:before:bg-action-primary focus-visible:before:bg-action-primary focus-visible:outline-none"
          onPointerDown={handleResizeStart}
          type="button"
        />
        <header className="flex shrink-0 items-start justify-between border-b border-border-subtle px-6 py-5">
          <div>
            <p className="text-caption-web text-text-secondary">
              {application.id}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <h2
                className="text-heading-3-web font-semibold text-text-primary"
                id="store-application-detail-title"
              >
                {application.storeName}
              </h2>
              <StatusBadge variant={isCompleted ? 'success' : 'warning'}>
                {isCompleted ? '입점 완료' : '입점 진행 중'}
              </StatusBadge>
            </div>
          </div>
          <button
            aria-label="상세 닫기"
            className="flex size-10 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>

        <div className="overflow-y-auto px-6 py-6">
          <DetailSection title="신청 정보">
            <dl>
              <DetailItem label="신청일">{application.appliedAt}</DetailItem>
              <DetailItem label="약관 동의">
                <span className="inline-flex items-center gap-1 text-status-success-fg">
                  {application.termsAgreed && (
                    <Check aria-hidden="true" className="size-4" />
                  )}
                  {application.termsAgreed ? '동의 완료' : '미동의'}
                </span>
              </DetailItem>
            </dl>
          </DetailSection>

          <DetailSection title="가게 기본 정보">
            <dl>
              <DetailItem label="상호명">{application.storeName}</DetailItem>
              <DetailItem label="업종">{application.category}</DetailItem>
              <DetailItem label="대표자 성명">
                {application.ownerName}
              </DetailItem>
              <DetailItem label="전화번호">
                {application.phoneNumber}
              </DetailItem>
              <DetailItem label="사업자등록번호">
                {application.businessNumber}
              </DetailItem>
              <DetailItem label="사업자 인증">
                <span
                  className={
                    application.businessVerified
                      ? 'inline-flex items-center gap-1 text-status-success-fg'
                      : 'text-text-secondary'
                  }
                >
                  {application.businessVerified && (
                    <Check aria-hidden="true" className="size-4" />
                  )}
                  {application.businessVerified ? '인증 완료' : '인증 대기'}
                </span>
              </DetailItem>
            </dl>
          </DetailSection>

          <DetailSection title="위치 및 영업시간">
            <dl>
              <DetailItem label="주소">
                <span className="inline-flex justify-end gap-1">
                  <MapPin
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-text-secondary"
                  />
                  <span>{application.address}</span>
                </span>
              </DetailItem>
              <DetailItem label="상세 주소">
                {application.addressDetail}
              </DetailItem>
              <DetailItem label="영업 요일">
                {application.businessDays}
              </DetailItem>
              <DetailItem label="평일 영업시간">
                <span className="inline-flex items-center gap-1">
                  <Clock3
                    aria-hidden="true"
                    className="size-4 text-text-secondary"
                  />
                  {application.weekdayHours}
                </span>
              </DetailItem>
              <DetailItem label="주말 영업시간">
                {application.weekendHours}
              </DetailItem>
            </dl>
          </DetailSection>

          <DetailSection title="매장 사진">
            <div className="grid grid-cols-3 gap-3">
              {['대표 이미지', '매장 내부', '매장 외부'].map((label) => (
                <div
                  className="flex aspect-square flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border-default bg-surface-subtle text-caption-web text-text-secondary"
                  key={label}
                >
                  <Image aria-hidden="true" className="size-5" />
                  {label}
                </div>
              ))}
            </div>
          </DetailSection>

          <DetailSection title="대표 메뉴">
            <ul className="space-y-2">
              {application.menus.map((menu) => (
                <li
                  className="flex items-center justify-between rounded-md bg-surface-subtle px-4 py-3 text-body-sm-web"
                  key={menu.name}
                >
                  <span className="font-medium text-text-primary">
                    {menu.name}
                  </span>
                  <span className="text-text-secondary">{menu.price}</span>
                </li>
              ))}
            </ul>
          </DetailSection>

          <DetailSection title="추가 서류">
            <div className="flex items-center justify-between rounded-md bg-surface-subtle px-4 py-3 text-body-sm-web">
              <span className="inline-flex items-center gap-2 text-text-primary">
                <FileText
                  aria-hidden="true"
                  className="size-4 text-text-secondary"
                />
                사업자등록증
              </span>
              <span
                className={
                  application.businessLicenseRegistered
                    ? 'text-status-success-fg'
                    : 'text-text-secondary'
                }
              >
                {application.businessLicenseRegistered ? '등록 완료' : '미등록'}
              </span>
            </div>
          </DetailSection>
        </div>
      </aside>
    </div>
  );
};
