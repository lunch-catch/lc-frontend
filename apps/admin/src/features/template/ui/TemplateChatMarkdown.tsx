import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** AI 답변의 마크다운만 렌더링한다. 원시 HTML은 실행하지 않고 텍스트로 표시한다. */
export const TemplateChatMarkdown = ({ children }: { children: string }) => (
  <div
    className={[
      'min-w-0 whitespace-normal [&>*+*]:mt-2 [&_p]:whitespace-pre-wrap [&_h1]:text-lg [&_h2]:text-base',
      '[&_h3]:text-body-sm-web [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_h4]:font-semibold',
      '[&_h5]:font-semibold [&_h6]:font-semibold [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5',
      '[&_li+li]:mt-1 [&_li>ul]:mt-1 [&_li>ol]:mt-1 [&_strong]:font-semibold [&_blockquote]:border-l-2',
      '[&_blockquote]:border-border-subtle [&_blockquote]:pl-3 [&_blockquote]:text-text-secondary [&_code]:rounded',
      '[&_code]:bg-surface-subtle [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.85em] [&_pre]:overflow-x-auto',
      '[&_pre]:rounded-lg [&_pre]:bg-surface-subtle [&_pre]:p-3 [&_pre]:whitespace-pre [&_pre_code]:bg-transparent',
      '[&_pre_code]:p-0 [&_a]:text-text-brand [&_a]:underline [&_th]:border [&_th]:border-border-subtle [&_th]:px-2',
      '[&_th]:py-1 [&_th]:text-left [&_td]:border [&_td]:border-border-subtle [&_td]:px-2 [&_td]:py-1',
      '[&_hr]:border-border-subtle',
    ].join(' ')}
  >
    <Markdown
      remarkPlugins={[remarkGfm]}
      disallowedElements={['img']}
      components={{
        table: ({ children }) => (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-caption-web">
              {children}
            </table>
          </div>
        ),
      }}
    >
      {children}
    </Markdown>
  </div>
);
