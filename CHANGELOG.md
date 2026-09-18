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
- **`elevation/sm`** (`--ap-elevation-sm`) — one short layer, for a part that
  lifts inside its own control.

### Changed, unreleased since 0.2.0

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
