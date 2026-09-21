import type { AnchorHTMLAttributes, CSSProperties, ReactNode } from 'react';
import styles from './Card.module.css';

const join = (...names: Array<string | undefined>) => names.filter(Boolean).join(' ');

export const cardElements = ['div', 'li', 'article', 'section'] as const;
export type CardElement = (typeof cardElements)[number];

export type CardProps = {
  /** `li` for a list of cards, so a screen reader can say how many there are. */
  as?: CardElement;
  children: ReactNode;
  className?: string;
};

/**
 * A filled surface a step under its ground, with no border: it stands on
 * `surface/raised`. In dark `surface/sunken` is the canvas, so on the canvas
 * it is not seen.
 *
 * It answers the pointer only when its title is a link, and then the whole
 * card is that link's hit area.
 */
export function Card({ as: Element = 'div', children, className }: CardProps) {
  return <Element className={join(styles.card, className)}>{children}</Element>;
}

export type CardMediaProps = {
  /** A CSS `aspect-ratio`. `'auto'` lets the content decide. */
  ratio?: string;
  children: ReactNode;
  className?: string;
};

/**
 * The picture set into the card. An `img` or a `video` covers it; anything
 * else — a component at rest, a chart — is centred on it.
 */
export function CardMedia({ ratio = '16 / 9', children, className }: CardMediaProps) {
  return (
    <div className={join(styles.media, className)} style={{ '--card-media-ratio': ratio } as CSSProperties}>
      {children}
    </div>
  );
}

export type CardBodyProps = { children: ReactNode; className?: string };

/** The words, standing 8 inside the picture's edge as drawn. */
export function CardBody({ children, className }: CardBodyProps) {
  return <div className={join(styles.body, className)}>{children}</div>;
}

export const cardTitleElements = ['h2', 'h3', 'h4', 'div'] as const;
export type CardTitleElement = (typeof cardTitleElements)[number];

export type CardTitleProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & {
  /** The heading level is the page's to decide. */
  as?: CardTitleElement;
  /** On the title's element, linked or not, so the card can be labelled by it. */
  id?: string;
  /**
   * Makes the card a link. The link is the title, so the title alone is its
   * name, and its `::after` stretches over the card, so the card is where it
   * is pressed. Every other anchor prop goes to that link, and means nothing
   * without it.
   *
   * A control or a second link in a linked card goes in `CardActions`, or
   * the card's link is pressed in its place.
   */
  href?: string;
  children: ReactNode;
  className?: string;
};

export function CardTitle({ as: Element = 'h3', id, href, children, className, ...anchor }: CardTitleProps) {
  return (
    <Element id={id} className={join(styles.title, className)}>
      {href === undefined ? (
        children
      ) : (
        <a {...anchor} href={href} className={styles.link}>
          {children}
        </a>
      )}
    </Element>
  );
}

export type CardActionsProps = { children: ReactNode; className?: string };

/**
 * Controls inside a card whose title is a link: lifted over the link's hit
 * area so they are pressed and not the card. Beside the link in the DOM, never
 * inside it.
 */
export function CardActions({ children, className }: CardActionsProps) {
  return <div className={join(styles.actions, className)}>{children}</div>;
}
