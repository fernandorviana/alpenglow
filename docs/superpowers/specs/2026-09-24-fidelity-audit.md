# Fidelity audit — drawing against build, and every width

2026-09-24. Fernando: the system "is turning into garbage" — in many cases
nothing like what was drawn, and the responsive behaviour very bad in many
cases. This is the audit that followed, and the rule that comes out of it.

## Method

- The drawing: the Alpenglow Figma file (30 component pages and six
  foundation pages) and, for the calendar, the product file's *Calendar V2*,
  *Layouts* and *Mobile* pages. Nine reviewers, one per family, each read the
  frames, then the component's spec and `MEMORY.md`, then the live site.
- The build: production, https://alpenglow-rose.vercel.app, all 51 routes at
  320, 375, 768, 1024 and 1440, light and dark, captured and measured by a
  headless Chrome driven over CDP (overflow, clipping, sideways scroll, hit
  targets under 24, text under 12). A second pass compared every element's
  box in `next dev` against production, to find rules that win or lose on
  stylesheet order.
- Every departure was classified: **unrecorded** (nobody wrote it down),
  **recorded by an agent** (a spec or a comment gives a reason, with no sign
  Fernando asked for it), or **recorded as Fernando's**.

## What holds

The token layer: all 54 Theme roles alias the same primitives as the Figma
variables in both modes; spacing, border widths, the `md` and `lg` shadows
and the desktop type sizes, line heights and tracking match exactly. The
Dialog's md shell, the backdrop, the Alert, the Tooltip, the Tag, the
DropdownMenu, the Pagination, the Tabs and SegmentedControl, and the date
picker's calendar grid are close to their drawings.

## Why the rest drifted

1. **Departures written as settled.** From 2026-09-18 the specs carry a
   "where it leaves the drawing" section whose reasons are the agent's own —
   "as every title in the system", "a field that lights up under the mouse
   competes", "set down without being asked, to be corrected on sight". A
   competent agent pulls a designer's decision towards its own default; the
   private notes warned of exactly this.
2. **False records about the drawing**, each the premise of the next session:
   the Toast "is not drawn" (tone-filled notifications are, `1219:21015`,
   `1219:20982`); no phone top bar or bottom bar "is drawn" (`116:9367`,
   `120:9434`, `2787:6033`, `638:10984`); the SideNav item is "40, as drawn"
   (48, `160:9623`); the Table's "type maps exactly" (it does not); "a week
   with several people is not drawn" (`4914:35448`); "an agenda list for a
   phone is not drawn" (`19848:139575`); the Loader is "two arcs, as drawn"
   (it has been one arc since 46bb6ab); the Select is "40 tall" (48); the
   Slider was "seen in Chromium, no overflow at 375" (it overflows in the
   production build at every width); the Pagination footer was "checked by
   hand at 320" (it pushes the page 16px sideways).
3. **A missing primitive.** With no round icon-only Button until 1fcabc3,
   the TopBar, the Accordion, the Drawer's header and the Tooltip's triggers
   took 50–58px capsules where circles of 32, 40 and 48 are drawn.
4. **One component rule emptied every reference table.** Below a 40rem
   container the Table kept only its first column, so every props, anatomy,
   measures and token table on the site lost its values at 768 and under.
   Replaced by columns that leave by rank (spec 2026-09-24, on main as
   5c3c521).
5. **The site's global prose rules reach into the components.** Specimens,
   dialogs and drawers render inside `.prose`, and `.prose > *`
   (max-width 37.5rem), `.prose a`, `.prose h3` and `.prose p` outrank or tie
   the components' single classes — and in the production build `docs.css`
   loads last, so a tie is lost too.
6. **Checked in `next dev` at desktop width.** The production build orders
   CSS chunks differently (the Slider and the Switch's description differ
   between the two; nothing else does), and the small widths were not looked
   at: the Textarea has rendered with no box at all since cd5ff68.

## The rule from now on

- The drawing is the default. A departure is a proposal to Fernando, named
  as one, with the drawn value beside it, and it lands only with a yes from
  Fernando, recorded in Fernando's words with the date.
- "Not drawn" is written only after searching both Figma files.
- Done means seen in the production build at 320, 375, 768, 1024 and 1440,
  light and dark (`npm run audit:responsive`).
- A global rule in `app/docs.css` never outranks a component's.

## Findings

Disposition: **fix** (a bug, no taste involved — part 1), **drawing** (an
unrecorded departure; the drawing wins — part 2), **decide** (recorded by an
agent; Fernando rules), **owner** (recorded as Fernando's; listed only).
Widths are where it breaks; "all" means every width measured.

### Broken on the live site

| Where | What | Width | Cause | Disposition |
|---|---|---|---|---|
| Slider | Track 0px, field 802px, the page scrolls sideways | all | `control.module.css` `.control{width:100%}` beats `Slider.module.css` `.field` on chunk order | fix |
| Switch | Description loses its 40px indent | all | `choice.module.css` `.description` beats `Switch.module.css` on chunk order | fix |
| Textarea | No fill, border, padding or focus border; invalid shows nothing | all | `Textarea.tsx` puts `control.field` (bare) on the box after `control.control` | fix |
| Dialog xs | Stacked buttons 22px tall, drawn 40 (`608:10569`) | all | `.actions > * { flex: 1 1 0 }` in a column | fix |
| Drawer | 480 wide at 320/375, left edge at −160/−105; Expand capped at 600 | ≤375, ≥768 | `.prose > *` max-width | fix |
| Drawer inline | Title set one letter per line | 320, 375 | panel shrinks under its own 320 minimum | fix |
| Dialog | Titles break mid-word ("Reschedul/e") | 320 | 112px title column, `overflow-wrap` | fix |
| CommandPalette | 600 wide on a phone; title cut, close off-screen | < 632 | `.prose > *` max-width | fix |
| Calendar | Month arrows' chevron 2.3×4.7px, reads as a dot | all | `.page` keeps the button's default padding | fix |
| Popover | Touches the screen edge; body scrolls with no cue | 320, 375 | anchored at the trigger's start with no edge margin | fix |
| /screen/full | Main column stuck at 754, empty strip to the right | 768–1023 | `.screen` `auto minmax(0,1fr)`; with the sheet closed the column falls into `auto` | fix |
| SideNav collapsed | Items are 24×40 slivers at the rail's edge, drawn 48 circles centred (`157:9589`) | 1024–1279 | Tooltip wrapper `inline-flex` shrinks the item | fix |
| SideNav sheet | Last item cut off | 375×812 | `min-block-size:100%` plus the close button | fix |
| /navigation | Every SideNav link in the accent | all | `.prose a` beats `.item { color: inherit }` | fix |
| Scheduler by person | Heads not over their columns (Léa's cards under Anthony) | all | `.head` and `.body` are separate grids sized by `max-content` | fix |
| Scheduler | All-day chip text clipped (20px pill, drawn 28 row) | all | chip height | fix |
| /scheduler Try it | The week gets 496px of 976 at 1440 | ≥768 | docs specimen width | fix |
| /scheduler | View select says Week while a day is shown | < 768 | page state | fix |
| /colour | Token tables 1119 wide in an 852 column; Dark column off-screen | all | `.tokens .alias { white-space: nowrap }` on a 110-character use line | fix |
| /foundations | Data-visualisation card picture blank | all | `.chartRamp` in a `place-items:center` well shrinks to 0 | fix |
| /colour | Each ramp's name sits with the ramp above | all | `.prose p` beats `.rampName` | fix |
| Docs cards | Title 32px down, description 16px margin | all | `.prose h3`/`.prose p` beat `.cardTitle`/`.cardDescription` | fix |
| Pager | "Next" sits at the left | all | `.prose .pagerLink` margin cancels `.pagerNext` auto | fix |
| Code blocks | Copy button printed over code; blocks capped at 600 with room beside | all / ≤375 | padding reserved at the scroll end only; `.prose > *` | fix |
| Theme toggle, dark | Track is the rail's colour; the pill disappears | ≥768 dark | track token | fix |
| SegmentedControl, dark | Thumb nearly invisible | dark | overlay on the navy track | fix |
| Inline code, dark | Pill disappears (`surface/sunken` is the canvas) | dark | invariant 4 | fix |
| /why Layers | Fixed viewBox scaled, labels 5–7px | 320, 375 | SVG | fix |
| Docs grids | Three cards leave an orphan | 768 | `auto-fill minmax(232px,1fr)` | fix |
| /icons | Long labels squash their icons | 1440 | no `flex-shrink:0` on the svg | fix |
| Filters bar | Three to four rows, "Clear" alone | 320, 375 | chips `flex:1 1 auto` | fix |
| Table bulk bar | Wraps to four lines over the rows | 375 | `flex-wrap` and stretched dividers | fix |
| /button | Dialog-footer example orphans the primary action | 320, 375 | example layout | fix |
| /screen | Frame opens at 1440, shown at 24% on a phone | 320, 375 | `DEFAULT_FRAME.width` | owner (dense-screen spec) |

### Different from the drawing

| Component | Drawn | Built | Disposition |
|---|---|---|---|
| Button | Outline and ghost neutral only | also accent and danger | drawing |
| Button | Neutral: borderless grey fill | fill plus `border/default` | decide (Button.module.css) |
| Button | Loading with an icon: spinner in the icon's slot, label stays | label hidden, spinner centred | drawing |
| Button | Toggle Button `1973:9766`, Upgrade Button `3270:16196` | not built | drawing |
| Badge | Small 24, Large 30 | 26 and 32 (hairline added) | drawing |
| Badge | 8 hues, icon-only and count discs, remove button | 6 tones, dot added | decide (tones); drawing (discs, remove) |
| Avatar | Grey ring, 80 with a 72 image; status dot 24 top-right; ring turns green/red | no ring, dot 12/16 bottom-right | drawing |
| Avatar group | "+N" filled indigo, white text | sunken, secondary text | drawing |
| Loader | Two arcs, 18 and 9 in 24, brand and brand 2 | one arc on a track; 16 and 32 added | drawing |
| Progress | Cyan into accent | dark teal, purple upload bar | decide |
| Input / Field | Label 12, inset 16 in line with the text; caption under the field; label and caption red in error, green in success | label 14 Medium flush; help between label and field; label stays primary | drawing |
| Input / Select | md 48, sm 40 | default 40; drawn md is `lg` | decide |
| Input / Textarea / Select | Hover: darker fill and a hairline | no hover | decide (control.module.css) |
| Input / Select | Focus: light hairline (inputs, select), accent (textarea) | `border/inverse` everywhere | drawing |
| Input / Select | Disabled keeps the rest fill, text faded | `interactive/disabled`, the heaviest box | drawing |
| Input / Select | Success state, read-only Select, clear ×, phone number | not built | drawing |
| Input | No border at rest; hairline on hover and focus | no border at rest (matches); the 2026-09-07 border/default note does not | — |
| Combobox | 32 grey recessed tags with 28 avatars, inverse checkboxes, clear only | 24 white tags, accent checkboxes, chevron added | decide (tags, checkbox); drawing (fill, chevron) |
| Select | Chevron dark, red in error | accent in every state; NativeSelect grey | drawing |
| Checkbox | Unchecked: accent hairline on light | `border/strong` grey | decide |
| Switch | Off track near-white | `border/strong` | decide (premise stale after the bedrock) |
| Radio / Switch | Label-first variants | not built | drawing |
| Radio | Focus: border to 2px, no ring | outer ring | drawing |
| Checkbox / Radio | Disabled nearly white | `interactive/disabled` | drawing |
| Slider | Field 80×40, value centred with unit | sm 64×32, no unit | decide |
| Slider | Light grey track | `border/strong` | decide |
| Slider rating | Solid fill, marks on the empty part, 0 and 10 by the faces | ten dashes, no numbers | drawing |
| Slider disabled | — | fill paler than the empty part | fix |
| DatePicker anatomy | 296 wide with visible labels | 844 wide, labels hidden | drawing |
| Table | Open, no frame; header a 44 pill band, radius 8, no rule; accent sort caret; primary 16/24 Medium | boxed frame, rule under the header, grey caret, 11px mono email in the demo | drawing |
| Table demo | Row action opens a menu | button that does nothing | fix |
| Dropdown | 15 variants incl. checkbox, radio, switch, avatar, footer, icons | 8; no static specimen | drawing |
| Item List `757:12039` | Integration rows 96 / 64 | not built | drawing |
| Popover New appointment `759:14082` | Icon-led rows, 434 tall | labelled fields, 586 tall | drawing |
| Card | Photo; hover shows inverse counts and "See details →" | line art; neutral counts always shown | decide (card spec) |
| Docs cards | The drawn Card (`3072:3359`) | hand-rolled hairline card | drawing |
| FileUpload | Uploaded file: 208×64 filled tile, no border | full-width white row with hairline | drawing |
| FileUpload compact | — | square-cornered button | drawing |
| Accordion | Violet chevron; "+" and "···" as 32 circles | grey chevron; one 50×32 capsule | drawing |
| Accordion / Drawer | Titles secondary | primary | decide |
| Drawer | Bare 24 icons; footer 120 pills 16 apart after the fields | ghost 50×32; 88/75 pinned, 12 apart | decide (pinned); drawing (sizes) |
| Toast | Tone-filled notifications with close | black inverse | decide (the owner ruled on "not drawn") |
| SideNav | Items 48 on a 56 step; rest icons tertiary | 40 on 48; icons primary | drawing |
| TopBar | Solid Create; three 40 filled circles; avatar 40; bar 64 | outline; 58×40 pills; 44; 69 | drawing |
| App shell | Top bar across the full width, nav under it | SideNav full height, bar in the column | decide (breakpoints spec) |
| Mobile | Bottom bar `638:10984`; phone and tablet top bars | hamburger and sheet | drawing |
| Creation Forms Templates `827:17430` | Section titles over rules, phone field | not built | drawing |
| Scheduler screen | 64 top bar, 80 rail, 360 right panel: mini-calendar, waiting room, Meet With, event types; the panel becomes the event and the new-event form | a card in the doc column, 280 side column, selected event below the fold | drawing |
| Scheduler | Bright person fills with dark text | 600-stop fills with white text | decide |
| Scheduler | Past `#bfd9ff`, pending pale with an edge; every kind fades | past and pending identical | decide |
| Scheduler | External: 24 bar with an icon; availability opaque teal with ×; selected light fill with handles | 4px edge; accent tint dashed; accent ring | decide |
| Scheduler | Date row over the people row, 28 avatars | people row only, 24 | drawing |
| Scheduler phone `19079:100383` | ~7 hours visible, 64 time column | 1–4 hours, 80 column, extra head | drawing |
| Foundations | Mobile type scale `4214:677` | not built | drawing |
| Foundations | Radius names `md` 8 … `3xl` 24 | code one step off (`md` 6 … `4xl` 24) | decide |
| Foundations | Shadow sm two layers | one layer | decide |
| Foundations | Layout & Grid page | not updated to the built scale | drawing (Figma side) |

### Records to correct

Every false claim listed under "Why the rest drifted", point 2, plus: the
/input lede's "the border is doing real work"; "breakpoints are not tokens
yet" in `app/navigation/page.tsx`, `app/screen/page.tsx`,
`screen.module.css`; the Scheduler's quarter-hour floor (spec and page say
24, CSS says 20); the counts that disagree between pages (primitives 134 vs
113, spacing steps 22 vs 21, components 48 vs thirty-three).
