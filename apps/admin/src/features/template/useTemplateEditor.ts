import { useEffect, useRef, useState } from 'react';

import { ApiError } from '@admin/api/client';
import {
  generateTemplate,
  getTemplate,
  getTemplateVersions,
  publishTemplate,
  type TemplateGeneration,
} from '@admin/api/templates';
import { useRequestFeedback } from '@admin/hooks/useRequestFeedback';

import type {
  PosterTemplate,
  TemplateVersion,
  TemplateVersionAvailability,
} from './templateTypes';
import { getTemplateError } from './templateUtils';

const RECHECK_TIMEOUT_MS = 10000;

interface EditorResult {
  template: PosterTemplate;
  versions: TemplateVersion[];
  nextPageToken: string | null;
}

/** 서버에 저장된 초안과 버전을 관리하며, 실패한 생성 요청의 식별자를 재시도에 재사용한다. */
export const useTemplateEditor = (initialId?: string) => {
  const [result, setResult] = useState<EditorResult | null>(null);
  const [generation, setGeneration] = useState<TemplateGeneration | null>(null);
  // HTML을 유지하는 일반 대화에서도 이전 추천은 최신 응답의 빈 배열로 교체한다.
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const savedId = useRef(initialId);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [requestPending, setRequestPending] = useState(false);
  const [stopNotice, setStopNotice] = useState('');
  const generationController = useRef<AbortController | null>(null);
  const recheckController = useRef<AbortController | null>(null);
  const { isWaiting, retryAfterSeconds, reportError } = useRequestFeedback();
  const [loadingMore, setLoadingMore] = useState(false);
  const [versionsFresh, setVersionsFresh] = useState(false);
  const [deletedVersions, setDeletedVersions] = useState<number[]>([]);
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
      generationController.current?.abort();
      recheckController.current?.abort();
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
        if (!controller.signal.aborted) {
          setResult({
            template,
            versions: page.items,
            nextPageToken: page.nextPageToken,
          });
          setVersionsFresh(true);
        }
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setLoadError(getTemplateError(cause));
      });
    return () => controller.abort();
  }, [initialId]);

  const getVersionAvailability = (
    versionNumber: number,
  ): TemplateVersionAvailability => {
    if (deletedVersions.includes(versionNumber)) return 'deleted';
    // 수정 성공 시 오래된 버전이 삭제될 수 있어 재조회 전 목록은 신뢰하지 않는다.
    if (!versionsFresh)
      return generation?.versionNumber === versionNumber
        ? 'available'
        : 'unknown';
    if (result?.versions.some((item) => item.versionNumber === versionNumber))
      return 'available';
    // 아직 다음 페이지가 있으면 목록에 없다는 이유만으로 삭제됐다고 단정하지 않는다.
    return result?.nextPageToken ? 'unknown' : 'deleted';
  };

  // 연결 중단이 서버 작업 취소를 보장하지 않으므로, 알고 있는 ID의 저장 결과만 확인한다.
  const readSavedResult = async (id: string) => {
    const controller = new AbortController();
    recheckController.current?.abort();
    recheckController.current = controller;
    const timeout = window.setTimeout(
      () => controller.abort(),
      RECHECK_TIMEOUT_MS,
    );
    try {
      const [template, page] = await Promise.all([
        getTemplate(id, controller.signal),
        getTemplateVersions(id, undefined, controller.signal),
      ]);
      if (!mounted.current || controller.signal.aborted) return;
      setResult({
        template,
        versions: page.items,
        nextPageToken: page.nextPageToken,
      });
      setVersionsFresh(true);
    } finally {
      window.clearTimeout(timeout);
      if (recheckController.current === controller)
        recheckController.current = null;
    }
  };
  const recheckSaved = async () => {
    const id = result ? String(result.template.templateId) : savedId.current;
    if (!id || operationRef.current || moreRef.current) return;
    operationRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await readSavedResult(id);
    } catch {
      if (mounted.current)
        setError(
          '저장 결과를 확인하지 못했습니다. 잠시 후 다시 확인해 주세요.',
        );
    } finally {
      operationRef.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const stopGeneration = () => generationController.current?.abort();

  const generate = async (
    name: string,
    requestPrompt: string,
    selectedVersionNumber?: number,
  ) => {
    if (operationRef.current || moreRef.current || isWaiting) return null;
    const trimmedName = name.trim();
    const trimmedPrompt = requestPrompt.trim();
    if (
      !trimmedName ||
      trimmedName.length > 100 ||
      !trimmedPrompt ||
      trimmedPrompt.length > 500
    ) {
      setError('템플릿명은 1~100자, 요청 내용은 1~500자로 입력해 주세요.');
      return null;
    }
    const id = result ? String(result.template.templateId) : savedId.current;
    if (
      id &&
      (selectedVersionNumber === undefined ||
        !Number.isSafeInteger(selectedVersionNumber) ||
        selectedVersionNumber <= 0)
    ) {
      setError('수정할 기준 버전을 다시 선택해 주세요.');
      return null;
    }
    if (
      id &&
      selectedVersionNumber !== undefined &&
      getVersionAvailability(selectedVersionNumber) !== 'available'
    ) {
      setError('선택한 버전을 사용할 수 없습니다. 다른 버전을 선택해 주세요.');
      return null;
    }
    // 현재 수정 API는 최신 버전만 사용하므로 이전 버전의 선택 내용을 잘못 적용하지 않는다.
    const latestVersionNumber = Math.max(
      generation?.versionNumber ?? 0,
      ...(result?.versions.map((item) => item.versionNumber) ?? []),
    );
    if (id && selectedVersionNumber !== latestVersionNumber) {
      setError(
        '현재는 최신 버전만 수정할 수 있습니다. 최신 버전으로 이동해 주세요.',
      );
      return null;
    }
    // 선택 버전은 서버에 보내지 않지만 같은 문구를 새 버전에서 다시 요청하는 경우를 구분한다.
    const key = JSON.stringify([
      id,
      selectedVersionNumber,
      trimmedName,
      trimmedPrompt,
    ]);
    // 응답 유실 후 같은 입력을 재전송해도 생성·버전 추가가 중복되지 않게 한다.
    if (pendingRequest.current?.key !== key)
      pendingRequest.current = { key, requestId: crypto.randomUUID() };
    operationRef.current = true;
    const controller = new AbortController();
    generationController.current = controller;
    setBusy(true);
    setRequestPending(true);
    setStopNotice('');
    setError(null);
    try {
      const generated = await generateTemplate(
        {
          name: trimmedName,
          requestPrompt: trimmedPrompt,
          requestId: pendingRequest.current.requestId,
        },
        id,
        controller.signal,
      );
      // 취소 후 늦게 도착한 결과로 화면이나 재시도용 요청 ID를 덮어쓰지 않는다.
      controller.signal.throwIfAborted();
      if (mounted.current) setRequestPending(false);
      // 503·네트워크 오류에는 ID를 보존하고, 성공한 요청만 다음 전송과 구분한다.
      pendingRequest.current = null;
      if (!mounted.current) return null;
      setSuggestedPrompts(generated.suggestedPrompts);
      // 대화만 완료된 경우 미리보기·저장 ID·버전 이력은 그대로 유지한다.
      if (generated.status === null) return generated;
      savedId.current = String(generated.templateId);
      setGeneration(generated);
      setVersionsFresh(false);
      // 새 템플릿은 서버 ID가 있는 편집 주소로 이동한 뒤 상세와 이력을 불러온다.
      if (!initialId) return generated;
      // 생성 응답에 생성 시각은 없으므로 임의 날짜를 채우지 않고 상세·이력에서 읽는다.
      // 후속 조회 실패가 이미 저장된 생성 결과를 실패로 바꾸지 않도록 별도로 처리한다.
      const [template, page] = await Promise.all([
        getTemplate(String(generated.templateId)),
        getTemplateVersions(String(generated.templateId)),
      ]).catch(() => [null, null] as const);
      if (mounted.current && template && page) {
        setResult({
          template,
          versions: page.items,
          nextPageToken: page.nextPageToken,
        });
        setVersionsFresh(true);
      } else if (mounted.current)
        setError(
          '임시저장은 완료했지만 버전 이력을 불러오지 못했습니다. 새로고침해 주세요.',
        );
      return mounted.current ? generated : null;
    } catch (cause) {
      if (mounted.current && controller.signal.aborted) {
        setRequestPending(false);
        setStopNotice(
          '응답 대기를 중단했습니다. 서버에서는 생성이 계속될 수 있으니, 다시 보내기 전에 저장 결과를 확인해 주세요.',
        );
        if (id) {
          try {
            await readSavedResult(id);
          } catch {
            if (mounted.current)
              setError(
                '저장 결과를 확인하지 못했습니다. 다시 확인하거나 목록을 열어 주세요.',
              );
          }
        }
      } else if (mounted.current) {
        setError(getTemplateError(cause));
        if (cause instanceof ApiError && cause.code === 'POSTER-004')
          reportError(cause);
      }
      return null;
    } finally {
      if (generationController.current === controller)
        generationController.current = null;
      operationRef.current = false;
      if (mounted.current) {
        setBusy(false);
        setRequestPending(false);
      }
    }
  };

  const publish = async (versionNumber: number) => {
    if (!result || operationRef.current || moreRef.current) return false;
    if (getVersionAvailability(versionNumber) !== 'available') {
      setError('선택한 버전을 사용할 수 없습니다. 다른 버전을 선택해 주세요.');
      return false;
    }
    operationRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await publishTemplate(String(result.template.templateId), versionNumber);
      return mounted.current;
    } catch (cause) {
      // 다른 관리자 요청으로 버전이 삭제됐을 때도 남아 있는 버전 목록으로 갱신한다.
      if (cause instanceof ApiError && cause.code === 'POSTER-008') {
        if (mounted.current) {
          setVersionsFresh(false);
          // 후속 목록 조회가 실패해도 서버가 삭제를 확인한 버전은 다시 허용하지 않는다.
          setDeletedVersions((current) =>
            current.includes(versionNumber)
              ? current
              : [...current, versionNumber],
          );
        }
        const page = await getTemplateVersions(
          String(result.template.templateId),
        ).catch(() => null);
        if (mounted.current && page) {
          setResult((current) =>
            current
              ? {
                  ...current,
                  versions: page.items,
                  nextPageToken: page.nextPageToken,
                }
              : current,
          );
          setVersionsFresh(true);
        }
      }
      if (mounted.current) setError(getTemplateError(cause));
      return false;
    } finally {
      operationRef.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const loadMore = async () => {
    if (
      !versionsFresh ||
      !result?.nextPageToken ||
      moreRef.current ||
      operationRef.current
    )
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
    suggestedPrompts,
    dismissSuggestions: () => setSuggestedPrompts([]),
    versions: result?.versions ?? [],
    nextPageToken: versionsFresh ? result?.nextPageToken : null,
    getVersionAvailability,
    loading: Boolean(
      initialId && !result && !loadError && !hasGeneratedTemplate,
    ),
    loadError: hasGeneratedTemplate ? null : loadError,
    error: error ?? (hasGeneratedTemplate ? loadError : null),
    busy,
    isWaiting,
    retryAfterSeconds,
    requestPending,
    stopNotice,
    stopGeneration,
    recheckSaved,
    canRecheck: Boolean(initialId || result || generation),
    loadingMore,
    generate,
    publish,
    loadMore,
  };
};
