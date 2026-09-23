# Scheduler, phase 2: creating, moving and the keyboard — design

2026-09-23. The second spec of the Scheduler, on top of phase 1
(`2026-09-23-scheduler-design.md`, on main as b3738b9). Drawn on the same
Calendar V2 page: the **New Event** screen (node 4912:34658), the dashed
"(No title) 12:00 - 12:30pm" on the grid while the panel is open; the
**Time Slots** explanation (node 6023:6572), "Click and drag on your
calendar to select your desired availability blocks", and the week with
the teal slots at 3:00 - 4:00pm and 3:00 - 5:00pm with a × (node
4912:33424); the behaviour note (node 10498:99186), "while dragging a
transparent element highlights the slot, on release it turns opaque"; and
the states on the Appointment Status sheet: hover and drag darker, selected
with the handles at the top and the bottom, and "slow opacity blinking
while being created if possible".

Fernando named Vimcal as the reference for behaviour. What its public
documentation confirms: A enters Slots and a drag paints them, "formatted
in real time, ready to copy"; Z is Time Travel; D, W and M the views; ⌘K the
command center; ⌘; templates; on iOS "hold and swipe down to multi-select".
From memory of the product, marked as such: C creates, T goes to today, G
to a date, hover-and-press acts on the event under the cursor without a
click, ⌘C / ⌘V copy and paste events, ⌘Z undoes.

## Decisions

1. **Three gestures, three callbacks, all optional.** Nothing drags unless
   the caller gives the callback, as the Table sorts only with `onSort`.
   `onCreate(draft)` arms the press on an empty slot: press and drag draws
   the draft snapping to `step` (15, the drawn quarter grid); a press with
   no drag makes a draft of `defaultDuration` (30, the drawn "(No title)
   12:00 - 12:30pm"). `onMove(event, next)` arms dragging a card along its
   column and to another column or person, the duration kept. `onResize
   (event, next)` arms the handle at the foot of the selected card, the
   drawn bar, to change the end. `next` is `{ start, end, resourceId? }`
   in wall-clock time, and the event handed back beside it is the before,
   so an undo is the caller's one line; the page shows it as a Toast with
   Undo.
2. **The draft is the caller's while a panel is open.** As drawn, the
   "(No title)" stays on the grid while New Event is open, and the panel
   closes it. So `draft` is a prop, `{ start, end, resourceId?, title? }`,
   drawn dashed on the tint of `createKind` (`confirmed` by default;
   `availability` makes the same gesture create availability, the drawn
   teal being the `availability` kind), with the requested slow pulse at
   1.8s, the Skeleton's pace, off under reduced motion. While a drag is
   under way the component draws its own pending draft; on release it
   calls `onCreate` and the caller decides whether to keep it as `draft`.
   `draftLabel` is "(No title)". `onRemove(event)` puts the drawn × on
   availability cards, and Delete or Backspace on a hot event calls it.
3. **The keyboard is the equivalent of every gesture, and hover is the
   keyboard's target.** The Vimcal model, made accessible: a key acts on
   the *hot* event, the one under the pointer if there is one, else the one
   with focus; with no pointer, nothing changes. With `onMove`, Shift+Up
   and Shift+Down move by a step, Shift+Left and Shift+Right to the next
   column at the same time; with `onResize`, Alt+Shift+Up and Down move the
   end. To create: with the region itself focused, Enter puts a cursor of
   `defaultDuration` at the first hour in view, in today's column or the
   first; the arrows move it, Shift+Up and Down stretch it, Enter calls
   `onCreate`, Escape drops it. ⌘C or Ctrl+C copies the hot event, ⌘V
   pastes it at the cursor, or after the hot event when there is none, and
   ⌘D duplicates the hot event right after itself, all through `onCreate`
   with `from: event`, so a template or a copy is the caller's to finish.
   A `role="status"` region off screen says the time under the pointer or
   the cursor as it moves, "12:00 – 12:30 PM, Thursday, April 20", and the
   result on release.
4. **Mouse and pen drag; touch taps.** A drag along the column is the
   gesture the grid's own scroll uses on touch, and the browser cancels a
   pointer drag the moment it decides to pan; the fix is `touch-action:
   none` on the columns, which takes the grid's scrolling away from every
   finger, or a long press that this component cannot test in jsdom. So on
   touch a tap on an empty slot creates the default draft and nothing
   drags; the phone drawing has no drag either. Recorded, with the long
   press as the next step if a product needs it. Near the region's edges
   a mouse drag scrolls the region.
5. **Slots as text.** `formatSlots(events, locale)` returns the drawn
   "Copy to clipboard" text, one line per day, "Thursday, April 22: 3:00 –
   4:00 PM, 5:00 – 6:00 PM", from the availability events it is given. The
   Vimcal gesture, as a helper: the component does not touch the
   clipboard.
6. **Colours and states.** A card being dragged dims to half and its ghost
   travels; hover on a card is the wash, already there. The ghost and the
   draft are the tint with a dashed edge of the fill, as the availability
   card, in the tone of `createKind`. The handle is a `border/strong` bar,
   drawn on the selected card only when `onResize` is given, with an
   `ns-resize` cursor. Nothing in these states is colour alone: the ghost
   is dashed, the handle is a shape, the status says the time.
7. **Placement is measured from the events layer.** The events list of
   each column becomes an absolutely positioned layer inset by the pad, so
   a pointer's minute is `(y - layer.top) / layer.height * minutes shown`,
   with no custom property read from JavaScript, and a slot's top loses the
   pad it added. Tests mock the layers' rects.

## Shape (what changes)

```
section.column[data-column]
  div.events (absolute, inset-block pad) > ul > li.slot[.dragging] > button.event
    + span.handle (selected, onResize)
  li.draft[.pulse][style --event-from --event-to] > span.title + span.time   the draft, the ghost or the cursor
span.status[role=status] (hidden)
```

## API (added)

```ts
type SchedulerDraft = { start: ISODateTime; end: ISODateTime; resourceId?: string; title?: string; from?: SchedulerEvent };
type SchedulerChange = { start: ISODateTime; end: ISODateTime; resourceId?: string };
step?: number;                 // 15
defaultDuration?: number;      // 30
draft?: SchedulerDraft | null;
draftLabel?: string;           // '(No title)'
createKind?: SchedulerKind;    // 'confirmed'
onCreate?: (draft: SchedulerDraft) => void;
onMove?: (event: SchedulerEvent, next: SchedulerChange) => void;
onResize?: (event: SchedulerEvent, next: SchedulerChange) => void;
onRemove?: (event: SchedulerEvent) => void;
removeLabel?: string;          // 'Remove'
```

`interaction.ts`: `snap`, `spanFromDrag`, `spanFromPress`, `moveSpan`,
`resizeSpan`, `formatSlots`.

## Tests

Pure: snapping and clamping, a drag up and down, a press, a move that
keeps its duration and stays inside the day, a resize with the floor of a
step, `formatSlots` by day and locale. Component, with the layers' rects
mocked: a press creates the default draft and a drag the dragged span, in
the right column and person, calling `onCreate` with wall-clock times; a
drag on a card calls `onMove`, across columns; the handle calls
`onResize`; Escape cancels a drag; `draft` is drawn and pulses; the ×
calls `onRemove`; nothing drags without the callback; touch taps and does
not drag; the keyboard on the hot event, hovered or focused: move, resize,
Delete, copy, paste, duplicate; the cursor: Enter, arrows, Shift+arrows,
Enter, Escape; the status text; the stylesheet's pulse and its reduced
motion rule; axe.

## Records

CHANGELOG under Unreleased, in the Scheduler's entry; MEMORY.md; the
`/scheduler` page with New Event, the Availability mode, the slots' text
and the Undo toast; the plan.
