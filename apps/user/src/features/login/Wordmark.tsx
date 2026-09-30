// 두 가지 색으로 쓰는 "런치캐치" 글자 로고
const Wordmark = ({ className }: { className?: string }) => {
  return (
    <p
      className={['text-h2-mobile font-black text-text-primary', className]
        .filter(Boolean)
        .join(' ')}
    >
      런치<span className="text-action-primary">캐치</span>
    </p>
  );
};

export default Wordmark;
