import type { ReactNode } from 'react';

interface DetailItemProps {
  label: string;
  children: ReactNode;
}

interface BillingFeedbackProps {
  notice: string;
  error: string;
}

export const DetailItem = ({ label, children }: DetailItemProps) => (
  <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 py-2 text-body-sm-web">
    <dt className="text-text-secondary">{label}</dt>
    <dd className="min-w-0 break-words font-medium">{children}</dd>
  </div>
);

export const BillingFeedback = ({ notice, error }: BillingFeedbackProps) => (
  <>
    {notice && (
      <p
        role="status"
        className="rounded-lg bg-status-success-bg p-3 text-body-sm-web text-status-success-fg"
      >
        {notice}
      </p>
    )}
    {error && (
      <p
        role="alert"
        className="rounded-lg bg-status-danger-bg p-3 text-body-sm-web text-status-danger-fg"
      >
        {error}
      </p>
    )}
  </>
);
