import { ApiError, jsonOptions, request, requestData } from './client';

export type TemplateStatus = 'DRAFT' | 'PUBLISHED';

export interface TemplateRecord {
  templateId: number;
  name: string;
  status: TemplateStatus;
  active: boolean;
  createdAt: string;
  activatedBy: number | null;
  activatedAt: string | null;
  lastModifiedBy: number | null;
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
  status: 'DRAFT';
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

const assertTemplate = (data: TemplateRecord) => {
  if (
    !data ||
    !Number.isSafeInteger(data.templateId) ||
    data.templateId <= 0 ||
    typeof data.name !== 'string' ||
    typeof data.html !== 'string' ||
    typeof data.active !== 'boolean' ||
    typeof data.createdAt !== 'string' ||
    !['DRAFT', 'PUBLISHED'].includes(data.status)
  )
    throw new ApiError('템플릿 응답 형식을 확인할 수 없습니다.', 200);
  return data;
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
    data.status !== 'DRAFT' ||
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

export const changeTemplateActive = async (id: string, active: boolean) => {
  const data = await requestData<{
    templateId: number;
    active: boolean;
    activatedBy: number;
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
    typeof data.activatedAt !== 'string'
  )
    throw new ApiError('템플릿 활성 상태 응답 형식을 확인할 수 없습니다.', 200);
  return data;
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
