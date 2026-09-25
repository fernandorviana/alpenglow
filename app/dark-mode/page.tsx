import { CodeBlock } from '@ui/CodeBlock';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { Swatch } from '@ui/Swatch';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Table, type Column } from '@/components/Table';
import { resolve } from '@/tokens/contrast';
import { elevation } from '@/tokens/elevation';
import { theme, type ThemeTokenName, type Mode } from '@/tokens/theme';

/** The tokens that show what the light does: the ladder inverts, the labels turn, one border stays. */
const MOVED: ThemeTokenName[] = [
  'surface/base',
  'surface/raised',
  'surface/overlay',
  'text/primary',
  'interactive/accent',
  'interactive/on-accent',
  'border/strong',
];

/**
 * The token names the row, with its use; then each mode's swatch and the
 * primitive it points at. The name keeps to one line — the longest,
 * `interactive/on-accent`, is 156 of the column's 176 — and a mode holds
 * `twilight/600`, 82 of its 108. The two take 284 of a 320 screen's 288:
 * room for one mode, not two. It is dark: this page is dark mode's, and the
 * light values are the ones the rest of the site is read in. The light
 * column is back from a 426 screen.
 */
const MOVED_COLUMNS: Column<ThemeTokenName>[] = [
  {
    key: 'token',
    header: 'Token',
    primary: true,
    minWidth: 176,
    cell: (token) => (
      <>
        <div className="tokenName">{token}</div>
        <div className="alias">{theme[token].use}</div>
      </>
    ),
  },
  ...(['light', 'dark'] as const).map(
    (mode: Mode): Column<ThemeTokenName> => ({
      key: mode,
      header: mode === 'light' ? 'Light' : 'Dark',
      priority: mode === 'dark' ? 1 : 2,
      minWidth: 108,
      cell: (token) => (
        <div className="swatchValue">
          <Swatch value={resolve(token, mode)} />
          <div className="alias">{theme[token][mode]}</div>
        </div>
      ),
    }),
  ),
];

const themed = Object.keys(theme).length;
const shadows = Object.keys(elevation).length;

export default function DarkModePage() {
  return (
    <DocPage
      evidence={
        <>
          <p>{themed} tokens change</p>
          <p>{shadows} shadow steps change</p>
          <p>0 dimensions change</p>
          <p>accent label on accent</p>
          <p>
            light{' '}
            <Ratio fg={resolve('interactive/on-accent', 'light')} bg={resolve('interactive/accent', 'light')} />
          </p>
          <p>
            dark{' '}
            <Ratio fg={resolve('interactive/on-accent', 'dark')} bg={resolve('interactive/accent', 'dark')} />
          </p>
        </>
      }
    >
      <h1>Dark mode</h1>
      <p className="lead">One attribute on the root element. Without it, the system decides.</p>

      <h2>See it</h2>
      <p>
        Flip the toggle at the foot of the rail. The page, the components in it and the
        numbers in the margin change together, because they read the same tokens; nothing
        moves, because dimension is not a token that changes with the light.
      </p>
      <div className="specimen">
        <div className="specimenRow">
          <Button>Confirm booking</Button>
          <Button variant="outline" tone="neutral">
            Go back
          </Button>
          <Badge tone="success">Confirmed</Badge>
          <span style={{ color: 'var(--ap-color-text-secondary)' }}>Thursday, 14:30</span>
        </div>
      </div>

      <h2>Set it</h2>
      <CodeBlock lang="html" code={`<html data-theme="dark">`} />
      <p>
        Both themes are in <code>styles.css</code>. <code>data-theme=&quot;light&quot;</code> or{' '}
        <code>&quot;dark&quot;</code> wins; with no attribute, the viewer&apos;s system preference
        does. <code>color-scheme</code> follows the same rule, so scrollbars, native select popups
        and autofill match the page.
      </p>

      <h2>What changes with the light</h2>
      <p>
        The {themed} theme tokens and the {shadows} shadow steps, and nothing else: spacing,
        radius, stroke and type are the same by day and by night. The ladder does not mirror.
        In light, a card and a panel are both white and the shadow separates them; in dark the
        panel is the lighter step, because a shadow stops reading as height there. The accent
        fill lightens in dark and its label darkens to stay clear of it — a white label would
        fail at the hover step. One border stays: <code>border/strong</code> is the same
        primitive in both, the only stop that clears 3:1 on every surface either way.
      </p>
      <div className="specimen">
        <Table caption="What changes with the light" density="compact" columns={MOVED_COLUMNS} rows={MOVED} getRowId={(token) => token} />
      </div>

      <h2>Choosing a default</h2>
      <p>
        Follow the system until the viewer says otherwise. Most people never touch a theme
        control, and the one they set at the operating system is the one they meant; an app
        that opens dark on a light system has made a decision for them. When you offer a
        control, keep the choice where the viewer made it — storage, and the attribute — and
        give a way back to the system, or say plainly that there is none: this site&apos;s
        toggle has two positions, follows the system until the first click, and then the
        choice is the viewer&apos;s to keep. That trade is written on the control.
      </p>
      <p>
        Name the control for the state it sets. A switch called <em>Dark theme</em> is on or
        off, which is what a screen reader announces; a button that says <em>Toggle theme</em>{' '}
        says nothing about where it leaves you.
      </p>

      <h2>Switching</h2>
      <p>Write the attribute and store the choice. Remove both to hand the decision back to the system.</p>
      <CodeBlock
        lang="ts"
        code={`function setTheme(theme: 'light' | 'dark' | null) {
  const root = document.documentElement;
  if (theme) root.setAttribute('data-theme', theme);
  else root.removeAttribute('data-theme');
  try {
    if (theme) localStorage.setItem('theme', theme);
    else localStorage.removeItem('theme');
  } catch {
    // Private windows and blocked site data throw. The page still switches.
  }
}`}
      />
      <p>
        A flip changes the colour of nearly everything at once, and every colour transition on
        the page fires together: this site measured 99 of them on one page, and the buttons
        faded while the page snapped. Hold transitions for the frame the attribute is written
        in — an attribute on the root, <code>transition: none</code> under it, removed on the
        next frame — and let only the control&apos;s own motion run.
      </p>

      <h2>Before the first paint</h2>
      <p>
        A stored choice has to reach the root before the browser paints, or a viewer who chose
        dark sees one frame of light. A script in the document head runs while the HTML is
        parsed, which is early enough:
      </p>
      <CodeBlock
        lang="html"
        code={`<script>
  try {
    var theme = localStorage.getItem('theme');
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  } catch (e) {}
</script>`}
      />
      <p>
        In Vite or plain HTML it goes in <code>index.html</code>. In the Next.js App Router, not{' '}
        <code>next/script</code> with <code>beforeInteractive</code>: that queues the code for the
        runtime, which runs after the first paint. This site renders the script from its root
        layout through a small client component, and{' '}
        <a href="https://github.com/fernandorviana/alpenglow/blob/main/app/ui/InlineScript.tsx">
          InlineScript.tsx
        </a>{' '}
        explains why it has to be one.
      </p>

      <h2>With next-themes</h2>
      <CodeBlock lang="tsx" code={`<ThemeProvider attribute="data-theme">{children}</ThemeProvider>`} />
      <p>
        Beside shadcn/ui, whose components read a <code>.dark</code> class, set both, and one
        switch drives the two systems:
      </p>
      <CodeBlock lang="tsx" code={`<ThemeProvider attribute={['class', 'data-theme']}>{children}</ThemeProvider>`} />

      <h2>Accessibility</h2>
      <p>
        Every pair on this site is measured in both modes, and the dark figures are on the same
        pages as the light ones — a system that passes in one mode has passed once. Dark is not
        the light palette reversed: the surfaces were re-stepped, the labels re-measured on
        every fill state, and the borders that could not hold were given an alpha. Respecting{' '}
        <code>prefers-color-scheme</code> without a control is the floor; a viewer who set it
        did so for a reason, and often the reason is their eyes.
      </p>
    </DocPage>
  );
}
