import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import * as jsxRuntime from 'react/jsx-runtime';
import ts from 'typescript';

// 실제 시간 대신 가상 시계를 진행해 표시 중단과 완료의 차이를 검증한다.
const createReveal = ({ reducedMotion = false, complete = false } = {}) => {
  const text = '안녕하세요 👨‍👩‍👧‍👦 **답변 내용**입니다. '.repeat(20);
  const states = [];
  const refs = [];
  const memos = [];
  const effects = [];
  let cursor = 0;
  let clock = 0;
  let completed = 0;
  let interval;
  let props = { text, complete, stopped: false };
  const pending = [];
  const effect = (callback, deps) => {
    const index = cursor++;
    const previous = effects[index];
    if (
      !previous ||
      deps.some((value, i) => !Object.is(value, previous.deps[i]))
    ) {
      pending.push(() => {
        previous?.cleanup?.();
        effects[index] = { deps, cleanup: callback() };
      });
    }
  };
  const react = {
    useState: (initial) => {
      const index = cursor++;
      if (!(index in states))
        states[index] = typeof initial === 'function' ? initial() : initial;
      return [
        states[index],
        (value) => {
          states[index] = value;
        },
      ];
    },
    useRef: (initial) => {
      const index = cursor++;
      return (refs[index] ??= { current: initial });
    },
    useMemo: (factory, deps) => {
      const index = cursor++;
      const previous = memos[index];
      if (
        !previous ||
        deps.some((value, i) => !Object.is(value, previous.deps[i]))
      )
        memos[index] = { deps, value: factory() };
      return memos[index].value;
    },
    useEffect: effect,
    useLayoutEffect: effect,
    useEffectEvent: (callback) => callback,
  };
  const exports = {};
  const source = readFileSync(
    new URL(
      '../src/features/template/ui/TemplateChatReveal.tsx',
      import.meta.url,
    ),
    'utf8',
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  vm.runInNewContext('(function(exports, require) {' + outputText + '\n})', {
    Intl,
    performance: { now: () => clock },
    window: {
      matchMedia: () => ({ matches: reducedMotion }),
      setInterval: (callback) => {
        interval = callback;
        return 1;
      },
      clearInterval: () => {
        interval = undefined;
      },
    },
  })(exports, (id) => {
    if (id === 'react') return react;
    if (id === 'react/jsx-runtime') return jsxRuntime;
    if (id === './TemplateChatMarkdown')
      return { TemplateChatMarkdown: () => null };
    throw new Error('Unexpected import: ' + id);
  });
  const render = (next = {}) => {
    props = { ...props, ...next };
    cursor = 0;
    const element = exports.TemplateChatReveal({
      ...props,
      onComplete: () => {
        completed++;
      },
      onProgress: () => false,
    });
    pending.splice(0).forEach((callback) => callback());
    return {
      text: element.props.children.props.children,
      busy: element.props['aria-busy'],
    };
  };
  return {
    text,
    render,
    tick: (ms) => {
      clock += ms;
      interval?.();
      return render();
    },
    get completed() {
      return completed;
    },
    get running() {
      return Boolean(interval);
    },
  };
};

test('표시 중단 후 완료 상태·재렌더링에도 남은 답변을 펼치지 않는다', () => {
  const reveal = createReveal();
  reveal.render();
  const partial = reveal.tick(160);
  assert.ok(
    partial.text.length > 0 && partial.text.length < reveal.text.length,
  );
  const stopped = reveal.render({ stopped: true, complete: true });
  assert.equal(stopped.text, partial.text);
  assert.equal(stopped.busy, false);
  assert.equal(reveal.running, false);
  assert.equal(reveal.tick(5000).text, partial.text);
  assert.equal(reveal.completed, 0);
});

test('첫 글자 전 중단해도 전체 답변이 나타나지 않는다', () => {
  const reveal = createReveal();
  reveal.render();
  assert.equal(reveal.render({ stopped: true, complete: true }).text, '');
  assert.equal(reveal.tick(5000).text, '');
});

test('중단하지 않은 답변은 끝까지 표시하고 완료를 알린다', () => {
  const reveal = createReveal();
  reveal.render();
  const result = reveal.tick(4100);
  assert.equal(result.text, reveal.text);
  assert.equal(result.busy, false);
  assert.equal(reveal.completed, 1);
  assert.equal(reveal.running, false);
});

test('동작 줄이기 설정과 이미 완료된 답변은 즉시 전체를 표시한다', () => {
  for (const options of [{ reducedMotion: true }, { complete: true }]) {
    const reveal = createReveal(options);
    assert.equal(reveal.render().text, reveal.text);
    assert.equal(reveal.running, false);
  }
});
