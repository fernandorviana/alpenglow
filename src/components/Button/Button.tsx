import { forwardRef } from 'react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode, Ref, RefAttributes } from 'react';
import { Loader } from '../Loader/Loader';
import { Anchor } from '../linkRender';
import type { LinkRender, LinkRenderProps } from '../linkRender';
import type { ControlSize, FillTone, TintTone } from '../vocabulary';
import styles from './Button.module.css';

type BaseProps = {
  size?: ControlSize;
  /** Renders a spinner, hides the label without changing the button's width, and blocks activation. */
  loading?: boolean;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
  fullWidth?: boolean;
  children?: ReactNode;
};

/** Every tone the theme can fill. */
export const buttonFillTones = ['accent', 'neutral', 'tertiary', 'success', 'danger'] as const satisfies readonly FillTone[];

/**
 * Outline and ghost paint the tone as text, outline as a border too.
 *
 * `tertiary` cannot be painted that way: its fill is flare/400, 2.53:1 on
 * white, and the theme has no tertiary text colour (flare/700 would clear
 * 7.84:1, but nobody has drawn the button that needs it), so
 * `variant="outline" tone="tertiary"` does not compile. `success` could — `text/success` and
 * `border/success`, added for field validation, clear 4.5:1 and 3:1 on the
 * canvas — but an outline success button was never drawn, so it is not
 * offered. Decided 2026-09-11.
 */
export const buttonTextTones = ['accent', 'neutral', 'danger'] as const satisfies readonly TintTone[];

type VariantProps =
  | { variant?: 'solid'; tone?: (typeof buttonFillTones)[number] }
  | { variant: 'outline' | 'ghost'; tone?: (typeof buttonTextTones)[number] };

export type ButtonAsButtonProps = BaseProps &
  VariantProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> & { href?: undefined; render?: undefined };

/**
 * A button that navigates is a link that looks like a button: the look is the
 * component's and the element follows `href`. Decided with the Link,
 * 2026-09-21, over a button variant on the Link, which would have copied every
 * size, tone and state here.
 */
export type ButtonAsLinkProps = BaseProps &
  VariantProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'color' | 'href' | 'type'> & {
    href: string;
    /**
     * An `a` has no `disabled`. Disabled or loading, it is rendered with no
     * `href` and `aria-disabled`: not focusable and not followed.
     */
    disabled?: boolean;
    /** For a router's link. Not called while disabled or loading. */
    render?: LinkRender;
  };

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

type LooseProps = BaseProps & {
  variant?: 'solid' | 'outline' | 'ghost';
  tone?: (typeof buttonFillTones)[number];
  href?: string;
  render?: LinkRender;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
};

function ButtonImpl(
  {
    variant = 'solid',
    tone = 'accent',
    size,
    loading = false,
    iconStart,
    iconEnd,
    fullWidth = false,
    disabled = false,
    children,
    className,
    type = 'button',
    href,
    render,
    ...rest
  }: LooseProps,
  ref: Ref<HTMLButtonElement | HTMLAnchorElement>,
) {
  const classes = [
    styles.button,
    styles[variant],
    styles[tone],
    styles[size ?? 'auto'],
    fullWidth && styles.fullWidth,
    loading && styles.loading,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inert = disabled || loading;

  const content = (
    <>
      <span className={styles.content}>
        {iconStart && (
          <span className={styles.icon} aria-hidden="true">
            {iconStart}
          </span>
        )}
        {children}
        {iconEnd && (
          <span className={styles.icon} aria-hidden="true">
            {iconEnd}
          </span>
        )}
      </span>
      {loading && (
        <span className={styles.spinner}>
          {/* No label: the button already carries aria-busy, and a second
              announcement would repeat what it said. */}
          <Loader tone="currentColor" size={size === 'lg' ? 'md' : 'sm'} />
        </span>
      )}
    </>
  );

  if (href !== undefined) {
    const anchorRef = ref as Ref<HTMLAnchorElement>;
    const anchor = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    if (inert) {
      // `role="link"`: an `a` with no `href` is no longer one to a screen reader.
      // Nothing that would make it answer: no handler and no place in the tab order.
      const quiet = Object.fromEntries(
        Object.entries(anchor).filter(([name]) => name !== 'tabIndex' && !/^on[A-Z]/.test(name)),
      );
      return (
        <a {...quiet} ref={anchorRef} role="link" aria-disabled="true" aria-busy={loading || undefined} className={classes}>
          {content}
        </a>
      );
    }
    const props = { ...anchor, ref, href, className: classes, children: content } as LinkRenderProps;
    return <Anchor render={render} {...props} />;
  }

  return (
    <button
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
      ref={ref as Ref<HTMLButtonElement>}
      type={type}
      className={classes}
      disabled={inert}
      aria-busy={loading || undefined}
    >
      {content}
    </button>
  );
}

ButtonImpl.displayName = 'Button';

export const Button = forwardRef(ButtonImpl) as {
  (props: ButtonAsButtonProps & RefAttributes<HTMLButtonElement>): ReactNode;
  (props: ButtonAsLinkProps & RefAttributes<HTMLAnchorElement>): ReactNode;
  /** A row that may or may not link: `href={item.href}`. A button when it is undefined. */
  (
    props: Omit<ButtonAsLinkProps, 'href'> & { href: string | undefined } & RefAttributes<HTMLAnchorElement | HTMLButtonElement>,
  ): ReactNode;
};
