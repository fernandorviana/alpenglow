import { DocPage } from '@ui/DocPage';
import { Layers } from '@ui/Layers';
import { primitives, alphaPrimitives } from '@/tokens/primitives';
import { theme } from '@/tokens/theme';
import { elevation } from '@/tokens/elevation';
import { spacing, radius, borderWidth } from '@/tokens/scale';
import { textStyle } from '@/tokens/typography';

export default function Page() {
  // Derived, not typed — the same rule as the home page. A count written by
  // hand is exactly the kind of number this system exists to stop shipping.
  const counts = {
    bedrock: Object.keys(primitives).length + Object.keys(alphaPrimitives).length,
    outcrop:
      Object.keys(spacing).length +
      Object.keys(radius).length +
      Object.keys(borderWidth).length +
      Object.keys(textStyle).length,
    contours: Object.keys(theme).length + Object.keys(elevation).length,
  };

  return (
    <DocPage
      evidence={
        <>
          <p>{counts.bedrock} bedrock</p>
          <p>{counts.outcrop} outcrop</p>
          <p>{counts.contours} contours</p>
        </>
      }
    >
      <h1>Why Alpenglow</h1>
      <p className="lead">Structure exists beneath the surface. Light makes it visible.</p>

      <h2>The name</h2>
      <p>
        Alpenglow is the light that stays on the mountains after the sun has gone. The
        valley is already dark; the high ground is still lit. The system is also named
        after my daughter Leonor — a name to which the sense of &ldquo;light&rdquo; is
        usually attributed — and its theme, Eleonora, for the same reason.
      </p>
      <p>
        The first sentence is not decoration. It is the reason this system&rsquo;s dark
        mode is built the way it is, and the rest of this page is that sentence unpacked.
      </p>

      <h2>Structure beneath the surface</h2>
      <p>
        Every clear interface rests on decisions nobody sees: which grey the text is, how
        far apart two controls sit, what a border is for, which of two surfaces is higher.
        Most systems make those decisions once and then describe them. This one measures
        them. Every ratio on this site is calculated from the tokens as the page renders,
        by the same function the test suite runs — the numbers in the gutter are the
        structure, brought to light.
      </p>
      <p>
        The landscape below is how the layers relate. Each has a name from the terrain,
        and each maps to a file.
      </p>

      <h2>Clarity, layer by layer</h2>
      <Layers />

      <h3>Bedrock</h3>
      <p>
        Raw colour, with no meaning attached: <code>primitives.ts</code>. Nothing in a
        component references a primitive, and that is on purpose. A primitive does not
        change with the light, so a component that used one directly would be right in one
        mode and wrong in the other.
      </p>

      <h3>Outcrop</h3>
      <p>
        Bedrock that reaches the surface: spacing, radius, border width, type and motion, in{' '}
        <code>scale.ts</code>, <code>typography.ts</code> and <code>motion.ts</code>. A
        component uses these
        directly, without an alias, because 16px is 16px by day and by night.
      </p>

      <h3>Contours</h3>
      <p>
        The semantic roles — <code>surface/raised</code>, <code>text/secondary</code>,{' '}
        <code>border/focus</code>, <code>elevation/md</code>. A contour line does not alter
        the terrain; it joins every point at the same height. A role does the same: it
        joins every place in the interface that means the same thing, and every one is an
        alias with no value of its own. They are the keys of <code>theme.ts</code> and{' '}
        <code>elevation.ts</code>.
      </p>

      <h3>Light</h3>
      <p>
        Eleonora. The values the contours take under each mode — the light and dark
        columns of <code>theme.ts</code> and <code>elevation.ts</code>. In the drawing it is
        not a band but a direction, because light has a source.
      </p>

      <h3>Terrain</h3>
      <p>
        The components, in <code>src/components</code>. Every one is built from contours
        and outcrop and nothing else; the test suite reads each stylesheet to make sure.
      </p>

      <h3>Paths</h3>
      <p>
        Patterns: recommended ways through a task. None exists yet, so the line is dashed
        — the cartographic convention for ground not yet surveyed. Nothing in the code
        answers to it.
      </p>

      <h3>Crest</h3>
      <p>
        Any product built on the system. This site is the first: every page you are
        reading is laid out with the tokens and components it documents. In the code it
        is <code>app/</code>.
      </p>

      <h2>The rule</h2>
      <p>
        <strong>A value needs a contour only if the light changes it.</strong>
      </p>
      <p>
        16px is 16px by day and by night, so spacing is outcrop and a component may use
        it directly. A grey is near-black by day and near-white by night, so colour is
        buried and reaches a component only through a role. That is the whole reason the
        token files are split as they are — and the reason the Figma primitives
        collection is hidden while the scale collection is published. The Figma split is
        the same rule in literal form.
      </p>

      <h2>Day, night, and the twilight between</h2>
      <p>
        Light and dark are not two themes. They are two modes of one theme: one{' '}
        <code>theme.ts</code>, every token carrying both values. Day is the light mode,
        night is the dark mode, and Eleonora is what the two share — the theme is what
        stays constant when the light changes. Alpenglow itself is a twilight phenomenon,
        morning and evening, which is why the theme lives at the intersection and not in
        either mode.
      </p>
      <p>
        It is also the explanation for the decision that gets mistaken for a bug most
        often. In light, a card and a modal are both white and a shadow separates them. In
        dark, shadows stop reading as elevation, so the higher surface has to be the
        lighter colour step — because in the evening the valley darkens first and the
        crests stay lit. The numbers are on the <a href="/decisions">Decisions</a> page;
        the surfaces themselves are on <a href="/colour">Colour</a>.
      </p>
    </DocPage>
  );
}
