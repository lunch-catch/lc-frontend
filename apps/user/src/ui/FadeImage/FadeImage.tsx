import { type ComponentPropsWithoutRef, useState } from 'react';

// 이번 접속에서 한 번 다 받은 사진 주소. 다른 화면에 갔다 돌아와 다시 그릴 때는 전환 없이 바로 보여준다
const loadedSources = new Set<string>();

interface FadeImageProps extends Omit<
  ComponentPropsWithoutRef<'img'>,
  'className'
> {
  // 사진 자리의 크기와 모양. 사진을 받는 동안 이 자리에 회색 바탕이 보인다
  className?: string;
  // 사진 자체에 줄 모양 (흑백 처리 등)
  imageClassName?: string;
}

// 사진을 받는 동안 회색 자리를 두고, 다 받으면 부드럽게 나타나게 해 갑자기 튀어나오지 않게 한다
// 이미 받아 둔 사진은 나타나는 전환 없이 바로 보여, 화면을 오갈 때 사진이 깜빡이지 않게 한다
const FadeImage = ({
  className = '',
  imageClassName = '',
  onLoad,
  src,
  ...props
}: FadeImageProps) => {
  // 다 받은 사진 주소와, 나타날 때 전환을 줄지. 주소가 바뀌면 새 사진을 다시 기다린다
  const [loaded, setLoaded] = useState<{ fade: boolean; src: string } | null>(
    () => (src && loadedSources.has(src) ? { fade: false, src } : null),
  );
  const isLoaded = Boolean(src) && loaded?.src === src;

  const markLoaded = (fade: boolean) => {
    if (!src || isLoaded) return;
    loadedSources.add(src);
    setLoaded({ fade, src });
  };

  return (
    <span className={`block overflow-hidden bg-surface-subtle ${className}`}>
      <img
        {...props}
        className={`size-full object-cover ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${
          loaded?.fade
            ? 'transition-opacity duration-200 ease-out motion-reduce:transition-none'
            : ''
        } ${imageClassName}`}
        onLoad={(event) => {
          markLoaded(true);
          onLoad?.(event);
        }}
        // 브라우저에 이미 있는 사진은 처음 그릴 때 벌써 다 받아진 상태라, 전환 없이 바로 보여준다
        ref={(image) => {
          if (image?.complete && image.naturalWidth > 0) markLoaded(false);
        }}
        src={src}
      />
    </span>
  );
};

export default FadeImage;
