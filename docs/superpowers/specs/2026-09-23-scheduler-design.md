# Scheduler — design

2026-09-23. Fifth piece of the roadmap's third wave, and the component the
system's origin asks for: "Calendar's date logic. Day and week; its own
spec, likely its own wave." Drawn on the product's Calendar V2 page: the
**weekly view** (node 4914:36041: the hours column with the zone in its
corner, "WET"; a 64 header with the weekday in caption and the day number,
today's in a 28 accent circle; an All-day row of 28; hours of 81 with a
hairline each and a dotted quarter-hour grid; the hours outside the working
day hatched; the current time as a coral line across the columns with a dot
at the start and "11:16" in the hours column; the events as 118-wide cards
in 129 columns, radius 8, the name 12 Semibold, the time 11 Medium, a 24
icon circle from one hour up, one line only at a quarter of an hour); the
**daily view with several people** (node 7374:12218: one column per person
with an avatar of 24 and the name, every person's events in that person's
colour, green, red, yellow, blue, teal); the **daily view on a phone** (node
19079:100383: the same grid with one column, 24-hour labels, the cards at
full width); the **week with several people** (node 4914:35448: Monday to
Friday, an "Out of office" chip in the All-day row, cascading overlaps,
"Availability" in the toolbar); and the **Appointment Status** sheet (node
5187:14853: regular at four durations, pending approval outlined on the
tint, cancelled outlined with the text struck, a time blocker on a dotted
tint, an external event white with a bar at the start, on-appointment with
a green bar and people-waiting with a red one, an availability slot in teal
with a ×, every one of them faded when past, and the states: active, hover
and drag, selected with handles, and the new appointment "(No title)
12:00 - 12:30pm" dashed).

Fernando took **A, in two phases**: the grid, the events, selection and the
keyboard now; dragging to create and to move, with the keyboard equivalents
and availability, as a second spec once this one is on main.

## Decisions

1. **The package takes the grid; the screen stays the caller's.** The
   toolbar (Today, the arrows, the Week/Day Select, Availability), the
   mini-calendar, the people search, the Event Type checkboxes, the panel of
   the selected event and the waiting room are the product's screen, and the
   `/scheduler` page composes them from what the package has. `Scheduler`
   is the hours column, the header, the All-day row, the hours, the now
   line and the events, and nothing else. `label` names it.
2. **Two views, one anatomy.** `view="week"` draws one column per day from
   `date`, `weekStartsOn` and `days` (7 as drawn; 5 in the drawing with
   several people). `view="day"` draws the one day, or with `resources` one
   column per person, headed by the avatar and the name. A week with
   several people is drawn (`4914:35448`, listed above) and is not built;
   `resources` is ignored in week view and the type says so. This said
   "is not drawn" (corrected 2026-09-24, fidelity audit).
3. **No `Date` leaves the component, as in the Calendar.** An event's
   `start` and `end` are wall-clock strings, `'2023-04-20T11:00'`, an
   `ISODateTime`; `time.ts` splits one into the Calendar's `ISODate` and
   minutes of the day, and every comparison is on those. The hours in the
   column and the times on the cards come from `Intl` for `locale` on a UTC
   timestamp, the way `date.ts` already formats: "9 AM" where the locale
   counts to twelve, "09:00" where it counts to twenty-four, which is the
   phone drawing; the card's "11:00 AM – 1:00 PM" is `formatRange`. No
   prop chooses the clock.
4. **`now` is a prop.** `ISODateTime` draws the line there, `null` draws
   none, and left out the component reads the clock after hydration and
   ticks with the minute, so the server renders no line and the client
   adds it. Past is derived from it: an event that ended before `now`
   loses its strong fill for the tint, and nothing loses opacity, so every
   text on a past card still measures.
5. **The hours are props.** `hours` `{ start, end }` bounds the column, 0
   to 24 by default; `workingHours`, on the component or per resource,
   paints the hours outside it `surface/sunken`, which is the drawn hatch
   as a token. The grid's height is `--scheduler-hour`, 80 by default for
   the drawn 81, and every event is placed from it in the stylesheet; the
   column's floor is `--scheduler-column`, 128, so at a phone's width the
   one column fills and the week scrolls sideways inside the region.
6. **Six kinds, one tone each.** `kind` is `confirmed` (the tone's fill,
   its label on it), `pending` (the tint with the fill as a 1px edge),
   `cancelled` (raised, `border/default`, the title and time struck),
   `blocker` (the tint under a dotted pattern of the fill, and the edge),
   `external` (raised with a 4px bar of the fill at the start) and
   `availability` (the tint with a dashed edge of the fill, for the second
   phase to create). The drawn on-appointment and people-waiting bars are
   product states with no token behind them and are not built; `icon` is
   the caller's node in the 24 circle, `renderEvent` adds to the card
   without replacing it.
7. **A categorical palette, measured, as the Tag was waiting for.** `tone`
   is `accent` by default, the theme's own tokens, or one of six hues:
   `glacier`, `moss`, `amber`, `ember`, `glow`, `flare`. Each hue is four
   theme tokens, `category/<hue>` (600 light, 400 dark), `category/on-<hue>`
   (white, night/950), `category/<hue>-subtle` (050, 900) and
   `category/<hue>-text` (700, 300): the accent's own four stops, so what
   holds for the accent holds for each. Measured before the choice, with
   one lightness per stop across the ramps: the label on the fill is at
   least 5.09:1 light and 7.51:1 dark, the text on the tint 7.25 and 9.36,
   the fill on `surface/raised` 4.74 and 6.97; twenty-four cases in the
   suite. A resource's `tone` paints its events unless an event names its
   own.
8. **A column is a list, not a grid of cells.** A `role="grid"` of
   ninety-six quarter-hours a day is what a screen reader would walk, so
   each column is a `section` named by its header holding a `ul` of
   buttons, one per event, named by the title, the time range and the
   kind. The region that scrolls is focusable, as the Table's. One event
   holds the tab stop: Up and Down move within the column, Left and Right
   to the nearest event by start in the next column that has one, Home and
   End to the column's first and last, Enter and Space call `onSelect`;
   `selectedId` marks the card with `aria-current="true"` and a ring. The
   All-day row's events are the same buttons in a row.
9. **Overlaps side by side.** Events that overlap form a cluster and take
   lanes greedily, each lane the first whose last event ended by the
   start; the cluster's width is divided by its lanes. The cascading
   overlap drawn in the week with several people is not replicated: at a
   third card the cascade hides the first one's time. Recorded.
10. **Sizes by duration, as drawn.** Under 30 minutes the card is one line,
    the title only; from 30 the time under it; from 60 the icon circle. The
    floor is 24, the drawn quarter-hour card, so a five-minute event is
    still a target. *Corrected 2026-09-24 (fidelity audit):* the review of
    2026-09-23 moved the built floor to 20, a quarter of the 80 hour
    (`--scheduler-event-min`, `spacing/250`), because 24 laid each
    quarter-hour card over the next by 4; this decision was not updated.
    Drawn 24 (the product file, `4914:36173`), built 20: which one stands is
    Fernando's to rule.
11. **Colours.** The fill and the ring of today's number are
    `interactive/accent`; the now line is `border/danger`, the drawn coral
    as the theme's ember, with its time in `text/danger`; the hours and the
    zone are `text/tertiary`; the hairlines `border/subtle`; the header on
    `surface/raised`.

## Shape

```
section.root[aria-label]                                    --scheduler-hour, --scheduler-column
  div.head                                                  sticky top, surface/raised
    div.corner > span.zone                                  "WET"
    div.columns > div.column-head[.today] × n
      span.weekday + span.day(.todayMark)  |  Avatar + span.name
    div.allDay > span.allDayLabel + ul.allDayList × n > li > button.event
  div.region[tabindex=0][style --scheduler-max-height]      scrolls
    div.hours > span.hour × h  (+ span.nowTime)
    div.columns
      section.column[aria-labelledby] × n
        span.offHours (before, after)                       surface/sunken
        span.line × h                                       hairlines
        ul.events > li > button.event[.confirmed|…][.past][.selected][style --event-from --event-to --event-lane --event-lanes]
          span.title + span.time + span.icon
      span.now[aria-hidden][style --scheduler-now]          the line and its dot
```

## API

```ts
type ISODateTime = string;                                   // 'YYYY-MM-DDTHH:MM', wall clock
type SchedulerView = 'day' | 'week';
type SchedulerKind = 'confirmed' | 'pending' | 'cancelled' | 'blocker' | 'external' | 'availability';
type SchedulerTone = 'accent' | 'glacier' | 'moss' | 'amber' | 'ember' | 'glow' | 'flare';
type SchedulerHours = { start: number; end: number };        // hours of the day, 0–24
type SchedulerEvent = {
  id: string; title: string; start: ISODateTime; end: ISODateTime;
  resourceId?: string; kind?: SchedulerKind; tone?: SchedulerTone;
  icon?: ReactNode; allDay?: boolean;
};
type SchedulerResource = { id: string; name: string; avatar?: ReactNode; tone?: SchedulerTone; workingHours?: SchedulerHours };
type SchedulerProps = {
  label: string;
  view?: SchedulerView;                                      // 'week'
  date: ISODate;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;                 // 0, as the Calendar
  days?: number;                                             // 7; week view only
  resources?: readonly SchedulerResource[];                 // day view only
  events: readonly SchedulerEvent[];
  selectedId?: string | null;
  onSelect?: (event: SchedulerEvent) => void;
  hours?: SchedulerHours;                                    // { 0, 24 }
  workingHours?: SchedulerHours;
  now?: ISODateTime | null;                                  // clock after hydration; null hides
  locale?: string;
  zoneLabel?: ReactNode;                                     // the corner
  allDayLabel?: string;                                      // 'All-day'
  kindLabels?: Partial<Record<SchedulerKind, string>>;       // the word in the accessible name
  maxHeight?: number | string;
  scrollTo?: number;                                         // an hour; workingHours.start or the first event
  renderEvent?: (event: SchedulerEvent) => ReactNode;
  className?: string;
};
```

`time.ts`: `splitDateTime`, `minutesOf`, `toDateTime`, `formatTime`,
`formatTimeRange`, `hourLabels(locale, hours)`; `layout.ts`: `lanes(events)`
returning, per event, its lane and the cluster's lane count.

## Contrast

For each of the six hues, both modes: `category/on-<hue>` on
`category/<hue>` ≥ AA; `category/<hue>-text` on `category/<hue>-subtle` and
on `surface/raised` ≥ AA; `category/<hue>` on `surface/raised` and
`surface/base` ≥ 3:1. Held already: `text/tertiary` on the surfaces,
`border/danger` on the surfaces, `interactive/on-accent` on
`interactive/accent`, `text/accent` on `surface/accent-subtle`.

## Tests

`time.ts` and `layout.ts` pure: the split and the join, minutes, labels in
a twelve-hour and a twenty-four-hour locale, ranges, lanes for none, one,
two overlapping, a chain of three, and two clusters. The component: a week
of seven from a date and a week of five, the header's names and today's
mark; a day, and a day with resources headed by name and each event in its
resource's column; events placed by start and end as custom properties,
lanes as custom properties, the classes for kind, past and selected; the
All-day row; the accessible name of an event; the keyboard on the four
arrows, Home and End, Enter and Space; `now` given, `null` and from the
clock after hydration; `workingHours` bands; `kindLabels`; the stylesheet's
hour and column custom properties, the box-sizing list and the motion
tokens; axe.

## Records

CHANGELOG under Unreleased, the palette named as a foundation; README's
counts (test cases; the theme's tokens, 82, and `category` among the
groups); the Colour page's fifth table; MEMORY.md; nav entry (thirty-two);
section card; the plan. Figma: the export script writes the new tokens for
Fernando to apply.
