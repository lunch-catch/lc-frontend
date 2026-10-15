import { useEffect, useRef, useState } from 'react';

import {
  generateTemplate,
  getTemplate,
  getTemplateVersions,
  publishTemplate,
  type TemplateGeneration,
} from '@admin/api/templates';

import type { PosterTemplate, TemplateVersion } from './templateTypes';
import { getTemplateError } from './templateUtils';

interface EditorResult {
  template: PosterTemplate;
  versions: TemplateVersion[];
  nextPageToken: string | null;
}

/** 서버에 저장된 초안과 버전을 관리하며, 실패한 생성 요청의 식별자를 재시도에 재사용한다. */
export const useTemplateEditor = (initialId?: string) => {
  const [result, setResult] = useState<EditorResult | null>(null);
  const [generation, setGeneration] = useState<TemplateGeneration | null>(null);
  const savedId = useRef(initialId);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  // React 상태가 다음 렌더에 반영되기 전의 연속 클릭도 잠금으로 차단한다.
  const operationRef = useRef(false);
  const moreRef = useRef(false);
  const pendingRequest = useRef<{ key: string; requestId: string } | null>(
    null,
  );
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!initialId) return;
    savedId.current = initialId;
    const controller = new AbortController();
    void getTemplate(initialId, controller.signal)
      .then(async (template) => {
        const page =
          template.status === 'DRAFT'
            ? await getTemplateVersions(initialId, undefined, controller.signal)
            : { items: [], nextPageToken: null };
        if (!controller.signal.aborted)
          setResult({
            template,
            versions: page.items,
            nextPageToken: page.nextPageToken,
          });
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setLoadError(getTemplateError(cause));
      });
    return () => controller.abort();
  }, [initialId]);

  const generate = async (
    name: string,
    requestPrompt: string,
    baseVersionNumber?: number,
  ) => {
    if (operationRef.current || moreRef.current) return null;
    if (
      !name.trim() ||
      name.trim().length > 100 ||
      !requestPrompt.trim() ||
      requestPrompt.trim().length > 500
    ) {
      setError('템플릿명은 1~100자, 요청 내용은 1~500자로 입력해 주세요.');
      return null;
    }
    const id = result ? String(result.template.templateId) : savedId.current;
    if (
      id &&
      (baseVersionNumber === undefined ||
        !Number.isSafeInteger(baseVersionNumber) ||
        baseVersionNumber <= 0)
    ) {
      setError('수정할 기준 버전을 다시 선택해 주세요.');
      return null;
    }
    const trimmedName = name.trim();
    const trimmedPrompt = requestPrompt.trim();
    // 요청 문구가 같아도 기준 버전이 다르면 별도의 수정 요청으로 취급한다.
    const key = JSON.stringify([
      id,
      baseVersionNumber,
      trimmedName,
      trimmedPrompt,
    ]);
    // 응답 유실 후 같은 입력을 재전송해도 생성·버전 추가가 중복되지 않게 한다.
    if (pendingRequest.current?.key !== key)
      pendingRequest.current = { key, requestId: crypto.randomUUID() };
    operationRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const generated = await generateTemplate(
        {
          name: trimmedName,
          requestPrompt: trimmedPrompt,
          requestId: pendingRequest.current.requestId,
          baseVersionNumber,
        },
        id,
      );
      pendingRequest.current = null;
      if (!mounted.current) return null;
      savedId.current = String(generated.templateId);
      setGeneration(generated);
      // 새 템플릿은 서버 ID가 있는 편집 주소로 이동한 뒤 상세와 이력을 불러온다.
      if (!initialId) return generated;
      // 생성 응답에 생성 시각은 없으므로 임의 날짜를 채우지 않고 상세·이력에서 읽는다.
      // 후속 조회 실패가 이미 저장된 생성 결과를 실패로 바꾸지 않도록 별도로 처리한다.
      const [template, page] = await Promise.all([
        getTemplate(String(generated.templateId)),
        getTemplateVersions(String(generated.templateId)),
      ]).catch(() => [null, null] as const);
      if (mounted.current && template && page)
        setResult({
          template,
          versions: page.items,
          nextPageToken: page.nextPageToken,
        });
      else if (mounted.current)
        setError(
          '임시저장은 완료했지만 버전 이력을 불러오지 못했습니다. 새로고침해 주세요.',
        );
      return mounted.current ? generated : null;
    } catch (cause) {
      if (mounted.current) setError(getTemplateError(cause));
      return null;
    } finally {
      operationRef.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const publish = async (versionNumber: number) => {
    if (!result || operationRef.current || moreRef.current) return false;
    operationRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await publishTemplate(String(result.template.templateId), versionNumber);
      return mounted.current;
    } catch (cause) {
      if (mounted.current) setError(getTemplateError(cause));
      return false;
    } finally {
      operationRef.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const loadMore = async () => {
    if (!result?.nextPageToken || moreRef.current || operationRef.current)
      return;
    moreRef.current = true;
    setLoadingMore(true);
    setError(null);
    try {
      const page = await getTemplateVersions(
        String(result.template.templateId),
        result.nextPageToken,
      );
      if (mounted.current)
        setResult((current) =>
          current
            ? {
                ...current,
                versions: [
                  ...current.versions,
                  ...page.items.filter(
                    (item) =>
                      !current.versions.some(
                        (existing) =>
                          existing.versionNumber === item.versionNumber,
                      ),
                  ),
                ],
                nextPageToken: page.nextPageToken,
              }
            : current,
        );
    } catch (cause) {
      if (mounted.current) setError(getTemplateError(cause));
    } finally {
      moreRef.current = false;
      if (mounted.current) setLoadingMore(false);
    }
  };

  // 생성 직후 상세·이력을 읽는 동안에도 이미 받은 결과와 대화는 표시한다.
  const hasGeneratedTemplate =
    generation !== null && String(generation.templateId) === initialId;

  return {
    template: result?.template ?? null,
    generation,
    versions: result?.versions ?? [],
    nextPageToken: result?.nextPageToken,
    loading: Boolean(
      initialId && !result && !loadError && !hasGeneratedTemplate,
    ),
    loadError: hasGeneratedTemplate ? null : loadError,
    error: error ?? (hasGeneratedTemplate ? loadError : null),
    busy,
    loadingMore,
    generate,
    publish,
    loadMore,
  };
};
