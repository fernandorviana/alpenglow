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
- **Breadcrumb** — a `nav` with an ordered list: the section as a capsule
  with its `icon`, slashes, and the page in words with `aria-current`, never a
  link. Every link is a capsule under the pointer; only the first has an
  icon. `items` of `label` and `href`, `renderLink` for a router, `maxItems`
  to fold the middle into a button that unfolds it in place, a long name cut
  with an ellipsis. Exports `Breadcrumb`, `BreadcrumbProps`,
  `BreadcrumbItem`.
- **Skeleton** — the shape of what is on its way: `text` (the height of the
  line it stands in, `lines`, the last one shorter), `circle` and `rect`, with
  `width`, `height` and `size`. `aria-hidden` spans, so one can stand inside
  the heading or paragraph it replaces; the region that is loading says
  `aria-busy`. A sweep for each shape, 1.8s; reduced motion drops the travel
  and keeps a slow breath. Filled with the pressed wash, so one shape is right
  on the page, on a card and in a panel, in both modes. Exports `Skeleton`,
  `skeletonVariants`, `SkeletonProps`, `SkeletonVariant`.
- **Accordion** — sections that open and close on the native `details`, so
  the browser's find-in-page opens the section that holds the match: a row of
  64 with the chevron at the start, a `title` that is a heading
  (`headingLevel`), a `count` or a `meta` Badge after it, and an `action` at
  the row's end, outside the summary and always shown. Several open at once,
  or `exclusive` for one. `open`, `defaultOpen`, `onOpenChange`. Exports
  `Accordion`, `AccordionItem`, `accordionHeadingLevels`, `AccordionProps`,
  `AccordionItemProps`, `AccordionHeadingLevel`.
- **Drawer** — a panel at the side of the page, not modal: `overlay` grows
  over the content in the top layer, `inline` is a sibling the content makes
  room for. 480 or 768 wide, the Popover's header, body and footer at the
  height of the page; `expanded` with `onExpandedChange` covers the page;
  `resizable` adds a separator on the inner edge that is dragged or moved with
  the arrows, Home and End, with `width`, `defaultWidth`, `onWidthChange`,
  `minWidth` and `maxWidth`. It never closes itself: Esc from inside and the
  close button call `onClose`, so a page can ask before a form is lost.
  Exports `Drawer`, `drawerModes`, `drawerSides`, `drawerSizes`,
  `DRAWER_WIDTH`, `DrawerProps`, `DrawerMode`, `DrawerSide`, `DrawerSize`.
- **Tag** — a capsule for something the reader added and can take away: the
  words, `start` for an Avatar or an icon, `md` (32) or `sm` (24), and
  `onRemove` for a button named after the words. Neutral only. A field that
  holds tags hands them `--tag-fill` and, through `removeProps`, takes the
  button out of the tab order. Exports `Tag`, `tagSizes`, `TagProps`,
  `TagSize`.
- **Combobox** — a field that is typed in to narrow a list, the value always
  from the list: the Select's `options`, the part that matched shown by
  weight, the best match taken by Enter, `filter` (or `null` with
  `onInputChange` and `loading` for a caller that fetches), `emptyText`,
  `clearable`. With `multiple`, the drawn one: tags in a field that grows, a
  checkbox before every option, `selectAllLabel` for a first row that is
  mixed, Backspace for the last tag, a count said on change, one hidden input
  for each value. Exports `Combobox`, `ComboboxProps`, `ComboboxSingleProps`,
  `ComboboxMultipleProps`.
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
