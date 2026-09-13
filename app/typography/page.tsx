import { DocPage } from '@ui/DocPage';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { fontFamily, fontWeight, textStyle } from '@/tokens/typography';
import { radius, spacing } from '@/tokens/scale';

const SAMPLE: Record<string, string> = {
  'heading/h1': 'Thursday, 14:30',
  'heading/h2': 'Thursday, 14:30',
  'heading/h3': 'Upcoming appointments',
  'heading/h4': 'Upcoming appointments',
  'subheading/lg': 'Three clinicians available this afternoon',
  'subheading/md': 'Three clinicians available this afternoon',
  'body/lg': 'The appointment was moved to Thursday at 14:30 and the client has been notified.',
  'body/md': 'The appointment was moved to Thursday at 14:30 and the client has been notified.',
  'button/lg': 'Confirm booking',
  'button/md': 'Confirm booking',
  'caption/md': 'Last edited 4 minutes ago',
  'caption/sm': 'Last edited 4 minutes ago',
  'caption/caps': 'Waiting room',
};

/** The measure the site sets its prose to, in rem: the 68ch of the body size. */
const MEASURE = 37.5;

const styles = Object.entries(textStyle);
const body = textStyle['body/md'];
const ratio = (s: { size: number; lineHeight: number }) => (s.lineHeight / s.size).toFixed(2);

export default function Page() {
  return (
    <DocPage
      evidence={
        <>
          <p>{styles.length} styles</p>
          <p>{Object.keys(fontWeight).length} weights</p>
          <p>44 in the source</p>
          <p>body {body.size}/{body.lineHeight}</p>
          <p>line height {ratio(body)}</p>
          <p>measure {MEASURE}rem</p>
        </>
      }
    >
      <h1>Typography</h1>
      <p className="lead">
        One family, thirteen styles, four weights. Type belongs to the scale layer, because
        it does not change between themes.
      </p>

      <h2>See it</h2>
      <p>
        The styles as they meet in a card: a title in <code>heading/h4</code>, a lead line in{' '}
        <code>subheading/md</code>, body copy, a button label, and a timestamp in{' '}
        <code>caption/md</code>. Five styles are usually all one surface needs.
      </p>
      <div className="specimen">
        <div style={{ maxWidth: 420, display: 'grid', gap: spacing[150] }}>
          <p className="alias" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: `${textStyle['caption/caps'].tracking}px` }}>
            Waiting room
          </p>
          <h3 style={{ margin: 0, fontSize: textStyle['heading/h4'].size, lineHeight: `${textStyle['heading/h4'].lineHeight}px`, letterSpacing: `${textStyle['heading/h4'].tracking}px` }}>
            Upcoming appointments
          </h3>
          <p style={{ margin: 0, fontSize: textStyle['subheading/md'].size, lineHeight: `${textStyle['subheading/md'].lineHeight}px`, color: 'var(--ap-color-text-secondary)' }}>
            Three clinicians available this afternoon
          </p>
          <p style={{ margin: 0 }}>
            The appointment was moved to Thursday at 14:30 and the client has been notified.
            The room is ready from 14:15.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[150], flexWrap: 'wrap' }}>
            <Button size="sm">Confirm booking</Button>
            <Badge tone="success" size="sm">
              Confirmed
            </Badge>
            <span className="alias">Last edited 4 minutes ago</span>
          </div>
        </div>
      </div>

      <h2>Choosing a style</h2>
      <p>
        The name says the job, not the size. <code>heading/h1</code> is the page title and there
        is one per page; <code>h2</code> a section, <code>h3</code> a subsection, <code>h4</code> a
        card, and each level is a step down the scale, so a subordinate heading can never
        overpower its parent. <code>subheading/lg</code> is a lead paragraph or a prominent label,
        and <code>subheading/md</code> a panel heading.
      </p>
      <p>
        <code>body/md</code>, at {body.size}px, is the default, and it is the most used style
        in the system. Fourteen rather than sixteen is a reason you can name: this is a dense
        professional tool, where a table of forty rows has to fit a screen, and Inter holds at
        fourteen. <code>body/lg</code> is for long-form copy — a letter, a note the reader
        settles into — and nothing else. <code>caption/md</code> is helper text and metadata,{' '}
        <code>caption/sm</code> the dense table cell and the timestamp, and{' '}
        <code>caption/caps</code> an overline for a section of a panel, the one place capitals
        earn their tracking; it is not a label style, and a form label is body text.
      </p>
      <p>
        Button labels have their own two styles because a label is set tighter than a line of
        body copy and never wraps. Everything is Inter; code and the site&rsquo;s own
        measurements are the system monospace. Two families, and the second only where the
        content is a value.
      </p>

      <h2>The scale</h2>
      <p>
        Line height follows the role: headings sit near 1.1, body copy between 1.5 and 1.6,
        and a caption in between, because a caption wraps to two lines at most. Tracking
        follows the size — negative on the large sizes, where Inter&rsquo;s letters drift apart,
        and positive on the small ones, where they crowd — and body copy at reading size takes
        none.
      </p>
      {styles.map(([name, style]) => (
        <div key={name} style={{ marginBottom: spacing[400] }}>
          <p className="alias" style={{ margin: `0 0 ${spacing['050']}px` }}>
            {name} — {style.size}/{style.lineHeight}, ×{ratio(style)}, {style.tracking > 0 ? '+' : ''}
            {style.tracking}px · {style.use}
          </p>
          <div
            style={{
              fontSize: `${style.size}px`,
              lineHeight: `${style.lineHeight}px`,
              letterSpacing: `${style.tracking}px`,
              fontWeight: name.startsWith('heading') || name.startsWith('button') ? fontWeight.semibold : fontWeight.regular,
              textTransform: 'transform' in style ? 'uppercase' : undefined,
              textWrap: name.startsWith('heading') ? 'balance' : 'pretty',
            }}
          >
            {SAMPLE[name]}
          </div>
        </div>
      ))}

      <h2>Weights</h2>
      <p>
        Four, and they mean things. Regular is text. Medium is the current item — the page in
        the sidebar, the selected row&rsquo;s name — and a label that needs to hold its own
        beside body copy. Semibold is a heading and a button label. Bold is reserved; nothing
        in the system uses it yet, and the first thing that does should say why. Nothing goes
        under regular: a light weight disappears at text sizes, and the smallest size here is
        ten pixels.
      </p>
      <div className="specimen">
        {Object.entries(fontWeight).map(([name, value]) => (
          <p key={name} style={{ fontWeight: value, margin: `0 0 ${spacing[100]}px` }}>
            {name} {value} — The appointment was moved to Thursday.
          </p>
        ))}
      </div>

      <h2>Setting text</h2>
      <p>
        A line of prose is capped at {MEASURE}rem — the 68 characters of the body size, set as a
        length rather than in <code>ch</code> so a heading gets the same measure as a paragraph.
        Headings wrap balanced, so a two-line title breaks evenly; descriptions wrap{' '}
        <em>pretty</em>, so a single word never lands alone on the last line. Long-form text
        takes neither.
      </p>
      <p>
        Numbers that change or line up — a table column, a timer, the ratios in the margin of
        this site — are set in tabular figures, so 14 and 27 take the same width and a sort
        changes nothing but the order. Nothing truncates without a way to the whole value: a
        dialog title wraps, and a token name does not break across lines because a broken
        identifier cannot be copied.
      </p>
      <p>
        Punctuation is the real thing: curly quotes in prose and straight ones in code, an en
        dash for a range — 14:00–15:30 — and the ellipsis character rather than three stops.
        Copy is stored in its natural case and capitals are a transform, so a redesign never
        means retyping.
      </p>
      <div className="specimen">
        <div style={{ display: 'grid', gap: spacing[100], maxWidth: 360 }}>
          <p style={{ margin: 0, fontVariantNumeric: 'tabular-nums', fontFamily: fontFamily.mono, fontSize: textStyle['caption/md'].size }}>
            1,114 · 27 · 2,003 — tabular
          </p>
          <p style={{ margin: 0, fontFamily: fontFamily.mono, fontSize: textStyle['caption/md'].size }}>
            1,114 · 27 · 2,003 — proportional
          </p>
          <p style={{ margin: 0, padding: spacing[100], borderRadius: radius.sm, background: 'var(--ap-color-surface-sunken)' }}>
            &ldquo;Moved to Thursday, 14:00–15:30 &hellip; and confirmed.&rdquo;
          </p>
        </div>
      </div>

      <h2>Corrections carried over</h2>
      <p>
        Three defects in the source are fixed here: two caption styles were set in
        Montserrat while everything else was Inter; letter-spacing mixed px and percent
        between weights of the same style, resolving to fractions of a pixel that were
        plainly not the intent; and the all-caps family carried its transform on the regular
        weight but not on medium or semibold.
      </p>
      <p>
        The system this was derived from stored the cross-product of style and weight as
        forty-four separate text styles. Weight is an independent axis, so thirteen styles
        plus four weights expresses the same system in seventeen tokens — and makes it
        possible to change every semibold at once.
      </p>

      <h2>Accessibility</h2>
      <p>
        Text is real text, selectable and resizable: the site sets{' '}
        <code>text-size-adjust: 100%</code> so a phone does not inflate it on its own, and the
        page reflows to 320px and to 200% zoom without a sideways scroll. Font smoothing is set
        once on the root, where macOS would otherwise render every weight heavier than drawn.
        The document declares its language, so quotes, hyphenation and a screen reader&rsquo;s
        voice follow it.
      </p>
      <p>
        One thing is recorded rather than solved. A text field is body size, {body.size}px, and
        iOS Safari zooms the whole page into a field under sixteen. The two fixes look
        different — sixteen on a phone, or fourteen held by a transform — and the choice is
        still to be made.
      </p>
    </DocPage>
  );
}
