'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Checkmark } from '@carbon/icons-react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { Bedrock } from '@ui/Bedrock';
import { Card, Cards } from '@ui/Card';
import { Ramp } from '@ui/Ramp';
import { NAV } from '@ui/contents';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { resolve } from '@/tokens/contrast';
import { theme } from '@/tokens/theme';
import { primitives } from '@/tokens/primitives';

/**
 * The section cards' pictures, keyed by the section's route. The install
 * line is the short form: a line of code never wraps, and the card is 128
 * of text at its narrowest, three across at 40rem — `npm install
 * alpenglow` is 140 and the stylesheet's import 200, so the well cut them.
 * `Card.test.tsx` holds every line to that room.
 */
const PICTURES: Record<string, ReactNode> = {
  '/develop': (
    <pre className="miniCode">
      <code>npm i alpenglow</code>
    </pre>
  ),
  '/foundations': <Ramp />,
  '/components': (
    <div className="miniRow">
      <Button size="sm">Confirm booking</Button>
      <Badge tone="success" icon={<Checkmark size={16} />}>
        Confirmed
      </Badge>
    </div>
  ),
};

/**
 * The Start here section's page, and the site's front door: the hero, the
 * three pages to read first, then the other three sections. Each section's
 * own page holds the cards for the pages inside it; this one does not repeat
 * them.
 */
export default function Page() {
  const [start, ...sections] = NAV;
  const counts = {
    primitives: Object.keys(primitives).length,
    theme: Object.keys(theme).length,
    // Derived, not typed. A hand-written count is exactly the kind of number
    // this system exists to stop shipping.
    aliases: Object.values(theme).filter((t) => !String(t.light).startsWith('#')).length,
  };

  return (
    <DocPage
      evidence={
        <>
          <p>{counts.primitives} primitives</p>
          <p>{counts.theme} theme tokens</p>
          <p>{counts.aliases} aliases</p>
          <p>0 hex</p>
        </>
      }
    >
      <div className="hero">
        <div>
          <h1>Bring structure to light</h1>
          <p className="lead">
            A design system that shows its working. Alpenglow is built for dense, data-heavy
            interfaces — scheduling grids, patient records, tables that stay legible at 11px. Light
            and dark, with every contrast ratio measured rather than assumed.
          </p>
          <p className="heroActions">
            <Link href="/install" className="heroAction">
              Install
            </Link>
            <Link href="/why">Why Alpenglow</Link>
          </p>
          <p className="ratioLine">
            Body text on a card, measured as this page renders —{' '}
            <Ratio fg={resolve('text/primary', 'light')} bg={resolve('surface/raised', 'light')} />{' '}
            light,{' '}
            <Ratio fg={resolve('text/primary', 'dark')} bg={resolve('surface/raised', 'dark')} />{' '}
            dark.
          </p>
        </div>
        <Bedrock />
      </div>

      <h2>{start!.title}</h2>
      <Cards>
        <Card
          href="/why"
          title="Why Alpenglow"
          description="The name, the landscape the layers take, and the rule that splits them."
        />
        <Card
          href="/accessibility"
          title="Accessibility"
          description="What is measured, what the suite asserts, and where the system stops short."
        />
        <Card
          href="/decisions"
          title="Decisions"
          description="The parts that look like mistakes, and the numbers that made them the right answer."
        />
      </Cards>

      <h2>The sections</h2>
      <Cards>
        {sections.map((section) => (
          <Card
            key={section.href}
            href={section.href}
            title={section.title}
            description={section.blurb}
            visual={PICTURES[section.href]}
          />
        ))}
      </Cards>
    </DocPage>
  );
}
