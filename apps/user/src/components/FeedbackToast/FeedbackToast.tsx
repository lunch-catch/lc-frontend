import { CircleAlert, CircleCheck } from 'lucide-react';

export type FeedbackToastTone = 'success' | 'error';

export interface FeedbackToastProps {
  message: string;
  // success: 처리됨, error: 처리하지 못함
  tone?: FeedbackToastTone;
}

const toneClassNames: Record<FeedbackToastTone, string> = {
  success: 'bg-status-success-bg text-status-success-fg',
  error: 'bg-status-danger-bg text-status-danger-fg',
};

// 행동이 처리됐는지 잠깐 알려주는 알림 (디자인 시스템 Feedback/Toast)
const FeedbackToast = ({ message, tone = 'success' }: FeedbackToastProps) => {
  const Icon = tone === 'success' ? CircleCheck : CircleAlert;

  return (
    <div
      className={`flex min-h-12 animate-toast-enter items-center gap-2.5 rounded-lg px-4 py-3 text-body-sm-mobile font-medium motion-reduce:animate-none ${toneClassNames[tone]}`}
      role="status"
    >
      <Icon aria-hidden="true" className="size-5 shrink-0" />
      {message}
    </div>
  );
};

export default FeedbackToast;
