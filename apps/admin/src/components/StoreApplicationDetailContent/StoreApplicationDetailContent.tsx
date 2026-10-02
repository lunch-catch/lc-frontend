import type { ReactNode } from 'react';
import { StatusBadge } from '@repo/ui';
import { formatDate } from '@repo/utils';
import { Check, Clock3, FileText, Image, MapPin } from 'lucide-react';

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

interface StoreApplicationDetailContentProps {
  application: StoreApplicationDetail;
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
  <section className="border-b border-border-subtle py-6 first:pt-0 last:border-b-0 last:pb-0 [&_dl]:grid [&_dl]:grid-cols-2 [&_dl]:gap-x-6 [&_dl]:gap-y-4">
    <h3 className="mb-4 text-body-sm-web font-semibold text-text-primary">
      {title}
    </h3>
    {children}
  </section>
);

const DetailItem = ({ children, label }: DetailItemProps) => (
  <div className="min-w-0 text-body-sm-web">
    <dt className="text-caption-web text-text-secondary">{label}</dt>
    <dd className="mt-1.5 min-w-0 break-words font-medium text-text-primary">
      {children}
    </dd>
  </div>
);

export const StoreApplicationDetailContent = ({
  application,
}: StoreApplicationDetailContentProps) => {
  const isCompleted = application.status === 'ACTIVE';
  return (
    <>
      <div className="mb-6 rounded-xl bg-surface-subtle p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-caption-web text-text-secondary">
            {application.id}
          </span>
          <StatusBadge variant={isCompleted ? 'success' : 'warning'}>
            {isCompleted ? '입점 완료' : '입점 진행 중'}
          </StatusBadge>
        </div>
        <h3 className="mt-3 text-title-sm-web font-semibold text-text-primary">
          {application.storeName}
        </h3>
        <p className="mt-1 text-caption-web text-text-secondary">
          {application.category} · 신청일 {formatDate(application.appliedAt)}
        </p>
      </div>
      <DetailSection title="신청 정보">
        <dl>
          <DetailItem label="신청일">
            {formatDate(application.appliedAt)}
          </DetailItem>
          <DetailItem label="약관 동의">
            <span
              className={`inline-flex items-center gap-1 ${application.termsAgreed ? 'text-status-success-fg' : 'text-text-secondary'}`}
            >
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
          <DetailItem label="대표자 성명">{application.ownerName}</DetailItem>
          <DetailItem label="전화번호">{application.phoneNumber}</DetailItem>
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
            <span className="inline-flex gap-1">
              <MapPin
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-text-secondary"
              />
              <span>{application.address}</span>
            </span>
          </DetailItem>
          <DetailItem label="상세 주소">{application.addressDetail}</DetailItem>
          <DetailItem label="영업 요일">{application.businessDays}</DetailItem>
          <DetailItem label="영업시간">
            <span className="flex min-h-5 items-center gap-1">
              <Clock3
                aria-hidden="true"
                className="block size-4 shrink-0 text-text-secondary"
              />
              <span className="block leading-5">
                {application.weekdayHours}
              </span>
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
              className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg bg-surface-subtle text-caption-web text-text-tertiary"
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
              <span className="font-medium text-text-primary">{menu.name}</span>
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
    </>
  );
};
