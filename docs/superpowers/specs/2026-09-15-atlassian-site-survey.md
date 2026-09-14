# What the Atlassian Design System site does, and what of it is ours to take

Read on 2026-09-15 in the Browser pane, light and dark, 800 and 375 wide:
the home, the Components index, Button on all four of its tabs, the Tokens
section (overview, explained, all tokens), Colour palette, Elevation, Spacing,
Accessibility, Get started, Tools, Release phases, the search dialog and the
404. Fernando asked for the survey after liking the site's complexity. This
is a record of what it does and, against what Alpenglow's site already has,
what is worth taking, what is worth taking later, and what is refused with a
reason — so it is not proposed again.

Nothing here is built. The order inside each list is by what it is worth to
a portfolio piece read through its documentation site.

---

## The shape of their site

- **Chrome.** A top bar (brand, two products — Design system / News —
  Search, Theme). A left tree with collapsible sections, and *captions*
  inside a section ("Forms and input", "Images and icons", "Labels",
  "Layout and structure", "Loading", "Messaging", "Navigation", …). A
  component can hold sub-pages (Button → Icon button, Link button, Split
  button, Button group, Button (legacy)). Status lozenges sit in the tree:
  *Caution*, *Beta*, *Early access*. A right column, "Contents", lists the
  page's h2s and h3s with the current one marked. A four-column footer.
- **A component page is four tabs, each its own URL**, under one shared
  header (title, one line, an optional notice): *Examples* (specimens with
  code), *Code* (an Install / npm / Source / Bundle block, then Props),
  *Usage* (Parts, Do/Don't, Accessibility, Best practices, Content
  guidelines, Related), *Changelog* (every version, its commit linked).
- **A specimen block** is the live component on a checkerboard; a toolbar
  with a *Styles* popover (Colour mode: Light / Dark / Match browser, feature
  flags, "Apply to all components"), *Copy code*, *Edit in code sandbox*; then
  the specimen's own source, coloured, folded under SHOW MORE when long.
- **Props** are a definition list per prop — name, a *Required* lozenge,
  description, type — generated from the TypeScript. The cost shows:
  `iconBefore` is typed `ComponentClass<Omit<IconProps, "size"> | Omit<…>>`
  on the page, and `data-testid` is "No description. Type: never".
- **Usage** opens with *Parts*: a numbered diagram and a numbered list.
  Then Do/Don't pairs — two cards, a picture over a green- or red-tinted
  caption with a tick or a cross and one sentence — for each rule ("Use one
  primary call to action", "Avoid disabling buttons", "Use sentence case").
  *Related* closes the page.
- **Tokens.** An *All tokens* page with a search field, filters by
  foundation, a syntax switch (JavaScript / CSS …), an exact-match
  checkbox, and a *token picker* wizard. Every token carries a description,
  "Introduced v1.6.0", and light and dark swatches labelled with the
  primitive's name. The token page itself has Code / Examples / Changelog
  tabs.
- **Colour palette** is swatch columns per family with Hex / RGB toggles,
  and a rule for dark mode: the ramp mirrors — 700 in light is 400 in dark,
  100 becomes 1000.
- **Elevation** names sunken / default / raised / overlay and one more,
  *overflow*, the shadow that says content has scrolled out of view; then
  interaction states (hovered and pressed, dragged, scrolled). "Only use
  sunken on the default surface."
- **Spacing** is a table — token, base-unit multiplier, rem, px, a bar —
  then three ranges with examples of what each is for.
- **Search** groups results under a section chip, shows a body snippet with
  the matched words in bold, carries the *Caution* lozenge into the result,
  and has a keyboard legend in its foot: ↑↓ Navigate, ↵ Select, Esc Close.
- **Release phases** is a page: Early Access / Beta / General Availability,
  and Intent to Deprecate (Caution) / Deprecated, each one paragraph.
- **Tools** lists an App provider, an ESLint plugin, a Stylelint plugin, a
  Storybook addon, a UI styling standard, the Figma libraries — and, first,
  *AI tooling: set up skills*. Their blog leads with a DESIGN.md post.
- **Every page** ends with "Was this page helpful? Yes / No".
- **The 404** is an illustration and one line: visit home, try searching,
  or contact us.
- **Section overview pages** (Components, Tokens, Elevation) have a spot
  illustration beside the title, and the component cards carry a
  monochrome thumbnail of the component.

---

## Worth taking

1. **A light/dark switch on the specimen, not on the site.** Their *Styles*
   popover shows a dark button on a light page. For a system whose claim is
   that every pair is measured in both modes, the stronger form is the two
   side by side: one "Try it" rendered twice, each under its own mode, so
   the reader sees the dark accent lighten while its label darkens
   (invariant 2) without leaving the page. What it costs: the generated
   `tokens.css` sets the dark values on `:root[data-theme='dark']` and
   under the media query; a scoped specimen needs the same block under a
   scoped selector too (`[data-theme='dark']` without `:root`, or a class
   the build emits). That is a change to `scripts/build-css` and to
   `generated.test.ts`, and the theme toggle's guard test (invariant 9)
   reads the same file — measure before deciding. The most valuable item
   on this list.
2. **A page for the skill.** `skills/applying-alpenglow-tokens/SKILL.md` is
   in the repository and nowhere on the site. Atlassian puts "AI tooling —
   set up skills" first under Tools, and their current blog post is about
   portable design context. The skill test (private memory: eleven of twelve
   predicted failures did not happen; the one real gap was Figma `scopes`)
   is itself a finding worth a section. One page under Developers, or a
   section on Install.
3. **A "Source" link on every component page**, to the component's folder
   on GitHub. Their Code tab has Install / npm / Source / Bundle per
   component; ours is one package, so only Source applies. The footer
   already derives the repository URL from `package.json`
   (`app/ui/Footer.tsx`), so a page can build the link the same way and
   `Footer.test.tsx`'s rule — no link outlives its target — extends to it.
   Reviewers of a portfolio read the code; this is the shortest path to it.
4. **Two things in the search dialog.** A keyboard legend in the foot
   (↑↓, ↵, Esc — and ⌘K / Ctrl K, which answers the open item "the
   shortcut is a tooltip" from MEMORY.md), and a body snippet around the hit
   with the match marked: the index already holds each entry's body
   (`extract.tsx`), and the palette marks the typed prefix in titles only.
5. **A 404 in the site's chrome.** There is no `app/not-found.tsx`; a static
   export writes `404.html` and Vercel serves it. Theirs is one line and the
   search. Ours can be the same, with the rail, the theme and the search
   item, so a dead link from an old URL still lands in the site.
6. **The token row carries every name the reader may write.** Their syntax
   switch shows a token as JavaScript or CSS. Ours has two consumptions —
   `--ap-color-surface-raised` and Tailwind's `bg-surface-raised` — and the
   Colour page shows the token's key only. Both names on the row, or a
   switch above the table; `tokenId` rows are already the search's landing
   place.
7. **"Since 0.x" on a token, and a changelog.** They stamp "Introduced
   v1.6.0" on every token. Two token names have already gone (`0.2.0`,
   invariant 21) and three package changes are unreleased (MEMORY.md, item
   -1); there is no `CHANGELOG.md`. A repository changelog first; then a
   "since" on the token rows and a *Changes* section on a component page,
   which can be built at build time from `git log` on the component's
   folder the way the search index is built — generated, git-ignored,
   stubbed under vitest.
8. **Do/Don't pairs — only where a decision exists.** Their pairs are the
   documentation pattern readers know; the pictures are the value, not the
   captions. The candidates are already written up as decisions: the
   loading button that must not look disabled (invariant 5), a wash rather
   than a fill for hover (invariant 21), tone by meaning rather than by
   colour (the Badge and Button "Choosing" sections). Not as a general
   device for pedagogy, which the skill test showed is the low-value part.

## Worth taking later, when there is something to attach it to

- **Status lozenges in the drawer and a release-phases vocabulary.** Every
  Alpenglow component is `0.x`, so today one sentence on Install says what
  their page says. The moment one component is *Beta* against the rest, or
  one is deprecated, the site's own `Badge` in the drawer row is the
  lozenge, and the search result carries it as theirs does.
- **Captions inside the Components drawer** ("Forms", "Overlays", "Data").
  Ten components fit in one list; past about twelve they do not. Ours
  groups differently on purpose (Avatar with Loader, the three choices
  together — Conventions), so the captions would follow what the reader is
  deciding, not what the thing looks like.
- **Thumbnails on the component cards.** Fernando said on 2026-09-15 that
  the cards will get assets of their own; their monochrome component
  thumbnails on a plain card are the shape to measure against.
- **An `overflow` shadow.** The one elevation they name that we do not:
  the shadow at the edge of a scrolled region. The Table scrolls
  horizontally inside a container; whether its edge needs a shadow is a
  question for the Table, not a token to add first.
- **"Was this page helpful?"** needs somewhere to send the answer. The
  site has Vercel Analytics; a custom event could carry it, and the same
  event is the ground for the search's undecided "popularity" (MEMORY.md,
  item -2). Not decided; one question, not two.

## Refused, with the reason

- **Four tabs per component.** They split Examples / Code / Usage /
  Changelog because two audiences read two halves. Ours is one page by
  decision (2026-09-13: Try it, Choosing, anatomy, states, accessibility,
  props), and with ten components one page shows the working end to end.
  A tab hides the ratio from the reader who came for the prop.
- **Auto-generated props.** Their page prints `Omit<IconProps, "size">`
  and "No description. Type: never". Ours are written by hand into the
  site's own Table with a Default column, and stay that way.
- **The checkerboard under a specimen.** It shows the component as if on
  no surface. Here the surface is the point: every specimen sits on a
  named surface and the ratio is measured against it.
- **The mirrored dark ramp** (700 ↔ 400). Invariant 1 and the deep tail
  refuse mechanical inversion; the Colour page's per-stop "Carries /
  Tightest" columns are the better instrument and already exist.
- **A token picker wizard.** The search palette lands on a token row; the
  `use` note on each token and the "Choosing a colour" section do the
  wizard's job in prose.
- **A News product, blog and careers.** It is a company's design site
  beside its system; Alpenglow has one author and one product.
- **Sub-pages under a component** (Icon button, Split button …). Ours
  fold variants into the page and group by decision, not by look.
