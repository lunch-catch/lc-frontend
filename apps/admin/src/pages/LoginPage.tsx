import { type FormEvent, useState } from 'react';
import { Button, Input } from '@repo/ui';
import { LockKeyhole, UserRound } from 'lucide-react';

export interface LoginPageProps {
  onLogin: (loginId: string, password: string) => void;
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const loginIdError =
    hasSubmitted && !loginId ? '관리자 ID를 입력해 주세요.' : undefined;
  const passwordError =
    hasSubmitted && !password ? '비밀번호를 입력해 주세요.' : undefined;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSubmitted(true);

    if (!loginId || !password) {
      return;
    }

    onLogin(loginId, password);
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

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <Input
            errorMessage={loginIdError}
            label="관리자 ID"
            leadingIcon={<UserRound className="size-4" />}
            onChange={(event) => setLoginId(event.target.value)}
            placeholder="관리자 ID를 입력해 주세요"
            value={loginId}
          />
          <Input
            errorMessage={passwordError}
            label="비밀번호"
            leadingIcon={<LockKeyhole className="size-4" />}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호를 입력해 주세요"
            type="password"
            value={password}
          />
          <Button className="mt-1 w-full" type="submit">
            로그인
          </Button>
        </form>
      </section>
    </main>
  );
};
