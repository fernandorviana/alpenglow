'use client';

import { useEffect, useRef, useState } from 'react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { CodeBlock } from '@ui/CodeBlock';
import { FileUpload, formatSize } from '@/components/FileUpload';
import type { UploadFile } from '@/components/FileUpload';
import { Badge } from '@/components/Badge';
import { Card, CardBody } from '@/components/Card';
import { Table } from '@/components/Table';
import { resolve } from '@/tokens/contrast';
import { spacing } from '@/tokens/scale';
import type { Mode, ThemeTokenName } from '@/tokens/theme';

const MODES: Mode[] = ['light', 'dark'];

const PAIRS: ReadonlyArray<{ name: string; fg: ThemeTokenName; bg: ThemeTokenName; threshold?: number }> = [
  { name: 'the dashed edge on the well, 3:1', fg: 'border/strong', bg: 'surface/sunken', threshold: 3 },
  { name: 'the edge dragged over, on the tint, 3:1', fg: 'border/accent', bg: 'surface/accent-subtle', threshold: 3 },
  { name: 'the words dragged over', fg: 'text/primary', bg: 'surface/accent-subtle' },
  { name: 'a failed card’s reason', fg: 'text/danger', bg: 'surface/raised' },
];

const MAX = 5_000_000;
const HINT = `PNG, JPEG, GIF or PDF under ${formatSize(MAX)}.`;

const USAGE = `import { FileUpload } from 'alpenglow';
import type { UploadFile } from 'alpenglow';

const [files, setFiles] = useState<UploadFile[]>([]);

<FileUpload
  multiple
  accept="image/*,.pdf"
  maxSize={5_000_000}
  hint="PNG, JPEG, GIF or PDF under 5 MB."
  files={files}
  onAdd={(chosen) => {
    // The component checked type and size; the caller uploads.
    for (const file of chosen) upload(file, (progress) => setFiles(…));
  }}
  onRemove={(file) => setFiles((f) => f.filter((x) => x.id !== file.id))}
  onRetry={(file) => upload(file)}
/>

// A dense form: the button and the hint on one line, dropping on the whole root.
<FileUpload variant="compact" accept=".pdf" hint="PDF only." onAdd={…} />

// The drawn "+" at the end of a row of documents.
<FileUpload variant="tile" label="Add a document" onAdd={…} />`;

type Measure = { part: string; value: string };
const MEASURES: Measure[] = [
  { part: 'Zone', value: `min 200 tall, ${spacing[300]} padding, a dashed hairline at radius lg on surface/sunken` },
  { part: 'Icon', value: `56 circle on surface/raised at elevation/sm, the cloud at ${spacing[400]} in text/accent` },
  { part: 'Words', value: 'body/md Medium; the words that open the picker in text/accent, underlined' },
  { part: 'Hint', value: 'caption/md in text/tertiary' },
  {
    part: 'Card',
    value: `${spacing[100]} ${spacing[150]} on surface/raised, a border/subtle hairline at radius md; border/danger when failed`,
  },
  { part: 'Card icon', value: `${spacing[500]} box on surface/sunken at radius sm, the document at ${spacing[300]}` },
  { part: 'Tile', value: '64 square (--file-upload-tile), the same dashed edge at radius md' },
  { part: 'Compact', value: 'a 32 button-like label with the hint beside' },
];
const measureColumns = [
  { key: 'part', header: 'Part', primary: true, cell: (r: Measure) => r.part },
  { key: 'value', header: 'Value', cell: (r: Measure) => <span className="alias">{r.value}</span> },
];

type PropRow = { prop: string; type: string; default: string };
const PROPS: PropRow[] = [
  { prop: 'onAdd', type: '(files: File[]) => void', default: 'required' },
  {
    prop: 'files',
    type: 'UploadFile[] — { id, name, size?, type?, status?, progress?, error?, href? }',
    default: '[]',
  },
  { prop: 'onRemove / onRetry', type: '(file: UploadFile) => void', default: '—' },
  { prop: 'onReject', type: '({ file, reason: "type" | "size" }[]) => void', default: '—' },
  { prop: 'accept', type: 'string', default: '—' },
  { prop: 'maxSize', type: 'number (bytes)', default: '—' },
  { prop: 'multiple', type: 'boolean', default: 'false' },
  { prop: 'variant', type: "'zone' | 'compact' | 'tile'", default: "'zone'" },
  { prop: 'label', type: 'string', default: '"Choose a file" / "Choose files"' },
  { prop: 'dropLabel', type: 'string', default: "'or drag and drop'" },
  { prop: 'hint', type: 'ReactNode', default: '—' },
  { prop: 'disabled', type: 'boolean', default: 'false' },
  { prop: 'name', type: 'string', default: '—' },
  {
    prop: 'removeLabel / retryLabel / downloadLabel / uploadingLabel',
    type: 'string',
    default: 'Remove / Retry / Download / Uploading',
  },
  { prop: 'rejectionLabel', type: '(reason, file) => string', default: '"Not a supported type" / "Larger than 5 MB"' },
  { prop: 'className', type: 'string', default: '—' },
];
const propColumns = [
  { key: 'prop', header: 'Prop', primary: true, cell: (r: PropRow) => <code>{r.prop}</code> },
  { key: 'type', header: 'Type', cell: (r: PropRow) => <span className="alias">{r.type}</span> },
  { key: 'default', header: 'Default', cell: (r: PropRow) => <span className="alias">{r.default}</span> },
];

/** A pretend upload: the bar climbs, and every third file fails so Retry has something to do. */
function useUploads() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setInterval>>());
  const count = useRef(0);

  const start = (id: string, fails: boolean) => {
    clearInterval(timers.current.get(id));
    setFiles((f) => f.map((x) => (x.id === id ? { ...x, status: 'uploading', progress: 0, error: undefined } : x)));
    let progress = 0;
    const timer = setInterval(() => {
      progress += 12;
      if (fails && progress >= 60) {
        clearInterval(timer);
        setFiles((f) => f.map((x) => (x.id === id ? { ...x, status: 'failed', error: 'The connection dropped' } : x)));
      } else if (progress >= 100) {
        clearInterval(timer);
        setFiles((f) => f.map((x) => (x.id === id ? { ...x, status: 'done', progress: 100, href: '#' } : x)));
      } else {
        setFiles((f) => f.map((x) => (x.id === id ? { ...x, progress } : x)));
      }
    }, 250);
    timers.current.set(id, timer);
  };

  useEffect(() => {
    const all = timers.current;
    return () => all.forEach((t) => clearInterval(t));
  }, []);

  return {
    files,
    add: (chosen: File[]) => {
      const next = chosen.map((file) => {
        count.current += 1;
        return {
          id: `${count.current}`,
          name: file.name,
          size: file.size,
          type: file.type,
          fails: count.current % 3 === 0,
        };
      });
      setFiles((f) => [...f, ...next.map(({ fails: _fails, ...x }) => ({ ...x, status: 'ready' as const }))]);
      for (const x of next) start(x.id, x.fails);
    },
    remove: (file: UploadFile) => {
      clearInterval(timers.current.get(file.id));
      setFiles((f) => f.filter((x) => x.id !== file.id));
    },
    retry: (file: UploadFile) => start(file.id, false),
  };
}

export default function Page() {
  const many = useUploads();
  const one = useUploads();
  const dense = useUploads();
  const tile = useUploads();

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
      <h1>File upload</h1>
      <p className="lead">
        A zone to choose or drop files, and the list of what became of them: uploading, done, failed with a reason. The
        component checks type and size and does no network of its own.
      </p>

      <h2>Try it</h2>
      <div className="specimen">
        <FileUpload
          multiple
          accept="image/*,.pdf"
          maxSize={MAX}
          hint={HINT}
          files={many.files}
          onAdd={many.add}
          onRemove={many.remove}
          onRetry={many.retry}
        />
      </div>
      <p className="alias">
        Drop files on the zone, or press it and choose. The upload here is pretend: the bar climbs, and every third file
        fails so Retry has something to do. Drop a .txt to see a refusal.
      </p>
      <p>
        Drawn as the product&rsquo;s &ldquo;Upload image&rdquo; dialog, in three states: at rest, dragged over, and
        uploading; and as the Uploaded Document card, with the bar the <a href="/progress">Progress</a> already draws.
        Underneath is a real <code>input type=&quot;file&quot;</code> and the zone is its label, so Tab reaches it and
        Enter opens the picker; <code>accept</code> and <code>multiple</code> are the input&rsquo;s. What is chosen or
        dropped is checked against <code>accept</code> and <code>maxSize</code>, the accepted files go to{' '}
        <code>onAdd</code>, and the refused ones are shown as failed cards with the reason, removable, without the
        caller writing a word.
      </p>

      <h2>The list is the caller’s</h2>
      <p>
        <code>files</code> is what the caller knows: each with a <code>status</code>, <code>ready</code> (chosen and not
        sent, for a form that sends on save), <code>uploading</code> with a <code>progress</code> or without one,{' '}
        <code>done</code> with an <code>href</code> for Download, or <code>failed</code> with an <code>error</code> and
        Retry. The component draws it and asks; the caller uploads, retries and removes. One component serves an upload
        per request and a form that sends everything at the end.
      </p>

      <h2>The drawn single-file zone</h2>
      <div className="specimen">
        <FileUpload
          accept="image/*"
          maxSize={MAX}
          hint="PNG, JPEG or GIF under 5 MB."
          files={one.files}
          onAdd={one.add}
          onRemove={one.remove}
          onRetry={one.retry}
        />
      </div>
      <p>
        Without <code>multiple</code> the zone takes one file and, as drawn, shows the upload inside itself, the Loader
        in the circle and &ldquo;Uploading&rdquo; with the name; done, the card appears below and the zone is ready for
        the next.
      </p>

      <h2>Compact, and the tile</h2>
      <div className="specimen">
        <div className="specimenRow">
          <Badge tone="info">compact, for a dense form</Badge>
        </div>
        <FileUpload
          variant="compact"
          multiple
          accept=".pdf"
          hint="PDF only."
          files={dense.files}
          onAdd={dense.add}
          onRemove={dense.remove}
          onRetry={dense.retry}
        />
        <div className="specimenRow">
          <Badge tone="info">the drawn &ldquo;+&rdquo; among a client&rsquo;s documents</Badge>
        </div>
        <div className="specimenRow" style={{ alignItems: 'stretch' }}>
          <style>{`.fileTile { width: 140px; }`}</style>
          {['ID card', 'Insurance', ...tile.files.map((f) => f.name)].map((name) => (
            <Card key={name} className="fileTile">
              <CardBody>
                <strong
                  style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {name}
                </strong>
                <span className="alias">PDF · Download</span>
              </CardBody>
            </Card>
          ))}
          <FileUpload variant="tile" label="Add a document" accept=".pdf" onAdd={tile.add} />
        </div>
      </div>
      <p>
        <code>compact</code> is the same input as a button-like label with the hint beside, and the whole root takes a
        drop. <code>tile</code> is the drawn &ldquo;+&rdquo; with its words off screen; the row of documents around it
        is the page&rsquo;s, and its list is left to the page too.
      </p>

      <h2>States</h2>
      <div className="specimen">
        <FileUpload
          multiple
          onAdd={() => {}}
          onRemove={() => {}}
          onRetry={() => {}}
          files={[
            {
              id: 'a',
              name: 'Justin - xray31rt.pdf',
              size: 1_234_000,
              type: 'application/pdf',
              status: 'done',
              href: '#',
            },
            { id: 'b', name: 'Consent form, signed on the 12th of September.pdf', status: 'uploading', progress: 45 },
            { id: 'c', name: 'Referral.pdf', status: 'uploading' },
            { id: 'd', name: 'scan.heic', size: 4_100_000, status: 'failed', error: 'The server refused it' },
            { id: 'e', name: 'notes.txt', size: 812 },
          ]}
        />
        <div className="specimenRow">
          <Badge tone="info">disabled</Badge>
        </div>
        <FileUpload disabled hint={HINT} onAdd={() => {}} />
      </div>

      <h2>Where it departs from the drawing, and why</h2>
      <p>
        The drawn edge is a light dashed grey at about 1.5:1. The roadmap has the drop zone&rsquo;s dashed edge as a
        boundary, and a boundary needs 3:1 (WCAG 1.4.11), so it is border/strong, the Switch&rsquo;s and the
        Slider&rsquo;s token; dragged over, the zone is surface/accent-subtle with a border/accent edge, the pair the
        Table&rsquo;s stripe already holds. The zone at rest is surface/sunken, which on a card is a well and in dark is
        the canvas, where the edge alone carries it, as the Tabs&rsquo; track. The tag-like card in the product,
        &ldquo;PDF . Download&rdquo;, keeps its words, with Download as the Link.
      </p>

      <h2>Best practice, and the alternatives</h2>
      <p>
        The zone above and the files below is what Carbon, Atlassian and Polaris converged on: the zone stays ready
        while files climb, and each file says its own state. Show the limits before the choice, in the hint, and refuse
        in the list rather than in a dialog. Keep the words that open the picker as words: an icon alone says nothing to
        someone who has not dropped a file before. A single-file zone that shows the upload inside itself is the
        drawing&rsquo;s choice and reads well in a dialog; with more than one file it hides the zone at the moment a
        second drop is likely, which is why <code>multiple</code> keeps the zone and lists the cards. The tile is for a
        row the page already lays out.
      </p>

      <h2>Accessibility</h2>
      <p>
        The input is named by the words, &ldquo;Choose files or drag and drop&rdquo;, and described by the hint. The
        zone draws the ring when the input inside it has focus. Each card&rsquo;s × is &ldquo;Remove&rdquo; and the
        file&rsquo;s name; Retry is a button in the error&rsquo;s line; the bar is the Progress, named
        &ldquo;Uploading&rdquo; and the name. Dragging is an addition, never the only way: the picker is always there.
      </p>

      <h2>Measures</h2>
      <div className="specimen">
        <Table
          caption="Measures"
          captionVisible
          density="compact"
          columns={measureColumns}
          rows={MEASURES}
          getRowId={(r) => r.part}
        />
      </div>

      <h2>Using it</h2>
      <CodeBlock code={USAGE} lang="tsx" />
      <div className="specimen">
        <Table
          caption="FileUpload props"
          captionVisible
          density="compact"
          columns={propColumns}
          rows={PROPS}
          getRowId={(r) => r.prop}
        />
      </div>
    </DocPage>
  );
}
