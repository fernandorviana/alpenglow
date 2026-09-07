import type { ReactNode } from 'react';

/**
 * Every page is content plus evidence. The gutter is where measured numbers
 * live, in one column so they can be read down the page instead of hunted for
 * inside prose.
 */
export function Page({ children, evidence }: { children: ReactNode; evidence?: ReactNode }) {
  return (
    <div className="page">
      <article className="prose">{children}</article>
      <aside className="gutter" aria-label="Measurements">
        {evidence}
      </aside>
    </div>
  );
}
