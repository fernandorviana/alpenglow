# Changelog

What changed for someone who installs `alpenglow`. Kept from the first wave of
the completeness roadmap (2026-09-18); `0.1.0` and `0.2.0` are summarised from
the record in `MEMORY.md`. While the version is `0.x`, a minor version may
break: a removed token or prop is named here under **Breaking**.

## Unreleased

### Added

- **Tabs** — `underline`, `segmented` and `pill` over one WAI-ARIA tabs
  pattern: roving focus, arrows that wrap and skip a disabled tab, Home and
  End, `dir="rtl"`, automatic or manual activation, an optional count in a
  tab's name, `keepMounted`, and a list that scrolls to keep the selected tab
  in view. Exports `Tabs`, `tabsVariants`, `TabsProps`, `TabItem`,
  `TabsVariant`.
- **Alert** — a tinted line that stays in the page: `info`, `success`,
  `warning` and `danger`, a message with an optional `title`, at most one
  `action`, and a close when `onClose` is given (the caller removes it).
  Not a live region unless `announce`. It measures its own container, so in
  a narrow column the action drops under the message. Exports `Alert`,
  `alertTones`, `ALERT_NARROW`, `AlertProps`, `AlertTone`, `AlertAction`.
- **`border/info-subtle`, `border/success-subtle`, `border/warning-subtle`,
  `border/danger-subtle`** (`--ap-color-border-*-subtle`) — the soft edge of
  a tinted status surface.
- **Card** — a filled surface a step under `surface/raised`, with no border,
  and five parts: `CardMedia` (a picture set into it, 16 / 9 unless told),
  `CardBody`, `CardTitle`, which with `href` makes the whole card its link
  while the link's name stays the title, and `CardActions`, which keeps
  controls pressable inside a linked card. Only a linked card answers the
  pointer: the theme's wash, and the picture rises a level. Exports `Card`,
  `CardMedia`, `CardBody`, `CardTitle`, `CardActions`, `cardElements`,
  `cardTitleElements` and their prop types.
- **Link** — the accent in Medium, with a line only under the pointer and
  the keyboard's focus: `inline` (the default, the size of its sentence) or
  `standalone` (24 tall, with `iconEnd`). `external` opens a new tab with
  `noreferrer` and says so to a screen reader; `render` hands the props to a
  router's link. Exports `Link`, `linkVariants`, `LinkProps`, `LinkVariant`,
  `LinkRender`, `LinkRenderProps`.
- `CardTitle` takes `render` and `Pagination` takes `renderLink`, the same
  hand-over to a router's link.
- **Button** takes `href` and is then an `a` with the same look, and
  `render` for a router's link. Disabled or loading, the link has no `href`
  and is `aria-disabled`. Exports `ButtonAsButtonProps`, `ButtonAsLinkProps`.
- **Select** — one value from a list, in Input's box: options with an
  Avatar or an icon before them, a second line, or content in place of the
  label; groups; a check in the accent on the choice; the whole keyboard of a
  select, with letters; a hidden input for forms, and a Field's label,
  description and error. Exports `Select`, `SelectProps`, `SelectOption`,
  `SelectGroup`, `SelectEntry`.
- **Popover** — a panel anchored to the button that opens it, not modal: a
  `title` (or `aria-label`), `headerActions`, a body and `actions` at the
  end, any of which may be a function handed `close`; four placements that
  take the roomier side, `width`, `open` and `onOpenChange`, `initialFocus`.
  The platform's `popover`, so Esc, a press outside and the focus going back
  are the browser's. Exports `Popover`, `popoverPlacements`, `PopoverProps`,
  `PopoverPlacement`, `PopoverTriggerProps`, `PopoverApi`.
- **Pagination** — a named `nav` of pages in seven places that never move
  the arrows, with `aria-current`, arrows that are `aria-disabled` at the
  ends, `hrefFor` for links, and the page arrived at announced. With `total`
  and `pageSize` it adds a summary, "Showing 10 per page · 1–10 of 72",
  whose page size is an editable combobox inside the sentence when
  `onPageSizeChange` is given: typed or picked, and the reader's place is
  kept. `summary` and every label are props, for other languages. Exports
  `Pagination`, `pageItems`, `PAGE_SIZE_OPTIONS`, `PaginationProps`,
  `PaginationSummaryParts`, `PageItem`.
- **Toast** — `toast(message, options)` and one `<Toaster />`: a line on the
  inverse surface in a corner, with a tone read from its icon (`neutral`,
  `success`, `danger`, `warning`, `info`), at most one action and a close.
  5s, 10s with an action, an error stays (WCAG 2.2.1); the clock stops under
  the pointer, with focus inside and in a background tab. A named live
  region in the top layer, F6 to reach the newest and Esc to dismiss it;
  six placements; `closeLabel`; an `id` updates a toast in place. Exports `Toaster`,
  `toast`, `toastTones`, `toasterPlacements`, `ToasterProps`,
  `ToasterPlacement`, `ToastOptions`, `ToastAction`, `ToastTone`.
- **Tooltip** — the overlay card (`md`) and a compact size (`sm`), opened by
  hover after 400ms and by keyboard focus at once, hoverable, dismissed by
  Esc without moving focus, persistent (WCAG 1.4.13). Describes its trigger
  or, with `purpose="label"`, names it; an optional `description` and
  `shortcut`; four placements that flip. Exports `Tooltip`, `tooltipSizes`,
  `tooltipPlacements`, `TooltipProps`, `TooltipSize`, `TooltipPlacement`.
- **`elevation/sm`** (`--ap-elevation-sm`) — one short layer, for a part that
  lifts inside its own control.

### Changed, unreleased since 0.2.0

- **Breaking: `Select` is no longer the native `<select>`.** It is a button
  that opens the system's own list, the same in every browser, and takes
  `options` (an array) and `onChange(value)` in place of `<option>` children
  and a change event. The native one is unchanged and is now `NativeSelect`
  (`NativeSelectProps`): to keep today's behaviour, rename the import.

- DropdownMenu, DatePicker and the Pagination's page size stand on one
  floating surface, `floating.module.css`, where each had its own copy. Their
  gap from the trigger is now kept on either side, whichever way they open.

- Button gives way by 4% when pressed (colour alone under reduced motion).
- Dialog's title wraps; the header gap is 24.
- Table's end-aligned cells use tabular figures.

## 0.2.0 — 2026-09-12

### Breaking

- `interactive/neutral-hover` and `interactive/neutral-pressed` are gone.
  Hover and pressed are a wash, `interactive/wash-hover` and
  `interactive/wash-pressed`, laid over whatever is beneath.

### Added

- The surface step `925` in `stone` and `night`; the dark ladder is
  `950 / 925 / 900`.
- `border/subtle` is an alpha and reads on all four surfaces.

## 0.1.0 — 2026-09-11

First release: Avatar, Badge, Button, Calendar, Checkbox, DatePicker, Dialog,
DropdownMenu, Field, Input, Loader, Radio, Select, Switch, Table, Textarea;
the token layers, the Tailwind theme and the contrast instrument.
