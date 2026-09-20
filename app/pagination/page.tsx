'use client';

import { useState } from 'react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { Pagination, pageItems, PAGE_SIZE_OPTIONS } from '@/components/Pagination';
import { Table } from '@/components/Table';
import { resolve } from '@/tokens/contrast';
import { radius, spacing } from '@/tokens/scale';
import { textStyle } from '@/tokens/typography';
import type { Mode, ThemeTokenName } from '@/tokens/theme';

const MODES: Mode[] = ['light', 'dark'];

const PAIRS: ReadonlyArray<{ name: string; fg: ThemeTokenName; bg: ThemeTokenName }> = [
  { name: 'current page', fg: 'text/primary', bg: 'surface/raised' },
  { name: 'other pages', fg: 'text/secondary', bg: 'surface/raised' },
  { name: 'the bar', fg: 'border/accent', bg: 'surface/raised' },
];

const TOTAL = 72;

type Shape = { page: number; count: number };
const SHAPES: Shape[] = [
  { page: 1, count: 3 },
  { page: 1, count: 24 },
  { page: 8, count: 24 },
  { page: 24, count: 24 },
];
const shown = ({ page, count }: Shape) =>
  pageItems(page, count)
    .map((item) => (typeof item === 'number' ? item : '…'))
    .join('  ');

type Measure = { part: string; value: string };
/** Read from the scale and the text styles, so the page cannot quote a number the stylesheet does not use. */
const MEASURES: Measure[] = [
  { part: 'Page and arrow', value: `${spacing[500]} square, round` },
  { part: 'Text, Medium', value: `${textStyle['body/md'].size} / ${textStyle['body/md'].lineHeight}` },
  { part: 'Bar under the current page', value: `${spacing['025']} by ${spacing[500] - 2 * spacing[150]}` },
  { part: 'Caret', value: '16' },
  { part: 'Page size field', value: `${spacing[400]} tall, radius ${radius.lg}` },
  { part: 'Its list', value: `rows of ${spacing[400]}, radius ${radius.xl}` },
];

type Key = { key: string; does: string };
const KEYS: Key[] = [
  { key: 'Digits', does: 'Type any page size. Nothing else is accepted.' },
  { key: 'Enter, or leaving the field', does: 'Takes the number. Zero or nothing puts the old one back.' },
  { key: 'Down, Up', does: 'Open the list at the size in use, and move through it.' },
  { key: 'Alt + Down', does: 'Opens the list and chooses nothing.' },
  { key: 'Esc', does: 'Closes the list. Again, puts back what was typed over.' },
];

type PropRow = { prop: string; type: string; default: string };
const PROPS: PropRow[] = [
  { prop: 'page', type: 'number', default: 'required' },
  { prop: 'onPageChange', type: '(page: number) => void', default: 'required' },
  { prop: 'pageCount', type: 'number', default: 'from total and pageSize' },
  { prop: 'total', type: 'number', default: '—' },
  { prop: 'pageSize', type: 'number', default: '—' },
  { prop: 'onPageSizeChange', type: '(size: number) => void', default: '—' },
  { prop: 'pageSizeOptions', type: 'readonly number[]', default: `[${PAGE_SIZE_OPTIONS.join(', ')}]` },
  { prop: 'maxPageSize', type: 'number', default: '100' },
  { prop: 'summary', type: '({ size, from, to, total }) => ReactNode', default: 'the English sentence' },
  { prop: 'hrefFor', type: '(page: number) => string', default: '—' },
  { prop: 'siblings, boundaries', type: 'number', default: '1, 1' },
  { prop: 'label', type: 'string', default: "'Pagination'" },
  { prop: 'previousLabel, nextLabel', type: 'string', default: "'Previous page', 'Next page'" },
  { prop: 'pageSizeLabel', type: 'string', default: "'Results per page'" },
  { prop: 'pageLabel', type: '(page: number) => string', default: '`Page ${page}`' },
  { prop: 'announce', type: 'boolean', default: 'true' },
  { prop: 'className', type: 'string', default: '—' },
];

export default function Page() {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [long, setLong] = useState(8);
  const [pt, setPt] = useState({ page: 1, size: 10 });

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
      <h1>Pagination</h1>
      <p className="lead">
        The pages of a long list, and how many rows a page holds, said in one sentence that
        can be edited where it stands.
      </p>

      <h2>Try it</h2>
      <div className="specimen">
        <Pagination page={page} onPageChange={setPage} total={TOTAL} pageSize={size} onPageSizeChange={setSize} />
      </div>
      <p className="alias">
        Press the number in the sentence and type another, or open its list. Go to the last
        page: the sentence says how many rows are in view, which is not the page size.
      </p>

      <h2>The page size, in the sentence</h2>
      <p>
        The drawing sets a Select beside the words: &ldquo;Show&rdquo;, a field 40 tall
        holding 10, then &ldquo;1-10 of 72 results&rdquo;. A footer is a quiet place and that
        is its loudest part, for something changed once a session. So the number moved into
        the sentence. It shows at rest that it can be changed, by its weight and its chevron
        and not only under the pointer, because a touch screen has no hover to find it with.
      </p>
      <p>
        A number that can be typed or picked is an editable combobox whose list suggests and
        does not filter, so 17 is as good a page size as 25. It is not the browser&rsquo;s{' '}
        <code>datalist</code>, whose list takes no styling, does not follow page zoom, and is
        not announced by every screen reader; and it is not a number input, which brings
        spinners, a wheel that changes the value, and &ldquo;e&rdquo; accepted as a digit.
      </p>
      <div className="specimen">
        <Table
          caption="The page size field, by keyboard"
          density="compact"
          columns={[
            { key: 'key', header: 'Key', primary: true, cell: (r: Key) => r.key },
            { key: 'does', header: 'Does', cell: (r: Key) => r.does },
          ]}
          rows={KEYS}
          getRowId={(r) => r.key}
        />
      </div>
      <p>
        &ldquo;Showing 10 of 72 results&rdquo; is false on the last page, where two are
        showing. So the field is the page size and the range beside it says what is in view.
        Changing the size keeps the reader&rsquo;s place: the new page is the one that holds
        the first row they were looking at.
      </p>

      <h2>A sentence in another language</h2>
      <p>
        Word order belongs to a language, so the sentence is the caller&rsquo;s:{' '}
        <code>summary</code> is handed the field and the numbers and returns the words around
        them. The field&rsquo;s own name, the arrows&rsquo; and each page&rsquo;s are props
        too.
      </p>
      <div className="specimen">
        <Pagination
          page={pt.page}
          onPageChange={(next) => setPt((was) => ({ ...was, page: next }))}
          total={TOTAL}
          pageSize={pt.size}
          onPageSizeChange={(next) => setPt((was) => ({ ...was, size: next }))}
          label="Paginação"
          previousLabel="Página anterior"
          nextLabel="Página seguinte"
          pageSizeLabel="Resultados por página"
          pageLabel={(n) => `Página ${n}`}
          summary={({ size: field, from, to, total }) => (
            <>
              <strong>
                {from}–{to}
              </strong>{' '}
              de <strong>{total}</strong> resultados, {field} por página
            </>
          )}
        />
      </div>

      <h2>Seven places</h2>
      <div className="specimen">
        <Pagination page={long} onPageChange={setLong} pageCount={24} />
      </div>
      <p>
        With more pages than fit there are seven places, always: the first and last page, the
        current one with a neighbour each side, and an ellipsis where pages are skipped. The
        arrows never move, so Next can be pressed again without looking for it. An ellipsis
        never stands for a single page, which would save nothing and cost a press.
      </p>
      <div className="specimen">
        <Table
          caption="The four drawn shapes, from one function"
          density="compact"
          columns={[
            { key: 'at', header: 'Page', primary: true, cell: (r: Shape) => `${r.page} of ${r.count}` },
            { key: 'shown', header: 'Shown', cell: (r: Shape) => <span className="alias">{shown(r)}</span> },
          ]}
          rows={SHAPES}
          getRowId={(r) => `${r.page}-${r.count}`}
        />
      </div>

      <h2>Anatomy</h2>
      <div className="specimen">
        <Table
          caption="Pagination geometry, in pixels"
          density="compact"
          columns={[
            { key: 'part', header: 'Part', primary: true, cell: (r: Measure) => r.part },
            { key: 'value', header: 'Value', cell: (r: Measure) => <span className="alias">{r.value}</span> },
          ]}
          rows={MEASURES}
          getRowId={(r) => r.part}
        />
      </div>
      <p>
        The current page is the drawn bar in the accent, and its number is primary where the
        others are secondary: a bar two pixels tall is a thin difference on its own. The
        published item draws every number in primary; the drawn footer already has the
        others in grey.
      </p>

      <h2>Accessibility</h2>
      <p>
        A <code>nav</code> with a name, holding a list of buttons: the current one carries{' '}
        <code>aria-current=&quot;page&quot;</code> and each is named &ldquo;Page 3&rdquo;, not
        &ldquo;3&rdquo;. The ellipsis is text. After a press the page arrived at is said,
        politely. At either end an arrow is <code>aria-disabled</code> and not{' '}
        <code>disabled</code>: pressing Next onto the last page would otherwise disable the
        button under the focus and drop the focus to the top of the page. With{' '}
        <code>hrefFor</code> the pages are links, for paging that lives in the URL. The carets
        turn over under <code>dir=&quot;rtl&quot;</code>.
      </p>

      <h2>Props</h2>
      <div className="specimen">
        <Table
          caption="Pagination props"
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
