'use client';

/**
 * A script that runs while the browser parses the served HTML, and never again.
 *
 * React warns whenever it renders a `<script>` on the client, because a script
 * React creates is never executed. That is exactly what this one wants: it has
 * done its work before React arrives. So the server writes it as JavaScript and
 * the client renders it as `text/plain` — a data block, which React does not
 * warn about and the browser would not run. `suppressHydrationWarning` accepts
 * the one attribute that differs.
 *
 * It has to be a Client Component. Rendered from a Server Component, the type
 * is decided once, on the server, and the client would be handed JavaScript.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
