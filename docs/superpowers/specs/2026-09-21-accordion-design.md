# Accordion — design

2026-09-21. Sixth piece of the roadmap's second wave.

## What is drawn

A published **Accordion** set, used for the sections of the Side Drawer's View
and Edit (Forms, Diagnosis, Notes, Treatment Plans, Billing, Follow-up,
Attachments):

| Part | Drawn |
|---|---|
| Row | 64: 16 above and below a 32 container, a `border/subtle` hairline under every item |
| Chevron | 20, at the start, 2 in; right when closed, down when open |
| Title | 16/24 Semibold (`paragraph/lg`), `text/secondary` |
| After the title | a count in a capsule of 20 on `surface/sunken`, 12/16 Semibold, or a Badge ("Unpaid") |
| At the end | an Icon Button of 32, "+", in the state "Hover Add New Diagnosis" |
| Content | 24 under the row's container, flush with the item's start |
| Open | several at once: the state "Everything Open" |

Older frames on the same page have the chevron at the end, after the action.
Shown both, Fernando took **the start**, the published one (2026-09-21): the
titles stand in a column and the end is left to the action.

## Decisions

- **`<details>`**, as the roadmap has it. Opening, the keyboard and the
  browser's find-in-page opening the right section are the platform's.
- **Several open** by default, as drawn. `exclusive` gives the items one
  `name`, and the platform closes the others.
- The title is a heading inside the `<summary>`, `headingLevel` 3 unless told.
  `text/primary` where the drawing has secondary, as every title in the system.
- **The action is outside the `<summary>`**: a button inside a control is
  invalid. It is laid over the row's end, and the summary keeps that room
  clear. **Always shown**, where the drawing shows it under the pointer only:
  a control that exists on hover does not exist for the keyboard or for touch.
- The chevron's turn travels as a custom property from `details[open]`; the
  part is not reached by descent.
- The opening is animated only where `::details-content` and
  `interpolate-size` exist, and not at all under reduced motion.

## API

`Accordion`: `children`, `exclusive`, `headingLevel` (2–6, 3), `className`.

`AccordionItem`: `title`, `count`, `meta` (a Badge), `action`, `children`,
`open`, `defaultOpen`, `onOpenChange`, `className`.

Controlled: the platform toggles the element whatever the prop says, so after
every render a controlled item is put back to its prop.

## From the build and the review

- The package's icon-only Button at sm is 50 across, measured, not the drawn
  32: the row keeps 64 clear, and `--accordion-action-room` sets another.
- `::details-content` declares its box-sizing in its own rule: in the list at
  the top, a browser that does not know it would drop the list.
- `toggle` fires for an item that mounts open and for one the prop moved; what
  the caller was last told is kept, and neither is reported.
- Every item sets `--accordion-turn`, closed too: a custom property inherits
  into a nested accordion.
- `defaultOpen` is read once.

## Not here

Sizes; a disabled item; a filled or carded variant; nesting rules.

## Tests

`details`/`summary` and the heading level; several open; `exclusive` shares a
`name` and its absence shares none; `defaultOpen`, controlled and put back;
`onOpenChange`; the count and meta in the summary; the action outside the
summary and the room kept for it; stylesheet: no marker, the turn as a custom
property, no descent, motion only under no-preference, box-sizing; axe.
Contrast: the chevron and the count.
