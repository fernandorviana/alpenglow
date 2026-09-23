'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Asleep, ColorPalette, Copy, Keyboard, Sun } from '@carbon/icons-react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { CodeBlock } from '@ui/CodeBlock';
import { applyTheme } from '@ui/ThemeToggle';
import { NAV } from '@ui/contents';
import { CommandPalette, useCommandPaletteShortcut } from '@/components/CommandPalette';
import type { CommandGroup, CommandItem } from '@/components/CommandPalette';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Table } from '@/components/Table';
import { resolve } from '@/tokens/contrast';
import { radius, spacing } from '@/tokens/scale';
import { textStyle } from '@/tokens/typography';
import type { Mode, ThemeTokenName } from '@/tokens/theme';

const MODES: Mode[] = ['light', 'dark'];

/** Read from the tokens at render, with the suite's own functions. */
const PAIRS: ReadonlyArray<{ name: string; fg: ThemeTokenName; bg: ThemeTokenName; over?: ThemeTokenName }> = [
  { name: 'row, on the overlay', fg: 'text/primary', bg: 'surface/overlay' },
  { name: 'row, active', fg: 'text/primary', bg: 'interactive/selected' },
  { name: 'row, hovered', fg: 'text/primary', bg: 'interactive/wash-hover', over: 'surface/overlay' },
  { name: 'description', fg: 'text/secondary', bg: 'surface/overlay' },
  { name: 'detail, and a group', fg: 'text/tertiary', bg: 'surface/overlay' },
  { name: 'key cap', fg: 'text/secondary', bg: 'surface/sunken' },
];

const USAGE = `import { CommandPalette, useCommandPaletteShortcut } from 'alpenglow';
import type { CommandGroup, CommandItem } from 'alpenglow';

const [open, setOpen] = useState(false);
const hint = useCommandPaletteShortcut(() => setOpen(true)); // "⌘K" or "Ctrl K"

const items: CommandGroup[] = [
  { label: 'Go to', items: [{ id: 'colour', label: 'Colour', description: 'Foundations' }] },
  { label: 'Actions', items: [{ id: 'dark', label: 'Switch to dark', shortcut: '⇧D' }] },
];

<button aria-keyshortcuts="Meta+K Control+K" title={hint} onClick={() => setOpen(true)}>Search</button>

<CommandPalette
  open={open}
  onClose={() => setOpen(false)}
  label="Commands"
  placeholder="Type a command"
  items={items}
  onSelect={(item: CommandItem) => {
    setOpen(false);
    run(item.id);
  }}
/>

// A caller that searches elsewhere hands the rows already narrowed:
<CommandPalette filter={null} query={query} onQueryChange={setQuery} loading={pending} items={results} … />`;

type Measure = { part: string; value: string };
const type = (name: keyof typeof textStyle) => `${textStyle[name].size} / ${textStyle[name].lineHeight}`;

const MEASURES: Measure[] = [
  { part: 'Dialog', value: 'the Dialog, md (640), held at 12vh from the top' },
  { part: 'Field', value: 'the Input, lg' },
  { part: 'List', value: 'at most 50vh, then scrolls; the active row scrolled into view' },
  { part: 'Row', value: `${spacing['100']} / ${spacing['150']} padding, radius ${radius.lg}` },
  { part: 'Label', value: type('body/md') },
  { part: 'Description, detail, group, key cap', value: type('caption/md') },
  { part: 'Active', value: 'interactive/selected; hovered, the wash' },
  { part: 'The mark', value: 'Semibold, no fill' },
];

const measureColumns = [
  { key: 'part', header: 'Part', primary: true, cell: (r: Measure) => r.part },
  { key: 'value', header: 'Value', cell: (r: Measure) => <span className="alias">{r.value}</span> },
];

type PropRow = { prop: string; type: string; default: string };
const PROPS: PropRow[] = [
  { prop: 'open', type: 'boolean', default: 'required' },
  { prop: 'onClose', type: '() => void', default: 'required' },
  { prop: 'label', type: 'string — the dialog, the field and the list are named by it', default: 'required' },
  { prop: 'items', type: 'readonly CommandGroup[] — { label, items: CommandItem[] }', default: 'required' },
  { prop: 'onSelect', type: '(item: CommandItem) => void', default: 'required' },
  { prop: 'placeholder', type: 'string', default: '—' },
  { prop: 'icon', type: 'ReactNode — at the start of the field', default: '—' },
  { prop: 'filter', type: '((item, query) => boolean) | null', default: 'label or a keyword holds the query' },
  { prop: 'query / defaultQuery / onQueryChange', type: 'string / string / (query: string) => void', default: "— / '' / —" },
  { prop: 'loading / loadingText', type: 'boolean / string', default: "false / 'Loading…'" },
  { prop: 'emptyText', type: 'string | ((query: string) => string)', default: 'Nothing matches “…”.' },
  { prop: 'status', type: 'ReactNode — a line the caller writes, in place of the palette’s own', default: '—' },
  { prop: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'" },
  { prop: 'className', type: 'string', default: '—' },
];

const ITEM_PROPS: PropRow[] = [
  { prop: 'id', type: 'string', default: 'required' },
  { prop: 'label', type: 'string — the row’s name; what the default filter reads', default: 'required' },
  { prop: 'description', type: 'string — at the end of the first line', default: '—' },
  { prop: 'detail', type: 'string — a second line', default: '—' },
  { prop: 'icon', type: 'ReactNode', default: '—' },
  { prop: 'shortcut', type: 'string — drawn as a key cap; nothing is bound', default: '—' },
  { prop: 'keywords', type: 'readonly string[] — searched, never shown', default: '—' },
  { prop: 'disabled', type: 'boolean', default: 'false' },
  { prop: 'mono', type: 'boolean — the label is code', default: 'false' },
];

const propColumns = [
  { key: 'prop', header: 'Prop', primary: true, cell: (r: PropRow) => <code>{r.prop}</code> },
  { key: 'type', header: 'Type', cell: (r: PropRow) => <span className="alias">{r.type}</span> },
  { key: 'default', header: 'Default', cell: (r: PropRow) => <span className="alias">{r.default}</span> },
];

type Key = { keys: string; does: string };
const KEYS: Key[] = [
  { keys: '⌘K, Ctrl K', does: 'Opens, from anywhere, through the hook. The button that opens it says which.' },
  { keys: 'Typing', does: 'Narrows the rows. A new query starts with no row active.' },
  { keys: '↓ ↑', does: 'Move the active row, wrapping, over a disabled one.' },
  { keys: 'Home, End', does: 'The caret’s, until a row is active; then the first and the last row.' },
  { keys: 'Enter', does: 'Follows the active row, or the first that can be chosen. Not the Enter of an IME composition.' },
  { keys: 'Esc', does: 'Closes, and reaches nothing else on the page.' },
];

const keyColumns = [
  { key: 'keys', header: 'Keys', primary: true, cell: (r: Key) => <code>{r.keys}</code> },
  { key: 'does', header: 'Does', cell: (r: Key) => <span className="alias">{r.does}</span> },
];

const COMPONENTS = NAV.find((group) => group.title === 'Components')?.items ?? [];

export default function Page() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  // ⌘J, not ⌘K: on this site ⌘K is the search in the rail, which is this
  // same component, and two palettes must not answer one key.
  const hint = useCommandPaletteShortcut(() => setOpen(true), 'j');

  const items: CommandGroup[] = [
    {
      label: 'Go to',
      items: COMPONENTS.slice(0, 8).map((page) => ({
        id: `go:${page.href}`,
        label: page.label,
        description: 'Components',
        icon: <ArrowRight size={16} />,
      })),
    },
    {
      label: 'Theme',
      items: [
        { id: 'theme:dark', label: 'Switch to dark', icon: <Asleep size={16} />, keywords: ['night', 'mode'], shortcut: '⇧D' },
        { id: 'theme:light', label: 'Switch to light', icon: <Sun size={16} />, keywords: ['day', 'mode'], shortcut: '⇧L' },
      ],
    },
    {
      label: 'Tokens',
      items: [
        { id: 'go:/colour#surface-raised', label: 'surface/raised', description: 'Colour', detail: 'Cards, panels, table body', mono: true, icon: <ColorPalette size={16} /> },
        { id: 'go:/colour#interactive-accent', label: 'interactive/accent', description: 'Colour', detail: 'Primary buttons, links', mono: true, icon: <ColorPalette size={16} /> },
      ],
    },
    {
      label: 'Actions',
      items: [
        { id: 'copy', label: 'Copy the install command', detail: 'npm install alpenglow', icon: <Copy size={16} /> },
        { id: 'shortcuts', label: 'Keyboard shortcuts', detail: 'Not built on this site', icon: <Keyboard size={16} />, disabled: true },
      ],
    },
  ];

  const run = (item: CommandItem) => {
    setOpen(false);
    setLast(item.label);
    if (item.id.startsWith('go:')) router.push(item.id.slice(3));
    else if (item.id === 'theme:dark') applyTheme('dark');
    else if (item.id === 'theme:light') applyTheme('light');
    else if (item.id === 'copy') void navigator.clipboard?.writeText('npm install alpenglow');
  };

  return (
    <DocPage
      evidence={
        <>
          {PAIRS.map((pair) => (
            <div key={pair.name}>
              <p>{pair.name}</p>
              {MODES.map((mode) => (
                <p key={mode}>
                  {mode}{' '}
                  <Ratio
                    fg={resolve(pair.fg, mode)}
                    bg={resolve(pair.bg, mode, pair.over && resolve(pair.over, mode))}
                  />
                </p>
              ))}
            </div>
          ))}
        </>
      }
    >
      <h1>Command palette</h1>
      <p className="lead">
        A dialog with a field and a list of commands, ⌘K from anywhere: this site&rsquo;s own search,
        graduated into the package. The <a href="/dialog">Dialog</a> holds it, the{' '}
        <a href="/input">Input</a> is the field, and the rows are commands the caller names.
      </p>

      <h2>Try it</h2>
      <div className="specimen">
        <div className="specimenRow">
          <Button
            variant="outline"
            onClick={() => setOpen(true)}
            aria-keyshortcuts="Meta+J Control+J"
            title={hint ? `Commands — ${hint}` : undefined}
          >
            Open the commands{hint ? ` · ${hint}` : ''}
          </Button>
          <span className="alias" role="status">
            {last ? `Last: ${last}` : 'Nothing chosen yet.'}
          </span>
        </div>
      </div>
      <p className="alias">
        Or press {hint ?? '⌘J'} anywhere on this page — J, because ⌘K is the site&rsquo;s own search in the rail,
        the same component, and two palettes must not answer one key. The commands act on the site: go to a
        component, switch the theme, copy the install command. One is disabled, to show the arrows skipping it.
      </p>
      <CommandPalette
        open={open}
        onClose={() => setOpen(false)}
        label="Commands"
        placeholder="Type a command or a page"
        items={items}
        onSelect={run}
        emptyText={(q) => `No command mentions “${q}”.`}
      />

      <h2>What is the caller&rsquo;s</h2>
      <p>
        The palette narrows, moves and reports; everything a command does is the caller&rsquo;s. It never
        closes itself: <code>onSelect</code> hands over the item and the caller sets <code>open</code> to
        false, or opens what comes next in its place. Recent items are the caller&rsquo;s too, a group like
        any other; the package writes nothing to storage. A <code>shortcut</code> on an item is drawn as a
        key cap and binds nothing: the site&rsquo;s search binds ⌘K through the hook and shows it on the
        button that opens the palette, and that is the whole of the arrangement.
      </p>

      <h2>Searching elsewhere</h2>
      <p>
        By default a row stays when its label or one of its keywords holds what was typed, anywhere in
        it, whatever the case or the accents. A caller with an index — this site&rsquo;s, with its
        tolerance for a typo and its excerpts — passes <code>filter={'{null}'}</code> and{' '}
        <code>query</code> with <code>onQueryChange</code>, hands back <code>items</code> already narrowed,
        and says <code>loading</code> while they come. What was typed is marked in Semibold where it occurs
        in the label and the detail; a fuzzy hit the caller found is not marked, since the palette does
        not know where it matched.
      </p>

      <h2>The keyboard</h2>
      <div className="specimen">
        <Table caption="Keys" captionVisible density="compact" columns={keyColumns} rows={KEYS} getRowId={(r) => r.keys} />
      </div>

      <h2>States</h2>
      <div className="specimenRow">
        <Badge tone="info">loading</Badge>
        <Badge tone="info">nothing matches</Badge>
        <Badge tone="info">a disabled row</Badge>
        <Badge tone="info">a status the caller writes</Badge>
      </div>
      <p>
        Loading and nothing-matches are read in a <code>role=&quot;status&quot;</code> line under the
        field. A caller can put its own line there — &ldquo;The index did not load.&rdquo; — while still
        showing what it has, which is what the site does with its suggestions.
      </p>

      <h2>Measures</h2>
      <div className="specimen">
        <Table caption="Measures" captionVisible density="compact" columns={measureColumns} rows={MEASURES} getRowId={(r) => r.part} />
      </div>
      <p>
        The dialog is held near the top rather than centred, so the list grows downward as the results
        change and the box does not jump. A row is the DropdownMenu&rsquo;s row at radius lg: the wash on
        hover, <code>interactive/selected</code> when the arrows reach it, and the mark of what was typed is
        weight rather than a fill, so those two are the only fills a row takes.
      </p>

      <h2>Accessibility</h2>
      <p>
        One combobox: the field has <code>role=&quot;combobox&quot;</code> with{' '}
        <code>aria-autocomplete=&quot;list&quot;</code> and controls the <code>listbox</code>, whose rows are
        options grouped under named groups; the active row is <code>aria-activedescendant</code> and focus
        never leaves the field, a press on a row keeping it there. The dialog, the field and the list are all
        named by <code>label</code>. A disabled row says so and is neither reached by the arrows nor chosen.
        Modal, the top layer, the inert page behind, Esc and focus return are the platform&rsquo;s through
        the Dialog.
      </p>

      <h2>Not built</h2>
      <p>
        Nested pages inside the palette, a command that opens a sub-list. A non-modal inline palette. Fuzzy
        scoring in the package. A registry of commands or bindings: the palette shows a shortcut and does not
        install one.
      </p>

      <h2>Using it</h2>
      <CodeBlock code={USAGE} lang="tsx" />
      <div className="specimen">
        <Table caption="CommandPalette props" captionVisible density="compact" columns={propColumns} rows={PROPS} getRowId={(r) => r.prop} />
      </div>
      <div className="specimen">
        <Table caption="CommandItem" captionVisible density="compact" columns={propColumns} rows={ITEM_PROPS} getRowId={(r) => r.prop} />
      </div>
    </DocPage>
  );
}
