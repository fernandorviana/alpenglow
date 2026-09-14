import { describe, it, expect } from 'vitest';
import { fold, words, terms, oneEdit, search, group, LIMIT, TYPO_FROM, WINDOW, type Entry, type Index } from './index';

/** An entry with every field defaulted, so a test names only what it is about. */
let order = 0;
const entry = (over: Partial<Entry>): Entry => ({
  kind: 'section',
  href: '/x#y',
  title: 'Untitled',
  // Neutral labels: a test that wants a label match names it.
  section: 'Section',
  page: 'Page',
  body: '',
  order: order++,
  ...over,
});
const index = (...entries: Entry[]): Index => ({ entries });

describe('fold', () => {
  it('lower-cases and strips accents without changing the length', () => {
    // Positions found in the folded text are used to slice the original,
    // so every character has to map to exactly one.
    for (const text of ['Café au lait', 'The Dialog’s title', 'Choosing … a picker', 'ﬁne — “quoted”']) {
      expect(fold(text)).toHaveLength(text.length);
    }
    expect(fold('Café')).toBe('cafe');
  });
});

describe('words', () => {
  it('keeps a slash, a hyphen and a dot inside a word, and adds the pieces at their own positions', () => {
    expect(words('the surface/raised token')).toEqual([
      { text: 'the', start: 0 },
      { text: 'surface/raised', start: 4 },
      { text: 'surface', start: 4 },
      { text: 'raised', start: 12 },
      { text: 'token', start: 19 },
    ]);
    expect(words('dark-mode')).toEqual([
      { text: 'dark-mode', start: 0 },
      { text: 'dark', start: 0 },
      { text: 'mode', start: 5 },
    ]);
  });

  it('drops punctuation at either end of a word', () => {
    expect(words('“quoted”, (4.5:1).').map((w) => w.text)).toEqual(['quoted', '4.5:1', '4', '5', '1']);
  });
});

describe('terms', () => {
  it('splits on whitespace, folds, keeps the joined forms whole', () => {
    expect(terms('  Surface/Raised  dark-mode ')).toEqual(['surface/raised', 'dark-mode']);
  });
  it('is empty for an empty or punctuation-only query', () => {
    expect(terms('')).toEqual([]);
    expect(terms(' — ')).toEqual([]);
  });
});

describe('oneEdit', () => {
  it('accepts one substitution, insertion, deletion or adjacent swap', () => {
    expect(oneEdit('buton', 'button')).toBe(true);
    expect(oneEdit('buttton', 'button')).toBe(true);
    expect(oneEdit('dialgo', 'dialog')).toBe(true);
    expect(oneEdit('swtich', 'switch')).toBe(true);
    expect(oneEdit('colour', 'coloud')).toBe(true);
  });
  it('rejects the same word, two edits, or a length two apart', () => {
    expect(oneEdit('button', 'button')).toBe(false);
    expect(oneEdit('buttn', 'buttons')).toBe(false);
    expect(oneEdit('dialgo', 'dialogs')).toBe(false);
    expect(oneEdit('ab', 'ba')).toBe(true);
    expect(oneEdit('abc', 'cba')).toBe(false);
  });
});

describe('search', () => {
  it('matches a term by prefix of a word, anywhere in the entry', () => {
    const idx = index(
      entry({ kind: 'page', href: '/button', title: 'Button' }),
      entry({ kind: 'page', href: '/elevation', title: 'Elevation and states' }),
    );
    expect(search(idx, 'butt').map((h) => h.entry.href)).toEqual(['/button']);
    expect(search(idx, 'elev').map((h) => h.entry.href)).toEqual(['/elevation']);
  });

  it('requires every term to match', () => {
    const idx = index(
      entry({ kind: 'page', href: '/button', title: 'Button', body: 'three variants' }),
      entry({ kind: 'page', href: '/badge', title: 'Badge', body: 'two treatments' }),
    );
    expect(search(idx, 'button variants').map((h) => h.entry.href)).toEqual(['/button']);
    expect(search(idx, 'button treatments')).toEqual([]);
  });

  it('allows one typo from four characters on, and none at three', () => {
    const idx = index(entry({ kind: 'page', href: '/dialog', title: 'Dialog' }), entry({ kind: 'page', href: '/why', title: 'Why' }));
    expect(TYPO_FROM).toBe(4);
    expect(search(idx, 'dialgo').map((h) => h.entry.href)).toEqual(['/dialog']);
    expect(search(idx, 'wyh')).toEqual([]);
  });

  it('ranks a page title over a token over a section over a label over the body', () => {
    const idx = index(
      entry({ kind: 'section', href: '/colour#text', title: 'Text', body: 'the accent colour is measured', page: 'Colour', section: 'Foundations' }),
      entry({ kind: 'section', href: '/button#labels', title: 'Labels', page: 'Button', body: 'accent' }),
      entry({ kind: 'section', href: '/badge#tones', title: 'Accent and others', page: 'Badge' }),
      entry({ kind: 'token', href: '/colour#interactive-accent', title: 'interactive/accent', page: 'Colour', section: 'Foundations' }),
      entry({ kind: 'page', href: '/accent', title: 'Accent' }),
      entry({ kind: 'section', href: '/x#labelled', title: 'By label', page: 'Accent', body: '' }),
    );
    expect(search(idx, 'accent').map((h) => h.entry.href)).toEqual([
      '/accent', // page title, 10
      '/colour#interactive-accent', // token title (the piece), 9
      '/badge#tones', // section title, 6
      '/x#labelled', // page label, 4
      '/button#labels', // body, 1 — the shorter body, so the term is more of it
      '/colour#text',
    ]);
  });

  it('ranks a whole word over a prefix over a typo', () => {
    const idx = index(
      entry({ kind: 'page', href: '/tables', title: 'Tables' }),
      entry({ kind: 'page', href: '/table', title: 'Table' }),
      entry({ kind: 'page', href: '/tablet', title: 'Tablr' }),
    );
    expect(search(idx, 'table').map((h) => h.entry.href)).toEqual(['/table', '/tables', '/tablet']);
  });

  it('ranks a body that mentions the term more often above one that mentions it once, never above a label', () => {
    const idx = index(
      entry({ kind: 'section', href: '/home#cards', title: 'Cards', body: 'npm once, and some more words here' }),
      entry({ kind: 'section', href: '/install#package', title: 'Package', body: 'npm install, and npm again, npm' }),
      entry({ kind: 'section', href: '/x#labelled', title: 'Any', page: 'npm' }),
    );
    expect(search(idx, 'npm').map((h) => h.entry.href)).toEqual(['/x#labelled', '/install#package', '/home#cards']);
  });

  it('counts a joined word once for a term that matches its head', () => {
    const idx = index(
      entry({ kind: 'section', href: '/a', title: 'A', body: 'the surface/raised token here' }),
      entry({ kind: 'section', href: '/b', title: 'B', body: 'the surface token here, and more' }),
    );
    const [a, b] = search(idx, 'surface');
    // Same mention count, so the shorter body wins — /a, by three characters;
    // counted twice, /a would win by more than the length ratio below.
    expect(a?.entry.href).toBe('/a');
    expect(b?.score).toBeCloseTo(a!.score * (1 + a!.entry.body.length / 2000) / (1 + b!.entry.body.length / 2000), 6);
  });

  it('ranks a short body above a long one that says the term as often', () => {
    // The term is a bigger part of a 200-character section than of a
    // 2000-character one; this is what puts "Install the package" above the
    // home's card that quotes the same install line.
    const filler = 'lorem ipsum '.repeat(160);
    const idx = index(
      entry({ kind: 'section', href: '/home#cards', title: 'Cards', body: `${filler} npm install alpenglow` }),
      entry({ kind: 'section', href: '/install#package', title: 'Package', body: 'run npm install alpenglow in the project' }),
    );
    expect(search(idx, 'npm').map((h) => h.entry.href)).toEqual(['/install#package', '/home#cards']);
  });

  it('breaks ties by reading order', () => {
    const idx = index(
      entry({ kind: 'page', href: '/b', title: 'Same', order: 2 }),
      entry({ kind: 'page', href: '/a', title: 'Same', order: 1 }),
    );
    expect(search(idx, 'same').map((h) => h.entry.href)).toEqual(['/a', '/b']);
  });

  it('returns eight at most', () => {
    const many = Array.from({ length: 12 }, (_, i) => entry({ kind: 'page', href: `/p${i}`, title: 'Page' }));
    expect(LIMIT).toBe(8);
    expect(search(index(...many), '')).toHaveLength(0); // no query
    expect(search(index(...many), 'page')).toHaveLength(8);
  });

  it('marks the typed prefix in the title, and the whole word for a typo', () => {
    const idx = index(entry({ kind: 'page', href: '/button', title: 'Button' }));
    expect(search(idx, 'butt')[0]?.ranges).toEqual([[0, 4]]);
    expect(search(idx, 'buton')[0]?.ranges).toEqual([[0, 6]]);
  });

  it('marks a piece of a joined word where the piece starts', () => {
    const idx = index(entry({ kind: 'token', href: '/colour#surface-raised', title: 'surface/raised' }));
    expect(search(idx, 'raised')[0]?.ranges).toEqual([[8, 14]]);
  });

  it('carries an excerpt only when nothing in the title matched', () => {
    const body = 'A'.repeat(300) + ' the package is published to npm under the name alpenglow ' + 'Z'.repeat(300);
    const idx = index(
      entry({ kind: 'section', href: '/install#install-the-package', title: 'Install the package', body }),
      entry({ kind: 'page', href: '/npm', title: 'npm', body }),
    );
    const [page, section] = search(idx, 'npm');
    expect(page?.entry.href).toBe('/npm');
    expect(page?.excerpt).toBeUndefined();
    expect(section?.excerpt?.text.length).toBeLessThanOrEqual(WINDOW + 2);
    expect(section?.excerpt?.text).toMatch(/^…/);
    expect(section?.excerpt?.text).toMatch(/…$/);
    expect(section?.excerpt?.text).toContain('npm');
    // The mark sits on the word inside the excerpt, ellipsis counted.
    const [start, end] = section!.excerpt!.ranges[0]!;
    expect(section!.excerpt!.text.slice(start, end)).toBe('npm');
  });

  it('cuts the excerpt on word boundaries and skips the ellipsis at an end it did not cut', () => {
    const idx = index(entry({ kind: 'section', href: '/a#b', title: 'B', body: 'short body that mentions npm once' }));
    const [hit] = search(idx, 'npm');
    expect(hit?.excerpt?.text).toBe('short body that mentions npm once');
  });
});

describe('group', () => {
  it('groups by section in the order of each section’s best hit, and keeps score order inside', () => {
    const idx = index(
      entry({ kind: 'section', href: '/a', title: 'Grid', section: 'Components', page: 'Table' }),
      entry({ kind: 'page', href: '/b', title: 'Grid', section: 'Foundations', page: 'Space' }),
      entry({ kind: 'section', href: '/c', title: 'Grid', section: 'Foundations', page: 'Space' }),
    );
    const groups = group(search(idx, 'grid'));
    expect(groups.map((g) => g.section)).toEqual(['Foundations', 'Components']);
    expect(groups[0]?.hits.map((h) => h.entry.href)).toEqual(['/b', '/c']);
  });
});
