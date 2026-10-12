import { type FormEvent, useRef, useState } from 'react';
import { Button, Input } from '@repo/ui';
import { LockKeyhole, UserRound } from 'lucide-react';

import { useRequestFeedback } from '@admin/hooks/useRequestFeedback';

export interface LoginContentProps {
  onLogin: (loginId: string, password: string) => Promise<void>;
}

export const LoginContent = ({ onLogin }: LoginContentProps) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const { errorMessage, isWaiting, reportError, clearError } =
    useRequestFeedback();

  const loginIdError =
    hasSubmitted && (!loginId.trim() || loginId.trim().length > 50)
      ? '관리자 ID는 1~50자로 입력해 주세요.'
      : undefined;
  const passwordError =
    hasSubmitted && !password.trim() ? '비밀번호를 입력해 주세요.' : undefined;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current || isWaiting) return;
    setHasSubmitted(true);

    if (!loginId.trim() || loginId.trim().length > 50 || !password.trim()) {
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    clearError();
    try {
      await onLogin(loginId.trim(), password);
      setPassword('');
    } catch (error) {
      reportError(error);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-subtle px-5 py-10">
      <section className="w-full max-w-[400px] rounded-xl border border-border-subtle bg-bg-surface p-8 shadow-sm sm:p-10">
        <div className="mb-8 text-center">
          <p className="text-caption-web font-semibold text-action-primary">
            LUNCH CATCH
          </p>
          <h1 className="mt-2 text-title-md-web font-semibold text-text-primary">
            관리자 로그인
          </h1>
          <p className="mt-2 text-body-sm-web text-text-secondary">
            관리자 계정으로 로그인해 주세요.
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            autoComplete="username"
            disabled={isSubmitting}
            errorMessage={loginIdError}
            label="관리자 ID"
            leadingIcon={<UserRound className="size-4" />}
            onChange={(event) => setLoginId(event.target.value)}
            placeholder="관리자 ID를 입력해 주세요"
            value={loginId}
          />
          <Input
            autoComplete="current-password"
            disabled={isSubmitting}
            errorMessage={passwordError}
            label="비밀번호"
            leadingIcon={<LockKeyhole className="size-4" />}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호를 입력해 주세요"
            type="password"
            value={password}
          />
          {errorMessage && (
            <p role="alert" className="text-caption-web text-status-danger-fg">
              {errorMessage}
            </p>
          )}
          <Button
            className="mt-1 w-full"
            type="submit"
            isLoading={isSubmitting}
            disabled={isWaiting}
          >
            {isWaiting ? '재시도 대기 중' : '로그인'}
          </Button>
        </form>
      </section>
    </main>
  );
};
