import type { ReactNode } from 'react';
import Link from 'next/link';

/**
 * A grid of cards, each a link to one page of the documentation. A list, so
 * a screen reader can say how many there are and step through them.
 */
export function Cards({ children }: { children: ReactNode }) {
  return <ul className="cards">{children}</ul>;
}

/**
 * One page, as a card. The title is the link and the whole card is its hit
 * area: the link's pseudo-element stretches over the card, so the accessible
 * name is the title alone and the description stays a description.
 *
 * The visual is the real thing at rest — a Button, a Badge, a strip of one
 * ramp — and it is `inert`: a control inside a card that is itself a link
 * would be a control inside a control, so these are pictures that happen to
 * be built from the components, reachable by neither pointer nor Tab. Not
 * `aria-hidden`: jsdom has no `inert`, and the axe run would find focusable
 * controls inside a hidden region.
 */
export function Card({
  href,
  title,
  description,
  visual,
}: {
  href: string;
  title: string;
  description: string;
  visual?: ReactNode;
}) {
  return (
    <li className="card">
      {visual && (
        <div className="cardVisual" inert>
          {visual}
        </div>
      )}
      <div className="cardBody">
        <h3 className="cardTitle">
          <Link href={href} className="cardLink">
            {title}
          </Link>
        </h3>
        <p className="cardDescription">{description}</p>
      </div>
    </li>
  );
}
