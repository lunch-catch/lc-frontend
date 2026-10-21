export interface TemplateSelection {
  source: 'preview' | 'code';
  label: string;
  html: string;
  selector?: string;
  line?: number;
}

/** 원본 HTML의 문자열 위치를 사용하며 end는 요소의 마지막 문자 다음 위치다. */
export interface TemplateCodeElement {
  start: number;
  end: number;
  openEnd: number;
  closeStart: number;
  selection: TemplateSelection;
}

const voidTags = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/** 원본 위치는 따옴표·주석·중첩을 구분해 찾고, 요소 식별 경로는 브라우저가 해석한 DOM에서 얻는다. */
export const getTemplateCodeElements = (
  html: string,
): TemplateCodeElement[] => {
  const tags: {
    tag: string;
    start: number;
    openEnd: number;
    closeStart: number;
    end: number;
  }[] = [];
  const stack: typeof tags = [];
  const edits: { at: number; text: string }[] = [];
  let cursor = 0;
  while (cursor < html.length) {
    const start = html.indexOf('<', cursor);
    if (start < 0) break;
    if (html.startsWith('<!--', start)) {
      const end = html.indexOf('-->', start + 4);
      cursor = end < 0 ? html.length : end + 3;
      continue;
    }
    const match = /^<(\/?)([a-z][\w:-]*)\b/i.exec(html.slice(start));
    if (!match) {
      cursor = start + 1;
      continue;
    }
    let quote = '';
    let end = start + match[0].length;
    for (; end < html.length; end++) {
      const char = html[end];
      if (quote) {
        if (char === quote) quote = '';
      } else if (char === '"' || char === "'") quote = char;
      else if (char === '>') break;
    }
    if (end === html.length) break;
    cursor = end + 1;
    const tag = match[2].toLowerCase();
    if (match[1]) {
      const index = stack.map((item) => item.tag).lastIndexOf(tag);
      if (index < 0) continue;
      stack.slice(index).forEach((item, offset) => {
        item.closeStart = start;
        item.end = offset === 0 ? cursor : start;
      });
      stack.splice(index);
      continue;
    }
    const item = {
      tag,
      start,
      openEnd: cursor,
      closeStart: cursor,
      end: cursor,
    };
    tags.push(item);
    edits.push({
      at: start + match[0].length,
      text: ` data-template-source-start="${start}"`,
    });
    if (!voidTags.has(tag) && !/\/\s*>$/.test(html.slice(start, cursor))) {
      stack.push(item);
      item.closeStart = html.length;
      item.end = html.length;
      // 스크립트·스타일·텍스트 영역 안의 '<태그>' 문자열은 구조로 해석하지 않는다.
      if (['script', 'style', 'textarea', 'title'].includes(tag)) {
        const closing = new RegExp(`</${tag}\\s*>`, 'ig');
        closing.lastIndex = cursor;
        const close = closing.exec(html);
        cursor = close ? close.index : html.length;
      }
    }
  }
  // 뒤에서부터 표시를 삽입해야 앞서 계산한 원본 코드의 위치가 밀리지 않는다.
  let instrumented = html;
  for (const edit of edits.reverse())
    instrumented =
      instrumented.slice(0, edit.at) + edit.text + instrumented.slice(edit.at);
  const document = new DOMParser().parseFromString(instrumented, 'text/html');
  const elements = new Map<number, Element>();
  document
    .querySelectorAll('[data-template-source-start]')
    .forEach((element) => {
      elements.set(
        Number(element.getAttribute('data-template-source-start')),
        element,
      );
      element.removeAttribute('data-template-source-start');
    });
  return tags.flatMap((item) => {
    const element = elements.get(item.start);
    if (
      !element ||
      !document.body.contains(element) ||
      !/^(DIV|SPAN|P|H[1-6]|STRONG|EM|BR|IMG)$/.test(element.tagName)
    )
      return [];
    return [
      {
        start: item.start,
        end: item.end,
        openEnd: item.openEnd,
        closeStart: item.closeStart,
        selection: {
          ...selectTemplateElement(element),
          source: 'code' as const,
          html: html.slice(item.start, item.end),
          line: html.slice(0, item.start).split('\n').length,
        },
      },
    ];
  });
};

/** 선택 범위를 포함하는 가장 작은 요소를 찾고, 형제를 함께 선택하면 공통 부모로 확장한다. */
export const findTemplateCodeElement = (
  elements: TemplateCodeElement[],
  start: number,
  end = start + 1,
) =>
  elements
    .filter((element) => element.start <= start && element.end >= end)
    .sort((a, b) => a.end - a.start - (b.end - b.start))[0];

const slotLabels: Record<string, string> = {
  eventName: '이벤트명',
  discount: '할인 내용',
  period: '기간',
  image: '이미지',
};

/** 서버 원본 HTML에서도 찾을 수 있도록 편집기 장식은 제외하고 구조 기반 경로를 만든다. */
export const selectTemplateElement = (element: Element): TemplateSelection => {
  const slot = element.getAttribute('data-slot');
  const path: string[] = [];
  let current: Element | null = element;
  while (current && current.tagName.toLowerCase() !== 'body') {
    const tag = current.tagName.toLowerCase();
    const siblings = Array.from(current.parentElement?.children ?? []).filter(
      (sibling) => sibling.tagName === current?.tagName,
    );
    path.unshift(`${tag}:nth-of-type(${siblings.indexOf(current) + 1})`);
    current = current.parentElement;
  }
  const knownSlot = slot && Object.hasOwn(slotLabels, slot) ? slot : null;
  const selector =
    knownSlot &&
    element.ownerDocument.querySelectorAll(`[data-slot="${slot}"]`).length === 1
      ? `[data-slot="${slot}"]`
      : `body > ${path.join(' > ')}`;
  const copy = element.cloneNode(true) as Element;
  copy.removeAttribute('data-editor-selected');
  copy
    .querySelectorAll('[data-editor-selected]')
    .forEach((child) => child.removeAttribute('data-editor-selected'));
  const text = (element.textContent ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 30);
  return {
    source: 'preview',
    label:
      (knownSlot && slotLabels[knownSlot]) ||
      `${element.tagName.toLowerCase()}${text ? ` · ${text}` : ''}`,
    selector,
    html: copy.outerHTML,
  };
};

/** 기존 requestPrompt 계약 안에서 선택한 부분과 자연어 요청을 함께 전송한다. */
export const buildSelectedTemplatePrompt = (
  prompt: string,
  selection: TemplateSelection | null,
) => {
  const instruction = prompt.trim();
  if (!selection) return instruction;
  const prefix = `수정 대상: ${selection.label}\n위치: ${selection.selector ?? `HTML ${selection.line}행`}\n선택 코드:\n`;
  const suffix = `\n수정 요청: ${instruction}\n선택한 부분 위주로 수정하고 다른 영역과 슬롯 구조는 유지해 주세요.`;
  // 선택 정보도 500자 제한에 포함되므로 사용자 요청을 유지하고 코드 발췌문만 줄인다.
  const available = 500 - prefix.length - suffix.length;
  if (available < 32)
    throw new Error(
      '선택 영역과 함께 보낼 수 있도록 요청 내용을 조금 줄여 주세요.',
    );
  const snippet =
    selection.html.length > available
      ? `${selection.html.slice(0, available - 1)}…`
      : selection.html;
  return `${prefix}${snippet}${suffix}`;
};

/** 미리보기의 스크립트 실행·폼 제출·외부 리소스 로딩을 제한한다. */
export const createSelectablePreviewHtml = (html: string) => {
  const document = new DOMParser().parseFromString(html, 'text/html');
  // 미리보기는 A4 틀 안에 고정하며 원본 HTML 코드의 스크롤과 분리한다.
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  const policy = document.createElement('meta');
  policy.httpEquiv = 'Content-Security-Policy';
  policy.content =
    "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; base-uri 'none'; form-action 'none'";
  document.head.prepend(policy);
  return `<!doctype html>\n${document.documentElement.outerHTML}`;
};
