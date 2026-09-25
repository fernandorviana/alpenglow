# Select — design

2026-09-21. The second piece of the roadmap's second wave, on the floating
surface the Popover brought.

## A decision revised, not erased

Until today `Select` was the native `<select>`, by a rule the system still
holds (Conventions, "Prefer the native element") and the roadmap repeated
("Select stays native"). The reasons were good and are unchanged: keyboard,
forms, screen readers and the phone's picker without a line of code.

It is set aside for this component, by Fernando, for what the drawing asks:
the drawn Staff field holds an Avatar, the drawn Service option has its code
in bold, and a native list shows neither; and the list is the operating
system's, a different list in every browser. Offered `appearance:
base-select` — the platform's own answer, in Chrome and Edge 135 and Safari
27, behind a flag in Firefox, the OS list elsewhere — he asked why everyone's
select is custom, and whether a button with a list is a select at all. It
is, when the choice stays shown: what tells it from a menu is what it does.
The cost he would not take is a portfolio whose select is the OS list for
whoever opens it in Firefox or an older Safari.

So **`Select` is the system's own list, the same in every browser, and the
native one stays as `NativeSelect`**, unchanged, for a long form on a phone
and for a very long list. It is a breaking change, made before 0.3.0 on
purpose. When `base-select` is everywhere this is the decision to look at
again; the two components' props were kept apart so that it can be.

## What is drawn

The closed field, which is the control box the package already has: drawn
48 tall at md and 40 at sm — the package's `lg` and `md` — radius 12, a
placeholder in grey, the chevron in the accent, an Avatar before the value on
Staff. This said "40 tall" (corrected 2026-09-24, fidelity audit); the
package's default is 40 (`md`, or `density/control` comfortable since
2026-09-23), a departure for Fernando to rule on.
**The open list is not drawn anywhere.** It is the DropdownMenu's rows — 40
tall, radius md, 8 inline — on `floating.module.css`, so every list in the
system is one list.

Shown a check at the end with the label in Semibold, against a row filled
with `interactive/selected`, Fernando chose the check, **and only the check,
in the accent**: no Semibold. The wash is the active option's, the one under
the pointer or the arrows, so "chosen" and "active" are never the same mark.
The check is a shape, so the choice does not rest on colour. There is no
`:hover` rule: the pointer makes an option active, so two rows cannot be lit
at once.

## API

`options` is an array, as the menu's `items` and the Tabs' are: an option is
`{ value, label, start?, description?, content?, disabled? }`, a group is
`{ label, options }`. `label` is always words — what typing finds and a
screen reader says — and `content` is shown in its place, in the list and in
the field. `value`, `defaultValue`, `onChange(value)`, `placeholder`, `size`,
`invalid`, `disabled`, `required`, `name`, `iconStart`, `id`, the three aria
props, `className`. Inside a `Field` it takes its id, description, error and
required as `NativeSelect` does.

Not here: more than one choice, and a list that filters as you type. The
second is wave 2's Combobox, which wants this base.

## Behaviour

The APG's select-only combobox: a `button` with `role="combobox"` and
`aria-haspopup="listbox"` that controls a `listbox`. **The focus never leaves
the button**; the active option is named to it by `aria-activedescendant`, so
there is one tab stop and nothing to give the focus back to, and a press in
the list is kept from taking it. Down, Up, Enter and Space open at the chosen
option; the arrows move past what is disabled and stop at the ends; Home and
End; a letter goes to the next label that starts with it, open or closed;
Enter and Space choose; Tab chooses and moves on; Esc closes with nothing
chosen and goes no further, so a Dialog around it stays.

The list is `popover="auto"`: light dismiss is the platform's. The button
carries `popovertarget`, once hydrated, because a press on the invoker is the
one press outside that must not close and reopen it. `name` submits through a
hidden input; a hidden input cannot stop a form, so `required` is said and
not enforced.

## Found by the browser and the review

- An Avatar of 24 in a line of 22 made the md field 42; it is given back 2.
- The list followed the active option into view, and the pointer makes
  options active, so a half-visible option under the pointer ran the list to
  its end. It follows the keyboard only.
- `showPopover()` and `hidePopover()` throw on a popover already in that
  state, and `open` is a task behind the platform: `togglePopover(force)`,
  as the Popover's review found.
- Capped to the room beside the field, the list never overflowed and so
  never flipped: eight rows is the only cap.
- A form's reset did not reach the hidden input, which is React's: an
  uncontrolled Select listens for it.
- Recorded, not solved: a press on the Field's label while the list is open
  is a press outside and then a click on the button, so it closes and
  reopens.

## Tests

The helpers (flatten, step, first, last, match); structure and roles; the
placeholder, the choice and its `start`; `content`; groups and disabled;
the check on the chosen option alone; the hidden input; no `popovertarget`
in server HTML; disabled; in a Field; the pointer; every key above; form
reset; the list follows the keyboard and not the pointer; two keys in one
task; controlled; the stylesheet's holds; axe closed and open. Contrast: an
option and the check on `surface/overlay`, the placeholder and the chevron on
the field's fill.
