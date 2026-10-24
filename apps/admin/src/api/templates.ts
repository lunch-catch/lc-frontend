import { ApiError, jsonOptions, request, requestData } from './client';

export type TemplateStatus = 'DRAFT' | 'PUBLISHED';

export interface TemplateRecord {
  templateId: number;
  name: string;
  status: TemplateStatus;
  active: boolean;
  /** 게시본과 별개로 편집 중인 임시저장이 있는지 나타낸다. DRAFT는 항상 true다. */
  hasDraft: boolean;
  createdAt: string;
  activatedBy: number | null;
  activatedByName: string | null;
  activatedAt: string | null;
  lastModifiedBy: number | null;
  lastModifiedByName: string | null;
  lastModifiedAt: string | null;
  html: string;
}

export interface TemplateVersionRecord {
  versionNumber: number;
  requestPrompt: string;
  message: string;
  createdAt: string;
  html: string;
}

export interface TemplateVersionPage {
  items: TemplateVersionRecord[];
  nextPageToken: string | null;
}

export interface TemplateGeneration {
  templateId: number;
  name: string;
  versionNumber: number;
  status: TemplateStatus;
  html: string;
  /** LLM 설명은 HTML로 해석하지 않으며 설명이 없는 응답은 빈 문자열이다. */
  message: string;
  removedElements: string[];
  suggestedPrompts: string[];
}

/** 저장된 템플릿·버전이 없는 자연어 응답(HTTP 200). */
export interface TemplateChatReply {
  templateId: null;
  name: null;
  versionNumber: null;
  status: null;
  html: null;
  message: string;
  removedElements: string[];
  suggestedPrompts: string[];
}

const basePath = '/v1/admin/templates';

// 구버전 서버의 필드 누락과 관리자를 찾지 못한 null은 모두 이름 없음으로 처리한다.
const isOptionalAdminName = (value: unknown) =>
  value == null || typeof value === 'string';

const assertTemplate = (data: TemplateRecord) => {
  if (
    !data ||
    !Number.isSafeInteger(data.templateId) ||
    data.templateId <= 0 ||
    typeof data.name !== 'string' ||
    typeof data.html !== 'string' ||
    typeof data.active !== 'boolean' ||
    typeof data.hasDraft !== 'boolean' ||
    typeof data.createdAt !== 'string' ||
    !isOptionalAdminName(data.lastModifiedByName) ||
    !isOptionalAdminName(data.activatedByName) ||
    !['DRAFT', 'PUBLISHED'].includes(data.status)
  )
    throw new ApiError('템플릿 응답 형식을 확인할 수 없습니다.', 200);
  return {
    ...data,
    lastModifiedByName: data.lastModifiedByName ?? null,
    activatedByName: data.activatedByName ?? null,
  };
};

export const getTemplates = async (signal?: AbortSignal) => {
  const data = await requestData<TemplateRecord[]>(basePath, { signal }, 200);
  if (!Array.isArray(data))
    throw new ApiError('템플릿 목록 응답 형식을 확인할 수 없습니다.', 200);
  return data.map(assertTemplate);
};

export const getTemplate = async (id: string, signal?: AbortSignal) =>
  assertTemplate(
    await requestData<TemplateRecord>(
      `${basePath}/${encodeURIComponent(id)}`,
      { signal },
      200,
    ),
  );

export const getTemplateVersions = async (
  id: string,
  pageToken?: string,
  signal?: AbortSignal,
) => {
  const query = new URLSearchParams({ pageSize: '20' });
  if (pageToken) query.set('pageToken', pageToken);
  const data = await requestData<TemplateVersionPage>(
    `${basePath}/${encodeURIComponent(id)}/versions?${query}`,
    { signal },
    200,
  );
  if (
    !Array.isArray(data.items) ||
    (data.nextPageToken !== null && typeof data.nextPageToken !== 'string') ||
    data.items.some(
      (item) =>
        !item ||
        !Number.isSafeInteger(item.versionNumber) ||
        item.versionNumber <= 0 ||
        typeof item.html !== 'string' ||
        typeof item.requestPrompt !== 'string' ||
        typeof item.message !== 'string' ||
        typeof item.createdAt !== 'string',
    )
  )
    throw new ApiError('템플릿 버전 응답 형식을 확인할 수 없습니다.', 200);
  return data;
};

/** 같은 생성·수정 요청의 재시도에는 requestId를 그대로 전달해 중복 버전을 방지한다. */
export const generateTemplate = async (
  values: {
    name: string;
    requestPrompt: string;
    requestId: string;
  },
  id?: string,
  signal?: AbortSignal,
) => {
  const path = id ? `${basePath}/${encodeURIComponent(id)}/versions` : basePath;
  const body = id
    ? {
        requestPrompt: values.requestPrompt,
        requestId: values.requestId,
      }
    : {
        name: values.name,
        requestPrompt: values.requestPrompt,
        requestId: values.requestId,
      };
  const data = await requestData<TemplateGeneration | TemplateChatReply>(
    path,
    { ...jsonOptions('POST', body), signal },
    [200, 201],
  );
  // 자연어 응답은 새 템플릿이나 버전을 만들지 않는다.
  if (
    data?.status === null &&
    data.templateId === null &&
    data.name === null &&
    data.versionNumber === null &&
    data.html === null &&
    typeof data.message === 'string' &&
    Array.isArray(data.removedElements) &&
    data.removedElements.length === 0 &&
    Array.isArray(data.suggestedPrompts) &&
    data.suggestedPrompts.length === 0
  )
    return data;
  if (
    !data ||
    (data.status !== 'DRAFT' && (!id || data.status !== 'PUBLISHED')) ||
    !Number.isSafeInteger(data.templateId) ||
    data.templateId <= 0 ||
    !Number.isSafeInteger(data.versionNumber) ||
    data.versionNumber <= 0 ||
    typeof data.name !== 'string' ||
    typeof data.html !== 'string' ||
    typeof data.message !== 'string' ||
    !Array.isArray(data.removedElements) ||
    data.removedElements.some((item) => typeof item !== 'string') ||
    !Array.isArray(data.suggestedPrompts) ||
    data.suggestedPrompts.some(
      (item) => typeof item !== 'string' || !item.trim(),
    )
  )
    throw new ApiError('템플릿 생성 응답 형식을 확인할 수 없습니다.', 201);
  return data;
};

export const publishTemplate = async (id: string, versionNumber: number) => {
  const data = await requestData<{
    templateId: number;
    name: string;
    status: 'PUBLISHED';
    html: string;
    publishedAt: string;
  }>(
    `${basePath}/${encodeURIComponent(id)}/publish`,
    jsonOptions('POST', { versionNumber }),
    200,
  );
  if (
    String(data.templateId) !== id ||
    data.status !== 'PUBLISHED' ||
    typeof data.html !== 'string' ||
    typeof data.name !== 'string' ||
    typeof data.publishedAt !== 'string'
  )
    throw new ApiError('템플릿 게시 응답 형식을 확인할 수 없습니다.', 200);
  return data;
};

/** 이름 변경 응답만 병합해 게시본 HTML과 노출 상태를 유지한다. */
export const renameTemplate = async (id: string, name: string) => {
  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.length > 100)
    throw new ApiError('템플릿명은 1~100자로 입력해 주세요.', 400);
  const data = await requestData<{
    templateId: number;
    name: string;
    lastModifiedBy: number;
    lastModifiedByName?: string | null;
    lastModifiedAt: string;
  }>(
    `${basePath}/${encodeURIComponent(id)}`,
    jsonOptions('PATCH', { name: trimmedName }),
    200,
  );
  if (
    !data ||
    String(data.templateId) !== id ||
    data.name !== trimmedName ||
    !Number.isSafeInteger(data.lastModifiedBy) ||
    data.lastModifiedBy <= 0 ||
    typeof data.lastModifiedAt !== 'string' ||
    !isOptionalAdminName(data.lastModifiedByName)
  )
    throw new ApiError('템플릿 이름 변경 응답 형식을 확인할 수 없습니다.', 200);
  return { ...data, lastModifiedByName: data.lastModifiedByName ?? null };
};

export const changeTemplateActive = async (id: string, active: boolean) => {
  const data = await requestData<{
    templateId: number;
    active: boolean;
    activatedBy: number;
    activatedByName?: string | null;
    activatedAt: string;
  }>(
    `${basePath}/${encodeURIComponent(id)}/active`,
    jsonOptions('PATCH', { active }),
    200,
  );
  if (
    String(data.templateId) !== id ||
    data.active !== active ||
    !Number.isSafeInteger(data.activatedBy) ||
    typeof data.activatedAt !== 'string' ||
    !isOptionalAdminName(data.activatedByName)
  )
    throw new ApiError('템플릿 활성 상태 응답 형식을 확인할 수 없습니다.', 200);
  return { ...data, activatedByName: data.activatedByName ?? null };
};

/** 초안과 모든 버전을 삭제하며, 성공한 204 응답은 JSON 본문을 읽지 않는다. */
export const deleteTemplate = async (id: string): Promise<void> => {
  const response = await request(`${basePath}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (response.status !== 204)
    throw new ApiError(
      '템플릿 삭제 응답을 확인할 수 없습니다.',
      response.status,
    );
};
