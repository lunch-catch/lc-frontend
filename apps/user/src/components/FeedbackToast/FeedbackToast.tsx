import { CircleCheck } from 'lucide-react';

export interface FeedbackToastProps {
  message: string;
}

// 행동이 처리됐음을 잠깐 알려주는 알림 (디자인 시스템 Feedback/Toast)
const FeedbackToast = ({ message }: FeedbackToastProps) => {
  return (
    <div
      className="flex min-h-12 animate-toast-enter items-center gap-2.5 rounded-lg bg-status-success-bg px-4 py-3 text-body-sm-mobile font-medium text-status-success-fg motion-reduce:animate-none"
      role="status"
    >
      <CircleCheck aria-hidden="true" className="size-5 shrink-0" />
      {message}
    </div>
  );
};

export default FeedbackToast;
