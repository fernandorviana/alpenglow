'use client';

import { Calendar as CalendarIcon, Checkmark, Search, Time } from '@carbon/icons-react';
import { DocPage } from '@ui/DocPage';
import { Card, Cards } from '@ui/Card';
import { Ramp, Ramps } from '@ui/Ramp';
import { DIVERGING, cssVar } from '@ui/chart';
import { primitives, alphaPrimitives } from '@/tokens/primitives';
import { theme } from '@/tokens/theme';
import { textStyle } from '@/tokens/typography';
import { spacing, radius } from '@/tokens/scale';

/**
 * The Foundations section: the tokens every component is built from, one
 * page per kind. The counts are read from the token files as the page
 * renders — a hand-written count is the kind of number this system exists
 * to stop shipping.
 */
export default function Page() {
  const counts = {
    primitives: Object.keys(primitives).length + Object.keys(alphaPrimitives).length,
    theme: Object.keys(theme).length,
    styles: Object.keys(textStyle).length,
    spacing: Object.keys(spacing).length,
    radii: Object.keys(radius).length,
  };

  return (
    <DocPage
      evidence={
        <>
          <p>{counts.primitives} primitives</p>
          <p>{counts.theme} theme tokens</p>
          <p>{counts.styles} text styles</p>
          <p>{counts.spacing} spacing steps</p>
          <p>{counts.radii} radii</p>
        </>
      }
    >
      <div className="hero">
        <div>
          <h1>Foundations</h1>
          <p className="lead">
            Colour, elevation, type, space and icons. Everything a component is made of, and
            the measurements that decided each value — light and dark, side by side.
          </p>
        </div>
        <Ramps />
      </div>

      <h2>In this section</h2>
      <Cards>
        <Card
          href="/colour"
          title="Colour"
          description="Ten families of eleven stops, one lightness per stop, and the semantic layer over them."
          visual={<Ramp />}
        />
        <Card
          href="/data-vis"
          title="Data visualisation"
          description="Six categories, a sequential ramp and a diverging one, each step measured on the canvas and on a card."
          visual={
            <div className="chartRamp">
              {DIVERGING.map((t) => (
                <span key={t} style={{ background: cssVar(t) }} />
              ))}
            </div>
          }
        />
        <Card
          href="/elevation"
          title="Elevation and states"
          description="Three surface levels in dark, shadows that stop working, and the wash that replaced the fill."
          visual={
            <div className="miniElevation">
              <span className="miniElevationMd" />
              <span className="miniElevationLg" />
            </div>
          }
        />
        <Card
          href="/typography"
          title="Typography"
          description={`${counts.styles} text styles in one family, from the page title down to 11px.`}
          visual={
            <div className="miniType">
              <span className="miniTypeSpecimen">Aa</span>
              <span className="miniTypeCaption">Inter</span>
            </div>
          }
        />
        <Card
          href="/space"
          title="Space and shape"
          description="Spacing on an 8px base, ten radii, and the capsule that every button takes."
          visual={
            <div className="miniShape">
              <span className="miniShapeSm" />
              <span className="miniShapeLg" />
              <span className="miniShapeFull" />
            </div>
          }
        />
        <Card
          href="/density"
          title="Density"
          description="Five tokens, comfortable and compact, chosen with data-density on any element."
          visual={
            <div className="miniDensity">
              <span className="miniDensityBar" style={{ height: 56 }} />
              <span className="miniDensityBar" style={{ height: 36 }} />
            </div>
          }
        />
        <Card
          href="/layout"
          title="Breakpoints and layout"
          description="Tailwind's five and xs, and a margin and gap that step up at lg and xl."
          visual={
            <div className="miniDensity">
              <span className="miniDensityBar" style={{ height: 24 }} />
              <span className="miniDensityBar" style={{ height: 40 }} />
              <span className="miniDensityBar" style={{ height: 56 }} />
            </div>
          }
        />
        <Card
          href="/icons"
          title="Icons"
          description="IBM Carbon, installed by the consumer, plus fifteen drawn for this system."
          visual={
            <div className="miniIcons">
              <Search size={24} />
              <CalendarIcon size={24} />
              <Time size={24} />
              <Checkmark size={24} />
            </div>
          }
        />
      </Cards>
    </DocPage>
  );
}
