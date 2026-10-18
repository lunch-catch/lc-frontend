import type { ComponentPropsWithoutRef, ElementType } from 'react';

// 흰 카드 모양. 바탕에 붙어 있는 카드라 그림자 없이 얇은 테두리로 경계를 보여준다
// 그림자는 포스터나 떠 있는 버튼처럼 내용 위에 뜨는 것에만 쓴다
// 링크나 버튼처럼 요소에 다른 역할이 있으면 Card 대신 이 클래스를 붙인다
export const cardClassName =
  'rounded-2xl border border-border-subtle bg-bg-surface';

type CardTag = 'div' | 'section' | 'article' | 'ul' | 'li' | 'dl';

type CardProps<T extends CardTag> = { as?: T } & ComponentPropsWithoutRef<T>;

// 여러 화면이 같은 카드 모양을 쓰도록 모은다. 안쪽 여백은 내용에 따라 다르니 className으로 준다
const Card = <T extends CardTag = 'div'>({
  as,
  className,
  ...props
}: CardProps<T>) => {
  const Tag = (as ?? 'div') as ElementType;
  return (
    <Tag
      className={[cardClassName, className].filter(Boolean).join(' ')}
      {...props}
    />
  );
};

export default Card;
