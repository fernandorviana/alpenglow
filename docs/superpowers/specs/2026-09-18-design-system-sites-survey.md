# Eighteen design-system sites, read for what sets each apart, and what Alpenglow can take from them

Read on 2026-09-18 in the Browser pane, after the Atlassian survey of
2026-09-15 (`2026-09-15-atlassian-site-survey.md`, which this one extends
and does not repeat). For each site: the home, the Button page, and the
colour or token page, plus a probe of the page's technology (framework,
custom elements, the count of custom properties declared on `:root`, the
body typeface). Fernando asked for the differentiators, the strengths and
the gaps of each, across technology, code, design, layout and tokens, so
that Alpenglow can find where it stands out — and for every conclusion to
be listed as a candidate improvement.

The 2026-09-12 elevation survey measured eleven of these systems' *token
values*; this one reads their *sites*. Nothing here is built. Where a
figure is quoted it was read from the page that day, not derived.

Systems, in the order read: Material 3, Carbon, Polaris (now inside
shopify.dev), Primer, Spectrum, Fluent 2, Lightning 2, shadcn/ui, Radix
Themes, GOV.UK, USWDS, Cloudscape, Geist, Chakra, Nord, Gestalt, Helios,
Ant Design. Atlassian is counted as the nineteenth through its own file.

---

## The technology, in one table

| System | Site built with | Body face | `:root` custom properties | Notes |
|---|---|---|---|---|
| Material 3 | Angular, Lit custom elements (`mio-*`) | Google Sans Text | 316 | cookie banner; hero image per page |
| Carbon | Gatsby 5.16 | IBM Plex Sans Var | 0 (Sass, no CSS vars on root) | site itself was just redesigned; "explore the preview site" |
| Polaris | shopify.dev (Shopify's docs platform) | Inter | 0 | polaris.shopify.com redirects; web components now |
| Primer | Next.js | system stack | 1088 | light/dark by `data-color-mode` |
| Spectrum | Next.js | Adobe Clean (serif headings) | 3 | copyright still 2024; hamburger-only nav |
| Fluent 2 | Astro | Segoe UI | 0 | dark by `data-theme` |
| Lightning 2 | zeroheight (hosted) | DM Sans | — | "Styleguide updated 2 days ago" |
| shadcn/ui | Next.js | Geist | 41 | the smallest token surface here |
| Radix Themes | Next.js | Untitled Sans | 1249 | 12-step scales, alpha twins |
| GOV.UK | Eleventy/Nunjucks (server-rendered) | GDS Transport | — | examples are iframes |
| USWDS | Jekyll 4.4 | Public Sans | 0 (Sass) | static previews of every state |
| Cloudscape | Next.js | Amazon Ember | 6 | 412 colour tokens, paginated 42 pages |
| Geist | Next.js (vercel.com) | Geist | 873 | P3 colours where supported |
| Chakra | Next.js | Wix Madefor Text | 0 (Panda, generated) | version selector in the bar |
| Nord | Eleventy + Nord web components | Nordhealth Sans | 347 | "rendered live with Nord web components — inspect away" |
| Gestalt | Next.js | Pinterest Sans | — | 1.0 docs are legacy; 2.0 behind a login |
| Helios | Ember | HashiCorp Sans | — | sidebar has a filter field |
| Ant Design | dumi | system stack | 0 (CSS-in-JS) | version selector; LLMs.md per page |

What the column of custom properties says: the two systems whose sites
expose the fewest variables (shadcn at 41, Cloudscape at 6) are the ones
that generate colour at build time or in JavaScript; the ones with the most
(Radix 1249, Primer 1088, Geist 873) publish the whole scale as CSS and
document it as CSS. Alpenglow is in the second camp with 54 theme tokens
plus primitives, and its `tokens.css` is the product. Nobody else measured
publishes a *contrast* per pair on the page; Cloudscape names a ratio in a
token's description ("at a contrast ratio of 3:1") and Spectrum says its
grays are *generated* to target ratios, but neither shows the number.

---

## Each system: what sets it apart, what it does well, what it lacks

### Material 3 (m3.material.io)

- **Apart.** The rail — search on top, five sections, a theme toggle at the
  foot — is the shape Alpenglow's nav already took (invariant 19). Each
  component has four tabs (Overview / Specs / Guidelines / Accessibility)
  and a *Resources* chip listing platforms. Specs carries a **tokens and
  specs table with a menu to switch token set** (common / colour / size)
  and a **states table per variant**. An "Availability & resources" table
  says per platform whether the thing exists (Web: Expressive —
  *Unavailable*). Every section heading has a "Copy link" control.
- **Strong.** Colour *roles* explained by vocabulary (surface, container,
  on-, variant) before any value; a Do/Don't pair that shows what breaks
  when contrast level is user-adjusted; "M3 Expressive update — May 2025"
  and "Differences from M2" dated on the page.
- **Lacks.** No live code; specimens are pictures and video; no contrast
  figures anywhere; a cookie banner over the rail; the 316 root variables
  are the site's, not documented.

### Carbon (carbondesignsystem.com)

- **Apart.** Four tabs (Usage / Style / Code / Accessibility). The Usage
  tab opens with a **live demo whose theme is a selector** (White / Gray 10
  / Gray 90 / Gray 100) and a variant selector, then an **accessibility
  testing status table** — default state *tested*, advanced states
  *tested*, screen reader *manually tested*, keyboard *tested*. The Colour
  Tokens page has the four themes as tabs over one table, and every row has
  a *Role* sentence ("Container color on $layer-01") and a value that can
  be an alpha ("Gray 50, 12%"). The footer prints the React package version
  and "Last updated 09 September 2026". "Edit this page on GitHub" on every
  page. Five framework libraries (React, Angular, Vue, Svelte, Web
  Components); a "Carbon MCP" announced 2026-02.
- **Strong.** The layer model (`$layer-01/02/03`, each "container color on"
  the one below) is the clearest published statement of the surface ladder
  Alpenglow's invariant 4 describes.
- **Lacks.** Storybook holds the real API; the Code tab is four links and
  the live demo says so. IBM's cookie banner covers the page content. The
  site was just redesigned and still asks visitors to "explore the preview
  site".

### Polaris, now Shopify dev docs (shopify.dev/docs/api/app-home/polaris-web-components)

- **Apart.** The design-system site is gone into the developer docs, and
  the components are **web components** with a props reference generated
  from types — `icon` lists "541 more" names inline. Every page has
  **Install AI Toolkit**, **Ask about this page** and **Copy MD**; the
  site has an "Ask assistant" in the bar. Props carry `Default:` and a
  `required` marker; enum values are explained one per line ("auto: the
  variant is determined by context").
- **Strong.** "Use cases" box beside the intro; the AI affordances are the
  most complete of any site read.
- **Lacks.** No design guidance left — no anatomy, no Do/Don't, no
  contrast; the old Polaris pages that had them redirect to this.

### Primer (primer.style)

- **Apart.** Three tabs (Overview / Guidelines / Accessibility). Under the
  title, **three implementation cards** — React *Ready* (Storybook | Source
  | Usage), Rails *Ready* (Docs | Lookbook | Source), Figma (View in
  Figma). Every example is a **live editable block** — Copy, Reset, Open in
  StackBlitz, an inline code editor, "Show full code" folded. A
  `KeybindingHint` inside a button. The loading state **replaces only the
  visual slot** (leading icon, trailing icon, or trailing action) and keeps
  the label — documented case by case.
- **Strong.** The Colour page is a table of CSS variable → output value
  with a sample, "in the site's active theme" — and it says so, and points
  to the Primitives Storybook for all themes. A "Give feedback" button in
  the bar.
- **Lacks.** The colour page shows one mode at a time; no contrast; no
  version or date on a component page.

### Spectrum (spectrum.adobe.com)

- **Apart.** **Version 7.0.1** printed at the top of the Button page. A
  fixed page order for every component: Anatomy, Options, Behaviors, Usage
  guidelines, Content standards, **Internationalization**, Keyboard
  interactions, Theming, **Changelog**, **Design checklist**. A "Table of
  options" that is platform-agnostic (property / values / default) so three
  implementations (CSS, React, Web Components) adapt it. Static colour
  buttons (black/white that ignore the theme) for use over imagery.
- **Strong.** The colour system page states the rule Alpenglow measures:
  grays are **generated from target contrast ratios with the background**,
  and each gray index has a job (200–300 decorative borders, 400 field
  borders, 600 control borders, 700–900 text, 500 disabled). Every page
  ends in a design checklist.
- **Lacks.** Serif headings and a hamburger-only nav; the copyright reads
  2024 and the site has not moved for Spectrum 2, which lives elsewhere;
  no live code on the guideline site.

### Fluent 2 (fluent2.microsoft.design)

- **Apart.** Astro. A **theme select on the specimen** (Web Dark / Web
  Light / Teams …) independent of the site's toggle; "Open in
  CodeSandbox". Components are split by platform first (Web / iOS /
  Android / Windows) and then by library (React / Web Components). A
  Resources block links the Storybook, the WAI pattern and the migration
  storybook. Content guidance is specific ("use *New* followed by the
  thing").
- **Strong.** The accessibility text states the numbers per part: label
  4.5:1, icon 3:1, no requirement for the stroke, none for disabled —
  the shape of a measured rule.
- **Lacks.** The Design tokens page is pictures with two paragraphs; no
  token table on the site at all; "Employee sign-in" in the bar.

### Lightning Design System 2 (lightningdesignsystem.com)

- **Apart.** Hosted on **zeroheight**. The bar prints "Summer '26 Version
  3.3.2 — Styleguide updated 2 days ago". The architecture is sold as
  **styling hooks** — CSS custom properties as the public API, with a
  Styling Hook Index and component-level hooks — and an "AI and SLDS 2"
  section with Figma-to-code.
- **Strong.** The freshness line; the explicit split of global vs
  component-level hooks.
- **Lacks.** zeroheight URLs (`/2e1ef8501/p/57fb2e-button`) are opaque and
  unshareable by hand; the home is marketing; dark mode is "paved the way
  to".

### shadcn/ui (ui.shadcn.com)

- **Apart.** Per component: **three primitive tabs** (Base UI / React Aria
  / Radix UI) over the same page; the preview then "View Code"; install as
  a CLI line with package-manager tabs; **Copy Page** (markdown for an
  LLM, with a menu); `llms.txt`; a **Skills** page ("give your AI assistant
  deep knowledge"; the skill runs `shadcn info --json` to read the
  project); an MCP server; a registry with a directory and "health"; Open
  in v0; **shadcn/create**, a visual theme builder that emits a preset.
  Theme tokens are `background`/`foreground` pairs in OKLCH under `:root`
  and `.dark`.
- **Strong.** The smallest, most legible token vocabulary (41 variables);
  the AI surface is the reference for the industry now.
- **Lacks.** No accessibility guidance per component; no anatomy; no
  states; no contrast; the home is a wall of demos.

### Radix Themes (radix-ui.com/themes)

- **Apart.** Under every title: **View source · Report an issue · View as
  Markdown · View in Playground**. The API table has an info tooltip per
  prop and "See full type" for enums. The colour page gives each of the
  **12 steps a job**: 1–2 backgrounds, 3–5 interactive, 6–8 borders, 9–10
  solid, 11–12 accessible text — plus functional tokens (`--accent-surface`,
  `-indicator`, `-track`, `-contrast`). Six tinted grays paired
  automatically to the accent. A ghost button's negative margin for optical
  alignment is explained.
- **Strong.** The step-vocabulary is the best short explanation of a
  scale's purpose read anywhere; the Playground shows every component in
  every accent and gray at once.
- **Lacks.** No guidelines (when to use), no Do/Don't, no accessibility
  tab beyond the Primitives' docs; 1249 root variables is a lot of
  surface for a consumer to read.

### GOV.UK Design System (design-system.service.gov.uk)

- **Apart.** Every example is a **sandboxed iframe** with "Open this
  example in a new tab" and HTML / Nunjucks tabs. Guidance is
  **research-backed and says so**: "Research on this component — testing
  on GOV.UK has shown that green start buttons improved click-through",
  "the Notify team discovered users were receiving invitations twice". A
  named label vocabulary ("Save and continue", "Accept and send"). A
  **component lifecycle** (Trial → Stable, dated 2026-08). "Help improve
  this component" links the GitHub discussion for that component. WCAG
  2.2 cited by criterion number.
- **Strong.** The `data-prevent-double-click` feature and the reason for
  it (motor impairments, slow connections). The writing.
- **Lacks.** No dark mode; no tokens page in the modern sense (Sass
  settings); the cookie banner takes the first screen; no live editing.

### USWDS (designsystem.digital.gov)

- **Apart.** A **"Passed WCAG 2.1 AA" badge** under every component title,
  and a **component preview that renders every state statically** —
  Default, Hover, Active, Focus, Disabled, aria-disabled — for every
  variant, so nothing has to be hovered to be seen. A separate "Button
  accessibility tests" page with the test plan. Colour **grades 0–100 with
  regularised lightness across families**, so a grade-50 in any family is
  the same lightness — the ground of their **"magic number"** rule: the
  difference in grade between two colours predicts the ratio, because each
  grade is held to a band of relative luminance (grade 50 is .175–.183,
  grade 90 is .005–.015). A difference of 40+ gives 3:1, 50+ gives 4.5:1,
  70+ gives 7:1, in any two families. Settings variables per component
  (`$theme-button-border-radius`).
- **Strong.** The state matrix and the grade rule are two of the three
  instruments read on any site that make contrast *predictable* rather
  than checked (Spectrum's generated grays are the third).
- **Lacks.** Jekyll and Sass; no dark mode; dense header (three bars);
  examples are not live.

### Cloudscape (cloudscape.design)

- **Apart.** Five tabs: **Playground / API / Style / Testing / Usage**.
  The Playground is a **configurator** — every prop as a control, slots,
  a preview, code with "Copy code" and an i18n note. The **Testing tab**
  documents test utilities per component (`wrapper.findButton()`,
  `findLoadingIndicator()`, `isDisabled()`) with unit and integration
  examples. A `disabledReason` prop. The token table has a **Themeable**
  column and Light / Dark columns, Sass / JS syntax tabs, and 412 colour
  tokens over 42 pages. Every page: "Published: date" and "Did this page
  help you?"
- **Strong.** Testing as a first-class tab is unique among the eighteen;
  the charts palette names a ratio per step in the token description.
- **Lacks.** Six root variables; tokens are built, not readable; the
  cookie banner; the visual weight of AWS chrome.

### Geist (vercel.com/geist)

- **Apart.** Minimal chrome: brand, search, no sidebar. The colour page:
  **"Right click to copy raw values"**, P3 where supported, ten scales, and
  the same step-jobs as Radix (1–3 component backgrounds, 4–6 borders,
  7–8 high-contrast backgrounds, 9–10 text) illustrated with live UI
  fragments. The Button page has an **"All types and sizes in
  comparison" matrix**. Best Practices are product rules with teeth:
  "the validator throws without svgOnly and aria-label"; "Title Case the
  label and name what happens: Deploy Project"; "destructive buttons pair
  1:1 with their toast: Delete Project → Project deleted".
- **Strong.** The comparison matrix and the copy rules; the fewest
  elements between the reader and the specimen.
- **Lacks.** No props table on the page (props live in "Show code"); no
  accessibility section; no anatomy; a marketing card in the middle of the
  colour page.

### Chakra UI (chakra-ui.com)

- **Apart.** A **version selector** in the bar (3.37.0). Under the title:
  Source · Storybook · **Recipe** (the styling recipe is a first-class
  link). An **"AI Tip: want to skip the docs? Use our Agent Skills"**
  callout on every page, and Copy Page. Preview / Code tabs with
  Stackblitz. A "Testing" concept page. Semantic tokens with a **typegen
  CLI** so tokens autocomplete in the editor. A Colour example that shows
  the palette × variant matrix.
- **Strong.** The `Recipe` link — the component's style as a readable,
  linkable object.
- **Lacks.** A premium-components ad across the top; no anatomy, no
  guidelines, no contrast; 0 readable root variables (Panda generates).

### Nord (nordhealth.design)

- **Apart.** The home renders a form **live with the system's own web
  components — "inspect away"**. A ⌘K palette over 57 components and 300
  icons. The Button page embeds a **Storybook-style controls panel inline**
  (Controls 13 / Code / Accessibility tabs, "Open in Storybook") and every
  example has "Edit in CodePen". `llms.txt`. "New" lozenges in the sidebar.
  npm and CDN install side by side; "works with any framework".
- **Strong.** The one site where the documentation *is* the product
  running, and says so; a small team's site that reads as complete.
- **Lacks.** No contrast figures; no anatomy drawings; the sidebar is one
  long list.

### Gestalt (gestalt.pinterest.systems)

- **Apart.** Under the title: **"also known as Action, CTA"** — aliases,
  for search and for newcomers. Three status readouts — Figma *Ready*,
  Responsive *Ready*, Adaptive *N/A*. "View source on GitHub · See recent
  changes on GitHub · Consult PDocs". A **Component status** page. Props
  with *Required* and a sentence each, and sizes stated in px (`sm: 32px,
  md: 40px, lg: 48px` — Alpenglow's ControlSize exactly). `backgroundContext`
  "light | dark" as a prop, "used for improving focus ring colour contrast".
- **Strong.** The alias line; the status triplet.
- **Lacks.** The 1.0 docs are labelled legacy and **2.0 is behind a
  login** — the public site is the old one; the home is a blog.

### Helios (helios.hashicorp.design)

- **Apart.** Six tabs: Guidelines / Code / **Specifications** / Content /
  Accessibility / **Version history**. Figma and GitHub links beside the
  title. Specifications is an **anatomy diagram plus a table of elements
  with Required / Optional / "focus state only"** and a footnote ("one of
  these must be present"). The sidebar has a **filter field**. Release
  notes and a roadmap on the home. Content guidance for icon *direction*
  (chevron-right for a step, arrow-right for an internal link,
  external-link for outside).
- **Strong.** The Specifications table is the tightest anatomy format
  read; "Version history" per component is the changelog Alpenglow lacks.
- **Lacks.** Ember-only; no live editing; no contrast figures; no dark
  mode on the site.

### Ant Design (ant.design)

- **Apart.** dumi. Under the title, a compact **metadata block**: Import
  line, GitHub folder, Issue, Open issues, "Edit this page", **Design**,
  **LLMs.md**. Version selector in the bar; "6.0.0" / "6.6.0" lozenges on
  new components and a DEPRECATED tag in the sidebar. A right-hand outline
  three levels deep. **Semantic DOM** section (the class names of each part
  as a stylable API) and **Design Token** section per component; an FAQ
  per component ("How to choose type and colour & variant?").
- **Strong.** The per-component Design Token and Semantic DOM sections —
  what a consumer needs to restyle without reading source.
- **Lacks.** The home page renders skeletons for seconds; emoji bullets in
  the guidance; sponsor logos; "world's second most popular" in the title.

### Atlassian — see the 2026-09-15 file.

---

## What the eighteen have in common, and where the gaps are

**Chrome.** Sixteen of eighteen use a left tree; the exceptions are Geist
(none) and Material (a rail). Eleven have a right-hand outline. Twelve put
a search in the bar and seven of those bind ⌘K. A theme toggle is on
eleven; USWDS, GOV.UK, Spectrum, Helios and Lightning have no dark mode on
the site at all. Nine show a cookie banner on the first screen, and on
four of them it covers the content.

**The component page.** Two shapes. *Tabs* — Atlassian, Material, Carbon,
Primer, Cloudscape, Helios (four to six of them) — or *one long page* —
shadcn, Radix, Geist, Chakra, Nord, Ant, GOV.UK, USWDS, Spectrum, Fluent.
The tab sites are the corporate ones with two audiences; the one-page
sites are the developer-first ones. Alpenglow is one-page by decision.

**Live or not.** Live, editable specimens: Primer (inline editor), Nord
(controls panel), Cloudscape (configurator), shadcn/Chakra/Radix (preview +
code). Static: Material, Spectrum, GOV.UK, USWDS, Helios, Fluent (the
CodeSandbox link aside). A theme or mode switch *on the specimen*, not
the site: Carbon, Fluent, Atlassian.

**Status and time.** A version on the page: Spectrum (7.0.1), Carbon
(footer), Chakra and Ant (selectors), Lightning ("updated 2 days ago"),
Cloudscape ("Published: date"). Per-component changelog: Atlassian,
Spectrum, Helios, Gestalt ("recent changes"). Lifecycle labels: Atlassian
(Caution/Beta/Early access), GOV.UK (Trial/Stable), Gestalt (Ready/N/A per
platform), Primer (Ready), Nord/Ant (New), Ant (DEPRECATED).

**AI.** In 2026 every developer-first site has an LLM surface: shadcn
(Copy Page, llms.txt, Skills, MCP), Chakra (Agent Skills, Copy Page),
Radix (View as Markdown), Ant (LLMs.md), Nord (llms.txt), Polaris (Install
AI Toolkit, Ask about this page, Copy MD), Carbon (MCP), Lightning ("AI
and SLDS 2"), Atlassian (skills, DESIGN.md). The corporate design-guidance
sites (Material, Spectrum, Fluent, GOV.UK, USWDS, Helios) have none.

**Contrast and measurement — the gap.** Not one of the eighteen prints a
contrast ratio beside a token pair or a component state. Three make
contrast *structural*: Spectrum (grays generated to target ratios), USWDS
(regularised grades and the 40/50-grade rule), Cloudscape (a ratio named
in the charts tokens' descriptions). Fluent states the per-part rule
(4.5 label, 3 icon, none for stroke). Everyone else says "meets WCAG" or
nothing. USWDS is the only site that shows every interactive state
without a hover. This is where Alpenglow already stands alone: 130 pairs
measured in both modes in a suite, and the figures on the page.

**Anatomy.** Numbered drawings on Atlassian, Carbon, Material, Helios
(with the Required/Optional table), Spectrum. None on shadcn, Radix,
Geist, Chakra, Nord, Ant. Alpenglow has "Sizes and anatomy" with the drawn
numbers; a Required/Optional table beside the drawing is Helios's step.

**Testing.** Cloudscape alone documents how to test the component; Carbon
alone publishes what *it* tested (the status table); USWDS publishes its
test plan. Nobody else. Alpenglow has the deepest suite of the group (1061
tests, axe on every page, stylesheet-reading tests) and the site says
almost nothing about it.

**The Figma side.** Atlassian, Primer, Helios, Gestalt, Nord, shadcn link
the Figma file or kit from the component page. Alpenglow's Figma file is
in step by script (`scripts/export-figma.ts`) and is not linked from the
site — by decision, the key stays out of the repository.

---

## Candidate improvements for Alpenglow

Ordered by what each is worth to a portfolio piece read through its site,
with the site it comes from and what it costs. The first four are where
the survey says Alpenglow can stand out rather than catch up; the rest
catch up on things every good site has. Nothing is decided by this list.

### Where Alpenglow can lead

1. **Put the measurement on the page in a form no other site has: a
   state matrix with the ratio in every cell.** USWDS renders Default /
   Hover / Active / Focus / Disabled statically per variant; nobody prints
   the number. Alpenglow has the numbers (`contrast.test.ts` derives them
   from the theme keys) and the tone × variant × state grid is finite. One
   component, `StateMatrix`, reading the same functions the suite reads,
   rendered for both modes side by side, with the label's ratio under each
   cell and the wash-composite where a wash applies (invariant 21). It
   replaces the prose readings in the evidence column for the states
   section and it is the one picture of "measured rather than assumed".
   Costs the scoped-mode block in `tokens.css` noted in the Atlassian
   survey (item 1 there), and a way to force `:hover`/`:active` paint
   without a pointer — a `data-state` attribute the stylesheets already
   half-use for `[data-state]` selectors would need to become the rule.
2. **A "what the suite holds" section on every component page.** Carbon
   publishes an accessibility testing status table; Cloudscape publishes
   test utilities; nobody publishes *what the tests assert about this
   component*. Alpenglow's tests read the stylesheet (Button's
   `:not(.loading)` guard, Loader's reduced-motion rule, Calendar's band
   width) and each is a sentence. A short list per page — "the suite
   fails if…" with the test file linked — is the portfolio's argument
   made in the reader's language. Cheap: the sentences exist in
   `MEMORY.md`; the link is item 3 of the Atlassian survey (Source link).
3. **A scale page with a job per stop, and the pairs that hold.** Radix
   (1–2 / 3–5 / 6–8 / 9–10 / 11–12) and Geist (1–3 / 4–6 / 7–8 / 9–10)
   explain their scales by *what each step is for*; Spectrum by which
   grays carry text, borders, disabled. Alpenglow's Colour page already
   has "Carries / Tightest" per stop. Naming the bands the way Radix does
   — with the 925 surface step, the deep tail, and the refusal of 975
   (invariant 4) as the bands' edges — turns a table into the system's
   argument. Prose only; no code.
4. **A "why this number" line on tokens, the way GOV.UK writes "research
   shows".** GOV.UK's authority comes from sentences like "the Notify
   team discovered…". Alpenglow's equivalent is "measured 1.19:1 above the
   scrim; a deeper tail was refused" — the Decisions page holds it, the
   token rows do not. A `why` field beside `use` in `theme.ts` for the
   tokens that have a story (surface/overlay, border/subtle, text/inert,
   the washes) surfaces on the Colour rows and in search. Small change to
   `ThemeEntry`; the sentences exist.

### Catching up on what every developer-first site has (2026)

5. **An LLM surface.** In order of cost: `llms.txt` at the site root
   (Nord, shadcn) listing the pages and the skill; **Copy page as
   Markdown** on every page (shadcn, Chakra, Radix, Polaris, Ant) — the
   search index already renders every page to text at build time
   (`extract.tsx`), so a `.md` per route is one more output of
   `build-search-index.ts`; the **skill page** from the Atlassian survey
   (item 2), with the install line the way shadcn and Chakra show it. An
   MCP server is refused below.
6. **Links beside the title: Source · Figma · Storybook · Issue.** Radix
   ("View source · Report an issue"), Ant (GitHub folder · Issue · Edit
   this page), Helios and Gestalt (Figma · GitHub), Chakra (Source ·
   Storybook · Recipe). Source is Atlassian item 3; *Report an issue* is
   the repository's issues URL the footer already derives, with the
   component name in the title query. Figma stays out (the key is
   private). Storybook does not exist and is not planned; see refused.
7. **Version, date and lifecycle on the page.** Spectrum's "Version
   7.0.1", Lightning's "updated 2 days ago", Cloudscape's "Published:",
   GOV.UK's Trial/Stable, Ant's DEPRECATED. For Alpenglow: the package
   version in the page header (read from `package.json` as the Install
   page does), the page's last commit date (build time, from git, the way
   the search index is built), and — only when one exists — a lifecycle
   lozenge. Ties to the changelog (Atlassian item 7).
8. **The comparison matrix.** Geist's "All types and sizes in
   comparison" and Chakra's palette × variant grid put every tone beside
   every variant in one frame. Alpenglow's Button page lists them in
   sequence. One `Matrix` specimen (tone × variant, both modes) is the
   cheap half of item 1 and can land first.
9. **Anatomy as Helios draws it.** The numbered drawing plus a table:
   element · Required / Optional / "focus state only" · footnote for
   "one of these must be present". The Button page's "Sizes and anatomy"
   has the numbers; the table is a `Table` specimen.
10. **Aliases under the title** ("also known as Action, CTA" — Gestalt).
    A line on each component page and a field in `contents.ts` the search
    index reads, so "modal" finds Dialog and "spinner" finds Loader.
    Answers the open search item about ranking with no ranking change.
11. **Enum values explained one per line in Props** (Polaris:
    "auto: determined by context; primary: high emphasis…"). Alpenglow's
    Props table has Prop · Type · Default; a `tone` cell that lists seven
    words explains nothing. A fourth column, or a note row under the enum
    props, in the existing `Table`.
12. **A component's own tokens and stylable parts** (Ant's "Design Token"
    and "Semantic DOM"; Chakra's Recipe; Lightning's component-level
    hooks). Alpenglow has no component tokens by design (everything reads
    the 54); the honest section is "which of the 54 this component reads",
    derivable by grepping the module CSS at build time. Shows the
    architecture's discipline rather than hiding it.
13. **A filter field over the drawer** (Helios) once Components passes
    a dozen — before then the ⌘K palette is the filter. Recorded so it is
    not built early.
14. **Feedback on the page** ("Did this page help you?" — Cloudscape,
    Atlassian, Polaris; "Give feedback" — Primer). Needs the analytics
    event the search survey left undecided. One decision for both.
15. **"Rendered live — inspect away"** (Nord). The home already renders
    the system's components; a line saying so under the hero, and a
    `data-alpenglow` root the reader can find in devtools, cost a
    sentence.
16. **The freshness line** ("Styleguide updated 2 days ago" —
    Lightning). Same build-time git read as item 7; on the home or the
    footer.

### Refused, with the reason

- **Tabs per component** (Material, Carbon, Primer, Cloudscape, Helios,
  Atlassian). Refused in the Atlassian survey; nothing read since changes
  it. The developer-first half of the field is one-page too.
- **A Storybook or a configurator** (Carbon, Primer, Cloudscape, Nord).
  Alpenglow's specimens are the site's own components on the site's own
  surfaces; a second renderer would be a second source of truth, and the
  configurator's value (every prop as a control) is what the Props table
  and the matrix give without a runtime. A Storybook also cannot show the
  ratio.
- **A live code editor** (Primer, StackBlitz/CodePen links). The samples
  are one line each; editing them proves nothing the reader cannot see.
  A "Copy" is enough and exists.
- **Three primitive tabs** (shadcn). Alpenglow *is* the primitive layer;
  there is no second implementation to switch to.
- **An MCP server** (Carbon, shadcn). The skill is the portable form and
  is tested; an MCP server needs hosting and has one consumer.
- **The mirrored dark ramp, the regularised grade rule, generated grays**
  (Atlassian, USWDS, Spectrum). All three are ways to make contrast
  predictable *without measuring*. Alpenglow measures; invariant 1 and
  the deep tail refuse symmetry on purpose. Note them as the alternatives
  the Decisions page argues against, with their names.
- **Web components / a CDN build** (Nord, Polaris, Carbon, Spectrum). The
  package is React 19 by decision; "works with any framework" would be a
  rewrite.
- **A cookie banner.** Nine sites have one; four cover the content with
  it. Vercel Analytics is cookieless; keep it that way.
- **Sponsors, a blog, careers, a premium tier** (Ant, Chakra, Atlassian,
  Material, Gestalt). One author, one product.
- **A login-gated 2.0** (Gestalt). Public or nothing.
