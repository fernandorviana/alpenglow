import { DocPage } from '@ui/DocPage';

export default function DarkModePage() {
  return (
    <DocPage>
      <h1>Dark mode</h1>
      <p className="lead">One attribute on the root element. Without it, the system decides.</p>

      <pre>
        <code>{`<html data-theme="dark">`}</code>
      </pre>
      <p>
        Both themes are in <code>styles.css</code>. <code>data-theme=&quot;light&quot;</code> or{' '}
        <code>&quot;dark&quot;</code> wins; with no attribute, the viewer&apos;s system preference
        does. <code>color-scheme</code> follows the same rule, so scrollbars, native select popups
        and autofill match the page.
      </p>

      <h2>Switching</h2>
      <p>Write the attribute and store the choice. Remove both to hand the decision back to the system.</p>
      <pre>
        <code>{`function setTheme(theme: 'light' | 'dark' | null) {
  const root = document.documentElement;
  if (theme) root.setAttribute('data-theme', theme);
  else root.removeAttribute('data-theme');
  try {
    if (theme) localStorage.setItem('theme', theme);
    else localStorage.removeItem('theme');
  } catch {
    // Private windows and blocked site data throw. The page still switches.
  }
}`}</code>
      </pre>

      <h2>Before the first paint</h2>
      <p>
        A stored choice has to reach the root before the browser paints, or a viewer who chose
        dark sees one frame of light. A script in the document head runs while the HTML is
        parsed, which is early enough:
      </p>
      <pre>
        <code>{`<script>
  try {
    var theme = localStorage.getItem('theme');
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  } catch (e) {}
</script>`}</code>
      </pre>
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
      <pre>
        <code>{`<ThemeProvider attribute="data-theme">{children}</ThemeProvider>`}</code>
      </pre>
      <p>
        Beside shadcn/ui, whose components read a <code>.dark</code> class, set both, and one
        switch drives the two systems:
      </p>
      <pre>
        <code>{`<ThemeProvider attribute={['class', 'data-theme']}>{children}</ThemeProvider>`}</code>
      </pre>
    </DocPage>
  );
}
