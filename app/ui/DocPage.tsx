import { Children, Fragment, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { OnThisPage, type Section } from './OnThisPage';
import { Pager } from './Pager';

/** The text a node renders, for a heading's id. */
function textOf(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return '';
}

/** `Variants and tones` → `variants-and-tones`. Accents fold, punctuation goes. */
const slug = (text: string) =>
  text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');

type Heading = ReactElement<{ id?: string; children?: ReactNode }, 'h2'>;

const isSection = (node: ReactNode): node is Heading => isValidElement(node) && node.type === 'h2';

/**
 * Gives every `h2` among `children` an id from its text, and returns the
 * children with the ids in place and the list of sections they make.
 *
 * Done while rendering rather than in an effect so the anchors are in the
 * static HTML: a link into a section has to land before React has run, and
 * the list has to be there for a reader with no script at all. Only `h2`s
 * that are children of the page — directly, or through a fragment — count;
 * a heading inside a specimen is the specimen's, not the page's.
 */
function anchored(children: ReactNode): { children: ReactNode; sections: Section[] } {
  const sections: Section[] = [];
  const taken = new Set<string>();

  const walk = (nodes: ReactNode): ReactNode =>
    Children.map(nodes, (node) => {
      if (isValidElement<{ children?: ReactNode }>(node) && node.type === Fragment) {
        return cloneElement(node, undefined, walk(node.props.children));
      }
      if (!isSection(node)) return node;

      const label = textOf(node.props.children);
      let id = node.props.id ?? slug(label);
      // Two sections with one name are told apart by position, `sizes-2`.
      for (let n = 2; taken.has(id); n++) id = `${slug(label)}-${n}`;
      taken.add(id);
      sections.push({ id, label });
      return node.props.id ? node : cloneElement(node, { id });
    });

  return { children: walk(children), sections };
}

/**
 * Every page is content plus evidence. The gutter is where measured numbers
 * live, in one column so they can be read down the page instead of hunted for
 * inside prose. On a wide screen the page's own sections are listed on the
 * other side, and the page before and after close the prose.
 */
export function DocPage({ children, evidence }: { children: ReactNode; evidence?: ReactNode }) {
  const page = anchored(children);

  return (
    <div className="page">
      <OnThisPage sections={page.sections} />
      <article className="prose">
        {page.children}
        <Pager />
      </article>
      <aside className="gutter" aria-label="Measurements">
        {evidence}
      </aside>
    </div>
  );
}
