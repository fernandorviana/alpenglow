import type { AnchorHTMLAttributes, ReactNode, Ref } from 'react';

/** Everything the `a` would have been given: spread it on the router's link. */
export type LinkRenderProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  ref?: Ref<HTMLAnchorElement>;
};

/**
 * For a router's link, which has to be the element so that it can take the
 * click: `render={(props) => <NextLink {...props} />}`. The DropdownMenu's
 * `trigger` idiom.
 */
export type LinkRender = (props: LinkRenderProps) => ReactNode;

/**
 * The anchor, or the caller's. A component and not a call in the parent's
 * render, so the ref travels as a prop, as it does to any element: a ref
 * handed to a function during render is one that could be read there.
 */
export function Anchor({ render, ...props }: LinkRenderProps & { render?: LinkRender }) {
  return render ? render(props) : <a {...props} />;
}
