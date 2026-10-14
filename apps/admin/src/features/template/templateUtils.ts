import { ApiError } from '@admin/api/client';

const templateErrors: Record<string, string> = {
  'POSTER-001':
    '필수 영역을 갖춘 템플릿을 만들지 못했습니다. 요청 내용을 바꿔 다시 시도해 주세요.',
  'POSTER-002':
    '기존 템플릿의 영역 구조를 유지하지 못했습니다. 다른 수정 요청을 입력해 주세요.',
  'POSTER-003': '템플릿은 최대 10개까지 등록할 수 있습니다.',
  'POSTER-004':
    '템플릿 생성이 지연되고 있습니다. 잠시 후 같은 요청으로 다시 시도해 주세요.',
  'POSTER-005': '템플릿을 찾을 수 없습니다.',
  'POSTER-006': '게시된 템플릿은 수정할 수 없습니다.',
  'POSTER-007': '이미 다른 버전으로 게시된 템플릿입니다.',
  'POSTER-008': '선택한 버전을 찾을 수 없습니다.',
  'POSTER-009': '게시한 템플릿만 활성 상태를 변경할 수 있습니다.',
};

/** 이름을 생성 요청에 보낼 수 있는 값으로 정리한다. 백엔드의 길이 제한은 100자다. */
export const getValidTemplateName = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const name = value.trim();
  return name.length > 0 && name.length <= 100 ? name : undefined;
};

export const getTemplateError = (error: unknown) =>
  error instanceof ApiError
    ? (templateErrors[error.code ?? ''] ?? error.message)
    : '서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.';
