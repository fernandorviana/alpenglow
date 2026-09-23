# FileUpload — design

2026-09-22. Fourth piece of the roadmap's third wave. Drawn in three places:
the product's "Upload image" dialog in three states (node 1530:44433: at
rest, a dashed zone on `surface/sunken` with the cloud in a white circle,
"**Choose a file** or Drag & Drop" and "We support PNGs, JPEGs & GIFs under
5MB"; dragged over, the zone tinted accent with a dashed accent edge;
uploading, a ring around the cloud and "Uploading xplodingplastix.jpg"); the
**Uploaded Document** set in the Alpenglow file (node 790:14416: a card with
a document icon, the name Semibold and cut, and under it "PDF . Download"
or the 4-tall bar the Progress already draws); and the "+" tile at the end
of a client's Documents row (node 20750:165368), a small dashed square.

Fernando asked for alternatives and took the recommendation: **B, the zone
above and the files as cards below, as the component, with A, C and D as
variants of it.**

## Decisions

1. **One component, `FileUpload`, three shapes.** `variant="zone"` is the
   drawn dialog: the tall zone, and with `multiple` off the uploading state
   inside it, as drawn. `variant="compact"` is a button-like label with the
   hint beside it, for a dense form; dropping works on the whole root.
   `variant="tile"` is the drawn "+" square, its words off screen, for a row
   of documents the page lays out. The list of cards is the same under all
   three; a page that wants only the zone passes no `files`.
2. **A real `input type="file"`, the zone its label.** Keyboard reaches the
   input, Enter and Space open the picker, `accept` and `multiple` are the
   input's. The input is off screen; the zone draws the ring for it through
   `:has(:focus-visible)`. The input's value is cleared after each choice,
   so the same file can be chosen twice.
3. **The component does no network.** It validates what is chosen or
   dropped against `accept` and `maxSize`, hands the accepted `File`s to
   `onAdd`, and shows the list the caller gives it in `files`, each with a
   status the caller sets: `ready` (chosen, not sent), `uploading` with
   `progress` (the Progress under the name, indeterminate without one),
   `done` with an optional `href` ("PDF · Download"), `failed` with an
   `error` and Retry. Rejected files are shown by the component itself as
   failed cards with the reason, "Not a supported type" or "Larger than
   5 MB", removable, so a caller need not write that; `onReject` says them
   too.
4. **The colours are measured.** The dashed edge is `border/strong`, the
   roadmap's boundary at 3:1, not the drawn `border/subtle`; dragged over,
   the zone is `surface/accent-subtle` with a `border/accent` dashed edge
   (the accent on the tint is already held at 3:1 for the Table's stripe),
   and the words `text/primary` on it are asserted AA. The zone at rest is
   `surface/sunken` on a card and a hairline; in dark, sunken is the canvas
   and the dashed edge alone carries the zone, as the Tabs' track.
5. **The card is the drawn Uploaded Document**: a 40 icon box on
   `surface/sunken`, the name Semibold cut with an ellipsis, a meta line in
   caption/md `text/tertiary` (the type and size, "Download" as a Link, the
   bar, or the error in `text/danger` with Retry), and the Tag's × to
   remove, named "Remove `name`".
6. **Words are props**: `label` ("Choose a file", or "Choose files" with
   `multiple`), `dropLabel` ("or drag and drop"), `hint`, `removeLabel`,
   `retryLabel`, `downloadLabel`, `uploadingLabel` ("Uploading"), and the
   two rejection reasons through `rejectionLabel(reason, file)`.

## Shape

```
div.root[.zone|.compact|.tile][.over][.disabled]        drop target
  label.zone (variant zone / tile) | label.button (compact)
    input.input[type=file][accept][multiple][disabled]     off screen
    span.icon > svg cloud | Loader (uploading, single)  |  svg plus (tile)
    span.words > strong.choose + " " + dropLabel        |  "Uploading name"
    span.hint
  ul.list > li.card
    span.docIcon > svg document
    span.body > span.name + span.meta (type · size | Download | Progress | error + Retry)
    button.remove (Tag's ×)
```

## API

```ts
type UploadStatus = 'ready' | 'uploading' | 'done' | 'failed';
type UploadFile = { id: string; name: string; size?: number; type?: string;
  status?: UploadStatus; progress?: number; error?: string; href?: string };
type FileUploadProps = {
  label?: string; dropLabel?: string; hint?: ReactNode;
  accept?: string; maxSize?: number; multiple?: boolean;
  files?: readonly UploadFile[];
  onAdd: (files: File[]) => void;
  onRemove?: (file: UploadFile) => void;
  onRetry?: (file: UploadFile) => void;
  onReject?: (rejected: { file: File; reason: 'type' | 'size' }[]) => void;
  variant?: 'zone' | 'compact' | 'tile';
  disabled?: boolean; name?: string; className?: string;
  removeLabel?: string; retryLabel?: string; downloadLabel?: string; uploadingLabel?: string;
  rejectionLabel?: (reason: 'type' | 'size', file: File) => string;
};
```

## Contrast

`border/strong` on `surface/base` and `surface/raised` ≥ 3:1 (held);
`border/accent` on `surface/accent-subtle` ≥ 3:1; `text/primary` and
`text/tertiary` on `surface/accent-subtle` ≥ AA; `text/danger` on
`surface/raised` ≥ AA.

## Tests

The zone is a label of a file input named by the words; `accept`,
`multiple`, `name`; choosing files calls `onAdd` with the accepted ones and
`onReject` with the rest, and a rejected file shows as a failed card with
its reason; the input's value is cleared; dragging over marks the root and
leaving unmarks it; a drop adds; a drag of something that is not a file is
ignored; the cards: name, meta, Download link, Progress with and without a
value, the error and Retry, Remove named by the file; single-file zone
shows the uploading state inside; `disabled`; the three variants' classes;
the stylesheet's dashed edge from `border/strong`; axe.

## Records

CHANGELOG under Unreleased; README's count; MEMORY.md; nav entry
(thirty-one); section card; the plan.
