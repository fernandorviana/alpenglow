'use client';

import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { CodeBlock } from '@ui/CodeBlock';
import { Location as LocationIcon, OverflowMenuHorizontal, Wikis } from '@carbon/icons-react';
import { Card, CardActions, CardBody, CardMedia, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { DropdownMenu } from '@/components/DropdownMenu/index';
import type { DropdownMenuEntry } from '@/components/DropdownMenu/index';
import { Table } from '@/components/Table';
import { toast } from '@/components/Toast';
import { Services, UserMedic } from '@/icons';
import { resolve } from '@/tokens/contrast';
import { radius, spacing } from '@/tokens/scale';
import { textStyle } from '@/tokens/typography';
import type { Mode, ThemeTokenName } from '@/tokens/theme';

const MODES: Mode[] = ['light', 'dark'];

const PAIRS: ReadonlyArray<{ name: string; fg: ThemeTokenName; bg: ThemeTokenName }> = [
  { name: 'title', fg: 'text/primary', bg: 'surface/sunken' },
  { name: 'captions', fg: 'text/secondary', bg: 'surface/sunken' },
  { name: 'the card on its ground', fg: 'surface/sunken', bg: 'surface/raised' },
];

const USAGE = `import { Card, CardMedia, CardBody, CardTitle, CardActions } from 'alpenglow';

<ul>
  <Card as="li">
    <CardMedia>
      <img src={location.photo} alt="" />
    </CardMedia>
    <CardBody>
      <CardTitle href={\`/locations/\${location.id}\`}>{location.name}</CardTitle>
      <p>{location.address}</p>
      <CardActions>
        <LocationMenu location={location} />
      </CardActions>
    </CardBody>
  </Card>
</ul>`;

const menuFor = (name: string): DropdownMenuEntry[] => [
  { id: 'edit', label: 'Edit location', onSelect: () => toast(`Editing ${name}`) },
  { id: 'hours', label: 'Opening hours', onSelect: () => toast(`Opening hours of ${name}`) },
  'separator',
  { id: 'archive', label: 'Archive', tone: 'danger', onSelect: () => toast(`${name} archived`) },
];

type Place = { name: string; address: string; hours: string; staff: number; services: number; sky: ThemeTokenName };
const PLACES: Place[] = [
  { name: 'Phoenix Clinic Hospital', address: 'Rochester, MN 55905, US', hours: 'CST - 8:00am to 10:00pm', staff: 164, services: 24, sky: 'surface/accent-subtle' },
  { name: 'Scottsdale Clinic Building', address: 'Scottsdale, AZ 85259, US', hours: 'MST - 7:00am to 9:00pm', staff: 98, services: 17, sky: 'surface/info-subtle' },
];

/** A place, drawn from tokens so it follows the theme: no photograph ships with the site. */
function Ridge({ sky }: { sky: ThemeTokenName }) {
  const token = (name: ThemeTokenName) => `var(--ap-color-${name.replace('/', '-')})`;
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ display: 'block', width: '100%', height: '100%' }}>
      <rect width="320" height="180" fill={token(sky)} />
      <polygon points="0,120 70,70 130,104 200,56 262,96 320,72 320,180 0,180" fill={token('surface/sunken')} stroke={token('border/strong')} />
      <polygon points="0,150 90,116 170,142 250,112 320,134 320,180 0,180" fill={token('surface/raised')} stroke={token('border/strong')} />
    </svg>
  );
}

const meta = { display: 'flex', alignItems: 'center', gap: spacing['050'], margin: 0, color: 'var(--ap-color-text-secondary)', fontSize: textStyle['caption/md'].size, lineHeight: `${textStyle['caption/md'].lineHeight}px`, fontWeight: 500 } as const;

function LocationCard({ place }: { place: Place }) {
  return (
    <Card as="li">
      <CardMedia>
        <Ridge sky={place.sky} />
        <div style={{ position: 'absolute', insetInline: spacing[150], bottom: spacing[150], display: 'flex', flexWrap: 'wrap', gap: spacing['050'] }}>
          <Badge icon={<UserMedic />}>{place.staff} staff</Badge>
          <Badge icon={<Services />}>{place.services} services</Badge>
        </div>
      </CardMedia>
      <CardBody>
        <div style={{ display: 'flex', alignItems: 'start', gap: spacing[150] }}>
          <div style={{ flex: 1, minWidth: 0, display: 'grid', gap: spacing['050'] }}>
            <CardTitle href="#the-locations-card">{place.name}</CardTitle>
            <p style={meta}>
              <LocationIcon size={16} aria-hidden="true" />
              {place.address}
            </p>
            <p style={meta}>
              <Wikis size={16} aria-hidden="true" />
              {place.hours}
            </p>
          </div>
          <CardActions>
            <DropdownMenu
              trigger={(props) => (
                <Button variant="ghost" tone="neutral" size="sm" aria-label={`Options for ${place.name}`} iconStart={<OverflowMenuHorizontal size={20} />} {...props} />
              )}
              items={menuFor(place.name)}
            />
          </CardActions>
        </div>
      </CardBody>
    </Card>
  );
}

type Measure = { part: string; value: string };
/** Read from the scale and the text styles, so the page cannot quote a number the stylesheet does not use. */
const MEASURES: Measure[] = [
  { part: 'Padding', value: `${spacing[200]}, a transparent hairline included` },
  { part: 'Radius', value: String(radius['2xl']) },
  { part: 'Between parts', value: String(spacing[100]) },
  { part: 'Picture', value: `16 / 9, radius ${radius.xl}, elevation md; lg under the pointer` },
  { part: 'Body', value: `${spacing['050']} block, ${spacing[100]} inline` },
  { part: 'Title, Semibold', value: `${textStyle['body/lg'].size} / ${textStyle['body/lg'].lineHeight}` },
];

type PropRow = { prop: string; type: string; default: string };
const PROPS: PropRow[] = [
  { prop: 'Card · as', type: "'div' | 'li' | 'article' | 'section'", default: "'div'" },
  { prop: 'CardMedia · ratio', type: "a CSS aspect-ratio, or 'auto'", default: "'16 / 9'" },
  { prop: 'CardTitle · as', type: "'h2' | 'h3' | 'h4' | 'div'", default: "'h3'" },
  { prop: 'CardTitle · id', type: 'string, on the title’s element', default: '—' },
  { prop: 'CardTitle · href', type: 'string', default: '—' },
  { prop: 'CardTitle · render', type: '(props: LinkRenderProps) => ReactNode, with href', default: '—' },
  { prop: 'CardTitle · …anchor', type: 'target, rel, onClick and the rest of an anchor’s', default: '—' },
  { prop: 'every part · children', type: 'ReactNode', default: 'required' },
  { prop: 'every part · className', type: 'string', default: '—' },
];

export default function Page() {
  return (
    <DocPage
      evidence={
        <>
          {PAIRS.map((pair) => (
            <div key={pair.name}>
              <p>{pair.name}</p>
              {MODES.map((mode) => (
                <p key={mode}>
                  {mode} <Ratio fg={resolve(pair.fg, mode)} bg={resolve(pair.bg, mode)} />
                </p>
              ))}
            </div>
          ))}
        </>
      }
    >
      <h1>Card</h1>
      <p className="lead">
        A filled surface that holds one thing — a place, a person, a plan — and, when its
        title is a link, opens it from anywhere on the card.
      </p>

      <h2>The locations card</h2>
      <div className="specimen">
        <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: spacing[200], margin: 0, padding: 0 }}>
          {PLACES.map((place) => (
            <LocationCard key={place.name} place={place} />
          ))}
        </ul>
      </div>
      <p className="alias">
        The drawn card, rebuilt from the five parts. The title is the link and the whole card
        is where it is pressed; the dots are a menu of their own, over the link.
      </p>

      <h2>A surface and five parts</h2>
      <p>
        A complex product needs many cards and no list of props survives them. So the Card is
        the surface and the parts that are hard to get right — the picture set into it, the
        title that makes the card a link, the controls that stay pressable inside one — and
        everything else in it is the caller&rsquo;s.
      </p>
      <div className="specimen" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: spacing[200] }}>
        <Card>
          <CardBody>
            <CardTitle as="div">Staff on shift</CardTitle>
            <p style={{ margin: 0, fontSize: textStyle['heading/h4'].size, lineHeight: `${textStyle['heading/h4'].lineHeight}px`, fontWeight: 600 }}>164</p>
            <p style={{ ...meta, display: 'block' }}>12 more than last week</p>
          </CardBody>
        </Card>
        <Card>
          <CardMedia ratio="auto">
            <div style={{ padding: spacing[300] }}>
              <Badge tone="success" dot>
                Confirmed
              </Badge>
            </div>
          </CardMedia>
          <CardBody>
            <CardTitle as="div">A component as the picture</CardTitle>
            <p style={{ ...meta, display: 'block' }}>Anything that is not an image is centred on the raised well.</p>
          </CardBody>
        </Card>
      </div>
      <p>
        A card with no linked title is a container: it has no hover, no focus ring and no
        pointer, because it does nothing.
      </p>

      <h2>Where it stands</h2>
      <p>
        The card is a fill with no border, a step <em>under</em> its ground, as it is drawn: a
        grey card on a white page. That ground is <code>surface/raised</code> — a section, a
        panel, a dialog. On the canvas it is one faint step in light and, in dark, nothing:
        there the sunken surface <a href="/elevation">is the canvas</a>, because the ramp ends
        and no step is invented below it. A card on the canvas wants a hairline, which is the
        outline card the site&rsquo;s own pages use and this package does not have yet.
      </p>

      <h2>Where it leaves the drawing</h2>
      <p>
        Under the pointer the drawn card turns violet and shows what it was hiding: two counts
        and a &ldquo;See details&rdquo; button. A touch screen and a keyboard have no hover, so
        nothing is behind it. The counts are information and are always there; the button is
        gone, since the card is already the link. The hover is the theme&rsquo;s wash, on the
        card and on the picture, which rises from <code>elevation/md</code> to <code>lg</code>.
        The violet is kept for a card that is selected.
      </p>
      <p>
        The drawn captions are <code>text/tertiary</code>. On this fill they are 4.5:1 or more
        at rest and 4.27:1 under the wash in light, so the captions of a card that answers
        the pointer are <code>text/secondary</code>.
      </p>

      <h2>Anatomy</h2>
      <div className="specimen">
        <Table
          caption="Card geometry, in pixels"
          density="compact"
          columns={[
            { key: 'part', header: 'Part', primary: true, cell: (r: Measure) => r.part },
            { key: 'value', header: 'Value', cell: (r: Measure) => <span className="alias">{r.value}</span> },
          ]}
          rows={MEASURES}
          getRowId={(r) => r.part}
        />
      </div>

      <h2>Accessibility</h2>
      <p>
        The link is the title, so a screen reader hears &ldquo;Phoenix Clinic Hospital,
        link&rdquo; and not the whole card read as one name. The link&rsquo;s own{' '}
        <code>::after</code> is stretched over the card, which makes the card the hit area
        without wrapping it in an <code>a</code>: a menu inside a link would be a control
        inside a control. <code>CardActions</code> lifts its controls over that area, and
        whatever is pressable belongs in it: a second link left in the body is under the
        card&rsquo;s, and a press on it opens the card. The words of a linked card cannot be
        selected, which is the price of one link and no nesting. The
        focus ring is drawn around the card, where <code>:has()</code> is understood, and
        around the title where it is not. A set of cards is a list: <code>as=&quot;li&quot;</code>{' '}
        inside a <code>ul</code>, so their number is said. The title&rsquo;s level is the
        page&rsquo;s to choose.
      </p>

      <h2>Using it</h2>
      <CodeBlock code={USAGE} lang="tsx" />
      <div className="specimen">
        <Table
          caption="Card props, by part"
          density="compact"
          columns={[
            { key: 'prop', header: 'Prop', primary: true, cell: (r: PropRow) => <code>{r.prop}</code> },
            { key: 'type', header: 'Type', cell: (r: PropRow) => <span className="alias">{r.type}</span> },
            { key: 'default', header: 'Default', cell: (r: PropRow) => <span className="alias">{r.default}</span> },
          ]}
          rows={PROPS}
          getRowId={(r) => r.prop}
        />
      </div>
    </DocPage>
  );
}
