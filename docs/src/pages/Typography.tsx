import { Page } from '../ui/Page.js';
import { textStyle, fontWeight } from '../../../src/tokens/typography.js';

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

export function Typography() {
  return (
    <Page
      evidence={
        <>
          <p>13 styles</p>
          <p>4 weights</p>
          <p>44 in the source</p>
        </>
      }
    >
      <h1>Typography</h1>
      <p className="lead">
        One family, thirteen styles, four weights. Type belongs to the scale layer, because
        it does not change between themes.
      </p>

      <p>
        The system this was derived from stored the cross-product of style and weight as
        forty-four separate text styles. Weight is an independent axis, so thirteen styles
        plus four weights expresses the same system in seventeen tokens — and makes it
        possible to change every semibold at once.
      </p>

      <h2>The ramp</h2>
      {Object.entries(textStyle).map(([name, style]) => (
        <div key={name} style={{ marginBottom: 32 }}>
          <p className="alias" style={{ margin: '0 0 4px' }}>
            {name} — {style.size}/{style.lineHeight}, {style.tracking > 0 ? '+' : ''}
            {style.tracking}px
          </p>
          <div
            style={{
              fontSize: `${style.size}px`,
              lineHeight: `${style.lineHeight}px`,
              letterSpacing: `${style.tracking}px`,
              fontWeight: name.startsWith('heading') || name.startsWith('button') ? 600 : 400,
              textTransform: 'transform' in style ? 'uppercase' : undefined,
            }}
          >
            {SAMPLE[name]}
          </div>
        </div>
      ))}

      <h2>Weights</h2>
      <div className="specimen">
        {Object.entries(fontWeight).map(([name, value]) => (
          <p key={name} style={{ fontWeight: value, margin: '0 0 8px' }}>
            {name} {value} — The appointment was moved to Thursday.
          </p>
        ))}
      </div>

      <h2>Corrections carried over</h2>
      <p>
        Three defects in the source are fixed here: two caption styles were set in
        Montserrat while everything else was Inter; letter-spacing mixed px and percent
        between weights of the same style, resolving to fractions of a pixel that were
        plainly not the intent; and the all-caps family carried its transform on the regular
        weight but not on medium or semibold.
      </p>
    </Page>
  );
}
