'use client';

import { useState } from 'react';
import { Add, Location, Map as MapIcon, Search, UserMultiple } from '@carbon/icons-react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { CodeBlock } from '@ui/CodeBlock';
import { TypeText } from '@ui/TypeText';
import { Button } from '@/components/Button';
import { Card, CardBody, CardTitle } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Input } from '@/components/Input';
import { Table } from '@/components/Table';
import { toast } from '@/components/Toast';
import hidden from '@/components/visuallyHidden.module.css';
import { resolve } from '@/tokens/contrast';
import { radius, spacing } from '@/tokens/scale';
import type { Mode, ThemeTokenName } from '@/tokens/theme';

const MODES: Mode[] = ['light', 'dark'];

const PAIRS: ReadonlyArray<{ name: string; fg: ThemeTokenName; bg: ThemeTokenName; threshold?: number }> = [
  { name: 'title', fg: 'text/primary', bg: 'surface/raised' },
  { name: 'the sentence', fg: 'text/secondary', bg: 'surface/raised' },
  { name: 'the dashed frame', fg: 'border/strong', bg: 'surface/raised', threshold: 3 },
];

type Client = { id: string; name: string; next: string };
const CLIENTS: Client[] = [
  { id: '1', name: 'Justin Anderson', next: '24 Sep' },
  { id: '2', name: 'Sandra Brown', next: '2 Oct' },
  { id: '3', name: 'Léa Martin', next: '—' },
];

const USAGE = `import { EmptyState, Button, Table } from 'alpenglow';

// First use: a table with nothing in it.
<Table
  …
  rows={locations}
  empty={
    <EmptyState
      icon={<Location size={24} />}
      title="No locations yet"
      description="Add the places where you see clients, in person or by video."
      action={<Button onClick={add}>Add location</Button>}
    />
  }
/>

// A section of a record.
<EmptyState size="sm" title="No notes yet" description="…" action={<Button variant="ghost" …>Add note</Button>} />`;

type Rule = { rule: string; why: string };
const RULES: Rule[] = [
  { rule: 'The title says what is not here', why: '“No locations yet”, never “Oops” or “Nothing here”.' },
  { rule: 'The sentence says why, or what happens next', why: 'It is the one place the feature is explained to someone who has not used it.' },
  { rule: 'The action is the verb and the thing', why: '“Add location”, the same words as the button that makes one everywhere else.' },
  { rule: 'Two actions at most, one primary', why: 'The other way — an import, something to read — comes first and is quieter.' },
  { rule: 'No results: repeat what was searched, and undo', why: 'The action clears the search and is not primary: clearing a filter is nobody’s goal.' },
  { rule: 'Good news has no action', why: '“No unread messages” is where the reader wanted to be.' },
  { rule: 'Loading is never empty', why: 'A Skeleton first, and this only once the answer is none.' },
];

type Kind = { where: string; use: string };
const KINDS: Kind[] = [
  { where: 'A field of a record that has not been filled', use: 'a ghost Button with “+”, in the field’s place' },
  { where: 'A section or a card with nothing in it', use: 'EmptyState, sm' },
  { where: 'A table, a list or a page with nothing in it', use: 'EmptyState, lg' },
  { where: 'A picture, a map or a chart that did not load', use: 'EmptyState, sm, on a surface of its own over the placeholder' },
  { where: 'A Select or a Combobox with no options', use: 'their own line: emptyText' },
];

type PropRow = { prop: string; type: string; default: string };
const PROPS: PropRow[] = [
  { prop: 'title', type: 'string', default: 'required' },
  { prop: 'description', type: 'ReactNode', default: '—' },
  { prop: 'icon', type: 'ReactNode', default: '—' },
  { prop: 'media', type: 'ReactNode — in the icon’s place', default: '—' },
  { prop: 'action', type: 'ReactNode', default: '—' },
  { prop: 'secondaryAction', type: 'ReactNode', default: '—' },
  { prop: 'size', type: "'sm' | 'lg'", default: "'lg'" },
  { prop: 'variant', type: "'plain' | 'dashed'", default: "'plain'" },
  { prop: 'headingLevel', type: '2 | 3 | 4 | 5 | 6', default: '3' },
  { prop: 'className', type: 'string', default: '—' },
];

const columns = [
  { key: 'name', header: 'Client', primary: true, cell: (r: Client) => r.name },
  { key: 'next', header: 'Next appointment', cell: (r: Client) => r.next },
];

export default function Page() {
  const [query, setQuery] = useState('zzz');
  const found = CLIENTS.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <DocPage
      evidence={
        <>
          {PAIRS.map((pair) => (
            <div key={pair.name}>
              <p>{pair.name}</p>
              {MODES.map((mode) => (
                <p key={mode}>
                  {mode} <Ratio fg={resolve(pair.fg, mode)} bg={resolve(pair.bg, mode)} threshold={pair.threshold} />
                </p>
              ))}
            </div>
          ))}
        </>
      }
    >
      <h1>Empty state</h1>
      <p className="lead">What stands where content would be when there is none: what this is, why it is empty, and what to do next.</p>

      <h2>First use</h2>
      <div className="specimen">
        <EmptyState
          icon={<Location size={24} />}
          title="No locations yet"
          description="Add the places where you see clients, in person or by video."
          secondaryAction={
            <Button variant="outline" tone="neutral" onClick={() => toast('Import started')}>
              Import CSV
            </Button>
          }
          action={
            <Button iconStart={<Add size={16} />} onClick={() => toast('Location added', { tone: 'success' })}>
              Add location
            </Button>
          }
        />
      </div>

      <h2>No results</h2>
      <div className="specimen">
        <div style={{ maxWidth: 320, marginBottom: spacing[200] }}>
          <Input aria-label="Search clients" value={query} onChange={(e) => setQuery(e.target.value)} iconStart={<Search size={16} />} />
        </div>
        {/* How many were found is the caller's to say: the table swaps its body without a word. */}
        <p className={hidden.hidden} aria-live="polite">
          {found.length === 0 ? 'No clients found' : `${found.length} clients found`}
        </p>
        <Table
          caption="Clients"
          columns={columns}
          rows={found}
          getRowId={(r) => r.id}
          empty={
            <EmptyState
              icon={<UserMultiple size={24} />}
              title={`No clients match “${query}”`}
              description="Check the spelling, or look in archived clients."
              action={
                <Button variant="outline" tone="neutral" onClick={() => setQuery('')}>
                  Clear search
                </Button>
              }
            />
          }
        />
      </div>
      <p>
        It is not a different look: it is the same block with different words. The title repeats what was searched,
        the action undoes it, and the action is not primary, because clearing a filter is nobody&rsquo;s goal.
      </p>

      <h2>A section, and good news</h2>
      <div className="specimen">
        <div style={{ display: 'grid', gap: spacing[200], gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <Card>
            <CardBody>
              <CardTitle>Relevant notes</CardTitle>
              <div style={{ marginTop: spacing[150] }}>
                <EmptyState
                  size="sm"
                  headingLevel={4}
                  title="No notes yet"
                  description="Notes written during an appointment are kept here."
                  action={
                    <Button variant="ghost" tone="neutral" size="sm" iconStart={<Add size={16} />}>
                      Add note
                    </Button>
                  }
                />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <CardTitle>Messages</CardTitle>
              <div style={{ marginTop: spacing[150] }}>
                <EmptyState size="sm" headingLevel={4} title="No unread messages" description="You are up to date." />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <h2>A frame that says something goes here</h2>
      <div className="specimen">
        <EmptyState
          variant="dashed"
          icon={<Add size={24} />}
          title="No documents yet"
          description="An ID card, an insurance policy, a referral letter."
          action={
            <Button variant="outline" tone="neutral">
              Add document
            </Button>
          }
        />
      </div>
      <p>
        <code>variant=&quot;dashed&quot;</code> is the language of the drawn &ldquo;+&rdquo; tiles in a record&rsquo;s
        documents: a dashed line is a place for something. So it is for first use only. On a search with no results a
        frame that invites making something says the wrong thing.
      </p>

      <h2>What did not load</h2>
      <div className="specimen">
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            height: 200,
            borderRadius: radius.xl,
            background: 'var(--ap-color-interactive-wash-pressed)',
          }}
        >
          <div
            style={{
              padding: `${spacing[150]}px ${spacing[200]}px`,
              borderRadius: radius.lg,
              background: 'var(--ap-color-surface-overlay)',
              boxShadow: 'var(--ap-elevation-sm)',
            }}
          >
            <EmptyState size="sm" headingLevel={4} icon={<MapIcon size={20} />} title="Can’t load map" />
          </div>
        </div>
      </div>
      <p>As drawn: the small size on a surface of its own, over the placeholder of what should have been there.</p>

      <h2>A field that has not been filled</h2>
      <div className="specimen">
        <div style={{ display: 'grid', gap: spacing[100], justifyItems: 'start' }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Contacts</p>
          <Button variant="ghost" tone="neutral" size="sm" iconStart={<Add size={16} />}>
            Add address
          </Button>
          <p style={{ margin: `${spacing[150]}px 0 0`, fontWeight: 600 }}>Location instructions</p>
          <Button variant="ghost" tone="neutral" size="sm" iconStart={<Add size={16} />}>
            Add instructions
          </Button>
        </div>
      </div>
      <p>
        In the product this system was drawn for, a record just made is empty in place: &ldquo;+ Add address&rdquo;
        stands exactly where the address will be. That is not this component. It is a ghost <a href="/button">Button</a>{' '}
        with an icon, and needs no title and no sentence, because the heading over it has already said what is missing.
      </p>

      <h2>Which one</h2>
      <div className="specimen">
        <Table
          caption="Empty, by where it is"
          density="compact"
          columns={[
            { key: 'where', header: 'Where', primary: true, cell: (r: Kind) => r.where },
            { key: 'use', header: 'Use', cell: (r: Kind) => r.use },
          ]}
          rows={KINDS}
          getRowId={(r) => r.where}
        />
      </div>

      <h2>What it says</h2>
      <div className="specimen">
        <Table
          caption="Rules of content"
          density="compact"
          columns={[
            { key: 'rule', header: 'Rule', primary: true, cell: (r: Rule) => r.rule },
            { key: 'why', header: 'Why', cell: (r: Rule) => r.why },
          ]}
          rows={RULES}
          getRowId={(r) => r.rule}
        />
      </div>

      <h2>Accessibility</h2>
      <p>
        The title is a heading, so the block is in the page&rsquo;s outline; <code>headingLevel</code> is one below the
        heading it stands under. The icon is hidden; <code>media</code> is not, since an illustration may have words of
        its own, and takes its own <code>alt</code>. The block announces nothing by itself: when results change under a
        filter, how many were found is the caller&rsquo;s live region to say. The circle is the pressed wash and not a
        surface, so one block is right on the page, on a card and in a panel, in both modes.
      </p>

      <h2>Using it</h2>
      <CodeBlock code={USAGE} lang="tsx" />
      <div className="specimen">
        <Table
          caption="EmptyState props"
          density="compact"
          columns={[
            { key: 'prop', header: 'Prop', primary: true, cell: (r: PropRow) => <code>{r.prop}</code> },
            { key: 'type', header: 'Type', cell: (r: PropRow) => <span className="alias"><TypeText>{r.type}</TypeText></span> },
            { key: 'default', header: 'Default', cell: (r: PropRow) => <span className="alias">{r.default}</span> },
          ]}
          rows={PROPS}
          getRowId={(r) => r.prop}
        />
      </div>
    </DocPage>
  );
}
