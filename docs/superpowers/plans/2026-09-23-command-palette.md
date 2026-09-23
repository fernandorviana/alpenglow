# CommandPalette — plan

Spec: `../specs/2026-09-23-command-palette-design.md`.

1. `CommandPalette.tsx`, `useShortcut.ts`, the stylesheet, the index; the
   tests first, ported from the site's `Search.test.tsx`: open and focus,
   the shortcut and its hint, the combobox wiring, the default filter and
   `null`, groups that empty, the arrows over a disabled item, Home and End,
   Enter on the active or the first, hover, click without losing focus, the
   IME Enter, Escape stopped, loading and empty status, marking, axe.
2. `src/index.ts` exports.
3. The site's `Search.tsx` on the component; its tests green; the `.search*`
   rules gone from `docs.css`.
4. Browser: the site's ⌘K as before; the page's Try it; light and dark, 375.
5. `/command-palette`, nav, card, changelog, README, MEMORY.md.
6. `npm run check`, `npm run build:docs`; code review; records.
