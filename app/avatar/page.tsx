'use client';

import { useState } from 'react';
import { DocPage } from '@ui/DocPage';
import { Avatar, AvatarGroup, type AvatarSize } from '@/components/Avatar/index';
import { Loader } from '@/components/Loader/index';
import { Button } from '@/components/Button/index';

const SIZES: AvatarSize[] = ['xxs', 'xs', 'sm', 'md', 'lg', 'xl'];

export default function Page() {
  const [busy, setBusy] = useState(false);

  return (
    <DocPage
      evidence={
        <>
          <p>initials 17.7</p>
          <p>drawn was 3.98</p>
          <p>5 states</p>
          <p>all named</p>
        </>
      }
    >
      <h1>Avatar and Loader</h1>
      <p className="lead">
        A person, and the wait for one. Both were saying things in colour alone.
      </p>

      <h2>Avatar</h2>
      <div className="specimen">
        <div className="specimenRow" style={{ alignItems: 'flex-end' }}>
          {SIZES.map((size) => (
            <div key={size} style={{ textAlign: 'center' }}>
              <Avatar name="Leonor Viana" size={size} />
              <div className="alias" style={{ marginTop: 6 }}>{size}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rejected">
        <p>
          <strong>The drawn placeholder was below AA.</strong>
        </p>
        <p>
          White initials on a mid-grey circle measure 3.98:1, and initials are text. It uses{' '}
          <code>surface/inverse</code> with <code>text/inverse</code> instead — 17.1:1 in light,
          15.9:1 in dark — which
          also flips by theme, so the avatar reads on a dark card as well as a light one.
        </p>
      </div>

      <h2>Status</h2>
      <p>
        Five states, each with a name. Drawn, status was colour and nothing else: available
        and busy were the same thing to anyone who cannot separate green from red, and to
        every screen reader. Three of the five also failed 3:1 against a white card —
        available at 1.67:1, idle at 1.61:1, away at 1.96:1.
      </p>
      <div className="specimen">
        <div className="specimenRow">
          {(['available', 'busy', 'inMeeting', 'idle', 'away'] as const).map((status) => (
            <Avatar key={status} name="Leonor Viana" status={status} />
          ))}
        </div>
        <p className="alias" style={{ marginTop: 12, marginBottom: 0 }}>
          Hover or tab a screen reader through them — each dot says its state in words.
        </p>
      </div>

      <h2>Groups</h2>
      <p>
        Overlapping avatars with a count for the rest. The count is written out for a screen
        reader — <em>and 3 more</em>, not <em>+3</em>.
      </p>
      <div className="specimen">
        <AvatarGroup overflow={3}>
          <Avatar name="Leonor Viana" status="available" />
          <Avatar name="Ana Costa" />
          <Avatar name="Bruno Dias" />
        </AvatarGroup>
      </div>

      <h2>Loader</h2>
      <p>
        Two arcs turning in opposite directions, as drawn — 18px and 9px inside a 24px box.
        The counter-rotation is what stops it reading as one thick ring.
      </p>
      <div className="specimen">
        <div className="specimenRow" style={{ alignItems: 'center' }}>
          <Loader size="sm" />
          <Loader size="md" />
          <Loader size="lg" />
          <Loader tone="neutral" />
          <Loader tone="success" />
          <Loader tone="danger" />
        </div>
      </div>

      <h3>Inside a button</h3>
      <p>
        The same component, taking the label&rsquo;s colour rather than the system&rsquo;s.
        One spinner in the system, not two.
      </p>
      <div className="specimen">
        <div className="specimenRow">
          <Button
            loading={busy}
            onClick={() => {
              setBusy(true);
              setTimeout(() => setBusy(false), 2200);
            }}
          >
            Confirm booking
          </Button>
          <Button tone="danger" loading>Cancelling</Button>
          <Button variant="outline" tone="neutral" loading>Saving</Button>
        </div>
      </div>

      <h2>Accessibility</h2>
      <p>
        A loader with a <code>label</code> is a live region and says what is being waited
        for. Without one it is decoration — which is right inside a button that already
        carries <code>aria-busy</code>, where a second announcement repeats what the button
        said.
      </p>
      <p>
        Reduced motion slows the arcs rather than stopping them. A frozen spinner reads as a
        hung page, and the preference asks for less motion, not none.
      </p>
      <p>
        An avatar without an image shows initials, but two letters are not a name — the full
        name is present for a screen reader to read.
      </p>
    </DocPage>
  );
}
