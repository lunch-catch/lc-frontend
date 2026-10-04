import {
  LoginContent,
  type LoginContentProps,
} from '@admin/features/login/LoginContent';

export type LoginPageProps = LoginContentProps;

export const LoginPage = (props: LoginPageProps) => <LoginContent {...props} />;
