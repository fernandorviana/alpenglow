# EmptyState — design

2026-09-22. Ninth piece of the roadmap's second wave.

## What is drawn

Nothing by that name. Fernando gave the product's page of a location just
created, where empty is quiet and in place: **"+ Add description", "+ Add
address", "+ Add services"** standing exactly where the content will be; `--`
for a count that is not there; a grey placeholder with diagonal shapes for the
picture; and **"Can't load map"**, a white label with an icon centred on a
grey area. No large icon, no centred block.

He had asked first what an empty state is and whether it does not depend on
the component. It does in what it says and not in its shape: it is a piece put
inside a container that has nothing, and says what this is, why it is empty and
what to do next. The drawing covers a record; it does not cover a list with
nothing in it or a search that found nothing, where "+ Add" alone does not say
enough.

## Decisions (Fernando, 2026-09-22)

Shown the drawn two and two proposed, then six treatments of the large one:

- **A**, an icon in a circle, centred, with a primary action; and **C**,
  `media` in the icon's place for a product's own illustration. Both.
- **E**, a dashed frame, as `variant="dashed"`: it is already his language,
  the dashed "+" tiles of Attachments and Documents. For first use only — on a
  search with no results a frame that invites creating says the wrong thing.
- **G**, two actions at most, one of them primary.
- **H**, no results: a rule of content and an example, not a look — the title
  repeats what was searched, the action undoes and is not primary.
- Left out: concentric halos (decoration, heavy in a dense product) and ghost
  rows behind the message (they are the Skeleton, which means loading).

The drawn "+ Add" in place is the ghost Button with an icon, which the system
has: the page documents it as the pattern for a record's empty field and it is
not a component. "Can't load map" is the small size on a surface of its own
over a placeholder, composed on the page.

## Shape

`size="lg"`, centred: media or the icon in a circle of 48, a title that is a
heading, a description held to 40ch, the actions in reading order with the
primary last. `size="sm"`, at the start: the icon at 20 beside the title, the
description, the actions. The circle's fill is the pressed wash, not a surface,
for the Skeleton's reason: one block is right on the page, on a card and in a
panel, in both modes.

`title`, `description`, `icon`, `media`, `action`, `secondaryAction`, `size`
(`'lg'`), `variant` (`'plain'` | `'dashed'`), `headingLevel` (3), `className`.

It says nothing of its own to a screen reader beyond its words: when results
change under a filter, the count is the caller's live region to say.

## Tests

The heading and its level; description, icon hidden, media in the icon's place
and not both; actions in order, none without; size and variant classes;
stylesheet: centred and held to 40ch, the wash, the dashed border, box-sizing;
axe. Contrast: the icon on the wash, the description.
