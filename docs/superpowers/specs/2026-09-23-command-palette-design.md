# CommandPalette — design

2026-09-23. The last piece of the roadmap's third wave: "the site's ⌘K,
once both parts are in the package" (Dialog + Combobox). Not drawn in
Figma; the drawing is the site's own search palette, `app/ui/search/
Search.tsx`, in the rail since 2026-09-14 (ddb82a7): the Dialog with an
Input in `role="combobox"` over a `listbox` of grouped rows, ⌘K and Ctrl+K
from anywhere, the field keeping focus while the arrows move an active row,
Enter following it, what was typed marked in the rows. "Crest feeds
Terrain": the pattern is graduated into the package and the site is
rewritten on it, not beside it. Vimcal's ⌘K "command center" is the
behaviour reference Fernando named for the Scheduler and it holds here:
commands with their shortcut at the end of the row.

## Decisions

1. **A Dialog with a field and a list of commands.** `CommandPalette` is
   controlled, `open` and `onClose`, and never closes itself, as the Dialog
   does not: on a choice it calls `onSelect(item)` and the caller sets
   `open` to false, so a command that opens something else in its place
   can. `label` names the dialog (its title, as the site's "Search"),
   `placeholder` the field. The dialog is held near the top of the
   viewport, 12vh, so the list grows downward without the box jumping as
   the results change; the platform would centre it. Modal, top layer,
   scrim, Esc and focus return are the Dialog's; the field is the Input,
   large, with an optional `icon`.

2. **Items are data.** `items` is a list of groups, `{ label, items }`, of
   `CommandItem { id, label, description?, detail?, icon?, shortcut?,
   keywords?, disabled?, mono? }`. `label` is the row's name and the accessible
   one; `description` sits at the end of the first line, the site's
   breadcrumb ("Foundations › Colour"); `detail` is a second line, the
   site's excerpt; `shortcut` is drawn as `kbd` at the end, Vimcal's and
   Raycast's gesture, and is a string the caller writes ("⌘;"), not a
   binding the palette installs; `keywords` are searched and not shown; a
   disabled item is skipped by the arrows and refused by Enter, as the
   listbox helpers already do. `mono` sets the label in the mono caption, a
   token or a path, as the Colour page sets its names.
   A group with no items after filtering is not drawn; its label is a
   `group` with `aria-label`, as the site's.

3. **Filter as the Combobox filters.** Left out, an item stays when its
   `label` or one of its `keywords` holds what was typed anywhere, accents
   and case folded, the `fold` of `listbox/options.ts`. `null` when the
   caller filters, which the site does, its index with typo tolerance and
   excerpts staying in the site and handing `items` already narrowed.
   `query` / `defaultQuery` / `onQueryChange` for a caller that searches
   elsewhere; `loading` with `loadingText`, `emptyText(query)`, both read in
   a `role="status"` line under the field, and `status` for a line the
   caller writes in their place, the site's "The index did not load." over
   the suggestions it still shows. What was typed is marked in
   Semibold where it occurs in the label and the detail, a `mark` with no
   background, the site's rule that the wash and the selected fill are the
   only fills a row takes; a caller's fuzzy hit is not marked, and that is
   recorded.

4. **The keyboard is the site's.** A new query starts with no row active,
   derived in the render that sees it change. Down and Up move and wrap,
   over the disabled; Home and End are the caret's until a row is active,
   then the list's; Enter follows the active row or, with none, the first;
   the Enter of an IME composition is the composition's. Hover makes a row
   active; a press on a row `preventDefault`s the mousedown so the field
   keeps focus. Escape closes through the Dialog's `cancel` and stops at the
   palette, so a document listener elsewhere, the site's narrow-screen
   menu, does not also act. The active row is scrolled into view as the
   arrows move it.

5. **The shortcut is a hook.** `useCommandPaletteShortcut(onOpen, key =
   'k')` listens on the document for Meta or Ctrl with the key and no Alt,
   both modifiers on every platform (a Mac with a PC keyboard should not be
   stranded), `preventDefault`s, and returns the hint for the button that
   opens the palette: "⌘K" on a Mac, "Ctrl K" elsewhere, `undefined` before
   hydration since it reads the platform. `aria-keyshortcuts` is the
   caller's to write on that button ("Meta+K Control+K"). Recent items are
   the caller's: the package writes nothing to storage; the site keeps its
   `recent.ts` and hands a "Recent" group.

6. **Rows of its own, keyboard shared.** The `OptionList` draws a check or a
   checkbox for what is chosen and a command is not chosen, so the palette
   draws its rows in its own stylesheet, the DropdownMenu's row at radius
   lg with the wash on hover and `interactive/selected` when the arrows
   reach it, and shares `step`, `first`, `last` and `fold` with the Select
   and the Combobox. The alternative, an `OptionList` with a renderer per
   row, was not taken: three components with three row shapes on one
   renderer prop is a renderer prop that grows.

## Deliverables

- `src/components/CommandPalette/`: `CommandPalette.tsx`, `useShortcut.ts`,
  `CommandPalette.module.css`, `index.ts`; tests ported from the site's
  `Search.test.tsx` plus the filter, the disabled item, the hint, axe;
  exports in `src/index.ts`.
- The site's `Search.tsx` rewritten on the component, its index and
  `recent.ts` kept, its tests kept green; the `.search*` rules the site no
  longer needs removed from `docs.css`.
- `/command-palette` under Components with a Try it whose commands act on
  the site (go to a page, switch the theme), the props table, the measures,
  the keyboard, what is not built; nav entry ("Thirty-three components"),
  section card, changelog, README count, MEMORY.md, this spec, the plan.

## Not in this spec

Nested pages inside the palette (a command that opens a sub-list). A
non-modal inline palette. Fuzzy scoring in the package. A registry of
commands or bindings: the palette shows a shortcut, it does not install one.
