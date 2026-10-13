import type {
  AdminAccountForm,
  AdminAccountFormErrors,
} from './adminAccountTypes';

export const validateAdminAccount = (
  form: AdminAccountForm,
): AdminAccountFormErrors => {
  const errors: AdminAccountFormErrors = {};
  if (!/^[A-Za-z0-9._-]{1,50}$/.test(form.id))
    errors.id = '영문, 숫자, 마침표, 밑줄, 하이픈 1~50자로 입력해 주세요.';
  if (
    !form.name.trim() ||
    form.name.trim().length > 50 ||
    !/^[\p{L}\p{M} .'-]+$/u.test(form.name.trim())
  )
    errors.name =
      '이름은 50자 이하의 문자, 공백, 마침표, 작은따옴표, 하이픈으로 입력해 주세요.';
  // BCrypt는 UTF-8 바이트 기준 제한이 있으므로 문자열 길이와 별도로 검사한다.
  if (
    form.password.length < 10 ||
    form.password.length > 72 ||
    /\s/.test(form.password) ||
    !/[A-Z]/.test(form.password) ||
    !/[a-z]/.test(form.password) ||
    !/[0-9]/.test(form.password) ||
    !/[^A-Za-z0-9\s]/.test(form.password)
  )
    errors.password =
      '공백 없이 10~72자로 대·소문자, 숫자, 특수문자를 포함해 주세요.';
  else if (new TextEncoder().encode(form.password).length > 72)
    errors.password =
      '비밀번호가 너무 깁니다. 한글이나 특수문자를 줄여 주세요.';
  if (!form.passwordConfirmation)
    errors.passwordConfirmation = '비밀번호를 다시 입력해 주세요.';
  else if (form.password !== form.passwordConfirmation)
    errors.passwordConfirmation = '비밀번호가 일치하지 않습니다.';
  return errors;
};
