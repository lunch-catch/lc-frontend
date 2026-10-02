import { CircleAlert, CircleCheck } from 'lucide-react';

export type FeedbackToastTone = 'success' | 'error';

export interface FeedbackToastAction {
  label: string;
  onClick: () => void;
}

export interface FeedbackToastProps {
  message: string;
  // success: 처리됨, error: 처리하지 못함
  tone?: FeedbackToastTone;
  // 방금 한 행동을 되돌리는 것처럼 바로 이어서 할 수 있는 행동
  action?: FeedbackToastAction;
}

const toneClassNames: Record<FeedbackToastTone, string> = {
  success: 'bg-status-success-bg text-status-success-fg',
  error: 'bg-status-danger-bg text-status-danger-fg',
};

// 행동이 처리됐는지 잠깐 알려주는 알림 (디자인 시스템 Feedback/Toast)
const FeedbackToast = ({
  action,
  message,
  tone = 'success',
}: FeedbackToastProps) => {
  const Icon = tone === 'success' ? CircleCheck : CircleAlert;

  return (
    <div
      className={`flex min-h-12 animate-toast-enter items-center gap-2.5 rounded-lg px-4 py-3 text-body-sm-mobile font-medium motion-reduce:animate-none ${toneClassNames[tone]}`}
      role="status"
    >
      <Icon aria-hidden="true" className="size-5 shrink-0" />
      <span className="min-w-0 flex-1">{message}</span>
      {action && (
        <button
          className="-my-3 -mr-2 h-11 shrink-0 px-2 font-bold underline underline-offset-2"
          onClick={action.onClick}
          type="button"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default FeedbackToast;
