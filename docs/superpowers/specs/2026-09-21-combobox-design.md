# Combobox — design

2026-09-21. Third piece of the roadmap's second wave.

## What is drawn

Proposed first as not drawn — a search of the published components finds
nothing named "combobox" — and then Fernando gave the page: **"Multiple
Select With Search", marked work in progress**, on the Figma file's Combobox
page. A field 556 wide whose choices are tags, 32 tall: an Avatar of 28, the
name in `caption/md`, a close in a 20 holder. The tags wrap and the field
grows with them, 88 for two rows. A close at the end of the first row clears
them all. The list is the menu's rows, 40 tall at radius md, with a checkbox
before every option — filled with `surface/inverse` and a white check — and a
first row, "All", whose box is a dash while some are chosen. The row under
the pointer is `surface/base`.

## Decisions

One `Combobox` with two forms. **The single one is not drawn** and is the
Select with a field to type in: the New Appointment panel's Patient is it.
**`multiple` is the drawn one.**

Set down without asking, since the drawing answered most of it, to be
corrected on sight:

- **What was typed is shown in the label by weight** (Bold in a list that is
  Medium). The filter finds it anywhere in a label, so the eye asks why
  "Sandra" is there for "and". Weight and not colour: the accent is the
  check's.
- **Clear is drawn, so it is in**: `clearable`, on unless told where many can
  be chosen, off for one.
- **The checkbox is the package's Checkbox, the accent, not the drawn
  inverse fill**: one checkbox is enough for a system. It is drawn again as a
  picture and is not the component — an input inside an option is a control
  inside a control, which axe refuses.
- **The tag is private to the Combobox.** The roadmap has a Tag in this wave
  and it is not drawn; when it is, this becomes that. 24 tall and not the
  drawn 32, so one row of tags leaves the md box at 40 with the 24 Avatar the
  scale has.
- The row under the pointer is the wash, as everywhere.

## Shared with the Select

`src/components/listbox/`: `options.ts` (moved from the Select; `fold`,
`contains` and `filterEntries` added) and `OptionList`, the rows, groups,
the check or the checkbox, the matched part, and the line shown in place of
the options. The Select was moved onto it first, with its tests unchanged
but for where the classes live. Not exported.

## Behaviour

An `input` with `role="combobox"` and `aria-autocomplete="list"` that owns a
`listbox`; the focus never leaves it. The list is `popover="manual"`: it is
typed into, and an `auto` popover would close on every press in the field
that is not its invoker. It closes when the focus leaves the box and its
list.

**The value is always from the list.** What is typed is a way to an option;
left with something typed that chose nothing, the choice is put back; left
empty, a single choice is taken away (the review). Typing opens the list,
narrows it, and makes the first option that can be chosen active, so Enter
takes the best match. From the site's search (invariant 22): it suggests and
never completes; the Enter that commits an IME composition is the
composition's; Home and End are the caret's until an option is active; Esc
closes the list, a second puts back what was typed over, and neither goes on
to a Dialog around it.

Many: a press toggles, the list stays open, what was typed is cleared;
Backspace in an empty field takes the last tag away; a tag's button is out of
the tab order, because six tags would be six stops before the field and the
keyboard has Backspace and the list; `selectAllLabel` adds the row for all,
mixed, checked or not, hidden while something is typed since "all" would not
mean the ones in view; a change says how many are chosen; one hidden input
for each value.

`filter` is a function, the default, or `null` for a caller that fetches,
with `onInputChange`, `loading` and `emptyText`.

## Found by the browser and the review

- The clear button and the chevron wrapped to the last row of tags with the
  field; they are taken out of the flow and pinned to the first row's end.
- A page's `:focus-visible { outline }` weighs the same as one class, and
  where it loaded later the field had a second ring inside the box.
- An input in an option is `nested-interactive` to axe: the box is a picture.
- The active option was an index, and the rows change under it when a fetch
  comes back: it is kept by value.
- `fold` lowercased the whole string first, and 'İ' lowercases to two code
  points: it folds character by character.
- A form's reset, as on the Select.

## Not here

Free text with suggestions (an Input); creating an option that is not in the
list; a virtualised list; the site's search, which is a palette with
sections, recents and a router, and stays its own.
